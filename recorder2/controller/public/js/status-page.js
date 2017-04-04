function StatusPage(root, navItem, hashTracker) {
    var view = this;
    view.root = root;
    view.navItem = navItem;
    view.hashTracker = hashTracker;
    view.summaryPanel = root.find(".summary");
    view.currentRecordingPanel = root.find(".current-recording");
    view.nextRecordingPanel = root.find(".next-recording");
    view.manualRecordingPanel = root.find(".manual-recording");
    view.recentRecordingsPanel = root.find(".recent-recordings");
    view.updateStatusPanel = root.find(".update-status");
    view.refreshButton = root.find(".refresh-button");
    view.isLoaded = false;
    view.refreshInterval = 30000;
    view.refreshTime = new Date();
    view.refreshTimer = null;
    
    // Set a sensible default manual recording name.
    view.manualRecordingPanel.find(".recording-title").val("Manual Recording " + moment().format("YYYY-MM-DD HH:mm:ss"));
    
    // Hide everything initially.
    view.summaryPanel.children().hide();
    view.currentRecordingPanel.hide();
    view.nextRecordingPanel.hide();
    view.manualRecordingPanel.hide();
    view.recentRecordingsPanel.hide();    

    // Event hooks
    hashTracker.registerAction("status-page", function(action, params) { return view.onHashChanged(action, params); });
    view.manualRecordingPanel.find(".start-recording").click(function() { view.onStartManualRecordingButtonPressed(); });
    view.refreshButton.click(function() { view.refresh(true); });
}

StatusPage.prototype.onActivate = function() {
    this.hashTracker.setAction("status-page");
    
    // Refresh, or set refresh timer.
    if (this.isLoaded)
        this.setRefreshTimer();
    else
        this.refresh();
}

StatusPage.prototype.onDeactivate = function() {
    // Prevent refresh while we're not active.
    if (this.refreshTimer !== null) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
    }
}

StatusPage.prototype.onHashChanged = function(action, params) {
    // Parameters are ignored, just jump to the list
    switchView(this);
    return true;
}

StatusPage.prototype.onStartManualRecordingButtonPressed = function() {
    var view = this;
    var title = this.manualRecordingPanel.find(".recording-title").val();
    if (!title.length) {
        toastr["error"]("Cannot record without specifying a title.", "Record Error");
        return;
    }
    var hours = parseInt(this.manualRecordingPanel.find(".duration-hours").val());
    var minutes = parseInt(this.manualRecordingPanel.find(".duration-minutes").val());
    var seconds = parseInt(this.manualRecordingPanel.find(".duration-seconds").val());
    if (hours == 0 && minutes == 0 && seconds == 0) {
        toastr["error"]("Cannot record without specifying a duration.", "Record Error");
        return;
    }
    
    beginLoadingModal();
    
    $.getJSON(BACKEND_URL + "/recordings/start-manual-recording?title=" + title + 
                            "&hours=" + hours + "&minutes=" + minutes + "&seconds=" + seconds,
        function(result) {
            console.log("manual recording result", result);
            if (result.result) {
                // Recording started.
                toastr["success"](result.title, "Manual Recording Started");
                
                // Wait half a second before refreshing the view, in case the recorder process failed to start.
                setTimeout(function() { view.refresh(); endLoadingModal(); }, 500);                
            } else {
                // Failed to start.
                toastr["error"]("Failed to start recording: " + result.error, "Record Error");
                endLoadingModal();
            }
        }
    ).fail(function() {
        toastr["error"]("Failed to send recording start request.", "Record Error");
        endLoadingModal();
    });        
}

StatusPage.prototype.setRefreshTimer = function() {
    var view = this;
    if (view.refreshTimer !== null) {
        clearTimeout(view.refreshTimer);
        view.refreshTimer = null;
    }
    
    // Find delay to refresh in.
    var delay = view.refreshInterval - (new Date() - view.refreshTime);
    if (delay <= 0) {
        // Instant refresh.
        view.refresh();
        return;
    } else {
        // Queue refresh.
        view.refreshTimer = setTimeout(function() { view.refresh(); }, delay);
    }
}

