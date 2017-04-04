#include <chrono>
#include <cerrno>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <iostream>
#include <memory>

#ifdef __linux__
    #include <spawn.h>
#endif

#include <sys/types.h>
#include <sys/wait.h>
#include <thread>
#include <unistd.h>

#include "recorder/recorder.h"
#include "recorder/segment_writer.h"
#include "shared/metadata.h"

namespace Recorder {

Recorder::Recorder(const std::string& analyserPath, Source* pSource)
{
    m_analyserPath = analyserPath;
    m_pSource = pSource;
    m_sampleRate = m_pSource->GetSampleRate();

    m_segmentLength = 0;
    m_overlapLength = 0;
    m_recordingDuration = -1;

    // Read 100ms of samples at a time.
    // TODO: Should we make this customizable?
    m_bufferSampleCount = (m_sampleRate / 100) & ~1;
    m_pSampleBuffer = std::make_unique<RecordingSample[]>(m_bufferSampleCount);
    m_totalSamplesRead = 0;
    
    m_rmsPeriod = 100;
    m_noiseThreshold = -34;

    m_exitFlag = false;
    m_runningAnalysisThreads = 0;
}

Recorder::~Recorder()
{

}

bool Recorder::Setup(const std::string& recordingPath, const std::string& recordingName, int32 recordingDuration, uint32 segmentLength, uint32 overlapLength)
{
    m_recordingName = recordingName;
    m_recordingPath = recordingPath;
    m_recordingDuration = recordingDuration;
    m_segmentLength = segmentLength;
    m_overlapLength = overlapLength;

    // TODO: Sanitize recording name.
    std::string recordingFileName = recordingPath + ".ogg";
    std::string recordingMetaDataFileName = recordingPath + ".metadata";
    std::cout << "INFO: Writing to recording file: " << recordingFileName << std::endl;

    // Check for existance of recording and/or metadata files, and don't overwrite them.
    if (access(recordingFileName.c_str(), F_OK) >= 0 || access(recordingMetaDataFileName.c_str(), F_OK) >= 0)
    {
        std::cerr << "ERR: Recording file " << recordingFileName << " or metadata file already exists. Not overwriting." << std::endl;
        return false;
    }

    m_pRecordingWriter = std::make_unique<RecordingWriter>();
    if (!m_pRecordingWriter->Open(m_sampleRate, recordingFileName.c_str()))
    {
        std::cerr << "ERR: Failed to open recording file: " << recordingFileName << std::endl;
        return false;
    }

    // Create metadata file. No need to lock it, since it's a new file.
    MetadataFile metadata;
    metadata.Create(recordingName, segmentLength, overlapLength);
    if (!metadata.SaveToFile(recordingMetaDataFileName.c_str()))
    {
        std::cerr << "ERR: Failed to write recording metadata file: " << recordingMetaDataFileName << std::endl;
        return false;
    }

    // Create segment writer
    m_pSegmentWriter = std::make_unique<SegmentWriter>(
        m_sampleRate, segmentLength, overlapLength,
        std::bind(&Recorder::OnSegmentWritten, this,
            std::placeholders::_1, std::placeholders::_2, std::placeholders::_3,
            std::placeholders::_4, std::placeholders::_5, std::placeholders::_6));

    return true;
}

void Recorder::SetAnalyserParameters(uint32 rmsPeriod, float noiseThreshold)
{
    m_rmsPeriod = rmsPeriod;
    m_noiseThreshold = noiseThreshold;
}

void Recorder::MainLoop()
{
    while (!m_exitFlag)
    {
        uint32 nSamples;
        if (!m_pSource->ReadSamples(m_pSampleBuffer.get(), m_bufferSampleCount, &nSamples))
        {
            std::cout << "INFO: Failed to read samples, exiting now." << std::endl;
            break;
        }

        if (nSamples > 0)
        {
            //std::cout << "DEBUG: Got " << nSamples << " samples." << std::endl;
            m_pRecordingWriter->AddSamples(m_pSampleBuffer.get(), nSamples);
            m_pSegmentWriter->AddSamples(m_pSampleBuffer.get(), nSamples);
            m_totalSamplesRead += nSamples;
        }

        // Check duration has not elapsed
        if (m_recordingDuration >= 0)
        {
            // ignoring nanoseconds for now.
            int32 diff = static_cast<int32>(m_totalSamplesRead / m_sampleRate);
            if (diff >= m_recordingDuration)
            {
                std::cout << "INFO: Ending recording due to elapsed time" << std::endl;
                m_exitFlag = true;
            }
        }
    }

    // Write last segment (if any)
    m_pSegmentWriter->EndRecording();

    // Wait until all analysis threads have completed.
    for (;;)
    {
        std::lock_guard<std::mutex> guard(m_runningAnalysisThreadsLock);
        if (m_runningAnalysisThreads == 0)
            break;
    }
}

void Recorder::OnSegmentWritten(uint32 segmentStartInSeconds, uint32 sampleRate, const RecordingSample* pSegmentSamples,
                                uint32 nSegmentSamples, uint32 newSamples, uint32 overlappingSamples)
{
    // We perform analysis out-of-process.
    // The sample data is moved into a temporary array so the caller can re-use the existing array.
    std::unique_ptr<RecordingSampleArray> pSampleArray = std::make_unique<RecordingSampleArray>(nSegmentSamples);
    std::memcpy(pSampleArray->data(), pSegmentSamples, sizeof(RecordingSample) * nSegmentSamples);
    OnAnalyserThreadStart();

    // Because we want to block until the analyser has received the data, but not hold up the recording
    // process (and cause buffer overflows), we spawn a thread that blocks until the analyser has finished.
    std::thread analyserThread = std::thread(&Recorder::AnalyserThreadEntryPoint, this, segmentStartInSeconds,
        sampleRate, std::move(pSampleArray), overlappingSamples, newSamples);

    // We must detach from the thread so we don't leak resources.
    // The number of running thread is tracked by m_runningAnalysisThreads so we don't need to join our worker threads.
    analyserThread.detach();
}

void Recorder::OnAnalyserThreadStart()
{
    std::lock_guard<std::mutex> guard(m_runningAnalysisThreadsLock);
    m_runningAnalysisThreads++;
}

void Recorder::OnAnalyserThreadEnd()
{
    std::lock_guard<std::mutex> guard(m_runningAnalysisThreadsLock);
    m_runningAnalysisThreads--;
}

void Recorder::AnalyserThreadEntryPoint(uint32 segmentStartInSeconds, uint32 sampleRate, std::unique_ptr<RecordingSampleArray> pSampleArray,
                                        uint32 newSamples, uint32 overlappingSamples)
{
    std::string segmentStartInSecondsString = std::to_string(segmentStartInSeconds);
    std::string sampleRateString = std::to_string(sampleRate);
    std::string overlappingSampleString = std::to_string(overlappingSamples);
    std::string newSamplesString = std::to_string(newSamples);
    std::string rmsPeriodString = std::to_string(m_rmsPeriod);
    std::string noiseThresholdString = std::to_string(m_noiseThreshold);

    // Convert string objects to C strings to pass to child process.
    // Safe to access member variables since the loop won't exit until
    // all worker threads have also exited (see m_runningAnalysisThreads).
    // /path/to/analyser /path/to/recording 44100 0
    char* childArgv[] =
    {
        // std::string::data() doesn't seem to return a non-const pointer. Work around this.
        &m_analyserPath[0],
        &m_recordingPath[0],
        &sampleRateString[0],
        &segmentStartInSecondsString[0],
        &overlappingSampleString[0],
        &newSamplesString[0],
        &rmsPeriodString[0],
        &noiseThresholdString[0],
        nullptr
    };

    // Create a pipe that can be used to post the samples to the child process.
    int pipeFds[2];
    if (pipe(pipeFds) < 0)
    {
        std::cerr << "ERR: Failed to create child process pipe." << std::endl;
        OnAnalyserThreadEnd();
        return;
    }

#if defined(__linux__)

    // Ugh, this is messy. Setup pipe to stdin.
    posix_spawn_file_actions_t actions;
    posix_spawn_file_actions_init(&actions);
    posix_spawn_file_actions_addclose(&actions, STDIN_FILENO);
    posix_spawn_file_actions_adddup2(&actions, pipeFds[0], STDIN_FILENO);
    posix_spawn_file_actions_addclose(&actions, pipeFds[0]);
    posix_spawn_file_actions_addclose(&actions, pipeFds[1]);
 
    // Linux version using posix_spawn().
    pid_t childProcessId;
    int status = posix_spawn(&childProcessId, m_analyserPath.c_str(), &actions, nullptr, childArgv, nullptr);
    if (status != 0)
    {
        // Something bad happened.
        std::cerr << "ERR: Failed to spawn analyser process (" << m_analyserPath << "). errno = " << errno << std::endl;
    }

    // Cleanup actions struct.
    posix_spawn_file_actions_destroy(&actions);

#else

    // Generic version using fork().
    pid_t childProcessId = fork();
    if (childProcessId == 0)
    {
        // Close stdin, and replace it with the pipe we're writing to.
        close(STDIN_FILENO);
        dup2(pipeFds[0], STDIN_FILENO);
        close(pipeFds[0]);
        close(pipeFds[1]);

        // We are the child. Switch with analyser program.
        int result = execvp(m_analyserPath.c_str(), childArgv);
        
        // If we even reached here, execution failed.
        std::cerr << "ERR: Failed to spawn analyser process (" << m_analyserPath << "). errno = " << errno << std::endl;
        std::abort();
    }
    else if (childProcessId < 0)
    {
        std::cerr << "ERR: Failed to fork child process. errno = " << errno << std::endl;
    }

#endif

    // Close the read end of the pipe in the parent process.
    close(pipeFds[0]);

    // Write the sample data to the child process.
    size_t writeCount = sizeof(RecordingSample) * pSampleArray->size();
    ssize_t written = write(pipeFds[1], pSampleArray->data(), writeCount);
    if (written < 0 || static_cast<size_t>(written) != writeCount)
        std::cerr << "WARN: Only wrote " << written << " of " << writeCount << " to analyser process." << std::endl;

    // Close the write end of the pipe, signaling EOF.
    close(pipeFds[1]);

    // Child process is running, so block until it exits.
    int childStatus = -1;
    waitpid(childProcessId, &childStatus, 0);
    if (!WIFEXITED(childStatus) || WEXITSTATUS(childStatus) != 0)
        std::cerr << "WARN: Analyser process exited with non-zero status code: " << WEXITSTATUS(childStatus) << " (raw " << childStatus << ")" << std::endl;

    // Inform main thread we are done.
    OnAnalyserThreadEnd();
}

}   // namespace Recorder

