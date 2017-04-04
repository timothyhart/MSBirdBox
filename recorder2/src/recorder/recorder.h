#pragma once

#include <functional>
#include <memory>
#include <mutex>

#include "recorder/recording_writer.h"
#include "recorder/segment_writer.h"
#include "recorder/source.h"

namespace Recorder {

class Recorder
{
public:
    Recorder(const std::string& analyserPath, Source* pSource);
    ~Recorder();

    void SetExitFlag() { m_exitFlag = true; }

    bool Setup(const std::string& recordingPath, const std::string& recordingName, int32 recordingDuration, uint32 segmentLength, uint32 overlapLength);
    
    void SetAnalyserParameters(uint32 rmsPeriod, float noiseThreshold);

    void MainLoop();

    void OnSegmentWritten(uint32 segmentStartInSeconds, uint32 sampleRate, const RecordingSample* pSegmentSamples,
                          uint32 nSegmentSamples, uint32 newSamples, uint32 overlappingSamples);
                          
private:
    void AnalyserThreadEntryPoint(uint32 segmentStartInSeconds, uint32 sampleRate, std::unique_ptr<RecordingSampleArray> pSampleArray,
                                  uint32 newSamples, uint32 overlappingSamples);
                                  
    void OnAnalyserThreadStart();
    void OnAnalyserThreadEnd();

    std::string m_analyserPath;

    Source* m_pSource;

    uint32 m_sampleRate;
    uint32 m_segmentLength;
    uint32 m_overlapLength;
    std::string m_recordingName;
    std::string m_recordingPath;
    int32 m_recordingDuration;

    uint32 m_bufferSampleCount;
    std::unique_ptr<RecordingSample[]> m_pSampleBuffer;

    size_t m_totalSamplesRead;

    std::unique_ptr<SegmentWriter> m_pSegmentWriter;
    std::unique_ptr<RecordingWriter> m_pRecordingWriter;
    
    // Analyser parameters
    uint32 m_rmsPeriod;
    float m_noiseThreshold;

    bool m_exitFlag;

    // Counter of how many analysis threads are running.
    // Because we detach the threads, we need a way to
    // prevent exit until they have completed their work.
    // Use a mutex here, atomics seem to have issues on ARM?
    // Or am I not using them correctly?
    uint32 m_runningAnalysisThreads;
    std::mutex m_runningAnalysisThreadsLock;
};

}   // namespace Recorder

