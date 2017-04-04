#include <cstdlib>
#include <cstdio>
#include <iostream>
#include <string>
#include <unistd.h>

#include "shared/common.h"
#include "shared/format.h"
#include "shared/segment_extractor.h"
#include "shared/spectrogram_image_generator.h"

static void WriteByteArrayToStdOut(const ByteArray& byteArray)
{
    ssize_t written = (write(STDOUT_FILENO, byteArray.data(), byteArray.size()));
    if (static_cast<size_t>(written) != byteArray.size())
        std::cerr << "ERR: Only wrote " << written << " of " << byteArray.size() << " to stdout." << std::endl;
}

static bool WriteSegmentAudio(SegmentExtractor& extractor, float startTime, float duration, SegmentExtractor::OutputFormat outputFormat)
{
    ByteArray encodedAudio;
    if (!extractor.ExtractAndEncodeSegment(startTime, duration, outputFormat, &encodedAudio))
        return false;

    WriteByteArrayToStdOut(encodedAudio);
    return true;
}

static bool WriteSegmentSpectrogram(SegmentExtractor& extractor, float startTime, float duration)
{
    RecordingSampleArray samples;
    uint32 sampleRate = extractor.GetInputSampleRate();
    if (!extractor.ExtractSamples(startTime, duration, &samples))
        return false;

    // TODO: Allow customization of these
    SpectrogramImageGenerator::OutputConfig config;
    config.DynamicRange = 180.0f;
    config.ImageWidth = 580;
    config.ImageHeight = 480;
    config.ShowBorder = true;

    ByteArray encodedImage;
    if (!SpectrogramImageGenerator::GenerateSpectrogramImage(sampleRate, samples, config, &encodedImage))
        return false;

    WriteByteArrayToStdOut(encodedImage);
    return true;
}

int main(int argc, char* argv[])
{
    // Expected to be executed as "splitter /path/to/recording.ogg start duration op", with
    // start being the offset from the beginning of the recording in seconds, and
    // duration being the duration in seconds to extract from the recording.
    //
    // op can be a choice from the following options:
    //   wav - Extract segment and write a WAV file to stdout
    //   ogg - Extract segment and write a OGG file to stdout
    //   spectrogram - Extract segment, generate a spectrogram, and write a PNG file to stdout
    //
    
    if (argc < 5)
    {
        std::cerr << "ERR: Invalid parameters." << std::endl;
        std::cerr << "  Expected format: " << argv[0] << " path.ogg start duration op" << std::endl;
        return -1;
    }

    std::string recordingPath = argv[1];
    float startTime = std::strtof(argv[2], nullptr);
    float duration = std::strtof(argv[3], nullptr);
    std::string operation = argv[4];

    // Pretty much everything uses a segment extractor, so set that up.
    SegmentExtractor extractor;
    if (!extractor.OpenFile(recordingPath.c_str()))
        return -1;

    bool result = false;
    if (operation == "wav")
        result = WriteSegmentAudio(extractor, startTime, duration, SegmentExtractor::OutputFormatWav);
    else if (operation == "ogg")
        result = WriteSegmentAudio(extractor, startTime, duration, SegmentExtractor::OutputFormatOgg);
    else if (operation == "spectrogram")
        result = WriteSegmentSpectrogram(extractor, startTime, duration);
    else
        std::cerr << "Unhandled operation: " << operation << std::endl;

    return (result) ? 0 : -1;
}

