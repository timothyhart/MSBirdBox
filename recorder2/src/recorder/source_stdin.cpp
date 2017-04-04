#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <iostream>
#include <unistd.h>

#include "recorder/source_stdin.h"
#include "shared/rms.h"

namespace Recorder {

StdInSource::StdInSource(uint32 sampleRate, float volumeBoost)
    : m_sampleRate(sampleRate)
    , m_volumeBoost(volumeBoost)
{

}

bool StdInSource::ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount)
{
    // Assume stdin reads are blocking.
    int nBytes = read(STDIN_FILENO, pDestination, sizeof(RecordingSample) * sampleCount);
    if (nBytes < 0)
    {
        std::cerr << "ERR: read() returned error: " << errno << std::endl;
        return false;
    }

    if (nBytes == 0)
    {
        std::cerr << "INFO: EOF reached in stdin." << std::endl;
        return false;
    }

    if ((nBytes % sizeof(RecordingSample)) != 0)
    {
        std::cerr << "WARN: Read half-sample. Dropping sample." << std::endl;
        nBytes -= (nBytes % sizeof(RecordingSample));
    }

    int nSamples = nBytes / sizeof(RecordingSample);
    *pWrittenSampleCount = static_cast<uint32>(nSamples);
    ApplyGainToRecordingSamples(pDestination, nSamples, m_volumeBoost);
    return true;
}

std::unique_ptr<Source> Source::CreateStdInSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost)
{
    if (sampleRate == 0)
        sampleRate = 44100;

    return std::make_unique<StdInSource>(sampleRate, volumeBoost);
}

void Source::EnumerateStdInSource(std::vector<SourceInfo>& sources)
{
    SourceInfo source;
    source.Name = "Standard Input";
    source.PreferredSampleRate = 44100;
    source.FactoryFunction = &Source::CreateStdInSource;
    source.FactoryParameter = 0;
    sources.emplace_back(source);
}

}   // namespace Recorder
