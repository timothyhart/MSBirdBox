function RecordingViewer(root, navItem, hashTracker, database)
{
    var view = this;
    
    // Constants for rendering the navigation image
    view.minimumNavigationImageWidthPerSegment = 1;
    view.maximumNavigationImageWidthPerSegment = 100;
    view.defaultNavigationImageWidthPerSegment = 10;
    view.navigationImageWidthPerSegment = 10;
    view.navigationImageHeight = 80;
    
    // Constants for rendering the spectrogram selection bar
    view.clipRangeStart = 65;
    view.clipRangeWidth = 440;
    view.spectrogramTopBorderSize = 16;
    view.spectrogramSelectionBarStartX = 65;
    view.spectrogramSelectionBarStartY = 16;
    view.spectrogramSelectionBarWidth = 440;
    view.spectrogramSelectionBarHeight = 424;
    view.waveformSelectionBarStartX = 65;
    view.waveformSelectionBarStartY = 480;
    view.waveformSelectionBarWidth = 440;
    view.waveformSelectionBarHeight = 128;
    
    // Element selectors
    view.root = root;
    view.navItem = navItem;
    view.hashTracker = hashTracker;
    view.database = database;
    view.recordingName = "";
    view.metadata = null;
    view.segmentStartTime = 0;
    view.segmentDuration = 0;
    view.recordingTitleElement = root.find(".recording-name");
    view.recordingInfoElement = root.find(".recording-info");
    view.navigationContainerElement = root.find(".navigation-container");
    view.navigationImageElement = view.navigationContainerElement.find(".navigation-image");
    view.navigationSelectionBarElement = view.navigationContainerElement.find(".selection-bar");
    view.navigationHighlightBarElement = view.navigationContainerElement.find(".highlight-bar");
    view.navigationInfoPopup = root.find(".navigation-info-popup");
    view.navigationStartSegment = 0;
    view.navigationEndSegment = 0;
    view.navigationOverSegment = -1;
    view.navigationUpdating = false;
    view.segmentInfoElement = root.find(".segment-info");
    view.playerElement = root.find(".player");
    view.spectrogramImageElement = view.playerElement.find(".spectrogram");
    view.spectrogramSelectionBarElement = view.playerElement.find(".spectrogram-selection-bar");
    view.spectrogramPlayBarElement = view.playerElement.find(".spectrogram-play-bar");
    view.waveformElement = view.playerElement.find(".waveform");
    view.waveformSelectionBarElement = view.playerElement.find(".waveform-selection-bar");
    view.waveformPlayBarElement = view.playerElement.find(".waveform-play-bar");
    view.playPauseButton = root.find(".play-pause");
    view.clipSelectionStartPosition = -1;
    view.clipSelectionEndPosition = -1;
    view.clipSelectionStartFraction = 0.0;
    view.clipSelectionEndFraction = 0.0;
    view.clipSelectionUpdating = false;
    view.clipInfoElement = root.find(".clip-info");
    
    // Modal element references
    view.compareModalRoot = $("#recording-viewer-compare-modal");
    view.compareModalRoot.modal({ show: false });
    view.compareModalRoot.on("show.bs.modal", function() { setTimeout(function() { view.onCompareModalShown(); }, 100); });
    view.compareModalLeftSpectrogram = view.compareModalRoot.find(".left .spectrogram");
    view.compareModalLeftWaveform = view.compareModalRoot.find(".left .waveform");
    view.compareModalLeftPlayButton = view.compareModalRoot.find(".left button");
    view.compareModalRightSpectrogram = view.compareModalRoot.find(".right .spectrogram");
    view.compareModalRightWaveform = view.compareModalRoot.find(".right .waveform");
    view.compareModalRightPlayButton = view.compareModalRoot.find(".right button");
    view.compareModalDatabaseSelection = view.compareModalRoot.find(".database-selection");
    
    // Wavesurfer playback object
    view.waveSurfer = WaveSurfer.create({
        container: view.waveformElement[0],
        waveColor: "#337ab7",
        progressColor: "#337ab7",
        cursorWidth: 0,
        normalize: true,
        interact: false
    });
    
    // Compare modal wavesurfers
    view.compareModalLeftWaveSurfer = WaveSurfer.create({ container: view.compareModalLeftWaveform[0], height: 64, normalize: true });
    view.compareModalRightWaveSurfer = WaveSurfer.create({ container: view.compareModalRightWaveform[0], height: 64, normalize: true });

    // Initialize dynamic elements
    view.updateNavigationSelectionBar();
    view.updateSegmentInfoPopup();
    view.updateSegmentView();

    // Event hooks
    //navItem.click(function() { switchView(view); });
    hashTracker.registerAction("view-recording", function(action, params) { return view.onHashChanged(action, params); });
    view.navigationContainerElement.on("mousedown", function(e) { view.onNavigationMouseDown(e); });
    view.navigationContainerElement.on("mousemove", function(e) { view.onNavigationMouseMove(e); });
    view.navigationContainerElement.on("mouseup", function(e) { view.onNavigationMouseUp(e); });
    view.navigationContainerElement.on("mouseout", function (e) { view.onNavigationMouseOut(e); });
    root.find(".navigation-zoom-in").click(function (e) { view.onNavigationZoomInClicked(); });
    root.find(".navigation-zoom-out").click(function (e) { view.onNavigationZoomOutClicked(); });
    root.find(".navigation-previous-tagged-segment").click(function (e) { view.jumpToPreviousTaggedSegment(); });
    root.find(".navigation-next-tagged-segment").click(function (e) { view.jumpToNextTaggedSegment(); });
    view.playerElement.on("mousedown", function(e) { view.onPlayerMouseDown(e); });
    view.playerElement.on("mouseup", function(e) { view.onPlayerMouseUp(e); });
    view.playerElement.on("mousemove", function(e) { view.onPlayerMouseMove(e); });
    root.find(".download-segment").click(function(e) { view.onDownloadSegmentButtonClicked(); });
    root.find(".replay-selection").click(function (e) { view.playClipSelection(); });
    root.find(".identify-selection").click(function (e) { view.compareCommonBirds(); });
    root.find(".compare-selection").click(function(e) { view.openCompareModal(); });
    root.find(".download-selection").click(function(e) { view.onDownloadSelectionButtonClicked(); });
    view.playPauseButton.click(function (e) { view.waveSurfer.playPause(); });
    view.waveSurfer.on("audioprocess", function(time) { view.onWaveSurferAudioProcess(time); });
    view.waveSurfer.on("play", function() { view.onWaveSurferPlayStateChange(); });
    view.waveSurfer.on("pause", function() { view.onWaveSurferPlayStateChange(); });
    view.waveSurfer.on("ready", function() { view.onWaveSurferLoaded() });
    view.compareModalLeftWaveSurfer.on("play", function() { view.onCompareModalLeftWaveSurferPlayStateChange(); });
    view.compareModalLeftWaveSurfer.on("pause", function() { view.onCompareModalLeftWaveSurferPlayStateChange(); });
    view.compareModalLeftPlayButton.click(function() { view.compareModalLeftWaveSurfer.playPause(); });
    view.compareModalDatabaseSelection.change(function() { view.onCompareModalDatabaseSelectionChanged(); });
    view.compareModalRightWaveSurfer.on("play", function() { view.onCompareModalRightWaveSurferPlayStateChange(); });
    view.compareModalRightWaveSurfer.on("pause", function() { view.onCompareModalRightWaveSurferPlayStateChange(); });
    view.compareModalRightPlayButton.click(function() { view.compareModalRightWaveSurfer.playPause(); });

    // Remove one level of modal block when the audio or image is loaded
    view.waveSurfer.on("ready", function () { endLoadingModal(); view.onWaveSurferAudioProcess(0.0); });
    view.spectrogramImageElement.load(function () { endLoadingModal(); });
    view.compareModalLeftWaveSurfer.on("ready", function() { endLoadingModal(); });
    view.compareModalLeftSpectrogram.load(function() { endLoadingModal(); });
    view.compareModalRightWaveSurfer.on("ready", function() { endLoadingModal(); });
    view.compareModalRightSpectrogram.load(function() { endLoadingModal(); });
}

