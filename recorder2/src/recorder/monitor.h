#pragma once

#include <atomic>
#include <functional>
#include <memory>

#include "recorder/source.h"

namespace Recorder {
    
class Monitor
{
public:
    static void RunMonitorLoop(Source* pSource, uint32 rmsPeriod, uint32 monitorDuration); 
};

}   // namespace Recorder
