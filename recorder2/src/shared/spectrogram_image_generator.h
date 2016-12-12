#pragma once

#include <vector>

#include "shared/common.h"
#include "shared/format.h"

class SpectrogramImageGenerator
{
public:
    struct OutputConfig
    {
        float DynamicRange = 180.0f;
        uint32 ImageWidth = 640;
        uint32 ImageHeight = 480;
        bool ShowBorder = true;
    };

    static bool GenerateSpectrogramImage(uint32 inSampleRate, const RecordingSampleArray& inSamples, const OutputConfig& outputConfig, ByteArray* pOutputData);
};