RecordingViewer.prototype.onActivate = function() {
    // Update the hash
    this.updateLocationHash();
}

RecordingViewer.prototype.onHashChanged = function(action, params) {
    //console.log(action, params);
    
    // Check required parameters
    if (params["name"] === undefined &&
        params["start"] === undefined &&
        params["end"] === undefined)
    {
        return false;
    }
    
    // Parse segment selection - has to be done outside, since closeRecording resets it
    var startSegment = parseInt(params["start"]);
    var endSegment = parseInt(params["end"]);
    
    // Do we need to change the open recording?
    var newRecordingName = params["name"];
    if (this.recordingName != newRecordingName) {
        // Queue opening this recording
        this.closeRecording();
        this.navigationStartSegment = startSegment;
        this.navigationEndSegment = endSegment;
        this.openRecording(newRecordingName);
    } else {
        // Same recording, so just update the information.
        this.navigationStartSegment = startSegment;
        this.navigationEndSegment = endSegment;
        this.updateSegmentView();
    }
    
    // Ensure we're the active view
    switchView(this);
    return true;
}

RecordingViewer.prototype.updateLocationHash = function() {
    // Can't do this without a loaded recording
    if (!this.metadata)
        return;
        
    var hashParams = {};
    hashParams["name"] = this.recordingName;
    hashParams["start"] = this.navigationStartSegment;
    hashParams["end"] = this.navigationEndSegment;
    
    this.hashTracker.setAction("view-recording", hashParams);
}

