var config = require("../config.js");
var sanitize = require("sanitize-filename");

module.exports = function(request, response) {
    // prevent file name/path injection
    var rawName = sanitize(request.params.name);
    var rawPath = config.rawAudioDirectory + "/" + rawName;
    response.sendFile(rawPath, {}, function(err) {
        if (err) {
            console.log("sendFile error " + err);
            response.status(err.status).end();
        }
    });
}

