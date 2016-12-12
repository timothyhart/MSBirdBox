#pragma once

#include <memory>
#include <time.h>

#include "shared/common.h"
#include "shared/format.h"

#include "recorder/source.h"

namespace Recorder
{

class SweepSource : public Source
{
public:
    SweepSource(uint32 sampleRate, float volumeBoost, uint32 toFreq);

    uint32 GetSampleRate() const override final { return m_sampleRate; }

    bool ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount) override final;

private:
    uint32 m_sampleRate;
    float m_volumeBoost;
    uint32 m_toFreq;
    
    struct timespec m_startTime;
    
    uint64 m_samplesWritten;
    
    int32 m_loopSize;
    int32 m_loopCounter;
    int32 m_loopIncrement;
    
    double m_phi;
    double m_f;
    double m_delta;
    double m_f_delta;
};


}   // namespace Recorder