RecordingViewer.prototype.openRecording = function(name) {
    var view = this;

    if (this.metadata)
        this.closeRecording();

    console.log("opening recording " + name);
    beginLoadingModal();
    
    // Load metadata for this recording
    $.getJSON(BACKEND_URL + "/recordings/metadata?name=" + name, function (metadata) {
        view.recordingName = name;
        view.metadata = metadata;
        console.log("metadata", metadata);
        
        // Target 550px width, and pick a sensible width for each segment from this
        view.navigationImageWidthPerSegment = (550 / (view.metadata.segments.length + 1));
        if (view.navigationImageWidthPerSegment < view.minimumNavigationImageWidthPerSegment)
            view.navigationImageWidthPerSegment = view.minimumNavigationImageWidthPerSegment;
        else if (view.navigationImageWidthPerSegment > view.maximumNavigationImageWidthPerSegment)
            view.navigationImageWidthPerSegment = view.maximumNavigationImageWidthPerSegment; 

        // Generate navigation image
        view.updateRecordingInfo();
        view.generateNavigationImage();
        view.updateNavigationSelectionBar();
        view.updateSegmentInfoPopup();
        view.updateSegmentView();

        // Bring us into view
        switchView(view);        
        
        endLoadingModal();
    });
}

RecordingViewer.prototype.closeRecording = function () {
    // Clear any selection and popups.
    this.recordingName = "";
    this.metadata = null;
    this.navigationStartSegment = 0;
    this.navigationEndSegment = 0;
    this.navigationOverSegment = -1;
    this.navigationUpdating = false;
    this.updateRecordingInfo();
    this.updateNavigationSelectionBar();
    this.updateSegmentInfoPopup();
    this.updateSegmentView();
}

RecordingViewer.prototype.updateRecordingInfo = function () {
    this.recordingInfoElement.empty();

    if (this.metadata === null) {
        return;
    }
    
    // Convert to more friendly structures
    var recordTimeMoment = moment(this.metadata.time);
    var recordLengthMoment = moment.duration(this.metadata.length, "seconds");

    this.recordingTitleElement.html(this.metadata.title);

    this.recordingInfoElement.append($("<strong>").text("File Name: "));
    this.recordingInfoElement.append($("<span>").text(this.metadata.name));
    this.recordingInfoElement.append($("<br>"));
    this.recordingInfoElement.append($("<strong>").text("Date/Time: "));
    this.recordingInfoElement.append($("<span>").text(recordTimeMoment.format(DATETIME_DISPLAY_FORMAT)));
    this.recordingInfoElement.append($("<br>"));
    this.recordingInfoElement.append($("<strong>").text("Duration: "));
    this.recordingInfoElement.append($("<span>").text(recordLengthMoment.format("h [hours,] m [minutes,] s [seconds]", { trim: false })));
    this.recordingInfoElement.append($("<br>"));    
}

RecordingViewer.prototype.generateNavigationImage = function() {
    // Size of each segment's box.
    var WIDTH_PER_SEGMENT = this.navigationImageWidthPerSegment;
    var IMAGE_HEIGHT = this.navigationImageHeight;

    // Determine colour to fill the box with, choose from grey (no tags), green (one tag), orange (two tags), red (three tags)
    var BOX_OUTLINE_COLOURS = ["#cccccc", "#00ee00", "#ee6600", "#ee0000"];
    var BOX_COLOURS = ["#eeeeee", "#00ff00", "#ff7700", "#ff0000"];

    // Scale all the volume levels to the peak volume level of the recording.
    var minVolumeLevel = this.metadata.segments.reduce(function (prev, cur) { return (cur.volume < prev) ? cur.volume : prev; }, this.metadata.segments[0].volume);
    var maxVolumeLevel = this.metadata.segments.reduce(function (prev, cur) { return (cur.volume > prev) ? cur.volume : prev; }, this.metadata.segments[0].volume);
    var volumeRange = maxVolumeLevel - minVolumeLevel;

    // Create canvas to render the image to
    var canvas = document.createElement("canvas");
    var segments = this.metadata.segments;
    canvas.width = WIDTH_PER_SEGMENT * segments.length + 1;
    canvas.height = IMAGE_HEIGHT;

    var ctx = canvas.getContext("2d");

    for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
        // Calculate height for this box
        var segment = segments[segmentIndex];
        var volumeFrac = (segment.volume - minVolumeLevel) / volumeRange;
        var boxHeight = Math.floor(volumeFrac * IMAGE_HEIGHT);
        var startX = segmentIndex * WIDTH_PER_SEGMENT;
        ctx.beginPath();
        ctx.rect(startX, IMAGE_HEIGHT - boxHeight, WIDTH_PER_SEGMENT, boxHeight);
        ctx.fillStyle = (segment.tags.length >= BOX_COLOURS.length) ? BOX_COLOURS[BOX_COLOURS.length - 1] : BOX_COLOURS[segment.tags.length];
        ctx.fill();
        ctx.strokeStyle = (segment.tags.length >= BOX_OUTLINE_COLOURS.length) ? BOX_OUTLINE_COLOURS[BOX_OUTLINE_COLOURS.length - 1] : BOX_OUTLINE_COLOURS[segment.tags.length];
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Render to image element.
    this.navigationImageElement.attr("src", canvas.toDataURL("image/png"));
    delete ctx;
    delete canvas;

    // Re-render the highlight bar
    this.updateNavigationSelectionBar();

    // Remove the popup, since it's no longer valid
    this.navigationOverSegment = -1;
    this.updateSegmentInfoPopup();
}

