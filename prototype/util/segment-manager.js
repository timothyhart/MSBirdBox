var fs = require("fs");
var moment = require("moment");
var config = require("../config.js");

// Class to handle creation/deletion/purging of recordings.
function SegmentManager() {
}

// Create a new recording name, using the current date/time.
SegmentManager.prototype.getNewSegmentName = function() {
    var segmentName = moment().format("YYYY-MM-DD_HH-mm-ss");
    return segmentName;
}

// Returns the path to save raw audio as.
SegmentManager.prototype.getRawAudioPath = function(name) {
    return config.rawAudioDirectory + "/" + name + ".wav";
}

// Returns the path to save temporary raw audio as.
SegmentManager.prototype.getTemporaryRawAudioPath = function(name) {
    return config.rawAudioDirectory + "/" + name + ".tmp.wav";
}

// returns a list of objects with { name, time }
// TODO: cache this list
SegmentManager.prototype.getSegmentInfoList = function(callback, ascending) {
    fs.readdir(config.rawAudioDirectory, function(err, files) {
        list = [];
        if (err) {
            console.log("readdir error: ", err);
        } else {
            for (var i = 0; i < files.length; i++) {
                // ensure it ends with .wav
                var fileName = files[i];
                if (fileName.length < 4 || fileName.substr(-4, 4) != ".wav") {
                    continue;
                }

                // skip temp (still being recorded) files
                if (fileName.length >= 8 && fileName.substr(-8, 8) == ".tmp.wav") {
                    continue;
                }

                // get file title
                var fileTitle = fileName.substr(0, fileName.length - 4);

                // get modified time (eek, sync)
                var modifiedTime;
                try {
                    var stat = fs.lstatSync(config.rawAudioDirectory + "/" + fileName);
                    modifiedTime = stat.mtime;
                } catch (err) {
                    modifiedTime = new Date();
                }

                // add to list
                list.push({ name: fileTitle, time: modifiedTime, shortTime: moment(modifiedTime).format("ddd, MMM DD YYYY hh:mm:ss A") });
            }
        }

        // sort the list in descending order of time
        list.sort(function(lhs, rhs) {
            if (ascending)
                return lhs.time.getTime() - rhs.time.getTime();
            else
                return rhs.time.getTime() - lhs.time.getTime();
        });
        callback(list);
    });
}

// Purges old recordings from the directory.
// Also wipes out cached versions.
SegmentManager.prototype.purgeOldSegments = function() {
    var segments = [];
    try {
        var dirFiles = fs.readdirSync(config.rawAudioDirectory);
        for (var i = 0; i < dirFiles.length; i++) {
            try {
                // ensure it ends with .wav
                var relativeFileName = dirFiles[i];
                if (relativeFileName.length < 4 || relativeFileName.substr(-4, 4) != ".wav") {
                    continue;
                }

                var segmentName = relativeFileName.substr(0, relativeFileName.length - 4);
                var fileName = config.rawAudioDirectory + "/" + relativeFileName;
                var stat = fs.lstatSync(fileName);
                segments.push({ segmentName: segmentName, fileName: fileName, time: stat.mtime });
            } catch (err) {
                console.log("purge lstat error: ", err);
                continue;
            }
        }
    } catch (err) {
        console.log("purge readdir error: ", err);
    }

    // sort the list in descending order of time
    segments.sort(function(lhs, rhs) {
        return rhs.time.getTime() - lhs.time.getTime();
    });

    // exceeded maximum recordings?
    console.log("purge: " + segments.length + " segments found");
    if (segments.length < config.maxStoredSegments) {
        console.log("purge: nothing to do");
        return;
    }

    // helper to remove files
    var removeFile = function(fileName) {
        try {
            fs.unlinkSync(fileName);
        } catch (err) {
            console.log("purge: failed to remove file " + fileName, err);
        }
    }

    // remove extra recordings
    for (var i = config.maxStoredSegments; i < segments.length; i++) {
        var segmentName = segments[i].segmentName;
        console.log("purge: removing recording " + segmentName);
        removeFile(config.rawAudioDirectory + "/" + segmentName + ".wav");
        removeFile(config.spectrogramCacheDirectory + "/" + segmentName + ".png");
        //removeFile(config.waveformCacheDirectory + "/" + segmentName + ".png");
        //removeFile(config.encodedAudioCacheDirectory + "/" + segmentName + ".ogg");
    }
}

module.exports = new SegmentManager();

