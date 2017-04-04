#pragma once

#include <functional>
#include <memory>
#include <string>

#include "shared/common.h"
#include "shared/format.h"

namespace Recorder {

class SegmentWriter
{
public:
    // Callback type. Function should take a uint32 parameter containing the number of seconds since the start of the recording
    // that the segment starts at, a uint32 parameter containing the sample rate, and a array of samples that comprise the segment.
    // The third parameter contains the number of samples contained in the sample array. The last two parameters contain the
    // number of overlapping samples, and the number of new samples, respectively.
    using WrittenCallback = std::function<void(uint32, uint32, const RecordingSample*, uint32, uint32, uint32)>;

    // Construct a new segment writer.
    SegmentWriter(uint32 sampleRate, uint32 segmentLength, uint32 overlapLength, const WrittenCallback& segmentWrittenCallback);
    ~SegmentWriter();

    void AddSamples(const RecordingSample* samples, uint32 sampleCount);

    // Creates a final segment from whatever samples we have left over.
    void EndRecording();

private:
    void StartSegment();
    void WriteSegment();

    uint32 m_sampleRate;
    uint32 m_segmentLength;
    uint32 m_overlapLength;
    WrittenCallback m_segmentWrittenCallback;

    // Number of samples to overlap
    uint32 m_segmentSampleCount;
    uint32 m_overlapSampleCount;
    uint32 m_bufferSampleCount;

    std::unique_ptr<RecordingSample[]> m_pCurrentSegmentSamples;
    uint32 m_currentSegmentSampleCount;
    uint32 m_currentOverlapSampleCount;
    uint32 m_currentSegmentStartSample;

    // Total number of segments written
    uint32 m_totalSamplesWritten;
};


}   // namespace Recorder
