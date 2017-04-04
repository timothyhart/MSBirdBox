var express = require("express");
var app = require("../app");
var util = require("../modules/util");
var router = express.Router();

// GET: /settings/recording
router.get("/recording", function(req, res, next) {
    // Build response including recording devices, and current settings values.
    var data = {
        recordingDevices: [],
        recordingDeviceId: app.config.getRecordingDeviceId(),
        volumeBoost: app.config.getVolumeBoost(),
        segmentLength: app.config.getSegmentLength(),
        overlapLength: app.config.getOverlapLength(),
        rmsPeriod: app.config.getRMSPeriod(),
        noiseThreshold: app.config.getNoiseThreshold()
    };
     
    // Spawn process to get recording devices, and add to response.
    app.recordingHelpers.getRecordingDevices(
        function(err, devices) {
            if (err) {
                next(err);
                return;
            }
            
            data.recordingDevices = devices;            
            res.json(data);
        }
    );
});

// POST: /settings/recording
router.post("/recording", function(req, res, next) {
    console.log("recording params", req.body);
    
    // strings -> ints
    var recordingDeviceId = parseInt(req.body.recordingDeviceId);
    var volumeBoost = parseFloat(req.body.volumeBoost);
    var segmentLength = parseInt(req.body.segmentLength);
    var overlapLength = parseInt(req.body.overlapLength);
    var rmsPeriod = parseInt(req.body.rmsPeriod);
    var noiseThreshold = parseFloat(req.body.noiseThreshold);
    
    // Cheap input validation
    if (!util.isInteger(recordingDeviceId) ||
        !util.isInteger(segmentLength) ||
        segmentLength <= 0 || segmentLength > 60 ||
        !util.isInteger(overlapLength) ||
        overlapLength < 0 || overlapLength > 60 ||
        !util.isInteger(rmsPeriod) || rmsPeriod <= 0 || rmsPeriod > 1000 ||
        noiseThreshold > 0)
    {
        next(new Error("Invalid request."));
        return;
    }
    
    app.config.setRecordingDeviceId(recordingDeviceId);
    app.config.setVolumeBoost(volumeBoost);
    app.config.setSegmentLength(segmentLength);
    app.config.setOverlapLength(overlapLength);
    app.config.setRMSPeriod(rmsPeriod);
    app.config.setNoiseThreshold(noiseThreshold);
    
    // Save config to json
    app.config.save();
    res.send(200);    
});

// GET: /settings/schedule
router.get("/schedule", function(req, res, next) {
    // Just send everything through as-is.
    var schedule = app.recorderController.getSchedule();
    res.json(schedule);
});

// POST: /settings/schedule
router.post("/schedule", function(req, res, next) {
    try {
        // setSchedule only pulls out the relevant info, so doesn't matter
        // if the client sends extra stuff here, or invalid fields.
        if (!Array.isArray(req.body)) {
            next(new Error("Invalid parameters"));
            return;
        }
                    
        var scheduleData = req.body;
        app.recorderController.setSchedule(scheduleData);
        app.recorderController.saveSchedule();
        app.recorderController.updateScheduleEvent();
        res.send(200);        
    } catch (err) {
        next(err);
        return;
    }    
});

// GET: /settings/advanced
router.get("/advanced", function(req, res, next) {
    var data = {
        dataPath: app.config.getDataPath(),
        recordingsPath: app.config.getRecordingsPath(),
        recorderProgramPath: app.config.getRecorderProgramPath(),
        analyserProgramPath: app.config.getAnalyserProgramPath(),
        splitterProgramPath: app.config.getSplitterProgramPath()
    };
    
    res.json(data);
});

// POST: /settings/advanced
router.post("/advanced", function(req, res, next) {
    var dataPath = req.body.dataPath;
    var recordingsPath = req.body.recordingsPath;
    var recorderProgramPath = req.body.recorderProgramPath;
    var analyserProgramPath = req.body.analyserProgramPath;
    var splitterProgramPath = req.body.splitterProgramPath;
    
    if (dataPath === undefined || dataPath.length == 0 ||
        recordingsPath === undefined || recordingsPath.length == 0 ||
        recorderProgramPath === undefined || recorderProgramPath.length == 0 ||
        analyserProgramPath === undefined || analyserProgramPath.length == 0 ||
        splitterProgramPath === undefined || splitterProgramPath.length == 0)
    {
        next(new Error("Invalid parameters"));
        return;
    }

    // This could potentially be a security risk. (setting program paths)
    // Temporarily disabled for this reason.
    next(new Error("Temporarily disabled."));
    return;
    
    app.config.setDataPath(dataPath);
    app.config.setRecordingsPath(recordingsPath);
    app.config.setRecorderProgramPath(recorderProgramPath);
    app.config.setAnalyserProgramPath(analyserProgramPath);
    app.config.setSplitterProgramPath(splitterProgramPath);
    app.config.save();
    res.send(200);    
});

module.exports = router;
