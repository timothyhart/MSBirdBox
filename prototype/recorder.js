var fs = require("fs");
var child_process = require("child_process");
var config = require("./config");
var segmentManager = require("./util/segment-manager.js");

// main recording function
function recordSegment() {
    // generate segment name
    var segmentName = segmentManager.getNewSegmentName();
    var segmentPath = segmentManager.getRawAudioPath(segmentName);
    var segmentTempPath = segmentPath + ".tmp.wav";
    console.log("new segment", segmentName, segmentPath);

    // open the destination file, split to executable + args
    var cmdLine = "arecord -f cd -c 1 -D hw:CARD=GoMic,DEV=0";
    var file = fs.openSync(segmentTempPath, "w");
    var args = cmdLine.split(" ");
    var progName = args.shift();
    console.log("exec", progName, args);
    var child = child_process.spawn(
        progName, args,
        { stdio: [ 'ignore', file, 'ignore' ] }
    );

    // function called when the timeout has elapsed
    var finishFunction = function() {
        console.log("terminating child process");
        child.kill("SIGTERM");
    };
    var finishTimer = setTimeout(finishFunction, config.segmentLength);
    var nextRecordingStarted = false;

    // function called when an error occured in the child (non-zero exit code)
    var errorCallback = function(err) {
        if (err && !(err.killed && err.signal == "SIGTERM")) {
            console.log("child process exited with error", err);
            clearTimeout(finishTimer);
            try {
                fs.closeSync(file);
                fs.unlinkSync(segmentTempPath);
            } catch (err) {
            }

            // spawn next iteration
            if (!nextRecordingStarted) {
                nextRecordingStarted = true;
                recordSegment();
            }
        }
    };

    // function that is called when the child exits
    var exitCallback = function() {
        console.log("child process exiting");

        // remove finish timer in case we exited early
        clearTimeout(finishTimer);

        // close the output file, and remove the .tmp extension
        fs.closeSync(file);

        // annoyingly, arecord doesn't write the length to the wave header,
        // which makes sox fail to generate a spectrogram. so rewrite the file
        var soxCmdLine = "sox '" + segmentTempPath + "' '" + segmentPath + "'";
        var soxChild = child_process.exec(soxCmdLine, function(err) {
            if (err) {
                console.log("fix header failed", err);
                fs.unlinkSync(segmentTempPath);
            } else {
                // purge old segments
                segmentManager.purgeOldSegments();
            }
        });

        // spawn next iteration
        if (!nextRecordingStarted) {
            nextRecordingStarted = true;
            recordSegment();
        }
    };

    // set callbacks
    child.on("error", errorCallback);
    child.on("exit", exitCallback);
}

// Execute the first recording, it will re-call itself from the closure.
recordSegment();

