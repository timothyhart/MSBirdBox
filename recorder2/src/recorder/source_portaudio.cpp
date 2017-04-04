#include <cassert>
#include <chrono>
#include <condition_variable>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <mutex>
#include <portaudio.h>
#include <thread>
#include <vector>

#include "recorder/source_portaudio.h"
#include "shared/rms.h"

namespace Recorder {

// TODO: Use a circular buffer here, rather than memmove'ing everything backwards for a partial read.
class PortAudioStreamBuffer
{
public:
    PortAudioStreamBuffer(uint32 sampleRate)
    {
        // buffer 10 secs at max
        m_buffer_current = 0;
        m_buffer_max = sampleRate * 10;
        m_buffer.resize(m_buffer_max);
    }
    
    ~PortAudioStreamBuffer()
    {
        
    }
    
    static int StreamCallback(const void* input, void* output, unsigned long frameCount, const PaStreamCallbackTimeInfo* timeInfo, PaStreamCallbackFlags statusFlags, void* userData)
    {
        PortAudioStreamBuffer* pThis = reinterpret_cast<PortAudioStreamBuffer*>(userData);
        uint32 oldCurrent;
        //std::cerr << "Callback for " << frameCount << " samples" << std::endl; 
        
        {
            std::lock_guard<std::mutex> guard(pThis->m_lock);
            oldCurrent = pThis->m_buffer_current;
            
            uint32 space = pThis->m_buffer_max - pThis->m_buffer_current;
            if (frameCount > space)
            {
                uint32 dropCount = frameCount - space;
                std::cerr << "Internal PA buffer overflow, dropping " << dropCount << " samples" << std::endl;
                memmove(&pThis->m_buffer[0], &pThis->m_buffer[dropCount], sizeof(RecordingSample) * (pThis->m_buffer_current - dropCount));
                pThis->m_buffer_current -= dropCount; 
            }
            
            memcpy(&pThis->m_buffer[pThis->m_buffer_current], input, sizeof(RecordingSample) * frameCount);
            pThis->m_buffer_current += frameCount;
        }
        
        if (oldCurrent == 0)
            pThis->m_cond.notify_all();
            
        return paContinue;
    }
    
    void ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount)
    {
        std::unique_lock<std::mutex> guard(m_lock);

        uint32 countToRead = std::min(m_buffer_current, sampleCount);
        if (countToRead == 0)
        {
            // Block for a maximum of one second.
            m_cond.wait_for(guard, std::chrono::milliseconds(1000));
        }
        
        //std::cerr << "Consuming " << countToRead << " samples" << std::endl;
        
        if (countToRead > 0)
        {
            memcpy(pDestination, &m_buffer[0], sizeof(RecordingSample) * countToRead);
            if (countToRead == m_buffer_current)
            {
                m_buffer_current = 0;
            }
            else
            {
                memmove(&m_buffer[0], &m_buffer[countToRead], sizeof(RecordingSample) * (m_buffer_current - countToRead));
                m_buffer_current -= countToRead;
            }
        }

        *pWrittenSampleCount = countToRead;
    }
    
private:
    std::vector<RecordingSample> m_buffer;
    uint32 m_buffer_current;
    uint32 m_buffer_max;
    
    std::mutex m_lock;
    std::condition_variable m_cond;
};

PortAudioSource::PortAudioSource(const PaDeviceInfo* pDeviceInfo, PaStream* pStream, PortAudioStreamBuffer* pBuffer, float volumeBoost)
    : m_pDeviceInfo(pDeviceInfo)
    , m_pBuffer(pBuffer)
    , m_pStream(pStream)
    , m_volumeBoost(volumeBoost)
{
    const PaStreamInfo* pStreamInfo = Pa_GetStreamInfo(pStream);
    assert(pStreamInfo);

    m_sampleRate = static_cast<uint32>(pStreamInfo->sampleRate);
}

PortAudioSource::~PortAudioSource()
{
    Pa_StopStream(m_pStream);

    if (m_pStream)
        Pa_CloseStream(m_pStream);
        
    delete m_pBuffer;
}

bool PortAudioSource::ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount)
{
    m_pBuffer->ReadSamples(pDestination, sampleCount, pWrittenSampleCount);
    return true;
}

bool PortAudioSource::InitializePortAudio()
{
    static bool initialized = false;
    if (initialized)
        return true;

    PaError err = Pa_Initialize();
    if (err != paNoError)
    {
        std::cerr << "ERR: Failed to initialize PortAudio: " << Pa_GetErrorText(err) << std::endl;
        return false;
    }

    initialized = true;
    std::atexit([]() {
        Pa_Terminate();
    });
    return true;
}