StatusPage.prototype.refresh = function(wasManualRefresh) {
    var view = this;
    
    // Prevent infinite reloading.
    view.refreshButton.attr("disabled", "disabled");
    view.refreshTime = new Date();
    view.isLoaded = true;
    
    //console.log("refreshing status view");
    
    var errorHandler = function(err) {
        toastr["error"](err, "Refresh Error");
        
        // Hide everything.
        view.summaryPanel.children().hide();
        view.currentRecordingPanel.hide();
        view.nextRecordingPanel.hide();
        view.manualRecordingPanel.hide();
        view.recentRecordingsPanel.hide();
    
        endLoadingModal();
        
        view.refreshButton.removeAttr("disabled");
        view.refreshTime = new Date();
        view.setRefreshTimer();
    };
    var completeHandler = function() {
        // Update the last refresh time.
        view.updateStatusPanel.find(".refresh-time").text(moment().format(DATETIME_DISPLAY_FORMAT));
        endLoadingModal();
        if (wasManualRefresh)
            toastr["info"]("Status page updated.");
        
        view.refreshButton.removeAttr("disabled");
        view.refreshTime = new Date();
        view.setRefreshTimer();
    };
    
    // Start by fetching the current recording status
    beginLoadingModal();
    $.getJSON(BACKEND_URL + "/status/current-recording", function(result) {
        console.log("current recording status", result);
        
        view.summaryPanel.children().hide();
        var isRecording = (result.state == "recording");
        if (isRecording) {
            // Recording state. Update current recording panel.
            view.currentRecordingPanel.find(".start-time").text(moment(result.startTime).format(DATETIME_DISPLAY_FORMAT));
            view.currentRecordingPanel.find(".end-time").text(moment(result.endTime).format(DATETIME_DISPLAY_FORMAT));
            view.currentRecordingPanel.find(".elapsed-time").text(moment.duration(result.elapsedTime, "seconds").format(DURATION_DISPLAY_FORMAT));
            view.currentRecordingPanel.find(".remaining-time").text(moment.duration(result.remainingTime, "seconds").format(DURATION_DISPLAY_FORMAT));
            
            // Show appropriate panels.            
            view.summaryPanel.find(".status-perfect").show();
            view.currentRecordingPanel.show();
            view.nextRecordingPanel.hide();
            view.manualRecordingPanel.hide();
        } else {
            // Show the manual recording box, since we're not recording.
            view.currentRecordingPanel.hide();
            view.manualRecordingPanel.show();
        }            
        
        // Get next recording state.
        $.getJSON(BACKEND_URL + "/status/next-recording", function(result) {
            if (result.time !== undefined) {
                // Has a next recording time.
                if (!isRecording)
                    view.summaryPanel.find(".status-reduced").show();
                    
                view.nextRecordingPanel.find(".next-time").text(moment(result.time).format(DATETIME_DISPLAY_FORMAT));
                view.nextRecordingPanel.find(".next-duration").text(moment.duration(result.duration, "seconds").format(DURATION_DISPLAY_FORMAT));
                view.nextRecordingPanel.show();
            } else {
                // No next recording.
                if (!isRecording)
                    view.summaryPanel.find(".status-critical").show();
                    
                view.nextRecordingPanel.hide();
            }
            
            // Everything is loaded now.
            completeHandler();
        }).fail(function() {
            errorHandler("Failed to load next recording state");
        });
        
    }).fail(function() {
        errorHandler("Failed to load current recording state");
    });
    
    // Fetch recent recordings
    beginLoadingModal();
    $.getJSON(BACKEND_URL + "/recordings/recent", function(data) {
        // Empty current list
        var recentTable = view.recentRecordingsPanel.find("table tbody");
        recentTable.empty();

        // Output table of records
        $.each(data, function(key, value) {
            var row = $("<tr>");
            row.append($("<td>").text(moment(value.time).format(DATETIME_DISPLAY_FORMAT)));
            row.append($("<td>").text(value.title));

            var duration = moment.duration(value.length, "seconds");
            var durationString = duration.format("hh:mm:ss", { trim: false });
            row.append($("<td>").text(durationString));

            var buttonColumn = $("<td>");
            buttonColumn.attr("class", "text-right");
            
            var viewButton = $("<button>").attr("class", "btn btn-sm btn-primary xs-left-margin xs-bottom-margin").html("<i class='glyphicon glyphicon-folder-open sm-right-margin'></i>View");
            viewButton.click(function() { g_recordingViewer.openRecording(value.name); });
            viewButton.appendTo(buttonColumn);
            row.append(buttonColumn);

            recentTable.append(row);
        });
        
        // Done loading something else
        view.recentRecordingsPanel.show();
        endLoadingModal();
    }).fail(function() {
        errorHandler("Failed to load the recent recording list");
    });
}
