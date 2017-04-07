function LevelSelectView() {
    var view = this;
    view.container = $(".level-select-view");
    view.cardsContainer = view.container.find(".cards-container");

    // Hook button events
    view.container.find(".home-button").click(function (e) { view.onHomeButtonPressed(); });
    view.container.find(".level-button").click(function (e) { view.onPageButtonPressed($(this)); });
}

LevelSelectView.prototype.onActivate = function()
{
    // Populate level 1 automatically
    this.populateView(0);
}

LevelSelectView.prototype.onHomeButtonPressed = function ()
{
    switchView(g_views.titleView);
}

LevelSelectView.prototype.onPageButtonPressed = function (button)
{
    var level = parseInt(button.attr("data-level"));
    this.populateView(level);
}

LevelSelectView.prototype.onExpandCardButtonPressed = function (button)
{
    // Card container has to have the class attribute applied.
    var cardContainer = $(button).parent();
    if (!cardContainer.hasClass("card-container-expanded"))
        cardContainer.addClass("card-container-expanded");
    else
        cardContainer.removeClass("card-container-expanded");
}

LevelSelectView.prototype.onPlayButtonPressed = function (button)
{
    // Find the card container, this contains our data attributes.
    var cardContainer = $(button).parent();
    var level = parseInt(cardContainer.attr("data-level"));
    var sublevel = parseInt(cardContainer.attr("data-sublevel"));
    //console.log("Play level " + level + ", sublevel " + sublevel);
    g_views.gameView.startGame(level, sublevel);
}

LevelSelectView.prototype.createLevelContainer = function(numCards)
{
    var levelContainer;

    switch (numCards)
    {
        case 1:
            levelContainer = $("<div>").attr("class", "single-level");
            break;

        case 2:
            levelContainer = $("<div>").attr("class", "double-level");
            break;
    }
    
    if (levelContainer)
        levelContainer.appendTo(this.cardsContainer);

    return levelContainer;
}

LevelSelectView.prototype.createLevelCard = function(levelContainer, level, sublevel, requiredSkillLevel, nextLevelSkill)
{
    var view = this;
    var isLocked = false;//!g_stats.hasSkillLevelForBirdsAtLevel(level, requiredSkillLevel);

    var cardContainer = $("<div>").appendTo(levelContainer);
    cardContainer.addClass("card-container");
    cardContainer.attr("data-level", level);
    cardContainer.attr("data-sublevel", sublevel);

    if (isLocked) {
        var lockedText = "Reach " + requiredSkillLevel + " skill level on all birds";
        cardContainer.addClass("disabled-card-container");

        var disabledOverlay = $("<div>").attr("class", "disabled-overlay").appendTo(cardContainer);
        disabledOverlay.append($("<label>").text(lockedText));
    }

    var card = $("<div>").attr("class", "card").appendTo(cardContainer);
    card.append($("<img>").attr("src", "media/placeholders/bird.png").attr("alt", "placeholder image"));
    card.append($("<label>").text("Level " + (sublevel + 1)));
    
    // This is kinda slow, all the extra copies. Use a cached list instead.
    var innerBirdList = $("<ul>").attr("class", "unlock-list").appendTo(card);
    $.each(g_database.getBirdsForLevel(level), function(index, bird) {
        var hasNextLevelSkill = false; //g_stats.hasSkillLevelForBird(bird.id, nextLevelSkill);
        innerBirdList.append($("<li>").text(bird.name + " (" + (hasNextLevelSkill ? "yes" : "no") + ")"));
    });

    var expandButton = $("<button>").attr("class", "expand-button").appendTo(cardContainer);
    expandButton.click(function (e) { view.onExpandCardButtonPressed(this); });

    var playButton = $("<button>").attr("class", "play-button").appendTo(cardContainer);
    playButton.click(function (e) { view.onPlayButtonPressed(this); });

    return cardContainer;
}

LevelSelectView.prototype.populateView = function(level)
{
    this.cardsContainer.empty();

    var levelContainer = this.createLevelContainer(2);
    this.createLevelCard(levelContainer, level, 0, 0, 10);
    this.createLevelCard(levelContainer, level, 1, 10, 20);
    
   /* // First tier - Image<->Name
    var levelContainer = this.createLevelContainer(1);
    this.createLevelCard(levelContainer, level, 0, 0, 10);

    // Second tier - Image<->Audio, Name<->Audio
    levelContainer = this.createLevelContainer(2);
    this.createLevelCard(levelContainer, level, 1, 10, 20);
    this.createLevelCard(levelContainer, level, 2, 10, 20);

    // Third tier - Image<->Spectrogram, Name<->Spectrogram
    levelContainer = this.createLevelContainer(2);
    this.createLevelCard(levelContainer, level, 3, 20, 30);
    this.createLevelCard(levelContainer, level, 4, 20, 30);
    
    // Fourth tier - Audio<->Spectrogram
    levelContainer = this.createLevelContainer(1);
    this.createLevelCard(levelContainer, level, 5, 30, 40);*/

    // Make disabled cards unclickable
    makeNonClickable(this.cardsContainer.find(".disabled-overlay"));

    // Update page buttons.
    this.container.find(".level-button").removeClass("active");
    this.container.find(".level-button[data-level=" + level + "]").addClass("active");
}

g_views.levelSelectView = new LevelSelectView();
