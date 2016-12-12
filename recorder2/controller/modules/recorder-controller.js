var fs = require("fs");
var moment = require("moment");
var app = require("../app");
var util = require("./util");
var child_process = require("child_process");

function RecorderController() {
    this.scheduleEntries = [];
    this.scheduleEvent = null;
    this.currentRecordingProcess = null;
    this.currentRecordingStartTime = null;
    this.currentRecordingName = "";
    this.currentRecordingTitle = "";
    this.currentRecordingDuration = 0;
}

RecorderController.prototype.getScheduleEntry = function(data) {
    if (!util.isInteger(data.day) || !util.isInteger(data.hour) || !util.isInteger(data.minute) || !util.isInteger(data.duration))
        return false;

    // Strip extra fields
    return {
        day: data.day,
        hour: data.hour,
        minute: data.minute,
        duration: data.duration
    };
}

RecorderController.prototype.getSchedule = function() {
    return util.deepClone(this.scheduleEntries);
}

// Schedule objects should have { day, hour, minute, duration }
RecorderController.prototype.setSchedule = function(scheduleData) {
    var newSchedule = [];
    for (var i = 0; i < scheduleData.length; i++) {
        var entry = this.getScheduleEntry(scheduleData[i]);
        if (entry) {
            newSchedule.push(entry);
        } else {
            return false;
        }
    }
    
    this.scheduleEntries = newSchedule;
    console.log("new schedule", newSchedule);
    return true;
}

RecorderController.prototype.loadSchedule = function() {
    var scheduleFileName = app.config.getScheduleFilePath();
    console.log("Reading schedule from " + scheduleFileName);
    
    // Read the schedule file json.
    try {
        var scheduleJSON = fs.readFileSync(scheduleFileName, { encoding: "utf8" });
        var scheduleData = JSON.parse(scheduleJSON);
        
        // Clear current schedule
        this.scheduleEntries = [];
        
        for (var i = 0; i < scheduleData.length; i++) {
            var entry = this.getScheduleEntry(scheduleData[i]);
            if (entry) {
                this.scheduleEntries.push(entry);
            }
        }
        
        console.log("Loaded " + this.scheduleEntries.length + " schedule entries");
    } catch (err) {
        console.log("Failed to load schedule: " + err.toString() + ". Assuming empty schedule.");
    }
    
    // Start the recorder timer.
    this.updateScheduleEvent();
}

RecorderController.prototype.saveSchedule = function() {
    var scheduleToSave = [];
    for (var i = 0; i < this.scheduleEntries.length; i++) {
        var entry = this.scheduleEntries[i];
        scheduleToSave.push({
            day: entry.day,
            hour: entry.hour,
            minute: entry.minute,
            duration: entry.duration
        });
    }
    
    var scheduleFileName = app.config.getScheduleFilePath();
    console.log("Writing schedule to " + scheduleFileName);
    
    var scheduleJSON = JSON.stringify(scheduleToSave);
    try {
        fs.writeFileSync(scheduleFileName, scheduleJSON, { encoding: "utf8" });
        return true;
    } catch (err) {
        console.log("Failed to save schedule: " + err.toString());
        return false;
    }
}

RecorderController.prototype.getNextScheduleEntryTime = function(entry) {
    // Create a date at the start of the week.
    var entryTime = moment().local().startOf("isoWeek");
    
    // Offset this by the schedule time.
    entryTime.add(entry.day, "days");
    entryTime.add(entry.hour, "hours");
    entryTime.add(entry.minute, "minutes");
    
    // Has this time passed in this week?
    var currentTime = moment().local();
    if (currentTime.valueOf() >= entryTime.valueOf()) {
        // Move the schedule time until the next week.
        entryTime.add(7, "days");
    }
    
    return entryTime.toDate();
}              

RecorderController.prototype.getNextScheduledRecording = function() {
    // Get next time for each entry, and store the smallest
    var closest = null;
    var closestDiff = 0;
    var currentTime = new Date();
    for (var i = 0; i < this.scheduleEntries.length; i++) {
        var runTime = this.getNextScheduleEntryTime(this.scheduleEntries[i]);
        var diff = runTime - currentTime;

        if (!closest || diff < closestDiff) {
            closest = this.scheduleEntries[i];
            closestDiff = diff;
        }
    }
    
    return closest;
}

RecorderController.prototype.updateScheduleEvent = function() {
    var controller = this;
        
    var nextEntry = this.getNextScheduledRecording();
    if (!nextEntry) {
        console.log("No next scheduled recording.");
        if (this.scheduleEvent) {
            console.log("Cancelling timer.");
            clearTimeout(this.scheduleEvent);
            this.scheduleEvent = null;
        }
    } else {
        if (this.isRecording()) {
            // Currently recording, so check again in 30 seconds.
            console.log("Recording currently in progress, deferring schedule check");
            if (this.scheduleEvent) {
                clearTimeout(this.scheduleEvent);
            }
            this.scheduleEvent = setTimeout(function() { controller.updateScheduleEvent(); }, 30000);
        } else {            
            var nextEntryTime = this.getNextScheduleEntryTime(nextEntry);
            var nextTimeDiff = moment(nextEntryTime).diff(moment().local());
            console.log("Next recording time: " + moment(nextEntryTime).format() + " (in " + nextTimeDiff + " ms)");
            
            // Cap the timeout interval to once every 5 minutes.
            if (nextTimeDiff >= 320000) {
                nextTimeDiff = 320000;
            }
            
            if (this.scheduleEvent) {
                clearTimeout(this.scheduleEvent);
            }
            this.scheduleEvent = setTimeout(function() { controller.scheduleEventCallback(nextEntry, nextEntryTime); }, nextTimeDiff);
            console.log("Scheduled event check in " + nextTimeDiff + " ms");
        }
    }
}

