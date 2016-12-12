var fs = require("fs");
var child_process = require("child_process");
var sanitize = require("sanitize-filename");
var config = require("../config.js");
var segmentManager = require("../util/segment-manager.js");

// GET: /merge/name1/name2
//
module.exports = function(request, response) {
    // extract requested segment name
    var segmentName1 = sanitize(request.params.name);
    var segmentName2 = sanitize(request.params.name2);

    // create the new segment name
    var mergedSegmentName = segmentName1 + "_" + segmentName2;

    // find all paths
    var segmentPath1 = segmentManager.getRawAudioPath(segmentName1);
    var segmentPath2 = segmentManager.getRawAudioPath(segmentName2);
    var mergedSegmentPath = segmentManager.getRawAudioPath(mergedSegmentName);

    // construct command line for ffmpeg
    // annoying, the concat filter expects a file containing the files to join. 
    // so we'll cheat and write the names into stdin, so not to have to create a temp file.
    //var cmdLine = "ffmpeg -f concat -i <(file '" + segmentPath1 + "' file '" + segmentPath2 + "') -c copy '" + mergedSegmentPath + "'";
    //var cmdLine = "ffmpeg -i '" + segmentPath1 + "' -i '" + segmentPath2 + "' -c copy '" + mergedSegmentPath + "'";
    var cmdLine = "ffmpeg -y -f concat -i - -c copy '" + mergedSegmentPath + "'";
    console.log("merge: exec:", cmdLine);
    var child = child_process.exec(cmdLine,
            // shell is required to be bash for substitution above
            //{ shell: "/bin/bash" },

            function(err, stdin, stdout) {
                if (err) {
                    console.log("merge error: ", err);
                    response.sendStatus(500);
                    return;
                }

                // redirect to segment view
                response.redirect("../../segment/" + mergedSegmentName);

                // purge old recordings (do we want this?)
                //segmentManager.purgeOldSegments();
            });
    child.stdin.write("file '" + segmentPath1 + "'\n");
    child.stdin.write("file '" + segmentPath2 + "'\n");
    child.stdin.end();
}

