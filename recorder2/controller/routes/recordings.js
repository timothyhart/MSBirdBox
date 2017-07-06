var express = require("express");
var app = require("../app");
var util = require("../modules/util");
var router = express.Router();
var fs = require('fs');
var MetadataParser = require("../modules/metadata-parser.js");

// TODO: Sanitize recording name.

// GET: /recordings/list
router.get("/list", function(req, res) {
    app.recordingHelpers.getRecordingsList(function(names) {
        res.json(names);
    });
});

//GET: /recordings/saveTag
router.get("/saveTag", function(req, res){
	var birdName = req.query.birdName;
	var tagName = req.query.fileName;
	fs.writeFile("/var/www/html/MSBirdBox/recorder2/data/tags/" + tagName, tagName, function(err) {
   	if(err) {
        	return console.log(err);
    	}

    console.log("Saved tag: " + tagName);
	});
});

// GET: /recordings/recent
router.get("/recent", function(req, res) {
    app.recordingHelpers.getRecordingsList(function(names) {
        // Sort by time
        var sortedList = names.sort(function(l, r) { return (l.time < r.time); });
        res.json(sortedList.slice(0, 5));
    });
});

// GET: /recordings/info?name=foo
router.get("/info", function(req, res, next) {
    var name = req.query.name;
    if (!name) {
        next(new Error("Name not specified."));
        return;
    }

    var metadataPath = app.recordingHelpers.getRecordingMetadataPath(name);
    MetadataParser.getRecordingInformation(metadataPath, function(err, info) {
        if (err) {
            next(err);
            return;
        }

        res.json(info);
    });
});

// GET: /recordings/metadata?name=foo
router.get("/metadata", function(req, res, next) {
    var name = req.query.name;
    if (!name) {
        next(new Error("Name not specified."));
        return;
    }

    var metadataPath = app.recordingHelpers.getRecordingMetadataPath(name);
    MetadataParser.parseFile(metadataPath, function(err, info) {
        if (err) {
            next(err);
            return;
        }

        res.json(info);
    });
});

// GET: /recordings/segment-audio?name=foo&startTime=0&duration=10&format=wav
router.get("/segment-audio", function (req, res, next) {
    var name = req.query.name;
    var startTime = req.query.startTime;
    var duration = req.query.duration;
    var format = req.query.format;
    var download = req.query.download;
    if (name === undefined || startTime === undefined || duration === undefined || format === undefined) {
        next(new Error("Missing parameters."));
        return;
    }

    startTime = parseFloat(startTime);
    duration = parseFloat(duration);
    if (isNaN(startTime) || isNaN(duration) || startTime < 0 || duration <= 0) {
        next(new Error("Invalid parameters."));
        return;
    }
    
    var isDownload = (download !== undefined);
    if (isDownload) {
        // Change the content-disposition so the client shows a download dialog rather than
        // rendering the file in the browser itself.
        var fileName;
        
        // Only include the fractional part if a non-integer has been provided.
        if (startTime != Math.floor(startTime) || duration != Math.floor(duration))
            fileName = util.sanitizeFileName(name + "_" + startTime.toFixed(2) + "_" + duration.toFixed(2)) + "." + format;
        else
            fileName = util.sanitizeFileName(name + "_" + startTime + "_" + duration) + "." + format;
            
        res.setHeader("Content-disposition", "attachment; filename=" + fileName);
    }
	
    app.splitterInterface.sendSegmentAudio(name, startTime, duration, format, res);

});

// GET: /recordings/segment-spectrogram?name=foo&startTime=0&duration=10&format=wav
router.get("/segment-spectrogram", function (req, res, next) {
    var name = req.query.name;
    var startTime = req.query.startTime;
    var duration = req.query.duration;
    if (name === undefined || startTime === undefined || duration === undefined) {
        next(new Error("Missing parameters."));
        return;
    }

    startTime = parseFloat(startTime);
    duration = parseFloat(duration);
    if (isNaN(startTime) || isNaN(duration) || startTime < 0 || duration <= 0) {
        next(new Error("Invalid parameters."));
        return;
    }
	
    app.splitterInterface.sendSegmentSpectrogram(name, startTime, duration, res);

});

// GET: /recordings/download?name=foo
router.get("/download", function(req, res, next) {
    var name = req.query.name;
    if (name === undefined) {
        next(new Error("Missing parameters."));
        return;
    }
    
    var audioPath = app.recordingHelpers.getRecordingAudioPath(name);
    
    // Inform the client that it should be a download rather than opening in the window
    res.download(audioPath);
});

// GET: /recordings/delete?name=foo
router.get("/delete", function(req, res, next) {
    var name = req.query.name;
    if (name === undefined) {
        next(new Error("Missing parameters."));
        return;
    }

    console.log("Deleting recording", name);
    
    app.recordingHelpers.deleteRecording(name, function(err) {    
        if (!err)
            res.json({ result: true });
        else
            res.json({ result: false, error: err.toString() });
    });
});

// GET: /recordings/start-manual-recording
router.get("/start-manual-recording", function(req, res, next) {

var title = req.query.title;
    var hours = req.query.hours;
    var minutes = req.query.minutes;
    var seconds = req.query.seconds;
    if (title === undefined ||
        hours === undefined ||
        minutes === undefined ||
        seconds === undefined)
    {
        next(new Error("Missing parameters."));
        return;
    }
    
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    seconds = parseInt(seconds);
    if (isNaN(hours) || hours < 0 || hours > 6 ||
        isNaN(minutes) || minutes < 0 || minutes > 60 ||
        isNaN(seconds) || seconds < 0 || seconds > 60 ||
        (hours == 0 && minutes == 0 && seconds == 0))
    {
        next(new Error("Invalid duration."));
        return;
    }
  
    // Calculate duration
    var duration = hours * 3600 + minutes * 60 + seconds;
    var data;
    try {
        app.recorderController.startManualRecording(title, duration);
        data = {

            result: true,
            name: app.recorderController.getCurrentRecordingName(),
            title: app.recorderController.getCurrentRecordingTitle()
        };
    } catch (err) {
        data = {
            result: false,
            error: err.toString()

        };
    }
    
    res.json(data);
});

// GET: /recordings/monitor
router.get("/monitor", function(req, res, next) {
    var duration = req.query.duration;
    if (duration === undefined) {
        next(new Error("Missing parameters."));
        return;
    }
    
    duration = parseInt(duration);
    if (!util.isInteger(duration)) {
        next(new Error("Invalid parameters."));
        return;
    }
    
    if (app.recorderController.isRecording()) {
        next(new Error("Recording in progress."));
        return;
    }
    
    app.recordingHelpers.monitorVolumeLevel(duration, function(err, levels) {
        if (err) {
            res.json({ result: false, error: err.toString() });
            return;
        }
        
        var data = {
            result: true,
            levels: levels
        };
        res.json(data);
    });
});

module.exports = router;
