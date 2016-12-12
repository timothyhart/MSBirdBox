var fs = require("fs");
var sanitize = require("sanitize-filename");
var config = require("../config.js");
var segmentManager = require("../util/segment-manager");

// GET: /segment/
// GET: /segment/<timestamp>
//
module.exports = function(request, response) {
    // extract requested segment name
    var segmentName = sanitize(request.params.name || "");

    // fetch list of segments
    segmentManager.getSegmentInfoList(function(segmentList) {
        // case when we just booted
        if (segmentList.length == 0) {
            response.sendStatus(404);
            return;
        }
        // do we want the last segement or a specific one
        var selectedIndex = 0;
        if (segmentName !== undefined) {
            // search for this segment in the list.
            // if it was not found, pick the first
            for (var i = 0; i < segmentList.length; i++) {
                if (segmentList[i].name == segmentName) {
                    selectedIndex = i;
                    break;
                }
            }
        }

        // figure out previous, current, and next segment names
        var model = {
            nav_segment: "active",
            partials: {
                body: "segment"
            },
            name: segmentList[selectedIndex].name,
            time: segmentList[selectedIndex].time,
            shortTime: segmentList[selectedIndex].shortTime,
            previousSegment: (selectedIndex < (segmentList.length - 1)) ? segmentList[selectedIndex + 1].name : undefined,
            nextSegment: (selectedIndex > 0) ? segmentList[selectedIndex - 1].name : undefined,
            segments: segmentList
        };

        // render this segment
        response.render("page", model);
    }, false);
}