RecordingViewer.prototype.onNavigationMouseDown = function(e) {
    //console.log("mousedown", e);
    var containerClientX = this.navigationContainerElement[0].getBoundingClientRect().left;
    var containerScrollX = this.navigationContainerElement[0].scrollLeft;
    var segmentIndexAtPointerPosition = Math.floor((e.clientX - containerClientX + containerScrollX) / this.navigationImageWidthPerSegment);
    this.navigationStartSegment = segmentIndexAtPointerPosition;
    this.navigationEndSegment = segmentIndexAtPointerPosition;
    this.navigationUpdating = true;
    this.updateNavigationSelectionBar();
}

RecordingViewer.prototype.onNavigationMouseMove = function(e) {
    var containerClientX = this.navigationContainerElement[0].getBoundingClientRect().left;
    var containerScrollX = this.navigationContainerElement[0].scrollLeft;
    var segmentIndexAtPointerPosition = Math.floor((e.clientX - containerClientX + containerScrollX) / this.navigationImageWidthPerSegment);
    //console.log(containerClientX, containerScrollX, segmentIndexAtPointerPosition);
    this.updateSegmentInfoPopupPosition(e);

    // Don't display popups when out-of-range.
    var segmentIndexForPopup = segmentIndexAtPointerPosition;
    if (segmentIndexForPopup >= this.metadata.segments.length)
        segmentIndexForPopup = -1;
    if (this.navigationOverSegment != segmentIndexForPopup) {
        this.navigationOverSegment = segmentIndexForPopup;
        this.updateSegmentInfoPopup();
    }

    // Ensure segment isn't out of range, clamp to the last one.
    if (segmentIndexAtPointerPosition >= this.metadata.segments.length)
        segmentIndexAtPointerPosition = this.metadata.segments.length - 1;

    // Temporarily set a maximum number of segments to select at 5
    // Due to unoptimized splitter and slowness of the rpi, we don't want to
    // create a request that takes "forever".
    if (segmentIndexAtPointerPosition > this.navigationStartSegment && (segmentIndexAtPointerPosition - this.navigationStartSegment) > 5)
        segmentIndexAtPointerPosition = this.navigationStartSegment + 5;
    else if (segmentIndexAtPointerPosition < this.navigationStartSegment && (this.navigationStartSegment - segmentIndexAtPointerPosition) > 5)
        segmentIndexAtPointerPosition = this.navigationStartSegment - 5;

    if (!this.navigationUpdating)
        return;

    //console.log("mousemove", e);
    this.navigationEndSegment = segmentIndexAtPointerPosition;
    this.updateNavigationSelectionBar();
    //console.log("time ", this.navigationStartSegment, this.navigationEndSegment, "pos", segmentIndexAtPointerPosition);
}

RecordingViewer.prototype.onNavigationMouseUp = function(e) {
    //console.log("mouseup", e);

    // Fix up backwards selections, these are okay too
    if (this.navigationEndSegment < this.navigationStartSegment) {
        var temp = this.navigationEndSegment;
        this.navigationEndSegment = this.navigationStartSegment;
        this.navigationStartSegment = temp;
    }

    this.navigationUpdating = false;
    this.updateSegmentView();
}

RecordingViewer.prototype.onNavigationMouseOut = function(e) {
    //console.log("mouseout", e);
    
    // Hide popup
    this.navigationOverSegment = -1;
    this.updateSegmentInfoPopup();
}

RecordingViewer.prototype.updateNavigationSelectionBar = function () {
    if (this.metadata === null || this.navigationStartSegment < 0) {
        // Hide the bar
        this.navigationSelectionBarElement.attr("style", "left: -9999px;");
        return;
    }

    // A negative range can be specified
    var startTime = this.navigationStartSegment;
    var endTime = this.navigationEndSegment;
    if (endTime < startTime) {
        startTime = this.navigationEndSegment;
        endTime = this.navigationStartSegment;
    }

    // Update bar style
    var style = "left: " + (startTime * this.navigationImageWidthPerSegment) + "px; width: " + ((endTime - startTime + 1) * this.navigationImageWidthPerSegment) + "px; " +
                "top: 0px; height: " + this.navigationImageHeight + "px;";

    this.navigationSelectionBarElement.attr("style", style);
}

RecordingViewer.prototype.onNavigationZoomInClicked = function () {
    if (this.metadata === null)
        return;

    this.navigationImageWidthPerSegment *= 2;
    if (this.navigationImageWidthPerSegment > this.maximumNavigationImageWidthPerSegment)
        this.navigationImageWidthPerSegment = this.maximumNavigationImageWidthPerSegment;

    this.generateNavigationImage();
}

RecordingViewer.prototype.onNavigationZoomOutClicked = function () {
    if (this.metadata === null)
        return;

    this.navigationImageWidthPerSegment /= 2;
    if (this.navigationImageWidthPerSegment < this.minimumNavigationImageWidthPerSegment)
        this.navigationImageWidthPerSegment = this.minimumNavigationImageWidthPerSegment;

    this.generateNavigationImage();
}

