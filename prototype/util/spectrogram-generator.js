var fs = require('fs');
var child_process = require('child_process');
var config = require('../config.js');
var requestManager = require('./request-manager.js')();

/* for reference:
 * sox FAIL spectrogram: usage: [options]
 *        -x num  X-axis size in pixels; default derived or 800
 *        -X num  X-axis pixels/second; default derived or 100
 *        -y num  Y-axis size in pixels (per channel); slow if not 1 + 2^n
 *        -Y num  Y-height total (i.e. not per channel); default 550
 *        -z num  Z-axis range in dB; default 120
 *        -Z num  Z-axis maximum in dBFS; default 0
 *        -q num  Z-axis quantisation (0 - 249); default 249
 *        -w name Window: Hann(default)/Hamming/Bartlett/Rectangular/Kaiser/Dolph
 *        -W num  Window adjust parameter (-10 - 10); applies only to Kaiser/Dolph
 *        -s      Slack overlap of windows
 *        -a      Suppress axis lines
 *        -r      Raw spectrogram; no axes or legends
 *        -l      Light background
 *        -m      Monochrome
 *        -h      High colour
 *        -p num  Permute colours (1 - 6); default 1
 *        -A      Alternative, inferior, fixed colour-set (for compatibility only)
 *        -t text Title text
 *        -c text Comment text
 *        -o text Output file name; default `spectrogram.png'
 *        -d time Audio duration to fit to X-axis; e.g. 1:00, 48
 *        -S position     Start the spectrogram at the given input position
 */

function realGenerateSpectrogram(rawName, spectrogramPath, callback) {
    var rawPath = config.rawAudioDirectory + '/' + rawName + '.wav';
    var cmdLine = "sox '" + rawPath + "' -n spectrogram -x 350 -y 257 -o '" + spectrogramPath + ".tmp'";
    console.log("exec: " + cmdLine);
    child_process.exec(cmdLine, function(err, stdin, stdout) {
        if (err) {
            console.log("error for " + rawName, err);
            callback(undefined);
            return;
        }

        // remove the .tmp extension. we create with the extension, so if the child process
        // is mid-write, we don't send an incomplete file
        fs.renameSync(spectrogramPath + ".tmp", spectrogramPath);
        callback(spectrogramPath);
    });
}

module.exports = function(rawName, callback) {
    // generate filename
    var spectrogramPath = config.spectrogramCacheDirectory + '/' + rawName + '.png';
    //console.log('request spectrogram: ' + rawName);

    // check if one has previously been generated
    try {
        var statResult = fs.lstatSync(spectrogramPath);
        if (statResult.isFile()) {
            // file exists, don't have to generate
            //console.log('spectrogram ' + rawName + ' is cached');
            callback(spectrogramPath);
            return;
        }
    } catch (err) {
    }

    // create a request for this file
    console.log('generate spectrogram: ' + rawName);
    requestManager.newRequest(spectrogramPath,
            // function executed once
            function(requestManager, identifier) {
                realGenerateSpectrogram(rawName, spectrogramPath, function() {
                    requestManager.completeRequest(identifier);
                });
            },

            // function executed upon completion
            function(identifier) {
                callback(spectrogramPath);
            }
    );
}

