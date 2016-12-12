var fs = require("fs");
var path = require("path");
var app = require("../app");

var DEFAULT_CONFIG_DIR = path.normalize(__dirname + "/../config");
var DEFAULT_DATA_PATH = path.normalize("/tmp/birdbox");
var DEFAULT_RECORDINGS_PATH = path.normalize("/tmp/birdbox/recordings");
var DEFAULT_RECORDER_PROGRAM_PATH = path.normalize(__dirname + "/../../../src/recorder/recorder");
var DEFAULT_ANALYSER_PROGRAM_PATH = path.normalize(__dirname + "/../../../src/analyser/analyser");
var DEFAULT_SPLITTER_PROGRAM_PATH = path.normalize(__dirname + "/../../../src/splitter/splitter");
var DEFAULT_RECORDING_DEVICE_ID = 0;
var DEFAULT_SEGMENT_LENGTH = 10;
var DEFAULT_OVERLAP_LENGTH = 10;
var DEFAULT_VOLUME_BOOST = 0;
var DEFAULT_RMS_PERIOD = 200;
var DEFAULT_NOISE_THRESHOLD = -22;

function Config() {
    // Test the environment variables first, otherwise use the default
    this.configFileDir = process.env.RECORDER_BACKEND_CONFIG_DIR || DEFAULT_CONFIG_DIR;
    this.configFilePath = this.configFileDir + "/config.json";
    this.scheduleFilePath = this.configFileDir + "/schedule.json";
        
    // Initialize to default values.
    this.dataPath = DEFAULT_DATA_PATH;
    this.recordingsPath = DEFAULT_RECORDINGS_PATH;
    this.recorderProgramPath = DEFAULT_RECORDER_PROGRAM_PATH;
    this.analyserProgramPath = DEFAULT_ANALYSER_PROGRAM_PATH;
    this.splitterProgramPath = DEFAULT_SPLITTER_PROGRAM_PATH;
    this.recordingDeviceId = DEFAULT_RECORDING_DEVICE_ID;
    this.segmentLength = DEFAULT_SEGMENT_LENGTH;
    this.overlapLength = DEFAULT_OVERLAP_LENGTH;
    this.volumeBoost = DEFAULT_VOLUME_BOOST;
    this.rmsPeriod = DEFAULT_RMS_PERIOD;
    this.noiseThreshold = DEFAULT_NOISE_THRESHOLD;
}

// Accessors
Config.prototype.getScheduleFilePath = function() { return this.scheduleFilePath; }
Config.prototype.getDataPath = function() { return this.dataPath; }
Config.prototype.getRecordingsPath = function() { return this.recordingsPath; }
Config.prototype.getRecorderProgramPath = function() { return this.recorderProgramPath; }
Config.prototype.getAnalyserProgramPath = function() { return this.analyserProgramPath; }
Config.prototype.getSplitterProgramPath = function() { return this.splitterProgramPath; }
Config.prototype.getRecordingDeviceId = function() { return this.recordingDeviceId; }
Config.prototype.getSegmentLength = function() { return this.segmentLength; }
Config.prototype.getOverlapLength = function() { return this.overlapLength; }
Config.prototype.getVolumeBoost = function() { return this.volumeBoost; }
Config.prototype.getRMSPeriod = function() { return this.rmsPeriod; }
Config.prototype.getNoiseThreshold = function() { return this.noiseThreshold; }

// Mutators
Config.prototype.setDataPath = function(path) { this.dataPath = path; }
Config.prototype.setRecordingsPath = function(path) { this.recordingsPath = path; }
Config.prototype.setRecorderProgramPath = function(path) { this.recorderProgramPath = path; }
Config.prototype.setAnalyserProgramPath = function(path) { this.analyserProgramPath = path; }
Config.prototype.setSplitterProgramPath = function(path) { this.splitterProgramPath = path; }
Config.prototype.setRecordingDeviceId = function(id) { this.recordingDeviceId = id; }
Config.prototype.setSegmentLength = function(length) { this.segmentLength = length; }
Config.prototype.setOverlapLength = function(length) { this.overlapLength = length; }
Config.prototype.setVolumeBoost = function(value) { this.volumeBoost = value; }
Config.prototype.setRMSPeriod = function(value) { this.rmsPeriod = value; }
Config.prototype.setNoiseThreshold = function(value) { this.noiseThreshold = value; }

// Loader
Config.prototype.load = function() {    
    console.log("Reading config from " + this.configFilePath);
       
    // Read the config file json.
    var configJSON = fs.readFileSync(this.configFilePath, { encoding: "utf8" });
    var configData = JSON.parse(configJSON);
    
    // Read keys from file (ignore the extra stuff..)
    this.dataPath = configData.dataPath || DEFAULT_DATA_PATH;
    this.recordingsPath = configData.recordingsPath || DEFAULT_RECORDINGS_PATH;
    this.recorderProgramPath = configData.recorderProgramPath || DEFAULT_RECORDER_PROGRAM_PATH;
    this.analyserProgramPath = configData.analyserProgramPath || DEFAULT_ANALYSER_PROGRAM_PATH;
    this.splitterProgramPath = configData.splitterProgramPath || DEFAULT_SPLITTER_PROGRAM_PATH;
    this.recordingDeviceId = configData.recordingDeviceId || DEFAULT_RECORDING_DEVICE_ID;
    this.segmentLength = configData.segmentLength || DEFAULT_SEGMENT_LENGTH;
    this.overlapLength = configData.overlapLength || DEFAULT_OVERLAP_LENGTH;
    this.volumeBoost = configData.volumeBoost || DEFAULT_VOLUME_BOOST;
    this.rmsPeriod = configData.rmsPeriod || DEFAULT_RMS_PERIOD;
    this.noiseThreshold = configData.noiseThreshold || DEFAULT_NOISE_THRESHOLD;
}

// Save
Config.prototype.save = function() {
    var configData = {
        dataPath: this.dataPath,
        recordingsPath: this.recordingsPath,
        recorderProgramPath: this.recorderProgramPath,
        analyserProgramPath: this.analyserProgramPath,
        splitterProgramPath: this.splitterProgramPath,
        recordingDeviceId: this.recordingDeviceId,
        segmentLength: this.segmentLength,
        overlapLength: this.overlapLength,
        volumeBoost: this.volumeBoost,
        rmsPeriod: this.rmsPeriod,
        noiseThreshold: this.noiseThreshold
    };
    
    var configJSON = JSON.stringify(configData);
    try {
        fs.writeFileSync(this.configFilePath, configJSON, { encoding: "utf8" });
        return true;
    } catch (err) {
        console.log("Failed to write config file: " + err.toString());
        return false;
    }
}

module.exports = Config;
