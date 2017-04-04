#pragma once

#include <sndfile.h>

#include "shared/common.h"
#include "shared/format.h"

namespace Recorder {

class RecordingWriter
{
public:
    RecordingWriter();
    ~RecordingWriter();

    bool Open(uint32 sampleRate, const char* filename);

    bool Flush();

    void AddSamples(const RecordingSample* samples, uint32 sampleCount);

private:
    SNDFILE* m_file = nullptr;
};

}   // namespace Recorder
