function DatabasePage(root, navItem, hashTracker, database) {
    var view = this;
    view.root = root;
    view.navItem = navItem;
    view.hashTracker = hashTracker;
    view.database = database;
    view.isLoaded = false;
    view.currentId = -1;
    
    view.birdListElement = root.find(".bird-list-container .bird-list");
    view.birdInfoElement = root.find(".bird-info-container");
    view.carouselElement = root.find(".carousel");
    
    var audioElement = view.birdInfoElement.find(".audio");
    view.waveSurfer = WaveSurfer.create({ container: audioElement[0], height: 64, normalize: true }); 
    
    // Event hooks
    hashTracker.registerAction("database", function(action, params) { return view.onHashChanged(action, params); });
    view.birdInfoElement.find(".play-button").click(function() { view.waveSurfer.playPause(); });
    view.waveSurfer.on("play", function() { view.onWaveSurferStateChange(); });
    view.waveSurfer.on("pause", function() { view.onWaveSurferStateChange(); });
}

DatabasePage.prototype.onActivate = function() {
    this.hashTracker.setAction("database", { id: this.currentId });
    
    // Trigger lazy load here
    if (!this.isLoaded)
        this.loadData();        
}

DatabasePage.prototype.onHashChanged = function(action, params) {
    // Extract bird id from params
    var id = parseInt(params.id);
    if (!isNaN(id)) {
        // If it's not loaded, instruct it to switch to this id once loading is done
        if (!this.isLoaded)
            this.currentId = id;
        else
            this.selectEntry(id);
    }
        
    switchView(this);
    return true;
}

DatabasePage.prototype.loadData = function(loadedCallback) {
    var view = this;
    if (view.isLoaded)
        return;

    beginLoadingModal();
    
    view.database.load(function(err) {
        if (err) {
            toastr["error"](err.toString(), "Failed to load database");
            endLoadingModal();
            return;
        }
        
        var birdList = view.database.getBirdList(); 
        view.birdListElement.empty();
        $.each(birdList, function(index, entry) {
            view.birdListElement.append($("<a>").attr("class", "list-group-item").attr("href", "#database/id=" + entry.id).attr("data-id", entry.id).text(entry.name));
        });
        
        // Select the first by default
        view.isLoaded = true;
        view.selectEntry((view.currentId < 0) ? birdList[0].id : view.currentId);
        endLoadingModal();
    });
}

DatabasePage.prototype.selectEntry = function(id) {
    var view = this;
    var entry = view.database.getBirdById(id);
    console.log("active entry", entry);
    if (!entry)
        return;
    
    // Remove active class from all list entries, and highlight the active one
    view.birdListElement.find("a").removeClass("active");
    view.birdListElement.find("a[data-id=" + id + "]").addClass("active");
    
    // Populate the basic information
    view.birdInfoElement.find(".name").text(entry.name);
    view.birdInfoElement.find(".species-name").text("(" + entry.speciesName + ")");
    view.birdInfoElement.find(".description").text(entry.description);
    
    
    
    // Sources
    var sourcesElement = view.birdInfoElement.find(".sources");
    sourcesElement.empty();
    sourcesElement.append($("<li>").text(entry.source1));
    sourcesElement.append($("<li>").text(entry.source2));
    sourcesElement.append($("<li>").text(entry.photoSource));
    sourcesElement.append($("<li>").text(entry.trophycallSource));    
    
    // Clear out carousel
    var carouselIndicatorsElement = view.carouselElement.find(".carousel-indicators");
    var carouselInnerElement = view.carouselElement.find(".carousel-inner");
    carouselIndicatorsElement.empty();
    carouselInnerElement.empty();
    
    // Create image elements
    carouselIndicatorsElement.append($("<li>").attr("data-target", "#database-image-carousel").attr("data-slide-to", "0").attr("class", "active"));
    carouselInnerElement.append($("<div>").attr("class", "item active")
        .append($("<img>").attr("src", entry.photo).attr("alt", entry.photo))
        .append($("<div>").attr("class", "carousel-caption")
            //.append($("<h4>").text(entry.name))
            .append($("<h4>").text("Photo Description")))            
    );
    
    // Sort out the audio
    // TODO: Call types
    view.waveSurfer.empty();
    view.waveSurfer.load(entry.clip);
    
    // Load spectrogram
    view.birdInfoElement.find(".spectrogram").attr("src", entry.spectrogram);
}

DatabasePage.prototype.onWaveSurferStateChange = function() {
    if (this.waveSurfer.isPlaying()) {
        this.birdInfoElement.find(".play-button").html('<i class="glyphicon glyphicon-pause xs-right-margin"></i>Pause');
    } else {
        this.birdInfoElement.find(".play-button").html('<i class="glyphicon glyphicon-play xs-right-margin"></i>Play');
    }
}