RecorderController.prototype.scheduleEventCallback = function(scheduleEntry, nextEntryTime) {
    var nextTimeDiff = moment(nextEntryTime).diff(moment().local());
    
    // Allow up to 10 seconds of early start due to timer inaccuracies.
    // If we are late, this will be negative, so we'll start anyway.
    if (nextTimeDiff < 10000) {
        try {
            // Construct a recording name and filename.
            var recordingTitle = "Automatic Recording " + moment().format("YYYY-MM-DD_HH-mm-ss");
            var recordingName = util.sanitizeFileName(recordingTitle);
            console.log("Starting recording - " + recordingTitle);
            this.startRecording(recordingTitle, recordingName, scheduleEntry.duration);
        } catch (err) {
            console.log("Failed to start automatic recording:" + err.toString());
        }
    } else {
        // Delay until next time.
        console.log("Not starting recording yet");
    }
    
    // Update next recording time.
    this.scheduleEvent = null;
    this.updateScheduleEvent();
}

RecorderController.prototype.isRecording = function() {
    return (this.currentRecordingProcess != null);
}

RecorderController.prototype.startRecording = function(name, title, duration) {
    var recorder = this;
    
    // Can't start when we're already recording
    if (recorder.isRecording()) {
        throw new Error("A recording is already in progress.");
    }
    
    // Sanity check
    if (duration <= 0) {
        throw new Error("Invalid duration");
    }
    
    // Initialize properties
    recorder.currentRecordingStartTime = new Date();
    recorder.currentRecordingName = name;
    recorder.currentRecordingTitle = title;
    recorder.currentRecordingDuration = duration;
    
    // Set up the recording process command line
    var childArgs = [
        "-d", app.config.getRecordingDeviceId(),
        "-a", app.config.getAnalyserProgramPath(),
        "-n", title,
        "-w", app.config.getRecordingsPath() + "/" + name,
        "-l", app.config.getSegmentLength(),
        "-o", app.config.getOverlapLength(),
        "-t", duration,
        "-B", app.config.getVolumeBoost(),
        "-p", app.config.getRMSPeriod(),
        "-T", app.config.getNoiseThreshold()
    ];
    
    // Spawn the child process
    recorder.currentRecordingProcess = child_process.spawn(app.config.getRecorderProgramPath(), childArgs);
    
    // Set up callbacks
    recorder.currentRecordingProcess.on("close", function(code) { recorder.onRecorderProcessClosed(code); });
    recorder.currentRecordingProcess.on("error", function(err) { recorder.onRecorderProcessError(err); });
    recorder.currentRecordingProcess.stdout.on("data", function(data) { console.log("recorder stdout", data.toString()); });
    recorder.currentRecordingProcess.stderr.on("data", function(data) { console.log("recorder stderr", data.toString()); });
    
    // Does the on error event fire after you hook it up or after we leave?
    if (!recorder.currentRecordingProcess)
        throw new Error("Error in recorder process");
        
    return true;
}

RecorderController.prototype.onRecorderProcessClosed = function(code) {
    console.log("Recorder process exited with code", code);
    this.currentRecordingProcess = null;
    this.currentRecordingStartTime = null;
    this.currentRecordingName = "";
    this.currentRecordingTitle = "";
    this.currentRecordingDuration = 0;
}

RecorderController.prototype.onRecorderProcessError = function(err) {
    console.log("Recorder process error: ", err);
    this.currentRecordingProcess = null;
    this.currentRecordingStartTime = null;
    this.currentRecordingName = "";
    this.currentRecordingTitle = "";
    this.currentRecordingDuration = 0;
}

RecorderController.prototype.startManualRecording = function(title, duration) {
    var name = util.sanitizeFileName(title);
    this.startRecording(name, title, duration);
}

RecorderController.prototype.getCurrentRecordingName = function() {
    return this.currentRecordingName;
}

RecorderController.prototype.getCurrentRecordingTitle = function() {
    return this.currentRecordingTitle;
}

RecorderController.prototype.getCurrentRecordingStartTime = function() {
    return this.currentRecordingStartTime;
}

RecorderController.prototype.getCurrentRecordingEndTime = function() {
    if (!this.currentRecordingProcess)
        return null;

    return moment(this.currentRecordingStartTime).add(this.currentRecordingDuration, "seconds").toDate();
}

RecorderController.prototype.getCurrentRecordingDuration = function() {
    return this.currentRecordingDuration;
}

RecorderController.prototype.getCurrentRecordingElapsedTime = function() {
    if (!this.currentRecordingProcess)
        return 0;

    return moment().diff(moment(this.currentRecordingStartTime)) / 1000;
}

RecorderController.prototype.getCurrentRecordingRemainingTime = function() {
    if (!this.currentRecordingProcess)
        return 0;
    
    var endMoment = moment(this.currentRecordingStartTime).add(this.currentRecordingDuration, "seconds");
    var diff = endMoment.diff(moment());
    if (diff < 0)
        diff = 0;
    return diff / 1000;
}

module.exports = RecorderController;
