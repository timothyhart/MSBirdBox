#include <cstdlib>
#include <getopt.h>
#include <iostream>
#include <memory>
#include <signal.h>
#include <string>

#include "recorder/recorder.h"
#include "recorder/monitor.h"
#include "recorder/source.h"

static std::unique_ptr<Recorder::Source> s_pSource;
static std::unique_ptr<Recorder::Recorder> s_pRecorder;

static void DisplayUsage(const char* progname)
{
    std::cerr << "Usage: " << progname << " <-a path> <-n name> <-w path> [-t time] <-l length> <-o length> [-d index] [-r rate] [-s]" << std::endl;
    std::cerr << "    -a: Path to analyser program" << std::endl;
    std::cerr << "    -n: Output recording name" << std::endl;
    std::cerr << "    -w: Output recording path (will have .ogg and .metadata appended)" << std::endl;
    std::cerr << "    -t: Recording duration in seconds, set to -1 (default) for infinite recording length." << std::endl;
    std::cerr << "    -l: Segment length in seconds" << std::endl;
    std::cerr << "    -o: Segment overlap in seconds" << std::endl;
    std::cerr << "    -d: PortAudio device id, when recording from physical device. Set to -1 for default device." << std::endl;
    std::cerr << "    -r: Sample rate (samples per second), only required for stdin source" << std::endl;
    std::cerr << "    -B: Volume boost. Value is in dB." << std::endl;
    std::cerr << "    -p: RMS calculation period (in milliseconds). Defaults to 100ms." << std::endl;
    std::cerr << "    -T: Threshold for noise detection. Value is in dBFS." << std::endl;
    std::cerr << "    -s: Show a list of PortAudio devices, then exit." << std::endl;
    std::cerr << "    -m: Monitor mode, run for duration seconds, displaying audio levels." << std::endl;
    std::cerr << std::endl;
}

static void ShowRecordingDevices()
{
    std::vector<Recorder::Source::SourceInfo> sources = Recorder::Source::EnumerateSources();
    
    for (size_t i = 0; i < sources.size(); i++)
    {
        const Recorder::Source::SourceInfo& sourceInfo = sources[i];
        std::cout << "Device " << i << ": " << sourceInfo.Name;
        std::cout << " (Preferred Sample Rate: " << sourceInfo.PreferredSampleRate << ")";
        std::cout << std::endl;
    }
}

static void ExitSignalHandler(int sig)
{
    std::cerr << "INFO: SIGTERM/SIGINT caught." << std::endl;
    if (s_pRecorder)
        s_pRecorder->SetExitFlag();
}

static void HookSignals()
{
    // instruct the signal to abort the system call, this means accept()/read()/write() will return EINTR
    struct sigaction sa;
    sa.sa_handler = ExitSignalHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    if (sigaction(SIGINT, &sa, NULL) != 0)
        perror("sigaction() failed");

    // do the same for SIGTERM
    sa.sa_handler = ExitSignalHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    if (sigaction(SIGTERM, &sa, NULL) != 0)
        perror("sigaction() failed");
}

