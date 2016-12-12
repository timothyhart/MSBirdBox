#include <cassert>
#include <cerrno>
#include <cstdlib>
#include <iostream>
#include <unistd.h>

#include "recorder/source.h"

namespace Recorder {

std::vector<Source::SourceInfo> Source::EnumerateSources()
{
    std::vector<SourceInfo> sources;
    
    EnumeratePortAudioSource(sources);
    EnumerateSweepSource(sources);
    EnumerateStdInSource(sources);
    
    return sources;
}

std::unique_ptr<Source> Source::CreateSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost)
{
    return sourceInfo.FactoryFunction(sourceInfo, sampleRate, volumeBoost);
}

}   // namespace Recorder