RecordingViewer.prototype.updateSegmentInfoPopup = function() {
    if (this.navigationOverSegment < 0) {
        this.navigationInfoPopup.addClass("hidden");
        this.navigationHighlightBarElement.addClass("hidden");
        return;
    }

    var segmentIndex = this.navigationOverSegment;
    var segmentInfo = this.metadata.segments[segmentIndex];
    var contents = $("<div>");
    contents.append($("<strong>").text("Segment: "));
    contents.append($("<span>").text("+" + segmentInfo.startTime + " seconds"));
    contents.append($("<br>"));
    contents.append($("<strong>").text("Time: "));
    contents.append($("<span>").text(moment(this.metadata.time).add(segmentInfo.startTime, "seconds").local().format(TIME_DISPLAY_FORMAT)));
    contents.append($("<br>"));
    contents.append($("<strong>").text("Volume: "));
    contents.append($("<span>").text(segmentInfo.volume.toFixed(4).toString() + " dBFS"));
    contents.append($("<br>"));
    contents.append($("<strong>").text("Tags: "));
    contents.append($("<span>").text(segmentInfo.tags.join(", ")));
    this.navigationInfoPopup.empty();
    this.navigationInfoPopup.append(contents);
    this.navigationInfoPopup.removeClass("hidden");

    // Update bar style
    var style = "left: " + (segmentIndex * this.navigationImageWidthPerSegment) + "px; width: " + this.navigationImageWidthPerSegment + "px; " +
                "top: 0px; height: " + this.navigationImageHeight + "px;";

    this.navigationHighlightBarElement.removeClass("hidden");
    this.navigationHighlightBarElement.attr("style", style);
}

RecordingViewer.prototype.updateSegmentInfoPopupPosition = function (e) {
    var rect = this.navigationContainerElement.parent()[0].getBoundingClientRect();
    var style = "left: " + (e.clientX - rect.left) + "px; top: " + (e.clientY - rect.top + 20) + "px;";
    this.navigationInfoPopup.attr("style", style);
}

RecordingViewer.prototype.jumpToPreviousTaggedSegment = function() {
    if (this.metadata === null)
        return;

    var currentSegment = this.navigationStartSegment - 1;
    while (currentSegment >= 0) {
        var segmentInfo = this.metadata.segments[currentSegment];
        if (segmentInfo.tags.length > 0) {
            this.navigationStartSegment = currentSegment;
            this.navigationEndSegment = currentSegment;
            this.updateSegmentView();
            return;
        }
        
        currentSegment--;
    }
    
    toastr["info"]("No more tagged segments in this recording.");
}

RecordingViewer.prototype.jumpToNextTaggedSegment = function() {
    if (this.metadata === null)
        return;

    var currentSegment = this.navigationEndSegment + 1;
    while (currentSegment < this.metadata.segments.length) {
        var segmentInfo = this.metadata.segments[currentSegment];
        if (segmentInfo.tags.length > 0) {
            this.navigationStartSegment = currentSegment;
            this.navigationEndSegment = currentSegment;
            this.updateSegmentView();
            return;
        }
        
        currentSegment++;
    }
    
    toastr["info"]("No more tagged segments in this recording.");
}

RecordingViewer.prototype.updateSegmentView = function () {
    // Stop anything playing.
    if (this.waveSurfer.isPlaying())
        this.waveSurfer.stop();
    
    // No selection?
    if (this.metadata === null || this.navigationStartSegment < 0) {
        this.segmentInfoElement.empty();
        this.waveSurfer.empty();
        this.spectrogramImageElement.attr("src", "");
        return;
    }

    var firstSegmentInfo = this.metadata.segments[this.navigationStartSegment];
    var lastSegmentInfo = this.metadata.segments[this.navigationEndSegment];
    var startTime = firstSegmentInfo.startTime;
    var duration = (lastSegmentInfo.startTime + lastSegmentInfo.segmentLength) - firstSegmentInfo.startTime;

    this.segmentStartTime = startTime; 
    this.loadSegmentAudio(startTime, duration);
    this.loadSegmentSpectrogram(startTime, duration);
    
    // Update the location hash while we're at it
    this.updateNavigationSelectionBar();
    this.updateLocationHash();
    this.updateSegmentInfo();
}

