var fs = require("fs");
var app = require("../app");

function createIfMissing(path) {
    try {
        if (!fs.existsSync(path)) {
            console.log("Creating directory " + path);
            fs.mkdirSync(path);
        }
    } catch (err) {
        // fixme at some point
    }
}

var PathInitializer = {
    createDataDirectories: function() {
        // create all directories
        createIfMissing(app.config.getDataPath());
        createIfMissing(app.config.getRecordingsPath());
        console.log("Created data/working directories.");
        return true;
    }
};

module.exports = PathInitializer;
