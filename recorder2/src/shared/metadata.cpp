#include <algorithm>
#include <cerrno>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <fcntl.h>
#include <fstream>
#include <iomanip>
#include <limits>
#include <iostream>
#include <sstream>
#include <thread>
#include <utility>
#include <unistd.h>

#include "shared/common.h"
#include "shared/metadata.h"
#include "shared/util.h"

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

MetadataEntry::MetadataEntry(float startTime, float segmentLength, float overlapLength)
    : m_startTime(startTime)
    , m_segmentLength(segmentLength)
    , m_overlapLength(overlapLength)
    , m_averageVolumeLevel(0.0f)
{

}

void MetadataEntry::AddTag(const std::string& tag)
{
    // Replace any semicolons with underscores since we use them for separating tags
    std::string fixedTagName(tag);
    std::replace_if(fixedTagName.begin(), fixedTagName.end(), [](char ch) { return (ch == ';'); }, '_');

    // Don't add duplicate tags.
    if (std::any_of(m_tags.begin(), m_tags.end(), [tag](const std::string& existingTag) { return Util::CaseInsensitiveStringsEqual(tag, existingTag); }))
        return;

    m_tags.push_back(tag);
}

bool MetadataEntry::Parse(const std::string& str)
{
    std::vector<std::string> fields = Util::SplitString(str, ',');
    if (fields.size() != 5)
    {
        std::cerr << "WARN: Incorrect number of fields in metadata entry, expected 5, was " << fields.size() << std::endl;
        return false;
    }

    m_startTime = std::strtof(fields[0].c_str(), nullptr);
    m_segmentLength = std::strtof(fields[1].c_str(), nullptr);
    m_overlapLength = std::strtof(fields[2].c_str(), nullptr);
    m_averageVolumeLevel = std::strtof(fields[3].c_str(), nullptr);
    m_tags = Util::SplitString(fields[4], ';');
    return true;
}

