#pragma once

#include <memory>

#include "shared/common.h"
#include "shared/format.h"

#include "recorder/source.h"

namespace Recorder
{

class StdInSource : public Source
{
public:
    StdInSource(uint32 sampleRate, float volumeBoost);

    uint32 GetSampleRate() const override final { return m_sampleRate; }

    bool ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount) override final;

private:
    uint32 m_sampleRate;
    float m_volumeBoost;
};


}   // namespace Recorder
