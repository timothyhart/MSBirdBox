function LevelCompleteView() {
    var view = this;
    view.container = $(".level-complete-view");
    view.unlockedBirdsCard = view.container.find(".unlock-list .new-birds");
    view.increasedSkillCard = view.container.find(".unlock-list .bird-skill");
    view.scoreDisplay = view.container.find(".score-container .score-value");
    view.unlockedBirdsModal = view.container.find(".unlocked-birds-modal");
    view.increasedSkillModal = view.container.find(".increased-skill-modal");
    view.completedLevel = 0;
    view.completedSubLevel = 0;
    view.unlockedBirds = [];
    view.birdsWithIncreasedSkill = [];
    view.waveSurferList = [];

    // Hook button events
    view.container.find(".home-button").click(function (e) { view.onHomeButtonPressed(); });
    view.container.find(".level-select-button").click(function (e) { view.onLevelSelectButtonPressed(); });
    view.container.find(".go-again-button").click(function (e) { view.onReplayButtonPressed(); });
    view.container.find(".unlock-list .new-birds").click(function (e) { view.openBirdsUnlockedPopup(); });
    view.container.find(".unlock-list .bird-skill").click(function (e) { view.openIncreasedSkillPopup(); });
    view.container.find(".level-complete-modal .close-button").click(function (e) { view.onPopupCloseClicked($(this)); });
    view.container.find(".unlocked-birds-modal .view-collection-button").click(function (e) { view.onViewInCollectionButtonClicked(); });
}

LevelCompleteView.prototype.onHomeButtonPressed = function ()
{
    switchView(g_views.titleView);
}

LevelCompleteView.prototype.onLevelSelectButtonPressed = function ()
{
    switchView(g_views.levelSelectView);
}

LevelCompleteView.prototype.onReplayButtonPressed = function()
{
    g_views.gameView.startGame(this.completedLevel, this.completedSubLevel);
}

//Function to read and return data. Currently uses cookies but use server side storing later.
function ReadCookies(name)
{
    var cookiesArray = document.cookie.split('; ');
    for (var i = 0; i < cookiesArray.length; i++) {
        var cookie = cookiesArray[i];
        alert(cookie);
        while (cookie.charAt(0) == " ") cookie.substring(1, cookie.length);

        if (cookie.indexOf(name) == 0) {
            var c = cookie.split("=");
            
            if (c[0] == name) {
                return cookie
            }
        } 
    }
}

function MakeCookies(name, value)
{
    document.cookie = name + "=" + value + "; path =/";
}


LevelCompleteView.prototype.displaySummary = function (level, subLevel, score, birdsWithIncreasedSkill)
{
    var view = this;

    // Update score.
    view.scoreDisplay.text(score);

    // Remove any previously-displayed rewards.
    view.unlockedBirdsCard.addClass("hide");
    view.increasedSkillCard.addClass("hide");
    view.unlockedBirdsModal.removeClass("active-modal");
    view.increasedSkillModal.removeClass("active-modal");
    view.unlockedBirds = [];
    view.birdsWithIncreasedSkill = [];

    // Any birds with increased skill level?
    if (birdsWithIncreasedSkill && birdsWithIncreasedSkill.length > 0)
    {
        view.birdsWithIncreasedSkill = birdsWithIncreasedSkill.slice(0);
        view.increasedSkillCard.removeClass("hide");

        // TODO: Populate the increased skill cards.

        // If we had any birds with increased skill, and we have reached the skill points for the last tier,
        // it's a safe assumption that we've reached the next level/group of birds.
        var tier = g_stats.getTierForSubLevel(subLevel);
        var requiredPoints = g_stats.getPointsToUnlockTier(TIER_TO_UNLOCK_NEXT_LEVEL);
        var strBirds;
        //var requiredPoints = ReadCookies("requiredPoints")

        if (g_stats.hasSkillLevelForBirdsAtLevel(level, requiredPoints))
        {
            // Is there a next level of birds?
            view.unlockedBirds = g_database.getBirdsForLevel(level + 1);
            if (view.unlockedBirds.length > 0)
            {
                view.unlockedBirdsCard.removeClass("hide");
                
                // TODO: Populate the unlocked birds
            }
        }
    }

    switchView(this);
}

