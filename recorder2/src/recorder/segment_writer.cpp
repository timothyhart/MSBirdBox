#include <algorithm>
#include <cassert>
#include <cstring>
#include <iostream>
#include <sndfile.h>

#include "recorder/segment_writer.h"

namespace Recorder {

SegmentWriter::SegmentWriter(uint32 sampleRate, uint32 segmentLength, uint32 overlapLength, const WrittenCallback& segmentWrittenCallback)
{
    m_sampleRate = sampleRate;
    m_segmentLength = segmentLength;
    m_overlapLength = overlapLength;
    m_segmentWrittenCallback = segmentWrittenCallback;

    assert(sampleRate % 2 == 0);
    m_segmentSampleCount = sampleRate * segmentLength;
    m_overlapSampleCount = sampleRate * overlapLength;
    m_bufferSampleCount = m_overlapSampleCount + m_segmentSampleCount;

    m_pCurrentSegmentSamples = std::make_unique<RecordingSample[]>(m_bufferSampleCount);
    m_currentSegmentSampleCount = 0;
    m_currentOverlapSampleCount = 0;
    m_currentSegmentStartSample = 0;
    
    m_totalSamplesWritten = 0;
}

SegmentWriter::~SegmentWriter()
{

}

void SegmentWriter::AddSamples(const RecordingSample* samples, uint32 sampleCount)
{
    while (sampleCount > 0)
    {
        // Don't overflow past the end of a segment
        uint32 remainingSamples = m_segmentSampleCount - m_currentSegmentSampleCount;
        assert(remainingSamples > 0);

        // Copy samples to segment buffer
        uint32 copySamples = std::min(sampleCount, remainingSamples);
        uint32 currentOffset = m_currentOverlapSampleCount + m_currentSegmentSampleCount;
        std::memcpy(m_pCurrentSegmentSamples.get() + currentOffset, samples, sizeof(RecordingSample) * copySamples);
        //std::cout << "write " << copySamples << " to offset " << currentOffset << std::endl;

        // Advance pointers
        samples += copySamples;
        sampleCount -= copySamples;

        // Update totals - has to be done before write
        m_totalSamplesWritten += copySamples;
        m_currentSegmentSampleCount += copySamples;
        //std::cout << copySamples << " -> " << m_totalSamplesWritten << " " << m_currentSegmentSampleCount << std::endl;

        // Do we have a complete segment?
        if (m_currentSegmentSampleCount == m_segmentSampleCount)
        {
            // Write the segments to a new file.
            WriteSegment();

            // Overlap half of the current segment to a new segment.
            StartSegment();
        }
    }
}


void SegmentWriter::EndRecording()
{
    if (!m_currentSegmentSampleCount)
        return;

    std::cout << "DEBUG: Final segment has " << m_currentSegmentSampleCount << " samples." << std::endl;
    WriteSegment();
}

void SegmentWriter::StartSegment()
{
    //std::cout << "DEBUG: Current segment sample count: " << m_currentSegmentSampleCount << " / " << m_segmentSampleCount << std::endl;
    //std::cout << "DEBUG: Current overlap sample count: " << m_currentOverlapSampleCount << " / " << m_overlapSampleCount << std::endl;

    // Add the current samples to the overlapping portion.
    assert((m_currentOverlapSampleCount + m_currentSegmentSampleCount) <= m_bufferSampleCount);
    m_currentOverlapSampleCount += m_currentSegmentSampleCount;
    m_currentSegmentSampleCount = 0;

    // The first segments will have no overlap.
    if (m_currentOverlapSampleCount > m_overlapSampleCount)
    {
        // Remove everything extra so we have a max of m_overlapSampleCount worth of overlapping samples.
        uint32 removeCount = m_currentOverlapSampleCount - m_overlapSampleCount;
        std::memmove(m_pCurrentSegmentSamples.get(), m_pCurrentSegmentSamples.get() + removeCount, sizeof(RecordingSample) * (m_currentOverlapSampleCount - removeCount));
        m_currentOverlapSampleCount -= removeCount;
    }
    
    // Update starting offset.
    m_currentSegmentStartSample = m_totalSamplesWritten;

    std::cout << "DEBUG: New segment starting at sample " << m_currentSegmentStartSample << " (" << (m_currentSegmentStartSample / m_sampleRate) << " seconds)" << std::endl;
}

void SegmentWriter::WriteSegment()
{
    uint32 startSegmentTimeInSeconds = m_currentSegmentStartSample / m_sampleRate;
    uint32 totalSamples = m_currentOverlapSampleCount + m_currentSegmentSampleCount;

    // Invoke segment written callback using the temporary array.
    m_segmentWrittenCallback(startSegmentTimeInSeconds, m_sampleRate, m_pCurrentSegmentSamples.get(), totalSamples, m_currentSegmentSampleCount, m_currentOverlapSampleCount);
}

}   // namespace Recorder
