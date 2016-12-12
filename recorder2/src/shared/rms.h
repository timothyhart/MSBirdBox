#pragma once
#include "shared/common.h"
#include "shared/format.h"

// RMS periods are specified in milliseconds, compared to durations, which are usually in seconds.
uint32 CalculateSamplesPerRMSPeriod(uint32 sampleRate, uint32 rmsPeriod);

// Calculate volume in dB for the specified samples by first converting to RMS power.
// +0dB is considered to be silence at this point.
float CalculateVolumeFromRMSPower(const RecordingSample* pSamples, size_t nSamples);

// Calculate the coefficient for applying the specified gain to a sample.
// The gain parameter is assumed to be in dB.
float CalculateGainCoefficent(float gain);

// Applies the specified gain in dB to a sample.
RecordingSample ApplyGainToRecordingSample(RecordingSample sample, float gain);

// Applies the specified gain in dB to an array of samples.
void ApplyGainToRecordingSamples(RecordingSample* pSamples, size_t nSamples, float gain);