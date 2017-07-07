function RecordingList(root, navItem, hashTracker) {
    var view = this;
    view.root = root;
    view.navItem = navItem;
    view.hashTracker = hashTracker;
    view.listTable = view.root.find(".recording-list-table");
    view.isLoaded = false;

    // Event hooks
    //navItem.click(function() { switchView(view); });
    hashTracker.registerAction("recording-list", function(action, params) { return view.onHashChanged(action, params); });
    root.find(".refresh-button").click(function() { view.refreshList(); });
}

RecordingList.prototype.onActivate = function() {
    this.hashTracker.setAction("recording-list");

    if (!this.isLoaded)
        this.refreshList();
}

RecordingList.prototype.onHashChanged = function(action, params) {
    // Parameters are ignored, just jump to the list
    switchView(this);
    return true;
}

RecordingList.prototype.deleteRecording = function(recordingName) {
    var view = this;
    beginLoadingModal();

    $.getJSON(BACKEND_URL + "/recordings/delete?name=" + recordingName,
        function(result) {
            if (result.result) {
                // Remove from recording list
                view.listTable.find("tr[data-recording-name=" + recordingName + "]").remove();
                toastr["success"]("Deleted recording '" + recordingName + "'.", "Recording Deleted");
            } else {
                toastr["error"](result.error, "Delete Recording Failed");
            }

            endLoadingModal();
        }
    ).fail(function() {
        toastr["error"]("Failed to delete recording");
        endLoadingModal();
    });
}

RecordingList.prototype.onOpenRecordingButtonClicked = function(recordingName) {
    g_recordingViewer.openRecording(recordingName);
}

RecordingList.prototype.onDeleteRecordingButtonClicked = function(recordingName) {
    var view = this;
    bootbox.dialog({
        message: "Are you sure you want to delete the recording '" + recordingName + "'?<br>This action permanent and cannot be undone.",
        title: "Confirm Deletion",
        buttons: {
            confirm: {
                label: "Delete",
                className: "btn-danger",
                callback: function() { view.deleteRecording(recordingName); }
            },
            cancel: {
                label: "Cancel",
                className: "btn-default",
                callback: function() {}
            }
        }
    });
}

RecordingList.prototype.refreshList = function() {
    var view = this;
    beginLoadingModal();

    $.getJSON(BACKEND_URL + "/recordings/list",
        function (data) {
            //console.log("recording list", data);

            // Empty current list
            var tbody = view.listTable.find("tbody");
            tbody.empty();

            // Convert time strings to Date objects
            data = data.map(function (item) { item.time = moment(item.time); return item; });

            // Sort in descending order by date
            data.sort(function (l, r) { return (l.time.valueOf() < r.time.valueOf()); });

            // Output table of records
            $.each(data, function(key, value) {
                var recordingName = value.name;

                var row = $("<tr>");
                row.attr("data-recording-name", recordingName);

                // Date/time
                var startTime = value.time;
                var endTime = moment(value.time).add(value.length, "seconds").local();
                row.append($("<td>").text(startTime.format(DATE_DISPLAY_FORMAT) + ", " + startTime.format(TIME_DISPLAY_FORMAT) + " - " + endTime.format(TIME_DISPLAY_FORMAT)));
                row.append($("<td>").text(value.name));
                row.append($("<td>").text(value.title));

                var duration = moment.duration(value.length, "seconds");
                var durationString = duration.format("hh:mm:ss", { trim: false });
                row.append($("<td>").text(durationString));

                var buttonColumn = $("<td>");
                buttonColumn.attr("class", "text-right");

                var viewButton = $("<button>").attr("class", "btn btn-sm btn-primary xs-left-margin xs-bottom-margin").html("<i class='glyphicon glyphicon-folder-open sm-right-margin'></i>View");
                viewButton.click(function() { view.onOpenRecordingButtonClicked(recordingName); });
                viewButton.appendTo(buttonColumn);
                var downloadURL = BACKEND_URL + "/recordings/download?name=" + recordingName;
                var downloadButton = $("<a>").attr("class", "btn btn-sm btn-info xs-left-margin xs-bottom-margin").html("<i class='glyphicon glyphicon-download-alt xs-right-margin'></i>Download");
                downloadButton.attr("href", downloadURL);
                downloadButton.attr("download", "");
                downloadButton.appendTo(buttonColumn);

                console.log(sessionStorage.getItem("isAdmin"));
                if(sessionStorage.getItem("isAdmin") === 1){
                  var deleteButton = $("<button>").attr("class", "btn btn-sm btn-danger xs-left-margin xs-bottom-margin").html("<i class='glyphicon glyphicon-remove xs-right-margin'></i>Delete");
                  deleteButton.click(function() { view.onDeleteRecordingButtonClicked(recordingName); });
                  deleteButton.appendTo(buttonColumn);
                }

                row.append(buttonColumn);

                tbody.append(row);
            });

            endLoadingModal();
            view.isLoaded = true;
        }
    ).fail(function() {
        toastr["error"]("Failed to load recording list.", "Load Error");
        endLoadingModal();
    });
}
