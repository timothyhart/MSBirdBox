#pragma once

#include <sndfile.h>
#include <vector>

#include "shared/common.h"
#include "shared/format.h"

class SegmentExtractor
{
public:
    // Determines the format of the data written by ExtractAndEncodeSegment.
    enum OutputFormat
    {
        OutputFormatWav,
        OutputFormatOgg
    };

public:
    SegmentExtractor();
    ~SegmentExtractor();

    bool OpenFile(const char* path);

    // Get the sample rate of the input file.
    uint32 GetInputSampleRate() const;

    // Get the duration of the input file in seconds.
    float GetInputDuration() const;

    // Extract duration seconds of audio from the recording, starting at startTime.
    // If duration is zero, it is assumed to be until the end of the file.
    bool ExtractAndEncodeSegment(float startTime, float duration, OutputFormat outputFormat, ByteArray* pOutData);

    // Extract duration seconds worth of samples from the recording.
    bool ExtractSamples(float startTime, float duration, RecordingSampleArray* pOutSamples);

private:
    // Utility methods.
    bool EncodeSamples(const RecordingSampleArray& inSamples, OutputFormat outputFormat, ByteArray* pOutData);

    // Open file
    SNDFILE* m_pInputFile;

    // Open file information
    SF_INFO m_inputFileInfo;
};

