function SettingsPage(root, navItem, hashTracker) {
    var view = this;
    view.root = root;
    view.navItem = navItem;
    view.hashTracker = hashTracker;
    view.summaryPanel = root.find(".summary");
    view.navContainer = root.find(".nav");
    view.tabContainer = root.find(".tab-content");
    view.recordingSettingsTab = view.tabContainer.find(".recording");
    view.recordingSettingsDeviceList = view.recordingSettingsTab.find(".recording-device");
    view.recordingSettingsVolumeBoost = view.recordingSettingsTab.find(".volume-boost");
    view.recordingSettingsSegmentLength = view.recordingSettingsTab.find(".segment-length");
    view.recordingSettingsOverlapLength = view.recordingSettingsTab.find(".overlap-length");
    view.recordingSettingsRMSPeriod = view.recordingSettingsTab.find(".rms-period");
    view.recordingSettingsNoiseThreshold = view.recordingSettingsTab.find(".noise-threshold");
    view.recordingSettingsCalibrateNoiseThresholdButton = view.recordingSettingsTab.find(".calibrate-noise-threshold");
    view.recordingSettingsLoaded = false;
    view.scheduleTab = view.tabContainer.find(".schedule");
    view.scheduleTimesTable = view.scheduleTab.find(".times-table");
    view.scheduleLoaded = false;
    view.advancedSettingsTab = view.tabContainer.find(".advanced");
    view.advancedSettingsDataPath = view.advancedSettingsTab.find(".data-path");
    view.advancedSettingsRecordingsPath = view.advancedSettingsTab.find(".recordings-path");
    view.advancedSettingsRecorderProgramPath = view.advancedSettingsTab.find(".recorder-program-path");
    view.advancedSettingsAnalyserProgramPath = view.advancedSettingsTab.find(".analyser-program-path");
    view.advancedSettingsSplitterProgramPath = view.advancedSettingsTab.find(".splitter-program-path");
    view.advancedSettingsLoaded = false;
    view.activeTab = "recording";
    
    // Populate dynamic elements
    view.createScheduleTable();
    
    // Event hooks
    hashTracker.registerAction("settings", function(action, params) { return view.onHashChanged(action, params); });
    view.recordingSettingsTab.find(".save-button").click(function() { view.saveRecordingSettings(); });
    view.recordingSettingsCalibrateNoiseThresholdButton.click(function() { view.calibrateNoiseThreshold(); });
    view.scheduleTab.find(".save-button").click(function() { view.saveSchedule(); });
    view.advancedSettingsTab.find(".save-button").click(function() { view.saveAdvancedSettings(); });
}

SettingsPage.prototype.onActivate = function() {
    this.hashTracker.setAction("settings", { tab: this.activeTab });
}

SettingsPage.prototype.onHashChanged = function(action, params) {
    var newTab = params["tab"];
    if (newTab === undefined)
        newTab = "recording";
        
    this.setTab(newTab);
    switchView(this);
    return true;
}

SettingsPage.prototype.setTab = function(tab) {
    //console.log("tab", tab);
    this.navContainer.find("li").removeClass("active");
    this.navContainer.find("li[data-tab-name=" + tab + "]").addClass("active");
    this.tabContainer.find(".tab-pane").removeClass("active");
    this.tabContainer.find("." + tab).addClass("active");
    this.activeTab = tab;
    
    // Lazy-load settings
    if (tab == "recording" && !this.recordingSettingsLoaded)
        this.loadRecordingSettings();
    else if (tab == "schedule" && !this.scheduleLoaded)
        this.loadSchedule();
    else if (tab == "advanced" && !this.advancedSettingsLoaded)
        this.loadAdvancedSettings();
}

SettingsPage.prototype.loadRecordingSettings = function() {
    var view = this;
    beginLoadingModal();
    
    $.getJSON(BACKEND_URL + "/settings/recording",
        function(result) {
            console.log("recording settings:", result);
            
            view.recordingSettingsDeviceList.empty();
            $.each(result.recordingDevices, function(index, device) {
                var deviceTitle = device.name + " (sample rate: " + device.sampleRate + "hz)";
                view.recordingSettingsDeviceList.append($("<option>").attr("value", device.id).text(deviceTitle));
            });
            
            view.recordingSettingsDeviceList.val(result.recordingDeviceId);
            view.recordingSettingsVolumeBoost.val(result.volumeBoost);
            view.recordingSettingsSegmentLength.val(result.segmentLength);
            view.recordingSettingsOverlapLength.val(result.overlapLength);
            view.recordingSettingsRMSPeriod.val(result.rmsPeriod);
            view.recordingSettingsNoiseThreshold.val(result.noiseThreshold);
            view.recordingSettingsLoaded = true;
            endLoadingModal();
        }
    ).fail(function() {
        toastr["error"]("Failed to retrieve recording settings.");
        endLoadingModal();
    });
}