bool PortAudioSource::OpenPortAudioStream(const SourceInfo& sourceInfo, uint32 requestedSampleRate, const PaDeviceInfo** ppDeviceInfo, PaStream** ppStream, PortAudioStreamBuffer** ppBuffer)
{
    PaDeviceIndex deviceId;
    if (sourceInfo.FactoryParameter < 0)
        deviceId = Pa_GetDefaultInputDevice();
    else
        deviceId = static_cast<PaDeviceIndex>(sourceInfo.FactoryParameter);

    const PaDeviceInfo* pDeviceInfo = Pa_GetDeviceInfo(deviceId);
    if (!pDeviceInfo)
    {
        std::cerr << "ERR: Failed to get PortAudio device info. Incorrect device id?" << std::endl;
        return false;
    }

    // samplerate of 0 means use default sample rate
    double sampleRate = (requestedSampleRate != 0) ? static_cast<double>(requestedSampleRate) : pDeviceInfo->defaultSampleRate;
    
    // create internal buffer
    PortAudioStreamBuffer* pBuffer = new PortAudioStreamBuffer(static_cast<uint32>(sampleRate));

    PaStreamParameters inputParameters;
    inputParameters.device = deviceId;
    inputParameters.channelCount = 1;
    inputParameters.sampleFormat = paFloat32;
    inputParameters.suggestedLatency = pDeviceInfo->defaultHighInputLatency;
    inputParameters.hostApiSpecificStreamInfo = nullptr;

    PaStream* pStream;
    PaError err = Pa_OpenStream(&pStream, &inputParameters, nullptr, static_cast<double>(sampleRate), 0, paClipOff, &PortAudioStreamBuffer::StreamCallback, pBuffer);
    if (err != paNoError)
    {
        std::cerr << "ERR: Failed to open PortAudio stream: " << Pa_GetErrorText(err) << std::endl;
        delete pBuffer;
        return false;
    }

    const PaStreamInfo* pStreamInfo = Pa_GetStreamInfo(pStream);
    assert(pStreamInfo);

    std::cout << "INFO: Opened PortAudio device " << pDeviceInfo->name << " (sample rate " << pStreamInfo->sampleRate << ")" << std::endl;

    err = Pa_StartStream(pStream);
    if (err != paNoError)
    {
        std::cerr << "ERR: Failed to start PortAudio stream: " << Pa_GetErrorText(err) << std::endl;
        Pa_CloseStream(pStream);
        delete pBuffer;
        return false;
    }

    *ppDeviceInfo = pDeviceInfo;
    *ppStream = pStream;
    *ppBuffer = pBuffer;
    return true;
}

std::unique_ptr<Source> Source::CreatePortAudioSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost)
{
    if (!PortAudioSource::InitializePortAudio())
        return std::unique_ptr<Source>();

    const PaDeviceInfo* pDeviceInfo;
    PaStream* pStream;
    PortAudioStreamBuffer* pBuffer;
    if (!PortAudioSource::OpenPortAudioStream(sourceInfo, sampleRate, &pDeviceInfo, &pStream, &pBuffer))
        return std::unique_ptr<Source>();

    return std::make_unique<PortAudioSource>(pDeviceInfo, pStream, pBuffer, volumeBoost);
}

void Source::EnumeratePortAudioSource(std::vector<SourceInfo>& sources)
{
    if (!PortAudioSource::InitializePortAudio())
        return;

    PaDeviceIndex defaultInputDevice = Pa_GetDefaultInputDevice();
    const PaDeviceInfo* pDefaultDeviceInfo = Pa_GetDeviceInfo(defaultInputDevice);
    if (pDefaultDeviceInfo)
    {    
        SourceInfo defaultSource;
        defaultSource.Name = "Default PortAudio Input";
        defaultSource.PreferredSampleRate = pDefaultDeviceInfo->defaultSampleRate;
        defaultSource.FactoryFunction = &Source::CreatePortAudioSource;
        defaultSource.FactoryParameter = -1;
        sources.emplace_back(defaultSource);
    }

    PaDeviceIndex count = Pa_GetDeviceCount();
    for (PaDeviceIndex i = 0; i < count; i++)
    {
        const PaDeviceInfo* pDeviceInfo = Pa_GetDeviceInfo(i);
        assert(pDeviceInfo);
        
        SourceInfo source;
        source.Name = pDeviceInfo->name;
        source.PreferredSampleRate = pDeviceInfo->defaultSampleRate;
        source.FactoryFunction = &Source::CreatePortAudioSource;
        source.FactoryParameter = static_cast<int32>(i);
        sources.emplace_back(source);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}   // namespace Recorder
