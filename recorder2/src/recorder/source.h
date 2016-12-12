#pragma once

#include <functional>
#include <string>
#include <memory>

#include "shared/common.h"
#include "shared/format.h"

namespace Recorder
{

class Source
{
public:
    virtual ~Source() = default;

    virtual uint32 GetSampleRate() const = 0;

    virtual bool ReadSamples(RecordingSample* pDestination, uint32 sampleCount, uint32* pWrittenSampleCount) = 0;

    // Source information
    struct SourceInfo
    {
        typedef std::function<std::unique_ptr<Source>(const SourceInfo&, uint32, float)> FactoryFunctionType;
            
        std::string Name;
        uint32 PreferredSampleRate;
        FactoryFunctionType FactoryFunction;
        int32 FactoryParameter;
    };
    
    // Enumerate all sources
    static std::vector<SourceInfo> EnumerateSources();
    
    // Create by device id
    static std::unique_ptr<Source> CreateSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost);
    
private:
    static std::unique_ptr<Source> CreateSweepSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost);
    static std::unique_ptr<Source> CreateStdInSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost);
    //static std::unique_ptr<Source> CreateFileSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost);
    static std::unique_ptr<Source> CreatePortAudioSource(const SourceInfo& sourceInfo, uint32 sampleRate, float volumeBoost);
    static void EnumerateSweepSource(std::vector<SourceInfo>& sources);
    static void EnumerateStdInSource(std::vector<SourceInfo>& sources);
    //static void EnumerateFileSource(std::vector<SourceInfo>& sources);
    static void EnumeratePortAudioSource(std::vector<SourceInfo>& sources);
};


}   // namespace Recorder