SettingsPage.prototype.saveRecordingSettings = function() {
    var view = this;
    beginLoadingModal();
    
    var data = {
        recordingDeviceId: parseInt(view.recordingSettingsDeviceList.val()),
        volumeBoost: parseFloat(view.recordingSettingsVolumeBoost.val()),
        segmentLength: parseInt(view.recordingSettingsSegmentLength.val()),
        overlapLength: parseInt(view.recordingSettingsOverlapLength.val()),
        rmsPeriod: parseInt(view.recordingSettingsRMSPeriod.val()),
        noiseThreshold: parseFloat(view.recordingSettingsNoiseThreshold.val())
    };
    
    $.post(BACKEND_URL + "/settings/recording", data,
        function(result) {
            toastr["success"]("Recording settings saved.");
            endLoadingModal();
        }
    ).fail(function() {
        toastr["error"]("Failed to save recording settings.");
        endLoadingModal();
    });
}

SettingsPage.prototype.calibrateNoiseThreshold = function() {
    var view = this;
    
    view.recordingSettingsCalibrateNoiseThresholdButton.attr("disabled", "disabled");
    view.recordingSettingsCalibrateNoiseThresholdButton.html("<i class='fa fa-spinner fa-pulse sm-right-margin'></i><span>Waiting</span>");
    
    var fail = function() {
        toastr["error"]("Failed to monitor volume level. Ensure no recording is active.");
        view.recordingSettingsCalibrateNoiseThresholdButton.text("Calibrate");
        view.recordingSettingsCalibrateNoiseThresholdButton.removeAttr("disabled");
    }
    
    var c = (function() {
        // Run for 10 seconds, one second at a time.
        var volumeSum = 0;
        var totalChecks = 10;
        var runCallback = function(remainingChecks) {
            $.getJSON(BACKEND_URL + "/recordings/monitor?duration=1",
                function(data) {
                    //console.log(data);
                    if (!data.result) {
                        fail();
                        return;
                    }
                    
                    // Take the average of all samples
                    var sum = 0;
                    $.each(data.levels, function(index, value) { sum += value; });
                    var averageLevel = sum / data.levels.length; 
                    volumeSum += averageLevel;
                    
                    if (remainingChecks > 0) {
                        // Not the end yet
                        view.recordingSettingsCalibrateNoiseThresholdButton.find("span").text("" + averageLevel.toFixed(4) + " dBFS");
                        runCallback(remainingChecks - 1);
                    } else {
                        // At the end, so get the average
                        var totalAverage = volumeSum / totalChecks;
                        //console.log(totalAverage);
                        view.recordingSettingsNoiseThreshold.val(totalAverage.toFixed(4));
                        view.recordingSettingsCalibrateNoiseThresholdButton.text("Calibrate");
                        view.recordingSettingsCalibrateNoiseThresholdButton.removeAttr("disabled");
                    }
                }
            ).fail(fail);
        };
        runCallback(totalChecks - 1);
    })();
}

SettingsPage.prototype.createScheduleTable = function() {
    var view = this;
    
    // Hour headers
    var tableHeadElement = view.scheduleTimesTable.find("thead");
    var headerRowElement = $("<tr>").appendTo(tableHeadElement);
    
    // Dummy for top-left corner
    headerRowElement.append($("<td>")); 
    for (var hourIndex = 0; hourIndex < 24; hourIndex++) {
        headerRowElement.append($("<td>").text(hourIndex.toString()));
    }
    
    // TODO: Use moment.js for this instead?
    var days = [ "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday "];
    var tableBodyElement = view.scheduleTimesTable.find("tbody"); 
    for (var dayIndex = 0; dayIndex < days.length; dayIndex++) {
        var dayElement = $("<tr>").appendTo(tableBodyElement);
        dayElement.append($("<td>").text(days[dayIndex]));
        
        for (var hourIndex = 0; hourIndex < 24; hourIndex++) {
            var hourElement = $("<td>").attr("class", "hour").attr("data-slot", dayIndex * 24 + hourIndex);
            hourElement.click(function() { $(this).toggleClass("active"); });
            dayElement.append(hourElement);
        }
    }
}

