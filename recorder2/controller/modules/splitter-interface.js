var fs = require("fs");
var child_process = require("child_process");
var app = require("../app");

function SplitterInterface() {
}

function SendSplitterProcessOutputToClient(child, contentType, response) {
    // Set the implicit headers. If there was an error, we'll override them later.
    response.statusCode = 200;
    response.setHeader("Content-Type", contentType);

    // Pipe output of child process to response.
    // On the first output chunk, this should send the headers.
    child.stdout.pipe(response);

    child.stderr.on("data", function (data) {
        if (!response.headersSent) {
            response.statusCode = 500;
            response.setHeader("Content-Type", "text/plain");
        }

        // Don't mess up the data stream, only send the errors if no data has been written.
        var errors = data.toString();
        console.error("Splitter process stderr output:", errors);
        if (response.statusCode == 500) {
            response.write(errors);
        }
    });

    child.on("close", function (code) {
        if (code != 0) {
            console.error("splitter process ended with status code " + code);

            if (!response.headersSent) {
                response.statusCode = 500;
                response.setHeader("Content-Type", "text/plain");
            }

            // Don't mess up the data stream, only send the errors if no data has been written.
            if (response.statusCode == 500) {
                response.write("Splitter process ended with status code " + code + "\n");
            }
        }

        response.end();
    });
}

SplitterInterface.prototype.sendSegmentAudio = function(recordingName, startTime, duration, format, response) {
    // Select operation and determine MIME type
    var op;
    var contentType;
    if (format == "wav") {
        op = "wav";
        contentType = "audio/wav";
    } else if (format == "ogg") {
        op = "ogg";
        contentType = "application/ogg";
    } else {
        response.statusCode = 500;
        response.end("Unknown audio format " + format);
        return;
    }

    var recordingPath = app.recordingHelpers.getRecordingAudioPath(recordingName);
    var childArgs = [ recordingPath, startTime, duration, op ];
    var child = child_process.spawn(app.config.getSplitterProgramPath(), childArgs);

    SendSplitterProcessOutputToClient(child, contentType, response);
}

// Returns spectrogram image in PNG format
SplitterInterface.prototype.sendSegmentSpectrogram = function (recordingName, startTime, duration, response) {
    var recordingPath = app.recordingHelpers.getRecordingAudioPath(recordingName);
    var childArgs = [ recordingPath, startTime, duration, "spectrogram" ];
    var child = child_process.spawn(app.config.getSplitterProgramPath(), childArgs);

    SendSplitterProcessOutputToClient(child, "image/png", response);
}

module.exports = SplitterInterface;

