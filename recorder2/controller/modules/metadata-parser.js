var fs = require("fs");

var MetadataParser = {};

// Get header information from the metadata file (title, date, length)
MetadataParser.getRecordingInformation = function(path, callback) {
    // Reads the whole file, even though it's not used. Oh well.
    fs.readFile(path, function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        // Extract name from path
        var name = path.substr(path.lastIndexOf('/') + 1, path.lastIndexOf('.') - path.lastIndexOf('/') - 1);

        // Bleh.
        data = data.toString("utf8");

        // Grab the first line only.
        var lineEnd = data.indexOf('\n');
        var line = (lineEnd < 0) ? data : data.substr(0, lineEnd);
        if (line[0] != '!') {
            callback(new Error("Invalid header line in metadata file"), null);
            return;
        }

        // Split to fields.
        var fields = line.substr(1).split(",");
        if (fields.length != 5) {
            callback(new Error("Incorrect number of fields in metadata header"), null);
            return;
        }

        // Create object.
        var info = {
            name: name,
            title: fields[0],
            time: new Date(fields[1]),
            length: parseFloat(fields[2]),
            segmentLength: parseFloat(fields[3]),
            overlapLength: parseFloat(fields[4])
        };

        callback(false, info);
    });
};

// Read entries in metadata file, and produce full data.
MetadataParser.parseFile = function(path, callback) {
    fs.readFile(path, function(err, data) {
        if (err) {
            callback(err);
            return;
        }

        // Extract name from path
        var name = path.substr(path.lastIndexOf('/') + 1, path.lastIndexOf('.') - path.lastIndexOf('/') - 1);

        // Bleh.
        data = data.toString("utf8");

        var lines = data.split('\n');
        var headerLine = lines[0];
        if (headerLine[0] != '!') {
            callback(new Error("Invalid header line in metadata file"));
            return;
        }

        // Split header to fields.
        var headerFields = headerLine.substr(1).split(',');
        if (headerFields.length != 5) {
            callback(new Error("Incorrect number of fields in metadata header"));
            return;
        }

        // Create object.
        var info = {
            name: name,
            title: headerFields[0],
            time: new Date(headerFields[1]),
            length: parseFloat(headerFields[2]),
            segmentLength: parseFloat(headerFields[3]),
            overlapLength: parseFloat(headerFields[4]),
            segments: []
        };

        // Parse segments.
        for (var i = 1; i < lines.length; i++) {
            var line = lines[i];
            if (line.length == 0)
                continue;

            var fields = line.split(',');
            if (fields.length != 5) {
                callback(new Error("Incorrect number of fields at line " + (i + 1)));
                return;
            }

            var segmentInfo = {
                startTime: parseFloat(fields[0]),
                segmentLength: parseFloat(fields[1]),
                overlapLength: parseFloat(fields[2]),
                volume: parseFloat(fields[3]),
                tags: (fields[4].length > 0) ? fields[4].split(';') : []
            };

            info.segments.push(segmentInfo);
        }

        callback(false, info);
    });
};

module.exports = MetadataParser;

