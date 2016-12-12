var express = require("express");
var app = require("../app");
var router = express.Router();

var MetadataParser = require("../modules/metadata-parser.js");

// TODO: Combine these into one request?

// GET: /status/current-recording
router.get("/current-recording", function(req, res) {
    var data;
    if (app.recorderController.isRecording()) {
        data = {
            state: "recording",
            name: app.recorderController.getCurrentRecordingName(),
            title: app.recorderController.getCurrentRecordingTitle(),
            startTime: app.recorderController.getCurrentRecordingStartTime(),
            endTime: app.recorderController.getCurrentRecordingEndTime(),
            elapsedTime: app.recorderController.getCurrentRecordingElapsedTime(),
            remainingTime: app.recorderController.getCurrentRecordingRemainingTime()
        };
    } else {
        data = {
            state: "idle"
        };
    }
    
    res.json(data);
});

// GET: /status/next-recording
router.get("/next-recording", function(req, res, next) {
    var data;
    
    var nextEntry = app.recorderController.getNextScheduledRecording();
    if (!nextEntry) {
        // No scheduled recording.
        data = {};
    } else {
        // Find time of recording.
        var nextEntryTime = app.recorderController.getNextScheduleEntryTime(nextEntry);
        data = {
            time: nextEntryTime,
            duration: nextEntry.duration
        }
    }
    
    // Send back response.
    res.json(data);
});

module.exports = router;