RecordingViewer.prototype.updateSegmentInfo = function() {
    // Calculate times
    var firstSegmentInfo = this.metadata.segments[this.navigationStartSegment];
    var lastSegmentInfo = this.metadata.segments[this.navigationEndSegment]; 
    var duration = (lastSegmentInfo.startTime + lastSegmentInfo.segmentLength) - firstSegmentInfo.startTime;
    
    // To readable strings        
    var startTimeString = moment(this.metadata.time).add(firstSegmentInfo.startTime, "seconds").local().format(TIME_DISPLAY_FORMAT);
    var endTimeString = moment(this.metadata.time).add(lastSegmentInfo.startTime + lastSegmentInfo.segmentLength, "seconds").local().format(TIME_DISPLAY_FORMAT);
    var durationString = moment.duration(duration, "seconds").format("m [minutes,] s [seconds]");
    
    var html = "<strong>Start Time: </strong>" + startTimeString + " (segment " + (this.navigationStartSegment + 1) + ")<br>" +
               "<strong>End Time: </strong>" + endTimeString + " (segment " + (this.navigationEndSegment + 1) + ")<br>" +
               "<strong>Duration: </strong>" + durationString + "<br>";

    this.segmentInfoElement.html(html);
}

RecordingViewer.prototype.loadSegmentAudio = function (startTime, duration) {
    // Load the audio clip into the wavesurfer object
    var segmentAudioURL = BACKEND_URL + "/recordings/segment-audio?name=" + this.recordingName +
                                        "&startTime=" + startTime +
                                        "&duration=" + duration +
                                        "&format=ogg";

    beginLoadingModal();
    this.waveSurfer.load(segmentAudioURL);
}

RecordingViewer.prototype.onWaveSurferLoaded = function() {
    // Update cached duration
    this.segmentDuration = this.waveSurfer.getDuration();
    
    // Clear the clip selection since we have a new segment
    this.clearClipSelection();
}

RecordingViewer.prototype.loadSegmentSpectrogram = function (startTime, duration) {
    // Update the segment info image source
    var segmentSpectrogramURL = BACKEND_URL + "/recordings/segment-spectrogram?name=" + this.recordingName +
                                              "&startTime=" + startTime +
                                              "&duration=" + duration;

    beginLoadingModal();
    this.spectrogramImageElement.attr("src", segmentSpectrogramURL);
}

RecordingViewer.prototype.onPlayerMouseDown = function(e) {
    var containerClientX = this.playerElement[0].getBoundingClientRect().left;
    var containerScrollX = this.playerElement[0].scrollLeft;
    var pixelOffset = Math.floor((e.clientX - containerClientX + containerScrollX));
    
    this.clipSelectionUpdating = true;
    this.clipSelectionStartPosition = pixelOffset;
    this.clipSelectionEndPosition = pixelOffset;
    this.updateClipSelection();
}

RecordingViewer.prototype.onPlayerMouseUp = function(e) {
    this.clipSelectionUpdating = false;
    
    // Fix up start/end when selecting backwards
    if (this.clipSelectionStartPosition > this.clipSelectionEndPosition) {
        var temp = this.clipSelectionEndPosition;
        this.clipSelectionEndPosition = this.clipSelectionStartPosition;
        this.clipSelectionStartPosition = temp; 
    }
    
    this.updateClipSelection();
    
    // Play the selection after it is selected
    this.playClipSelection();
}

RecordingViewer.prototype.onPlayerMouseMove = function(e) {
    if (!this.clipSelectionUpdating)
        return;
        
    var containerClientX = this.playerElement[0].getBoundingClientRect().left;
    var containerScrollX = this.playerElement[0].scrollLeft;
    var pixelOffset = Math.floor((e.clientX - containerClientX + containerScrollX));
    
    this.clipSelectionEndPosition = pixelOffset;
    this.updateClipSelection();   
}

RecordingViewer.prototype.updateClipSelection = function() {
    var leftOffset = this.clipSelectionStartPosition;
    var rightOffset = this.clipSelectionEndPosition;
    //console.log("range", leftOffset, rightOffset);
    
    // Swap for backwards selections
    if (leftOffset > rightOffset) {
        var temp = rightOffset;
        rightOffset = leftOffset;
        leftOffset = temp;
    }
    
    // Remove borders from the equation
    leftOffset -= this.clipRangeStart;
    rightOffset -= this.clipRangeStart;
    if (leftOffset < 0)
        leftOffset = 0;
    else if (leftOffset > this.clipRangeWidth)
        leftOffset = this.clipRangeWidth;
    if (rightOffset < 0)
        rightOffset = 0;
    else if (rightOffset > this.clipRangeWidth)
        rightOffset = this.clipRangeWidth;
   
    // Calculate fraction of segment selected
    this.clipSelectionStartFraction = leftOffset / this.clipRangeWidth;
    this.clipSelectionEndFraction = rightOffset / this.clipRangeWidth;
    //console.log("fraction", this.clipSelectionStartFraction, this.clipSelectionEndFraction);
    
    // Update overlay bars
    this.updateClipSelectionBars();
    
    // Update info window
    this.updateClipInformation();   
}
    
