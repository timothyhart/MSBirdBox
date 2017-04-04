var fs = require("fs");
var sanitize = require("sanitize-filename");
var config = require("../config.js");
var segmentManager = require("../util/segment-manager");

// GET: /list/
//
module.exports = function(request, response) {
    // fetch list of segments
    segmentManager.getSegmentInfoList(function(segmentList) {
        response.json(segmentList);
    }, false);
}

