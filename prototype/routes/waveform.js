var config = require("../config.js");
var waveformGenerator = require("../util/waveform-generator");
var sanitize = require("sanitize-filename");

module.exports = function(request, response) {
    // prevent file name/path injection
    var rawName = sanitize(request.params.name);
    //console.log("request received for waveform for " + rawName);
    
    waveformGenerator(rawName, function(waveformPath) {
        //console.log("request completed for " + rawName + ": " + waveformPath);
        if (waveformPath === undefined) {
            // generation failed for some reason
            response.sendStatus(404);
            return;
        }
        response.sendFile(waveformPath, {}, function(err) {
            if (err) {
                console.log("sendFile error " + err);
                response.status(err.status).end();
            }
        });
    });
}