RecordingViewer.prototype.updateClipSelectionBars = function() {
    var startFraction = this.clipSelectionStartFraction;
    var endFraction = this.clipSelectionEndFraction;
    var selectionFraction = endFraction - startFraction;
    
    if (startFraction >= endFraction) {
        this.spectrogramSelectionBarElement.hide();
        this.waveformSelectionBarElement.hide();
    } else {
        // Update overlay bar style
        var spectrogramBarLeft = Math.floor(this.spectrogramSelectionBarStartX + startFraction * this.spectrogramSelectionBarWidth);
        var spectrogramBarWidth = Math.ceil(selectionFraction * this.spectrogramSelectionBarWidth);
        var waveformBarLeft = Math.floor(this.waveformSelectionBarStartX + startFraction * this.waveformSelectionBarWidth);
        var waveformBarWidth = Math.floor(selectionFraction * this.waveformSelectionBarWidth);
        setAbsoluteElementRect(this.spectrogramSelectionBarElement, spectrogramBarLeft, this.spectrogramSelectionBarStartY, spectrogramBarWidth, this.spectrogramSelectionBarHeight);
        setAbsoluteElementRect(this.waveformSelectionBarElement, waveformBarLeft, this.waveformSelectionBarStartY, waveformBarWidth, this.waveformSelectionBarHeight);
        this.spectrogramSelectionBarElement.show();
        this.waveformSelectionBarElement.show();
    }
}

RecordingViewer.prototype.updateClipInformation = function() {
    var html = "<strong>Selection Start: </strong>" + (this.clipSelectionStartFraction * this.segmentDuration).toFixed(3) + " seconds<br>" +
               "<strong>Selection End: </strong>" + (this.clipSelectionEndFraction * this.segmentDuration).toFixed(3) + " seconds<br>" +
               "<strong>Selection Duration: </strong>" + ((this.clipSelectionEndFraction - this.clipSelectionStartFraction) * this.segmentDuration).toFixed(3) + " seconds<br>";
               
    this.clipInfoElement.html(html);
}

RecordingViewer.prototype.clearClipSelection = function() {
    this.clipSelectionStartPosition = -1;
    this.clipSelectionEndPosition = -1;
    this.clipSelectionStartFraction = 0.0;
    this.clipSelectionEndFraction = 0.0;
    this.updateClipSelection();
    
    // Seek so when we hit play we start at the beginning
    if (this.waveSurfer.isPlaying())
        this.waveSurfer.stop();
    this.onWaveSurferAudioProcess(0.0);
}

RecordingViewer.prototype.playClipSelection = function() {
    var startTime = this.clipSelectionStartFraction * this.waveSurfer.getDuration();
    var endTime = this.clipSelectionEndFraction * this.waveSurfer.getDuration();
    
    // Danger, floating point comparison without epsilon!
    if (startTime == endTime) {
        // Play the whole thing when a single click was made only
        endTime = this.waveSurfer.getDuration();
    }
    
    //console.log("play clip - ", startTime, endTime);   
    this.waveSurfer.play(startTime, endTime);
}

RecordingViewer.prototype.onWaveSurferAudioProcess = function(time) {
    // Calculate played percentage
    var playedFraction = this.waveSurfer.getCurrentTime() / this.waveSurfer.getDuration();
    //console.log("PF", playedFraction);
    
    // Adjust the seek bar positions
    setAbsoluteElementRect(this.spectrogramPlayBarElement,
        this.spectrogramSelectionBarStartX + Math.floor(this.spectrogramSelectionBarWidth * playedFraction), this.spectrogramSelectionBarStartY,
        2, this.spectrogramSelectionBarHeight);
        
    setAbsoluteElementRect(this.waveformPlayBarElement,
        this.waveformSelectionBarStartX + Math.floor(this.waveformSelectionBarWidth * playedFraction), this.waveformSelectionBarStartY,
        2, this.waveformSelectionBarHeight); 
}

RecordingViewer.prototype.onWaveSurferPlayStateChange = function() {
    if (this.waveSurfer.isPlaying()) {
        this.playPauseButton.html('<i class="glyphicon glyphicon-pause xs-right-margin"></i>Pause');
    } else {
        this.playPauseButton.html('<i class="glyphicon glyphicon-play xs-right-margin"></i>Play');
    }
}

RecordingViewer.prototype.onDownloadSegmentButtonClicked = function() {
    var firstSegmentInfo = this.metadata.segments[this.navigationStartSegment];
    var lastSegmentInfo = this.metadata.segments[this.navigationEndSegment];
    var startTime = firstSegmentInfo.startTime;
    var duration = (lastSegmentInfo.startTime + lastSegmentInfo.segmentLength) - firstSegmentInfo.startTime;

    var segmentAudioURL = BACKEND_URL + "/recordings/segment-audio?name=" + this.recordingName +
                                        "&startTime=" + startTime +
                                        "&duration=" + duration +
                                        "&download&format=ogg";
                                         
    window.location = segmentAudioURL;    
}

RecordingViewer.prototype.onDownloadSelectionButtonClicked = function() {
    var clipStartTime = this.clipSelectionStartFraction * this.waveSurfer.getDuration();
    var clipEndTime = this.clipSelectionEndFraction * this.waveSurfer.getDuration();
    if (clipStartTime == clipEndTime)
        clipEndTime = this.waveSurfer.getDuration() - clipStartTime;
        
    var segmentStartTime = this.metadata.segments[this.navigationStartSegment].startTime;
    var startTime = segmentStartTime + clipStartTime;
    var duration = clipEndTime - clipStartTime;
    
    var segmentAudioURL = BACKEND_URL + "/recordings/segment-audio?name=" + this.recordingName +
                                        "&startTime=" + startTime +
                                        "&duration=" + duration +
                                        "&download&format=ogg";
                                         
    window.location = segmentAudioURL;
}

