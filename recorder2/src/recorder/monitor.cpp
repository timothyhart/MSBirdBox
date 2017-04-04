#include <algorithm>
#include <iostream>
#include <iomanip>
#include <memory>

#include "recorder/monitor.h"
#include "shared/rms.h"

namespace Recorder {

void Monitor::RunMonitorLoop(Source* pSource, uint32 rmsPeriod, uint32 monitorDuration)
{
    // Calculate number of samples per rms period
    uint32 samplesPerRMSPeriod = CalculateSamplesPerRMSPeriod(pSource->GetSampleRate(), rmsPeriod);
    
    // Allocate buffer for samples
    std::unique_ptr<RecordingSample[]> pRMSBuffer = std::make_unique<RecordingSample[]>(samplesPerRMSPeriod);
    uint32 currentRMSSamples = 0;
    
    // Work out how many samples we need to read total
    uint32 remainingSamples = ((monitorDuration * 1000) / rmsPeriod) * samplesPerRMSPeriod;
    std::cerr << "Reading " << remainingSamples << " total samples." << std::endl;
    
    // Main loop here
    while (remainingSamples > 0)
    {
        uint32 nSamples = std::min(samplesPerRMSPeriod - currentRMSSamples, remainingSamples);
        if (!pSource->ReadSamples(pRMSBuffer.get() + currentRMSSamples, nSamples, &nSamples))
            break;
        
        currentRMSSamples += nSamples;
        remainingSamples -= nSamples;
        
        if (currentRMSSamples == samplesPerRMSPeriod)
        {
            // We have enough samples, output value.
            double db = CalculateVolumeFromRMSPower(pRMSBuffer.get(), currentRMSSamples);
            std::cout << "dBFS: " << std::fixed << std::setprecision(8) << db << std::endl;
            currentRMSSamples = 0;
        }        
    }
    
    // Left-over samples
    if (currentRMSSamples > 0)
    {
        double db = CalculateVolumeFromRMSPower(pRMSBuffer.get(), currentRMSSamples);
        std::cout << "dBFS: " << std::fixed << std::setprecision(8) << db << std::endl;
    }
}

}   // namespace Recorder
