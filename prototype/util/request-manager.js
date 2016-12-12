// Array of maps containing a list of callbacks to execute when a request has completed.
// This removes the chance of duplicate files being created.
function RequestManager() {
    this.requests = {};
}

RequestManager.prototype.newRequest = function(identifier, callback, completeCallback) {
    var requestList = this.requests[identifier];
    if (requestList === undefined) {
        this.requests[identifier] = [completeCallback];
        callback(this, identifier);
    } else {
        requestList.push(completeCallback);
    }
}

RequestManager.prototype.completeRequest = function(identifier) {
    var requestList = this.requests[identifier];
    if (requestList !== undefined) {
        delete this.requests[identifier];
        for (var i = 0; i < requestList.length; i++) {
            requestList[i]();
        }
    }
}

module.exports = function() {
    return new RequestManager();
}

