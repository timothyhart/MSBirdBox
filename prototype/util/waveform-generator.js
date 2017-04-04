var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var config = require('../config.js');
var requestManager = require('./request-manager.js')();

function realGenerateWaveform(rawName, waveformPath, callback) {
    var rawPath = config.rawAudioDirectory + '/' + rawName + '.wav';
    var nativeBinary = path.resolve(__dirname, "../native/bin", "waveform");
    var cmdLine = nativeBinary + " -m -h 50 -w 320 -b ffffff00 -c 337ab7ff -i '" + rawPath + "' -o '" + waveformPath + ".tmp'";
    console.log("exec: " + cmdLine);
    child_process.exec(cmdLine, function(err, stdin, stdout) {
        if (err) {
            console.log("error for " + rawName, err);
            callback(undefined);
            return;
        }

        // remove the .tmp extension. we create with the extension, so if the child process
        // is mid-write, we don't send an incomplete file
        fs.renameSync(waveformPath + ".tmp", waveformPath);
        callback(waveformPath);
    });
}

module.exports = function(rawName, callback) {
    // generate filename
    var waveformPath = config.waveformCacheDirectory + '/' + rawName + '.png';
    //console.log('request waveform: ' + rawName);

    // check if one has previously been generated
    try {
        var statResult = fs.lstatSync(waveformPath);
        if (statResult.isFile()) {
            // file exists, don't have to generate
            //console.log('waveform ' + rawName + ' is cached');
            callback(waveformPath);
            return;
        }
    } catch (err) {
    }

    // create a request for this file
    console.log('generate waveform: ' + rawName);
    requestManager.newRequest(waveformPath,
            // function executed once
            function(requestManager, identifier) {
                realGenerateWaveform(rawName, waveformPath, function() {
                    requestManager.completeRequest(identifier);
                });
            },

            // function executed upon completion
            function(identifier) {
                callback(waveformPath);
            }
    );
}