SettingsPage.prototype.loadSchedule = function() {
    var view = this;
    beginLoadingModal();
    
    // Unflag all time slots
    view.scheduleTimesTable.find(".hour").removeAttr("active");
    
    $.getJSON(BACKEND_URL + "/settings/schedule",
        function(result) {
            console.log("current schedule", result);
            
            $.each(result, function(index, value) {
                
                // Why did I make duration seconds not hours? Probably had some reason..
                var startSlot = value.day * 24 + value.hour;
                var endSlot = startSlot + Math.floor(value.duration / 3600) - 1;
                if (endSlot < startSlot)
                    return;
                    
                for (var slot = startSlot; slot <= endSlot; slot++)
                    view.scheduleTimesTable.find(".hour[data-slot=" + slot.toString() + "]").addClass("active");
            });
            
            endLoadingModal();
        }
        
    ).fail(function() {
        toastr["error"]("Failed to retrieve schedule.");
        endLoadingModal();
    });
}

SettingsPage.prototype.saveSchedule = function() {
    var TOTAL_SLOTS = 24 * 7;
    var view = this;
    
    // Helper for determinining if a given slot is active
    var slotActive = function(slot) {
        return view.scheduleTimesTable.find(".hour[data-slot=" + slot.toString() + "]").hasClass("active");
    }
    
    // For each slot, work through as many consecutive slots are active, and create an entry
    var timeGroups = [];
    for (var startSlot = 0; startSlot < TOTAL_SLOTS; startSlot++) {
        if (!slotActive(startSlot))
            continue;
            
        var endSlot = startSlot;
        while (endSlot < (TOTAL_SLOTS - 1)) {
            var testSlot = endSlot + 1;
            if (!slotActive(testSlot))
                break;
            
            endSlot++;
        }
        
        var numHours = (endSlot - startSlot) + 1;
        timeGroups.push({
            day: Math.floor(startSlot / 24),
            hour: Math.floor(startSlot % 24),
            minute: 0,
            duration: numHours * 3600
        });
        startSlot = endSlot + 1;
    }
    
    console.log("sending updated schedule", timeGroups);
    
    beginLoadingModal();
    $.ajax({
        url: BACKEND_URL + "/settings/schedule",
        type: "post",
        contentType: "application/json",
        data: JSON.stringify(timeGroups),
        success: function(result) {
            toastr["info"]("Schedule saved.");
        },
        error: function(result) {
            toastr["error"]("Failed to save schedule.");
        },
        complete: function() {
            endLoadingModal();
        }
    });             
}

SettingsPage.prototype.loadAdvancedSettings = function() {
    var view = this;
    beginLoadingModal();
    
    $.getJSON(BACKEND_URL + "/settings/advanced",
        function(result) {
            console.log("advanced settings:", result);
            
            view.advancedSettingsDataPath.val(result.dataPath);
            view.advancedSettingsRecordingsPath.val(result.recordingsPath);
            view.advancedSettingsRecorderProgramPath.val(result.recorderProgramPath);
            view.advancedSettingsAnalyserProgramPath.val(result.analyserProgramPath);
            view.advancedSettingsSplitterProgramPath.val(result.splitterProgramPath);
            view.advancedSettingsLoaded = true;
            endLoadingModal();
        }
    ).fail(function() {
        toastr["error"]("Failed to retrieve advanced settings.");
        endLoadingModal();
    });
}

SettingsPage.prototype.saveAdvancedSettings = function() {
    var view = this;
    beginLoadingModal();
    
    var data = {
        dataPath: view.advancedSettingsDataPath.val(),
        recordingsPath: view.advancedSettingsRecordingsPath.val(),
        recorderProgramPath: view.advancedSettingsRecorderProgramPath.val(),
        analyserProgramPath: view.advancedSettingsAnalyserProgramPath.val(),
        splitterProgramPath: view.advancedSettingsSplitterProgramPath.val()
    };
    
    $.post(BACKEND_URL + "/settings/advanced", data,
        function(result) {
            toastr["success"]("Advanced settings saved.");
            endLoadingModal();
        }
    ).fail(function() {
        toastr["error"]("Failed to save advanced settings.");
        endLoadingModal();
    });
}
