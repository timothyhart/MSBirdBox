var fs = require("fs");
var app = require("../app");
var util = require("./util");
var child_process = require("child_process");
var MetadataParser = require("./metadata-parser");

function RecordingHelpers() {
}

// Gets the path of a recording audio file.
RecordingHelpers.prototype.getRecordingAudioPath = function(name) {
    return app.config.getRecordingsPath() + "/" + name + ".ogg";
}

// Gets the path of a recording metadata file.
RecordingHelpers.prototype.getRecordingMetadataPath = function(name) {
    return app.config.getRecordingsPath() + "/" + name + ".metadata";
}

// Returns a list of recordings available for viewing.
RecordingHelpers.prototype.getRecordingsList = function(callback) {
    var helpers = this;
    
    fs.readdir(app.config.getRecordingsPath(), function(err, files) {
        if (err) {
            console.log("Failed to read recordings list: " + err);
            callback([]);
        } else {
            // Filter the list to only include recordings that have audio and metadata files.
            var actualRecordingNames = [];
            files.forEach(function(filename) {
                var extension = filename.substr(filename.lastIndexOf('.'));
                if (extension == ".metadata") {
                    var recordingName = filename.substr(0, filename.lastIndexOf('.'));
                    var recordingAudioFileName = recordingName + ".ogg";
                    if (files.indexOf(recordingAudioFileName) >= 0)
                        actualRecordingNames.push(recordingName);
                }
            });

            // Obtain information about each recording from metadata.
            // Messy due to callbacks.
            var recordingList = [];
            if (actualRecordingNames.length == 0) {
                callback(recordingList);
                return;
            }

            var remaining = actualRecordingNames.length;
            actualRecordingNames.forEach(function (filename) {
                var metadataPath = helpers.getRecordingMetadataPath(filename);
                MetadataParser.getRecordingInformation(metadataPath, function (err, info) {
                    if (!err) {
                        recordingList.push(info);
                    }

                    remaining--;
                    if (remaining == 0)
                        callback(recordingList);
                });
            });
        }
    });
};

function tryRemoveFile(path) {
    try {
        console.log("remove file ", path);
        fs.unlinkSync(path);
    } catch (err) {
        console.log("Failed to remove file ", path, err);
    }
}

RecordingHelpers.prototype.deleteRecording = function(name, callback) {
    // Using synchronous here since it shouldn't be too slow to delete files.
    // Also makes things a bit easier.
    var audioFileName = this.getRecordingAudioPath(name);
    var metadataFileName = this.getRecordingMetadataPath(name);
    if (!fs.existsSync(audioFileName) && !fs.existsSync(metadataFileName)) {
        callback(new Error("Recording does not exist."));
        return;
    }
    
    tryRemoveFile(audioFileName);
    tryRemoveFile(metadataFileName);
    tryRemoveFile(metadataFileName + ".lock");
    callback(false);
}

// Callback is expected to take error, device array
RecordingHelpers.prototype.getRecordingDevices = function(callback) {
    var devices = [];
    
    child_process.exec(app.config.getRecorderProgramPath() + " -s",
        function(err, stdout, stderr) {
            if (err) {
                callback(err, devices);
                return;
            }
            
            if (stderr.length > 0)
                console.log("getRecordingDevices stderr:", stderr.toString());
                
            // Split to lines
            var lines = stdout.toString().split("\n");
            //console.log(lines);
            
            // Parse output lines
            var regexp = /Device ([0-9]*): (.*) \(Preferred Sample Rate: ([0-9]*)\)/;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var matches = line.match(regexp);
                if (!matches || matches.length != 4)
                    continue;
                    
                var device = {
                    id: parseInt(matches[1]),
                    name: matches[2],
                    sampleRate: parseInt(matches[3])
                };
                
                if (!util.isInteger(device.id) || !util.isInteger(device.sampleRate))
                    continue;
                    
                devices.push(device);
            }
            
            callback(false, devices);
        }
    );
}

RecordingHelpers.prototype.monitorVolumeLevel = function(duration, callback) {
    // Set up the recording process command line
    var childArgs = [
        "-d", app.config.getRecordingDeviceId(),
        "-B", app.config.getVolumeBoost(),
        "-p", app.config.getRMSPeriod(),
        "-t", duration,
        "-m"
    ];
    
    // Spawn the child process
    var childProcess = child_process.execFile(app.config.getRecorderProgramPath(), childArgs, function(err, stdout, stderr) {
        if (err) {
            console.log("monitor error", err);
            callback(err);
            return;
        }
        
        //console.log("monitor stderr", stderr);
        //console.log("monitor stdout", stdout);
        
        var regexp = /^dBFS: ([0-9\-.]*)$/;
        var levels = stdout.toString().split("\n").filter(
            function(value) { 
                return regexp.test(value);
            }
        ).map(
            function(value) { 
                var matches = value.match(regexp);
                return parseFloat(matches[1]);
            }
        );
        //console.log(levels);
        
        callback(false, levels);
    });
}

module.exports = RecordingHelpers;

