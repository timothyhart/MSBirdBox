function LibraryView() {
    var view = this;
    view.container = $(".library-view");
    view.cardContainer = view.container.find(".cards-container");
    view.exitCallback = null;
    view.page = -1;
    view.birdList = [];
    view.birdListWaveSurfers = [];
    view.cardModal = $(".library-card-modal");
    view.cardModalWaveSurfer = null;

    // Hook button events
    view.container.find(".home-button").click(function (e) { view.onHomeButtonPressed(); });
    view.container.find(".page-button").click(function (e) { view.onLibraryPageButtonPressed($(this)); });
    view.cardModal.find(".close-button").click(function (e) { view.onPopupCloseButtonPressed($(this)); });
    view.cardModal.find(".play-button").click(function (e) { view.onPopupPlayButtonPressed($(this)); });
    view.cardModal.find(".page-buttons button").click(function (e) { view.onPopupPageButtonPressed($(this)); });
}

LibraryView.prototype.onHomeButtonPressed = function ()
{
    // Run exitCallback, or return to title screen.
    if (this.exitCallback) {
        this.exitCallback();
        return;
    }

    switchView(g_views.titleView);
}

LibraryView.prototype.onLibraryPageButtonPressed = function (button)
{
    var page = parseInt(button.attr("data-page"));
    this.loadPage(page);
}

LibraryView.prototype.onCardPressed = function (card)
{
    var birdId = parseInt(card.attr("data-id"));
    var bird = g_database.getBirdById(birdId);
    if (bird)
        this.openPopup(bird);
}

// Load library page. page is zero-based.
LibraryView.prototype.loadPage = function (page)
{
    var view = this;
    if (view.page == page)
        return;

    // Remove all cards
    view.page = page;
    view.cardContainer.find(".card").remove();
    view.birdList = [];

    // Destroy wavesurfer objects
    $.each(view.birdListWaveSurfers, function(index, obj) {
        obj.destroy();
    });
    view.birdListWaveSurfers = [];

    // Get a list of birds to display
    view.birdList = g_database.getBirdsForLevel(page);

    // Build card objects for each of these birds
    $.each(this.birdList, function (key, value) {
        var cardElement = $("<div>").attr("class", "card").appendTo(view.cardContainer);
        var cardInnerElement = $("<div>").attr("class", "inner").appendTo(cardElement);
        cardInnerElement.append($("<div>").attr("class", "card-title").text(value.name));
        cardInnerElement.append($("<div>").attr("class", "image").append($("<img>").attr("src", value.photo).attr("alt", value.name)));
        cardInnerElement.append($("<div>").attr("class", "waveform"));
        cardInnerElement.append($("<div>").attr("class", "spectrogram").append($("<img>").attr("src", value.spectrogram).attr("alt", value.name)));
        cardInnerElement.append($("<button>").attr("class", "play-button"));

        // Hook up popup opener
        cardElement.attr("data-id", value.id);
        cardElement.click(function (e) { view.onCardPressed($(this)); });

        // Create wavesurfer
        var waveformElement = cardInnerElement.find(".waveform");
        var waveSurfer = WaveSurfer.create({
            container: waveformElement[0],
            height: 60,
            waveColor: "#e22"
        });
        waveSurfer.load(value.clip);
        view.birdListWaveSurfers.push(waveSurfer);

        // Prevent falling through to parent object events
        makeNonClickable(waveformElement);

        // Hook up play button
        cardInnerElement.find(".play-button").click(function (e) {
            waveSurfer.play();
            e.stopPropagation();
        });
    });

    // Update UI
    view.container.find(".page-button").removeClass("active");
    view.container.find(".page-button[data-page=" + page + "]").addClass("active");
}

// Loads library, if exitCallback is provided, it will be executed when home is pressed.
LibraryView.prototype.open = function(exitCallback)
{
    this.exitCallback = (exitCallback) ? exitCallback : null;
    this.loadPage(0);
    switchView(this);
}

// Opens a popup of a bird
LibraryView.prototype.openPopup = function(bird)
{
    this.cardModal.addClass("active-modal");

    // Fill in fields
    this.cardModal.find(".card-title").text(bird.name);
    this.cardModal.find(".image img").attr("src", bird.photo).attr("alt", bird.name);
    this.cardModal.find(".spectrogram img").attr("src", bird.spectrogram).attr("alt", bird.name);
    this.cardModal.find(".description").text(bird.description);

    // Default to first page
    this.cardModal.find(".page").removeClass("active-page");
    this.cardModal.find(".page[data-page=0]").addClass("active-page");

    // Create wavesurfer
    var waveformElement = this.cardModal.find(".waveform");
    this.cardModalWaveSurfer = WaveSurfer.create({
        container: waveformElement[0],
        height: 120,
        waveColor: "#e22"
    });
    this.cardModalWaveSurfer.load(bird.clip);
}

LibraryView.prototype.onPopupCloseButtonPressed = function()
{
    // Destroy wavesurfer so we're not wasting memory
    if (this.cardModalWaveSurfer) {
        this.cardModalWaveSurfer.destroy();
        this.cardModalWaveSurfer = null;
    }

    this.cardModal.removeClass("active-modal");
}

LibraryView.prototype.onPopupPlayButtonPressed = function()
{
    this.cardModalWaveSurfer.play(0);
}

LibraryView.prototype.onPopupPageButtonPressed = function(button)
{
    var newPage = parseInt(button.attr("data-page"));
    this.cardModal.find(".page").removeClass("active-page");
    this.cardModal.find(".page[data-page=" + newPage + "]").addClass("active-page");
}

g_views.libraryView = new LibraryView();
