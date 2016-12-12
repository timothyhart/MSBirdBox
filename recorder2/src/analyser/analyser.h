#pragma once

#include <string>
#include <vector>

#include "shared/common.h"
#include "shared/format.h"

namespace Analyser {

class Analyser
{
public:
    using TagList = std::vector<std::string>;

public:
    Analyser(uint32 sampleRate, const RecordingSampleArray& samples, uint32 segmentSamples, uint32 overlappingSamples, uint32 rmsPeriod, float noiseThreshold);
    ~Analyser();

    // Analyser outputs.
    float GetSegmentLength() const { return m_segmentLength; }
    float GetOverlapLength() const { return m_overlapLength; }
    float GetAverageVolume() const { return m_averageVolume; }
    const TagList& GetTags() const { return m_tags; }

    // Invoke the analyser process.
    void Run();

private:
    // Analyser methods.
    void CalculateSegmentLength();
    void CalculateAverageVolume();
    void CheckForNoise();

    // Analyser inputs.
    uint32 m_sampleRate;
    const RecordingSampleArray& m_samples;
    uint32 m_segmentSamples;
    uint32 m_overlappingSamples;
    uint32 m_rmsPeriod;
    float m_noiseThreshold;
    
    // Analyser intermediates.
    size_t m_samplesPerRMSPeriod;

    // Analyser outputs.
    float m_segmentLength;
    float m_overlapLength;
    float m_averageVolume;
    TagList m_tags;

};

}   // namespace Analyser
