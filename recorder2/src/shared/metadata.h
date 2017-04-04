#pragma once
#include <ctime>
#include <istream>
#include <ostream>
#include <string>
#include <vector>

#include "shared/common.h"

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class MetadataEntry
{
public:
    using TagList = std::vector<std::string>;

public:
    MetadataEntry() = default;
    MetadataEntry(float startTime, float segmentLength, float overlapLength);

    // Accessors
    float GetStartTime() const { return m_startTime; }
    float GetSegmentLength() const { return m_segmentLength; }
    float GetOverlapLength() const { return m_overlapLength; }
    float GetAverageVolumeLevel() const { return m_averageVolumeLevel; }

    // Access tag list (list of strings)
    const TagList& GetTagList() const { return m_tags; }

    // Mutators
    void SetAverageVolumeLevel(float level) { m_averageVolumeLevel = level; }
    void AddTag(const std::string& tag);

    // Parse entry from a line in a database text file
    bool Parse(const std::string& str);

    // Serialize entry to string
    std::string Serialize() const;

private:
    // Time since start of recording in seconds
    float m_startTime = 0.0f;

    // Length of this segment
    float m_segmentLength = 0.0f;

    // Length of overlapping segment used in analysis
    float m_overlapLength = 0.0f;

    // Average volume level of the segment, 0..1 range.
    float m_averageVolumeLevel = 0.0f;

    // String list of tags
    TagList m_tags;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class MetadataFile
{
public:
    using EntryList = std::vector<MetadataEntry>;

public:
    MetadataFile();
    ~MetadataFile();

    // accessors
    const std::string& GetRecordingName() const { return m_recordingName; }
    time_t GetRecordingTime() const { return m_recordingTime; }
    float GetRecordingLength() const { return m_recordingLength; }
    float GetSegmentLength() const { return m_segmentLength; }
    float GetOverlapLength() const { return m_overlapLength; }

    // mutators
    void SetRecordingName(const std::string& name) { m_recordingName = name; }
    void SetRecordingTime(std::time_t timestamp) { m_recordingTime = timestamp; }
    void SetRecordingLength(float length) { m_recordingLength = length; }
    void SetSegmentLength(float length) { m_segmentLength = length; }
    void SetOverlapLength(float length) { m_overlapLength = length; }

    // initializer
    void Create(const std::string& recordingName, float segmentLength, float overlapLength);

    // Loads metadata entries from pFile
    bool LoadFromFile(const char* filename);

    // Write current metadata entries to pFile
    bool SaveToFile(const char* filename) const;

    // Access entry list, suitable for looping over
    const EntryList& GetEntries() const { return m_entries; }
    uint32 GetEntryCount() const { return m_entries.size(); }

    // Access entry by index
    const MetadataEntry& GetEntry(size_t index) const { return m_entries.at(index); }

    // Access entry for a specific time. If exact is set, the timestamp must match exactly,
    // otherwise the entry with the closest timestamp will be returned.
    const MetadataEntry* GetEntryAtTime(float timestamp, bool exact);

    // Adds a new entry to the file
    void AddEntry(const MetadataEntry& entry);

private:
    bool ParseHeaderLine(const std::string& line);
    float CalculateRecordingLength() const;

    std::string m_recordingName;
    std::time_t m_recordingTime;
    float m_recordingLength;
    float m_segmentLength;
    float m_overlapLength;
    EntryList m_entries;
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This class allows the process to lock a metadata file, preventing data from being
// lost, by only allowing a single process access at once.
class MetadataFileLock
{
public:
    MetadataFileLock(const char* filename);
    ~MetadataFileLock();

    bool HasLock() const { return (m_fd >= 0); }
    
private:
    std::string m_lockFileName;
    int m_fd;
};
