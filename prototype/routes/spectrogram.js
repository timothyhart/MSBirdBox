var config = require("../config.js");
var spectrogramGenerator = require("../util/spectrogram-generator");
var sanitize = require("sanitize-filename");

module.exports = function(request, response) {
    // prevent file name/path injection
    var rawName = sanitize(request.params.name);
    //console.log("request received for spectrogram for " + rawName);
    
    spectrogramGenerator(rawName, function(spectrogramPath) {
        //console.log("request completed for " + rawName + ": " + spectrogramPath);
        if (spectrogramPath === undefined) {
            // generation failed for some reason
            response.sendStatus(404);
            return;
        }
        response.sendFile(spectrogramPath, {}, function(err) {
            if (err) {
                console.log("sendFile error " + err);
                response.status(err.status).end();
            }
        });
    });
}

