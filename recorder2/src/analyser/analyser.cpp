#include <algorithm>
#include <cassert>
#include <cmath>
#include <iostream>
#include <iomanip>

#include "analyser/analyser.h"
#include "shared/rms.h"

namespace Analyser {

Analyser::Analyser(uint32 sampleRate, const RecordingSampleArray& samples, uint32 segmentSamples, uint32 overlappingSamples, uint32 rmsPeriod, float noiseThreshold)
    : m_sampleRate(sampleRate)
    , m_samples(samples)
    , m_segmentSamples(segmentSamples)
    , m_overlappingSamples(overlappingSamples)
    , m_rmsPeriod(rmsPeriod)
    , m_noiseThreshold(noiseThreshold)
    , m_samplesPerRMSPeriod(CalculateSamplesPerRMSPeriod(sampleRate, rmsPeriod)) 
    , m_segmentLength(0.0f)
    , m_overlapLength(0.0f)
    , m_averageVolume(0.0f)
{

}

Analyser::~Analyser()
{

}

void Analyser::Run()
{
    assert(!m_samples.empty());

    CalculateSegmentLength();
    CalculateAverageVolume();
    CheckForNoise();
}

void Analyser::CalculateSegmentLength()
{
    assert(m_sampleRate != 0);

    // Derive segment length from sample count and rate.
    m_segmentLength = static_cast<float>(m_segmentSamples) / static_cast<float>(m_sampleRate);
    m_overlapLength = static_cast<float>(m_overlappingSamples) / static_cast<float>(m_sampleRate);
}

void Analyser::CalculateAverageVolume()
{
    // Calculate the mean of all RMS periods.
    double sum = 0.0;
    uint32 count = 0;
    for (size_t startSample = m_overlappingSamples; startSample < m_samples.size(); )
    {
        size_t samplesThisPeriod = std::min(m_samples.size() - startSample, m_samplesPerRMSPeriod);
        
        double db = CalculateVolumeFromRMSPower(&m_samples[startSample], samplesThisPeriod);
        sum += db;
        
        startSample += samplesThisPeriod;
        count++;
    }
    
    m_averageVolume = static_cast<float>(sum / count);
    std::cout << "Analyser: Average volume: " << std::fixed << std::setprecision(16) << m_averageVolume << std::endl;
}

void Analyser::CheckForNoise()
{
    // Check for peaks in volume across all RMS periods.
    for (size_t startSample = m_overlappingSamples; startSample < m_samples.size(); )
    {
        size_t samplesThisPeriod = std::min(m_samples.size() - startSample, m_samplesPerRMSPeriod);
        
        double db = CalculateVolumeFromRMSPower(&m_samples[startSample], samplesThisPeriod);
        if (db >= m_noiseThreshold)
        {
            std::cout << "Analyser: Detected noise (dBFS " << db << " >= " << m_noiseThreshold << ")" << std::endl;
            m_tags.push_back("Noise");
            return;
        }
        
        startSample += samplesThisPeriod;
    }
}

}   // namespace Analyser
