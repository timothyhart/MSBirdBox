#include <cassert>
#include <cerrno>
#include <cmath>
#include <cstdlib>
#include <iostream>
#include <unistd.h>

#include "recorder/source_sweep.h"
#include "shared/rms.h"

static const double PI = 3.14159265358979323846; 

namespace Recorder {

SweepSource::SweepSource(uint32 sampleRate, float volumeBoost, uint32 toFreq)
    : m_sampleRate(sampleRate)
    , m_volumeBoost(volumeBoost)
    , m_toFreq(toFreq)
    , m_samplesWritten(0)
    , m_loopSize(0)
    , m_loopCounter(0)
    , m_loopIncrement(1)
    , m_phi(0)
    , m_f(0)
    , m_delta(0)
    , m_f_delta(0)
{
    clock_gettime(CLOCK_MONOTONIC, &m_startTime);
    
    // Go from start->end in 5 seconds
    m_loopSize = static_cast<int32>(sampleRate * 5);
    
    // based on http://stackoverflow.com/questions/22597392/generating-swept-sine-waves
    m_delta = 2 * PI * m_f / m_sampleRate;
    m_f_delta = (toFreq - 0) / static_cast<double>(m_sampleRate * 5.0);
}

bool SweepSource::ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount)
{
    struct timespec currentTime;
    clock_gettime(CLOCK_MONOTONIC, &currentTime);
    
    uint32 elapsedTime = currentTime.tv_sec - m_startTime.tv_sec;
    uint64 expectedSamplesWritten = elapsedTime * m_sampleRate;
    uint32 thisWrittenCount = 0;
    
    if (m_samplesWritten == expectedSamplesWritten)
    {
        // Sleep for a little bit.
        usleep(100000);
        *pWrittenSampleCount = 0;
        return true;
    }
    
    while (m_samplesWritten < expectedSamplesWritten && thisWrittenCount < sampleCount)
    {
        double amplitude = 0.3 * sin(m_phi);
        //int16 sample = static_cast<int16>(amplitude * 32768);
        pDestination[thisWrittenCount++] = amplitude;
        m_samplesWritten++;
        
        //std::cout << "LC: " << m_loopCounter << ", amplitude: " << amplitude << ", sample: " << sample << std::endl;        
        
        if (m_loopCounter == m_loopSize)
        {
            m_loopIncrement = -1;
            m_loopCounter--;
        }
        else if (m_loopCounter == 0)
        {
            m_loopIncrement = 1;
        }
        
        if (m_loopIncrement > 0)
        {
            m_phi += m_delta;
            m_f += m_f_delta;
        }
        else
        {
            m_phi -= m_delta;
            m_f -= m_f_delta;
        }
        
        m_delta = 2 * PI * m_f / m_sampleRate;
        
        m_loopCounter += m_loopIncrement;
    }   
    
    *pWrittenSampleCount = thisWrittenCount;
    ApplyGainToRecordingSamples(pDestination, thisWrittenCount, m_volumeBoost);
    return true;
}

std::unique_ptr<Source> Source::CreateSweepSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost)
{
    if (sampleRate == 0)
        sampleRate = 44100;

    return std::make_unique<SweepSource>(sampleRate, volumeBoost, static_cast<uint32>(sourceInfo.FactoryParameter));
}

void Source::EnumerateSweepSource(std::vector<SourceInfo>& sources)
{
    SourceInfo source;
    source.Name = "Test Sweep Tone 0-1000hz";
    source.PreferredSampleRate = 44100;
    source.FactoryFunction = &Source::CreateSweepSource;
    source.FactoryParameter = 1000;
    sources.emplace_back(source);
}

}   // namespace Recorder
