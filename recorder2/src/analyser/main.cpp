#include <cerrno>
#include <cstdlib>
#include <iostream>
#include <memory>
#include <signal.h>
#include <string>
#include <unistd.h>

#include "analyser/analyser.h"

#include "shared/common.h"
#include "shared/format.h"
#include "shared/metadata.h"

static bool g_exitEarlyFlag = false;

static void ExitSignalHandler(int sig)
{
    std::cerr << "INFO: SIGTERM/SIGINT caught." << std::endl;
    g_exitEarlyFlag = true;
}

static void HookSignals()
{
    // instruct the signal to abort the system call, this means accept()/read()/write() will return EINTR
    struct sigaction sa;
    sa.sa_handler = ExitSignalHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    if (sigaction(SIGINT, &sa, NULL) != 0)
        perror("sigaction() failed");

    // do the same for SIGTERM
    sa.sa_handler = ExitSignalHandler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    if (sigaction(SIGTERM, &sa, NULL) != 0)
        perror("sigaction() failed");
}

static bool ReadSamples(RecordingSampleArray& sampleArray)
{
    const size_t CHUNK_SIZE = 16384;

    // Keep reading until EOF.
    for (;;)
    {
        if (g_exitEarlyFlag)
        {
            // Received a SIGTERM. Exit early.
            return false;
        }

        size_t oldSize = sampleArray.size();
        sampleArray.resize(oldSize + CHUNK_SIZE);

        ssize_t bytesRead = read(STDIN_FILENO, sampleArray.data() + oldSize, CHUNK_SIZE * sizeof(RecordingSample));
        if (bytesRead < 0)
        {
            std::cerr << "ERR: read() returned error, errno = " << errno << std::endl;
            sampleArray.resize(oldSize);
            break;
        }
        else if (bytesRead == 0)
        {
            // End of file.
            sampleArray.resize(oldSize);
            break;
        }

        if ((bytesRead & 3) != 0)
        {
            std::cerr << "WARN: Read partial-sample. Dropping sample." << std::endl;
            bytesRead--;
        }

        // Adjust array to correct size.
        sampleArray.resize(oldSize + static_cast<size_t>(bytesRead / sizeof(RecordingSample)));
    }

    std::cout << "INFO: Read " << sampleArray.size() << " samples from stdin." << std::endl;
    return !sampleArray.empty();
}

static bool UpdateRecordingMetadata(const std::string& recordingPath, float segmentStart, const Analyser::Analyser* pAnalyser)
{
    std::string metadataFileName = recordingPath + ".metadata";

    // Lock the metadata file to allow only a single process access at once.
    // This is so that data does not get corrupted by slow analyser processes.
    MetadataFileLock metadataLock(metadataFileName.c_str());
    if (!metadataLock.HasLock())
    {
        std::cerr << "WARN: Failed to get metadata file lock. Not modifying file." << std::endl;
        return false;
    }

    // The recorder should have created the metadata file already, so open it.
    MetadataFile metadata;
    if (!metadata.LoadFromFile(metadataFileName.c_str()))
    {
        std::cerr << "ERR: Failed to load existing metadata file. Data will be lost." << std::endl;
        return false;
    }
    
    // Add new metadata entry for this recording.
    MetadataEntry entry(segmentStart, pAnalyser->GetSegmentLength(), pAnalyser->GetOverlapLength());

    // Copy analyser output into metadata.
    entry.SetAverageVolumeLevel(pAnalyser->GetAverageVolume());

    // Copy tags.
    for (const std::string& tag : pAnalyser->GetTags())
        entry.AddTag(tag);

    // Append to metadata set.
    metadata.AddEntry(entry);

    // Re-write metadata file.
    bool result = metadata.SaveToFile(metadataFileName.c_str());
    if (!result)
        std::cerr << "WARN: Failed to write metadata file. Data will be lost." << std::endl;

    return result;
}

int main(int argc, char* argv[])
{
    // Expected to be executed as "analyser /path/to/recording 44100 0 220500 441000",
    // with the recording path not containing the .ogg extension, 44100 being the sample
    // rate of the incoming data to stdin, 0 being the offset from the beginning of the
    // recording, 220500 being the number of new samples in this segment, and 441000
    // being the number of overlapping samples in this segment.
    if (argc < 6)
    {
        std::cerr << "ERR: Invalid parameters." << std::endl;
        return -1;
    }

    std::string recordingPath = argv[1];
    std::string metadataFileName = recordingPath + ".metadata";
    uint32 sampleRate = std::strtoul(argv[2], nullptr, 10);
    float segmentStart = std::strtof(argv[3], nullptr);
    uint32 segmentSamples = std::strtoul(argv[4], nullptr, 10);
    uint32 overlappingSamples = std::strtoul(argv[5], nullptr, 10);
    uint32 rmsPeriod = std::strtoul(argv[6], nullptr, 10);
    float noiseThreshold = std::strtof(argv[7], nullptr);

    std::cout << "INFO: Analyser module invoked." << std::endl
              << "  Recording name = " << recordingPath << std::endl
              << "  Segment start in seconds = " << segmentStart << ", Sample rate = " << sampleRate << std::endl
              << "  New samples = " << segmentSamples << ", overlapping samples = " << overlappingSamples << std::endl
              << "  RMS period = " << rmsPeriod << ", noise threshold = " << noiseThreshold << std::endl;

    // Prevent SIGTERM from exiting us early.
    HookSignals();

    // Read samples from stdin.
    RecordingSampleArray sampleArray;
    if (!ReadSamples(sampleArray))
    {
        std::cerr << "ERR: Failed to read samples from stdin." << std::endl;
        return 1;
    }

    // Create analyser interface.
    std::unique_ptr<Analyser::Analyser> pAnalyser = std::make_unique<Analyser::Analyser>(
        sampleRate, sampleArray, segmentSamples, overlappingSamples, rmsPeriod, noiseThreshold
    );

    // Run analyser.
    std::cout << "INFO: Analyser running." << std::endl;
    pAnalyser->Run();

    // Write metadata.
    if (!UpdateRecordingMetadata(recordingPath, segmentStart, pAnalyser.get()))
    {
        std::cerr << "ERR: Failed to update recording metadata." << std::endl;
        return 1;
    }
    else
    {
        std::cout << "INFO: Analyser exiting cleanly." << std::endl;
        return 0;
    }
}

