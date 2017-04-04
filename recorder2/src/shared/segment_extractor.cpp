#include <algorithm>
#include <cassert>
#include <cstring>
#include <iostream>

#include "shared/segment_extractor.h"

SegmentExtractor::SegmentExtractor()
    : m_pInputFile(nullptr)
{

}

SegmentExtractor::~SegmentExtractor()
{
    if (m_pInputFile)
        sf_close(m_pInputFile);
}

bool SegmentExtractor::OpenFile(const char* path)
{
    assert(!m_pInputFile);

    m_inputFileInfo.frames = 0;
    m_inputFileInfo.samplerate = 0;
    m_inputFileInfo.channels = 0;
    m_inputFileInfo.format = 0;
    m_inputFileInfo.sections = 0;
    m_inputFileInfo.seekable = 1;

    m_pInputFile = sf_open(path, SFM_READ, &m_inputFileInfo);
    if (!m_pInputFile)
    {
        std::cerr << "ERR: Failed to open " << path << " as input file: " << sf_strerror(nullptr) << std::endl;
        return false;
    }

    return true;
}

uint32 SegmentExtractor::GetInputSampleRate() const
{
    return static_cast<uint32>(m_inputFileInfo.samplerate);
}

float SegmentExtractor::GetInputDuration() const
{
    return static_cast<float>(m_inputFileInfo.frames) / static_cast<float>(m_inputFileInfo.samplerate);
}

bool SegmentExtractor::ExtractAndEncodeSegment(float startTime, float duration, OutputFormat outputFormat, ByteArray* pOutData)
{
    RecordingSampleArray samples;
    if (!ExtractSamples(startTime, duration, &samples))
        return false;

    return EncodeSamples(samples, outputFormat, pOutData);
}

bool SegmentExtractor::ExtractSamples(float startTime, float duration, RecordingSampleArray* pOutSamples)
{
    // Allow fractional second seek points.
    uint32 sampleRate = GetInputSampleRate();
    uint32 totalSamples = static_cast<uint32>(m_inputFileInfo.frames);
    uint32 offsetInSamples = static_cast<uint32>(startTime * sampleRate);
    uint32 durationInSamples = static_cast<uint32>(duration * sampleRate);
    if (offsetInSamples >= totalSamples)
    {
        std::cerr << "ERR: Can't extract samples, startTime of " << startTime << " exceeds recording length of " << GetInputDuration() << std::endl;
        return false;
    }

    // Seek to approximate location in input file. This may not be exact.
    sf_count_t actualStartSample = sf_seek(m_pInputFile, offsetInSamples, SEEK_SET);
    if (actualStartSample < 0)
    {
        std::cerr << "ERR: Can't extract samples, sf_seek failed: " << sf_strerror(m_pInputFile) << std::endl;
        return false;
    }

    // Clamp to recording length
    offsetInSamples = static_cast<uint32>(actualStartSample);
    durationInSamples = std::min(durationInSamples, totalSamples - offsetInSamples);
    if (durationInSamples == 0)
    {
        std::cerr << "ERR: Can't extract samples, at end of file." << std::endl;
        return false;
    }

    // Decode samples into buffer
    pOutSamples->resize(durationInSamples);
    sf_count_t readSamples = sf_read_float(m_pInputFile, pOutSamples->data(), durationInSamples);
    if (readSamples != durationInSamples)
    {
        assert(readSamples >= 0);
        std::cerr << "WARN: Incorrect number of samples returned when extracting, " << readSamples << " vs " << durationInSamples;
        pOutSamples->resize(readSamples);
    }

    return true;
}

// Memory-backed SF_VIRTUAL_IO structure.
class MemoryVirtualIO
{
public:
    MemoryVirtualIO(ByteArray* pData)
        : m_pData(pData)
        , m_position(0)
    {

    }

    const ByteArray* GetData() const { return m_pData; }
    
    const void* GetDataPointer() const { return m_pData->data(); }
    size_t GetDataSize() const { return m_pData->size(); }

    SF_VIRTUAL_IO GetVirtualIO() const
    {
        SF_VIRTUAL_IO io;
        io.get_filelen = &wrap_get_filelen;
        io.seek = &wrap_seek;
        io.read = &wrap_read;
        io.write = &wrap_write;
        io.tell = &wrap_tell;
        return io;
    }

private:
    static sf_count_t wrap_get_filelen(void* user_data)
    {
        MemoryVirtualIO* pThis = reinterpret_cast<MemoryVirtualIO*>(user_data);
        return static_cast<sf_count_t>(pThis->m_pData->size());
    }

