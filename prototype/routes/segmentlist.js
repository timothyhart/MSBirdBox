var fs = require("fs");
var sanitize = require("sanitize-filename");
var config = require("../config.js");
var segmentManager = require("../util/segment-manager");

// GET: /list/
//
module.exports = function(request, response) {
    // fetch list of segments
    segmentManager.getSegmentInfoList(function(segmentList) {
        var model = {
            nav_segmentlist: "active",
            partials: {
                body: "segmentlist"
            },
            segments: segmentList
        };

        // render this segment
        response.render("page", model);
    }, false);
}

