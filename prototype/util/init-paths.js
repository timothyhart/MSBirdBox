var fs = require("fs");
var config = require("../config.js");

function createIfMissing(path) {
    try {
        fs.mkdirSync(path);
    } catch (err) {
        // fixme at some point
    }
}

module.exports = function() {
    // create all directories
    createIfMissing(config.baseDirectory);
    createIfMissing(config.saveDirectory);
    createIfMissing(config.rawAudioDirectory);
    createIfMissing(config.baseDirectory + "/cache");
    createIfMissing(config.encodedAudioCacheDirectory);
    createIfMissing(config.spectrogramCacheDirectory);
    createIfMissing(config.waveformCacheDirectory);
    console.log("Created data/working directories.");
}