LevelCompleteView.prototype.destroyWaveSurfers = function ()
{
    // Destroy wavesurfer objects
    $.each(this.waveSurferList, function (index, obj) {
        obj.destroy();
    });
}

LevelCompleteView.prototype.createPopupCardList = function (birdList, cardsContainer, onClickCallback)
{
    var view = this;
    this.destroyWaveSurfers();

    // Build card objects for each of these birds
    $.each(birdList, function (key, value) {
        var cardElement = $("<div>").attr("class", "card").appendTo(cardsContainer);
        var cardInnerElement = $("<div>").attr("class", "inner").appendTo(cardElement);
        cardInnerElement.append($("<div>").attr("class", "card-title").text(value.name));
        cardInnerElement.append($("<div>").attr("class", "image").append($("<img>").attr("src", value.photo).attr("alt", value.name)));
        cardInnerElement.append($("<div>").attr("class", "waveform"));
        cardInnerElement.append($("<div>").attr("class", "spectrogram").append($("<img>").attr("src", value.spectrogram).attr("alt", value.name)));
        cardInnerElement.append($("<button>").attr("class", "play-button"));

        // Hook up popup opener
        cardElement.attr("data-id", value.id);
        cardElement.click(onClickCallback);

        // Create wavesurfer
        var waveformElement = cardInnerElement.find(".waveform");
        var waveSurfer = WaveSurfer.create({
            container: waveformElement[0],
            height: 60,
            waveColor: "#e22"
        });
        waveSurfer.load(value.clip);
        view.waveSurferList.push(waveSurfer);

        // Prevent falling through to parent object events
        makeNonClickable(waveformElement);

        // Hook up play button
        cardInnerElement.find(".play-button").click(function (e) {
            waveSurfer.playPause();
            e.stopPropagation();
        });
    });
}

LevelCompleteView.prototype.onPopupCloseClicked = function(button)
{
    var modal = button.parent();
    modal.removeClass("active-modal");
}

LevelCompleteView.prototype.onViewInCollectionButtonClicked = function ()
{
    var view = this;
    g_views.libraryView.open(function () {
        switchView(view);
    });
}

LevelCompleteView.prototype.onIncreasedSkillCardClicked = function (card)
{
    var cardsContainer = this.increasedSkillModal.find(".cards-container");
    cardsContainer.find(".card").removeClass("active");
    card.addClass("active");

    var score = g_stats.getSkillForBird(parseInt(card.attr("data-id")));
    var scoreElem = this.increasedSkillModal.find(".skill-gauge .value");
    var maxScoreElem = this.increasedSkillModal.find(".skill-gauge .max-value");
    scoreElem.text(score);
    maxScoreElem.text(TIER_TO_UNLOCK_NEXT_LEVEL * POINTS_PER_TIER);
}

LevelCompleteView.prototype.openBirdsUnlockedPopup = function ()
{
    var view = this;
    view.unlockedBirdsModal.find(".bird-count").text(view.birdsWithIncreasedSkill.length);

    var cardsContainer = view.unlockedBirdsModal.find(".cards-container");
    cardsContainer.empty();

    this.createPopupCardList(view.unlockedBirds, cardsContainer, function (e) { });

    view.unlockedBirdsModal.addClass("active-modal");
}

LevelCompleteView.prototype.openIncreasedSkillPopup = function()
{
    var view = this;

    var cardsContainer = view.increasedSkillModal.find(".cards-container");
    cardsContainer.empty();

    this.createPopupCardList(view.birdsWithIncreasedSkill, cardsContainer, function (e) { view.onIncreasedSkillCardClicked($(this)); });

    // auto-select first card
    this.onIncreasedSkillCardClicked(cardsContainer.children().first());

    view.increasedSkillModal.addClass("active-modal");
}

g_views.levelCompleteView = new LevelCompleteView();