    static sf_count_t wrap_seek(sf_count_t offset, int whence, void* user_data)
    {
        MemoryVirtualIO* pThis = reinterpret_cast<MemoryVirtualIO*>(user_data);

        size_t newOffset = pThis->m_position;
        switch (whence)
        {
        case SEEK_SET:
            newOffset = static_cast<size_t>(offset);
            break;

        case SEEK_CUR:
            newOffset = pThis->m_position + static_cast<size_t>(offset);
            break;

        case SEEK_END:
            newOffset = pThis->m_pData->size();
            break;
        }

        newOffset = std::min(newOffset, pThis->m_pData->size());
        return static_cast<size_t>(newOffset);
    }

    static sf_count_t wrap_read(void* ptr, sf_count_t count, void* user_data)
    {
        MemoryVirtualIO* pThis = reinterpret_cast<MemoryVirtualIO*>(user_data);

        size_t bytesRemaining = pThis->m_pData->size() - pThis->m_position;
        size_t copyCount = std::min(bytesRemaining, static_cast<size_t>(count));
        if (copyCount > 0)
            std::memcpy(ptr, pThis->m_pData->data() + pThis->m_position, copyCount);

        return static_cast<sf_count_t>(count);
    }

    static sf_count_t wrap_write(const void* ptr, sf_count_t count, void* user_data)
    {
        MemoryVirtualIO* pThis = reinterpret_cast<MemoryVirtualIO*>(user_data);

        size_t newSize = pThis->m_position + static_cast<size_t>(count);
        if (newSize > pThis->m_pData->size())
            pThis->m_pData->resize(newSize);

        std::memcpy(pThis->m_pData->data() + pThis->m_position, ptr, count);
        pThis->m_position += static_cast<size_t>(count);

        return count;
    }

    static sf_count_t wrap_tell(void* user_data)
    {
        MemoryVirtualIO* pThis = reinterpret_cast<MemoryVirtualIO*>(user_data);
        return static_cast<sf_count_t>(pThis->m_position);
    }

    ByteArray* m_pData;
    size_t m_position;
};

bool SegmentExtractor::EncodeSamples(const RecordingSampleArray& inSamples, OutputFormat outputFormat, ByteArray* pOutData)
{
    // Fill in output format.
    SF_INFO outputInfo;
    outputInfo.frames = 0;
    outputInfo.samplerate = m_inputFileInfo.samplerate;
    outputInfo.channels = 1;
    outputInfo.sections = 0;
    outputInfo.seekable = 0;
    outputInfo.format = 0;
    switch (outputFormat)
    {
    case OutputFormatWav:
        outputInfo.format = SF_FORMAT_WAV | SF_FORMAT_PCM_16;
        break;

    case OutputFormatOgg:
        outputInfo.format = SF_FORMAT_OGG | SF_FORMAT_VORBIS;
        break;
    }

    // Use pOutData as a destination for the written data.
    MemoryVirtualIO virtualIOWrapper(pOutData);
    SF_VIRTUAL_IO virtualIO = virtualIOWrapper.GetVirtualIO();
    SNDFILE* pOutFile = sf_open_virtual(&virtualIO, SFM_WRITE, &outputInfo, &virtualIOWrapper);
    if (!pOutFile)
    {
        std::cerr << "ERR: Failed to open virtual output file for EncodeSamples: " << sf_strerror(nullptr) << std::endl;
        return false;
    }

    // Encode data one second at a time.
    // Passing large sample buffers to the vorbis encoder seems to cause stack corruption???
    size_t startSample = 0;
    while (startSample < inSamples.size())
    {
        sf_count_t writeCount = std::min(static_cast<sf_count_t>(inSamples.size() - startSample), static_cast<sf_count_t>(m_inputFileInfo.samplerate));
        sf_count_t writtenSamples = sf_write_float(pOutFile, &inSamples[startSample], writeCount);
        if (writtenSamples != writeCount)
        {
            std::cerr << "ERR: Only " << writtenSamples << " of " << inSamples.size() << " samples encoded." << std::endl;
            sf_close(pOutFile);
            return false;
        }

        startSample += static_cast<size_t>(writtenSamples);
    }

    sf_close(pOutFile);
    return true;
}

