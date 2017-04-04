#include "recorder/recording_writer.h"
#include <iostream>
#include <sndfile.h>

namespace Recorder {

RecordingWriter::RecordingWriter()
{

}

RecordingWriter::~RecordingWriter()
{
    sf_close(m_file);
}

bool RecordingWriter::Open(uint32 sampleRate, const char* filename)
{
    SF_INFO info;
    info.frames = 0;
    info.samplerate = sampleRate;
    info.channels = 1;
    info.format = SF_FORMAT_VORBIS | SF_FORMAT_OGG;
    info.sections = 0;
    info.seekable = 0;

    m_file = sf_open(filename, SFM_WRITE, &info);
    if (!m_file)
    {
        std::cerr << "ERR: Failed to open " << filename << " as output file. Error: " << sf_strerror(nullptr) << std::endl;
        return false;
    }

    // TODO: Set bitrate/quality.

    return true;
}

bool RecordingWriter::Flush()
{
    sf_write_sync(m_file);
    return (sf_error(m_file) != SF_ERR_NO_ERROR);
}

void RecordingWriter::AddSamples(const RecordingSample* samples, uint32 sampleCount)
{
    sf_count_t writtenCount = sf_write_float(m_file, samples, sampleCount);
    if (writtenCount != sampleCount)
        std::cerr << "WARN: Incorrect # of samples (" << writtenCount << ") written, should be " << sampleCount << std::endl;
}

}   // namespace Recorder
