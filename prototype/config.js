var config = {};

// Configurable.
config.baseDirectory = '/tmp/bbp';
config.saveDirectory = '/tmp/bbp-save';
config.maxStoredSegments = 120;
config.segmentLength = 10000;

// Do not modify defaults unless you have a good reason to.
config.rawAudioDirectory = config.baseDirectory + '/raw';
config.encodedAudioCacheDirectory = config.baseDirectory + '/cache/encoded';
config.spectrogramCacheDirectory = config.baseDirectory + '/cache/spectrogram';
config.waveformCacheDirectory = config.baseDirectory + '/cache/waveform';

// Do not modify.
module.exports = config;