RecordingViewer.prototype.openCompareModal = function() {
    var view = this;
    beginLoadingModal();
    
    // Populate list with all birds from database.
    beginLoadingModal();
    view.database.load(function() {
        var birdList = view.database.getBirdList();
        view.compareModalDatabaseSelection.empty();
        
        var optGroupElement = $("<optgroup>").attr("label", "Database Birds").appendTo(view.compareModalDatabaseSelection);
        $.each(birdList, function(key, value) {
            optGroupElement.append($("<option>").attr("value", value.id).text(value.name));
        });
        
        // Select the first bird by default
        view.compareModalDatabaseSelection.val(birdList[0].id);
        view.onCompareModalDatabaseSelectionChanged();                        
        endLoadingModal();
    });
    
    this.compareModalRoot.modal("show");
}

RecordingViewer.prototype.compareCommonBirds = function() {
    var view = this;
    beginLoadingModal();
    
    // Populate list with 6 common birds.
    beginLoadingModal();
    view.database.load(function() {
        var birdList = view.database.getCommonBirdList(true, 6);
        var firstBirdId = birdList[0].id;
        view.compareModalDatabaseSelection.empty();
        
        var optGroupElement = $("<optgroup>").attr("label", "Possible Match Birds").appendTo(view.compareModalDatabaseSelection);
        $.each(birdList, function(key, value) {
            optGroupElement.append($("<option>").attr("value", value.id).text(value.name));
        });
        
        birdList = view.database.getBirdList();
        optGroupElement = $("<optgroup>").attr("label", "Database Birds").appendTo(view.compareModalDatabaseSelection);
        $.each(birdList, function(key, value) {
            optGroupElement.append($("<option>").attr("value", value.id).text(value.name));
        });
        
        // Select the first bird by default
        view.compareModalDatabaseSelection.val(firstBirdId);
        view.onCompareModalDatabaseSelectionChanged();                        
        endLoadingModal();
    });
    
    this.compareModalRoot.modal("show");
}

RecordingViewer.prototype.onCompareModalShown = function() {   
    var view = this;   
       
    // Determine range of selection
    var startTime = view.segmentStartTime + (view.clipSelectionStartFraction * view.segmentDuration);
    var duration = (view.clipSelectionStartFraction == view.clipSelectionEndFraction) ? (view.segmentDuration) : ((view.clipSelectionEndFraction - view.clipSelectionStartFraction) * view.segmentDuration);
    
    // Initialize the left side of the compare window
    // Loading modal for each image/audio
    var lhsAudioURL = BACKEND_URL + "/recordings/segment-audio?name=" + view.recordingName +
                                    "&startTime=" + startTime +
                                    "&duration=" + duration +
                                    "&format=ogg";
    var lhsSpectrogramURL = BACKEND_URL + "/recordings/segment-spectrogram?name=" + view.recordingName +
                                          "&startTime=" + startTime +
                                          "&duration=" + duration;
    beginLoadingModal();
    view.compareModalLeftSpectrogram.attr("src", lhsSpectrogramURL);
    beginLoadingModal();
    //setTimeout(function() {
        view.compareModalLeftWaveSurfer.load(lhsAudioURL);
    //}, 250);

    endLoadingModal();
}

RecordingViewer.prototype.onCompareModalDatabaseSelectionChanged = function() {
    var birdId = this.compareModalDatabaseSelection.val();
    var birdInfo = this.database.getBirdById(birdId);
    //console.log("db selection", birdInfo);
    
    this.compareModalRightSpectrogram.attr("src", "");
    this.compareModalRightWaveSurfer.empty();
    
    beginLoadingModal();    
    this.compareModalRightSpectrogram.attr("src", birdInfo.spectrogram);
    
    beginLoadingModal();
    this.compareModalRightWaveSurfer.load(birdInfo.clip);
}

RecordingViewer.prototype.onCompareModalLeftWaveSurferPlayStateChange = function() {
    if (this.compareModalLeftWaveSurfer.isPlaying()) {
        this.compareModalLeftPlayButton.html('<i class="glyphicon glyphicon-pause xs-right-margin"></i>Pause');
    } else {
        this.compareModalLeftPlayButton.html('<i class="glyphicon glyphicon-play xs-right-margin"></i>Play');
    }
}

RecordingViewer.prototype.onCompareModalRightWaveSurferPlayStateChange = function() {
    if (this.compareModalRightWaveSurfer.isPlaying()) {
        this.compareModalRightPlayButton.html('<i class="glyphicon glyphicon-pause xs-right-margin"></i>Pause');
    } else {
        this.compareModalRightPlayButton.html('<i class="glyphicon glyphicon-play xs-right-margin"></i>Play');
    }
}
