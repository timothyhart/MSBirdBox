#include <algorithm>
#include <cassert>
#include <cmath>
#include <iostream>
#include <limits>
#include "shared/rms.h"

uint32 CalculateSamplesPerRMSPeriod(uint32 sampleRate, uint32 rmsPeriod)
{
    assert(sampleRate > 0 && rmsPeriod > 0);
    return std::max(sampleRate * rmsPeriod / 1000, 0u);
}

float CalculateVolumeFromRMSPower(const RecordingSample* pSamples, size_t nSamples)
{
    assert(nSamples > 0);
    
    // Use double for accumulator to reduce precision issues.
    double sum = 0.0;
    for (size_t i = 0; i < nSamples; i++)
    {
        double sample = ConvertRecordingSampleTo<double>(pSamples[i]);
        sum += (sample * sample);
        //std::cerr << "sample: " << sample << std::endl;
    }
    
    // Shouldn't really happen.
    if (sum == 0.0)
        sum = 0.00001;
    
    //std::cerr << "sum: " << sum << std::endl;
    double rms = std::sqrt(sum / static_cast<double>(nSamples));
    //std::cerr << "rms: " << rms << std::endl;
    double db = 20.0 * std::log10(rms); 
    
    return db;
}

float CalculateGainCoefficent(float gain)
{
    return std::pow(10.0f, gain / 20.0f);
}

RecordingSample ApplyGainToRecordingSample(RecordingSample sample, float gain)
{
    double coefficient = CalculateGainCoefficent(gain);
    return MakeRecordingSampleFrom<double>(Clamp(coefficient * ConvertRecordingSampleTo<double>(sample), 0.0, 1.0));
}

void ApplyGainToRecordingSamples(RecordingSample* pSamples, size_t nSamples, float gain)
{
    // fast path
    if (gain == 0.0f)
        return;

    double coefficient = CalculateGainCoefficent(gain);
    for (size_t i = 0; i < nSamples; i++)
    {
        RecordingSample sample = pSamples[i];
        double gained = Clamp(coefficient * ConvertRecordingSampleTo<double>(sample), -1.0, 1.0);
        pSamples[i] = MakeRecordingSampleFrom<double>(gained);
    }
}