int main(int argc, char** argv)
{
    uint32 sampleRate = 0;
    std::string analyserPath;
    std::string recordingName;
    std::string recordingPath;
    uint32 segmentLength = 0;
    uint32 overlapLength = 0;
    int32 recordingDuration = -1;
    uint32 deviceId = 0xFFFFFFFF;
    float volumeBoost = 0.0f;
    uint32 rmsPeriod = 100;
    float noiseThreshold = -30.0f;
    bool monitorLevels = false;

    int c;
    while ((c = getopt(argc, argv, "a:n:w:t:l:o:d:r:B:p:T:sm")) != -1)
    {
        switch (c)
        {
        case 'a':
            {
                analyserPath = optarg;
                std::cout << "INFO: Setting analyser path to " << analyserPath << std::endl;
            }
            break;

        case 'n':
            {
                recordingName = optarg;
                std::cout << "INFO: Setting recording name to " << recordingName << std::endl;
            }
            break;

        case 'w':
            {
                recordingPath = optarg;
                std::cout << "INFO: Setting recording path to " << recordingPath << std::endl;
            }
            break;

        case 't':
            {
                recordingDuration = std::strtol(optarg, nullptr, 10);

                std::cout << "INFO: Setting recording duration to " << recordingDuration << std::endl;
            }
            break;

        case 'l':
            {
                segmentLength = std::strtoul(optarg, nullptr, 10);
                if (segmentLength == 0)
                {
                    std::cerr << "ERR: Invalid segment length." << std::endl;
                    return -1;
                }
            }
            break;

        case 'o':
            {
                overlapLength = std::strtoul(optarg, nullptr, 10);
                if (overlapLength == 0)
                {
                    std::cerr << "ERR: Invalid overlap length." << std::endl;
                    return -1;
                }
            }
            break;

        case 'd':
            {
                deviceId = std::strtoul(optarg, nullptr, 10);
                std::cout << "INFO: Using device id " << deviceId << std::endl;
            }
            break;

        case 'r':
            {
                sampleRate = std::strtoul(optarg, nullptr, 10);
                if (sampleRate == 0 || (sampleRate % 2) != 0)
                {
                    std::cerr << "ERR: Invalid sample rate " << sampleRate << std::endl;
                    return -1;
                }
            }
            break;
            
        case 'B':
            {
                volumeBoost = std::strtof(optarg, nullptr);
                std::cout << "INFO: Setting volume boost to " << volumeBoost << std::endl;
            } 
            break;
            
        case 'p':
            {
                rmsPeriod = std::strtoul(optarg, nullptr, 10);
                std::cout << "INFO: Setting RMS period to " << rmsPeriod << std::endl;

                if (rmsPeriod == 0 || rmsPeriod > 1000)
                {
                    std::cerr << "ERR: Invalid RMS period " << rmsPeriod << std::endl;
                    return -1;
                }
            }
            break;
            
        case 'T':
            {
                noiseThreshold = std::strtof(optarg, nullptr);
                std::cout << "INFO: Setting noise threshold to " << noiseThreshold << std::endl;
            }
            break;

        case 's':
            {
                ShowRecordingDevices();
                std::exit(0);
            }
            break;
            
        case 'm':
            {
                std::cerr << "INFO: Only monitoring volume levels." << std::endl;
                monitorLevels = true;
            }
            break;
        }
    }

    if (!monitorLevels)
    {
        if (analyserPath.empty() ||
            recordingName.empty() ||
            recordingPath.empty() ||
            segmentLength == 0 ||
            overlapLength == 0)
        {
            std::cerr << "ERR: Not all arguments provided." << std::endl;
            DisplayUsage(argv[0]);
            return -1;
        }
    }
    
    // Set up signal handlers.
    HookSignals();

    // Get recording sources.
    std::vector<Recorder::Source::SourceInfo> sources = Recorder::Source::EnumerateSources();
    if (deviceId >= sources.size())
    {
        std::cerr << "ERR: Invalid device id: " << deviceId << " (must be < " << sources.size() << ")" << std::endl;
        return -1;
    }
    
    // Create recording source.
    s_pSource = Recorder::Source::CreateSource(sources[deviceId], sampleRate, volumeBoost);
    if (!s_pSource)
    {
        std::cerr << "ERR: Failed to create recording source." << std::endl;
        return -1;
    }
    
    // Running monitor mode?
    if (!monitorLevels)
    {
        // Setup program state.
        s_pRecorder = std::make_unique<Recorder::Recorder>(analyserPath, s_pSource.get());
        if (!s_pRecorder->Setup(recordingPath, recordingName, recordingDuration, segmentLength, overlapLength))
        {
            std::cerr << "ERR: Failed to setup recorder." << std::endl;
            s_pRecorder.reset();
            s_pSource.reset();
            return -1;
        }
        
        // Setup analyser.
        s_pRecorder->SetAnalyserParameters(rmsPeriod, noiseThreshold);

        // Run main loop.
        s_pRecorder->MainLoop();
        
        // Recording finished, clean up.
        s_pRecorder.reset();
    }
    else
    {
        // Run monitor loop.
        Recorder::Monitor::RunMonitorLoop(s_pSource.get(), rmsPeriod, static_cast<uint32>(std::max(recordingDuration, 1)));
    }

    // Exit cleanly.
    std::cerr << "INFO: Exiting cleanly." << std::endl;
    s_pSource.reset();
    return 0;
}

