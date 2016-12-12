#pragma once

#include <memory>

#include "recorder/source.h"
#include "shared/common.h"
#include "shared/format.h"

namespace Recorder
{

class PortAudioStreamBuffer;

class PortAudioSource : public Source
{
public:
    PortAudioSource(const PaDeviceInfo* pDeviceInfo, PaStream* pStream, PortAudioStreamBuffer* pBuffer, float volumeBoost);
    ~PortAudioSource();

    uint32 GetSampleRate() const override final { return m_sampleRate; }

    bool ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount) override final;

    bool Start();

    // Helper methods
    static bool InitializePortAudio();
    static bool OpenPortAudioStream(const SourceInfo& sourceInfo, uint32 requestedSampleRate, const PaDeviceInfo** ppDeviceInfo, PaStream** ppStream, PortAudioStreamBuffer** ppBuffer);

private:
    const PaDeviceInfo* m_pDeviceInfo;
    PortAudioStreamBuffer* m_pBuffer;
    PaStream* m_pStream;
    uint32 m_sampleRate;
    float m_volumeBoost;
};


}   // namespace Recorder