std::string MetadataEntry::Serialize() const
{
    std::stringstream line;

    // startTime,segmentLength,volumeLevel,tags;separated;by;semicolons
    line << m_startTime << ",";
    line << m_segmentLength << ",";
    line << m_overlapLength << ",";
    line << std::fixed << std::setprecision(16) << m_averageVolumeLevel << ",";
    for (size_t i = 0; i < m_tags.size(); i++)
        line << ((i != 0) ? ";" : "") << m_tags[i];

    return line.str();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

MetadataFile::MetadataFile()
{

}

MetadataFile::~MetadataFile()
{

}


void MetadataFile::Create(const std::string& recordingName, float segmentLength, float overlapLength)
{
    m_recordingName = recordingName;
    m_recordingTime = time(nullptr);
    m_recordingLength = 0.0f;
    m_segmentLength = segmentLength;
    m_overlapLength = overlapLength;
}

bool MetadataFile::LoadFromFile(const char* filename)
{
    std::ifstream stream(filename, std::ios::in);
    if (!stream.is_open())
    {
        std::cerr << "ERR: Failed to open " << filename << " for reading." << std::endl;
        return false;
    }

    std::string line;
    uint32 lineNumber = 0;
    bool hasHeaderLine = false;
    while (!std::getline(stream, line).eof() && stream.good())
    {
        lineNumber++;

        // Comment lines
        if (line[0] == '#')
            continue;

        // Header line
        if (line[0] == '!')
        {
            if (hasHeaderLine)
            {
                std::cerr << "ERR: Duplicate metadata header at line " << lineNumber << std::endl;
                return false;
            }

            if (!ParseHeaderLine(line.substr(1)))
            {
                std::cerr << "ERR: Malformed header at line " << lineNumber << std::endl;
                return false;
            }

            hasHeaderLine = true;
            continue;
        }

        // If we have an entry without a header line, that's bad
        if (!hasHeaderLine)
        {
            std::cerr << "ERR: Metadata entry without header line at line " << lineNumber << std::endl;
            return false;
        }

        MetadataEntry entry;
        if (!entry.Parse(line))
        {
            std::cerr << "WARN: Bad metadata entry at line " << lineNumber << std::endl;
            continue;
        }

        m_entries.emplace_back(std::move(entry));
    }
    
    return (stream.good() || stream.eof());
}

bool MetadataFile::ParseHeaderLine(const std::string& line)
{
    std::vector<std::string> fields = Util::SplitString(line, ',');
    if (fields.size() != 5)
        return false;

    m_recordingName = fields[0];

    tm recordingTime;
    if (!strptime(fields[1].c_str(), "%FT%T.000%z", &recordingTime) || (m_recordingTime = mktime(&recordingTime)) < 0)
        m_recordingTime = time(nullptr);

    m_recordingLength = std::strtof(fields[2].c_str(), nullptr);
    m_segmentLength = std::strtof(fields[3].c_str(), nullptr);
    m_overlapLength = std::strtof(fields[4].c_str(), nullptr);

    return true;
}

bool MetadataFile::SaveToFile(const char* filename) const
{
    std::ofstream stream(filename, std::ios::out | std::ios::trunc);
    if (!stream.is_open())
    {
        std::cerr << "ERR: Failed to open " << filename << " for writing." << std::endl;
        return false;
    }

    tm recordingTime = {};
    localtime_r(&m_recordingTime, &recordingTime);
    char timeString[128] = {};
    strftime(timeString, sizeof(timeString), "%FT%T.000%z", &recordingTime);

    // Header
    stream << '!' << m_recordingName;
    stream << ',' << timeString;
    stream << ',' << CalculateRecordingLength();
    stream << ',' << m_segmentLength;
    stream << ',' << m_overlapLength;
    stream << std::endl;

    // Entries
    for (const auto& entry : m_entries)
    {
        std::string serializedEntry = entry.Serialize();

        stream << serializedEntry << std::endl;
    }

    return stream.good();
}

float MetadataFile::CalculateRecordingLength() const
{
    float length = 0;
    for (const auto& entry : m_entries)
        length += entry.GetSegmentLength();

    return length;
}

const MetadataEntry* MetadataFile::GetEntryAtTime(float timestamp, bool exact)
{
    const MetadataEntry* pClosestBefore = nullptr;
    float closestTimeDifference = std::numeric_limits<float>::max();

    for (const auto& entry : m_entries)
    {
        float timeDifference = std::abs(entry.GetStartTime() - timestamp);
        if (timeDifference < closestTimeDifference)
        {
            pClosestBefore = &entry;
            closestTimeDifference = timeDifference;
        }
    }

    if (exact && closestTimeDifference != 0)
        return nullptr;

    return pClosestBefore;
}

void MetadataFile::AddEntry(const MetadataEntry& entry)
{
    // Throw a critical error if a duplicate timestamp tries to be added, since this shouldn't happen.
    if (std::any_of(m_entries.begin(), m_entries.end(), [entry](const MetadataEntry& existingEntry) { return (entry.GetStartTime() == existingEntry.GetStartTime()); }))
    {
        std::cerr << "ERR: Attempt to add two metadata entries with start time " << entry.GetStartTime() << std::endl;
        std::abort();
    }

    // Add to list.
    m_recordingLength += entry.GetSegmentLength();
    m_entries.emplace_back(entry);
    
    // Keep entries sorted according to the start time.
    std::sort(m_entries.begin(), m_entries.end(), [](const MetadataEntry& lhs, const MetadataEntry& rhs) { return (lhs.GetStartTime() < rhs.GetStartTime()); });
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

MetadataFileLock::MetadataFileLock(const char* filename)
{
    constexpr size_t MAX_ATTEMPTS = 10;

    m_lockFileName = filename;
    m_lockFileName.append(".lock");

    size_t attempts = 0;
    for (;;)
    {
        m_fd = open(m_lockFileName.c_str(), O_CREAT | O_RDWR, 0664);
        if (m_fd >= 0)
            break;

        if (errno == EACCES)
        {
            if ((++attempts) == 10)
            {
                std::cerr << "ERR: Failed to open metadata lock file after " << MAX_ATTEMPTS << " attempts." << std::endl;
                return;
            }

            // Sleep for 100ms to give another process time to finish.
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            continue;
        }

        std::cerr << "WARN: Failed to open " << filename << " for locking." << std::endl;
        return;
    }

    flock fl;
    fl.l_type = F_WRLCK;
    fl.l_whence = SEEK_SET;
    fl.l_start = 0;
    fl.l_len = 0;
    fl.l_pid = 0;

    fcntl(m_fd, F_SETLKW, &fl);
}

MetadataFileLock::~MetadataFileLock()
{
    if (m_fd < 0)
        return;

    flock fl;
    fl.l_type = F_UNLCK;
    fl.l_whence = SEEK_SET;
    fl.l_start = 0;
    fl.l_len = 0;
    fl.l_pid = 0;

    fcntl(m_fd, F_SETLK, &fl);
    close(m_fd);
    //remove(m_lockFileName);
}
