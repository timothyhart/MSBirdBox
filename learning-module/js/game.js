function GameView() {
    var view = this;
    view.canvas = new fabric.Canvas('bird-box-canvas');
    view.canvas.setHeight(200);
    view.canvas.setWidth(window.innerWidth);
    view.container = $(".game-view");
    view.answerContainer = view.container.find(".answer-card")
    view.cardContainer = view.container.find(".cards-container");
    view.scoreDisplay = view.container.find(".score-panel .score");
    view.level = 0;
    view.subLevel = 0;
    view.score = 0;
    view.selectedCard = null;
    view.waveSurfers = [];
    view.birdGuessCount = {};
    view.increasedSkillBirds = [];
    view.lives = 2;
    view.answerBirdList = {};
    view.answerBird = 0;
        
    // Hook button events
    view.container.find(".back-button").click(function (e) { view.onBackButtonPressed(); });
    view.container.find(".library-button").click(function (e) { view.onLibraryButtonPressed(); });
}

GameView.prototype.onBackButtonPressed = function ()
{
    this.endGame(false);
}

GameView.prototype.onLibraryButtonPressed = function()
{
    this.pauseGame();

    // Activate library view, with a parameter that says to return to GameView
    var view = this;
    g_views.libraryView.open(function() {
        switchView(view);
        view.resumeGame();
    });
}

GameView.prototype.createNameCard = function(bird)
{
    var card = $("<div>").attr("class", "card name-card").attr("data-id", bird.id).appendTo(this.cardContainer);
    //card.append($("<div>").attr("class", "flipped-overlay"));
    card.append($("<div>").attr("class", "name").text(bird.name));
}

GameView.prototype.createImageCard = function(bird)
{
    var card = $("<div>").attr("class", "card image-card").attr("data-id", bird.id).appendTo(this.cardContainer);
    //card.append($("<div>").attr("class", "flipped-overlay"));
    card.append($("<div>").attr("class", "image").append($("<img>").attr("src", bird.photo).attr("alt", bird.name)));
    card.append($("<div>").attr("class", "name").text(bird.name));
}

GameView.prototype.createAudioCard = function(bird)
{
    var card = $("<div>").attr("class", "card waveform-card").attr("data-id", bird.id).appendTo(this.answerContainer);
    //card.append($("<div>").attr("class", "flipped-overlay"));

    var waveSurferElem = $("<div>").attr("class", "image").appendTo(card);
    waveSurferElem.click(function (e) {
        e.stopPropagation();
    });

    var waveSurfer = WaveSurfer.create({
        container: waveSurferElem[0],
        waveColor: "#595959",
        height: 140
    });
    this.waveSurfers.push(waveSurfer);
    waveSurfer.load(bird.clip);

    var playButton = $("<button>").attr("class", "play-button").appendTo(card);
    playButton.click(function (e) {
console.log("should be playing");
        e.stopPropagation();
        waveSurfer.playPause();
    });
}

GameView.prototype.createSpectrogramCard = function(bird)
{
    var card = $("<div>").attr("class", "card spectrogram-card").attr("data-id", bird.id).appendTo(this.cardContainer);
    //card.append($("<div>").attr("class", "flipped-overlay"));
    card.append($("<div>").attr("class", "image").append($("<img>").attr("src", bird.spectrogram).attr("alt", bird.name)));
}

/*GameView.prototype.createCardPair = function(sublevel, bird)
{
    switch (sublevel)
    {
        // Bird Name <-> Photo
        case 0:
            this.createNameCard(bird);
            this.createImageCard(bird);
            break;

        // Bird Image<->Audio
        case 1:
            this.createImageCard(bird);
            this.createAudioCard(bird);
            break;

        // Bird Name<->Audio
        case 2:
            this.createNameCard(bird);
            this.createAudioCard(bird);
            break;

        // Bird Image<->Spectrogram
        case 3:
            this.createImageCard(bird);
            this.createSpectrogramCard(bird);
            break;

        // Bird Name<->Spectrogram
        case 4:
            this.createNameCard(bird);
            this.createSpectrogramCard(bird);
            break;

            // Bird Audio<->Spectrogram
        case 5:
            this.createAudioCard(bird);
            this.createSpectrogramCard(bird);
            break;
    }
}*/

//Creating the answer and buttons for guessing.
GameView.prototype.createAnswerCard = function (bird){
    this.createAudioCard(bird);
}

// level: 0-4, bird group
// sublevel: 0 - name/pic, 1 - name/waveform, etc...
GameView.prototype.startGame = function (level, sublevel)
{
    console.log(this);
    var view = this;
    view.loadGameImages();
    console.log("startGame level", level, "sublevel", sublevel);
    view.level = level;
    view.subLevel = sublevel;

    // Get a new list of birds, and extract the subset of birds at this sub-level.
    view.birdList = g_database.getBirdsForLevel(level);
    // Create a shallow copy of the birdlist to be used for drawing answers out
    view.answerBirdList = view.birdList.slice();
    
    
    // Remove all cards from field
    
    this.birdGuessCount = {};
    
    view.startNewRound();
        
    /*// Create 3 pairs of birds from the current set.
    // Use splice so we don't place the same bird in more than once.
    //EDITED THIS (Increased from 3 to 6)
    
   for (var i = 0; i < 6; i++) {
        //var index = Math.floor(Math.random() * birdList.length);
        var bird = birdList[i];
        this.createCardPair(sublevel, bird);
        this.birdGuessCount[bird.id] = 0;
    }*/
    
    switchView(g_views.gameView);
}

GameView.prototype.startNewRound = function(){
    
    var view = this;
    this.container.find(".card").remove();
    //picks a random bird to be correct for this level
    var randBirdIndex = Math.floor(Math.random() * (this.birdList.length-1));
    console.log("Bef " + randBirdIndex);
    
    //to ensure there is no out of bounds exceptions
    randBirdIndex = randBirdIndex <= this.answerBirdList.length ? randBirdIndex-- : randBirdIndex;
    
    console.log("Aft " + randBirdIndex);
    var correctBird = this.answerBirdList.splice(randBirdIndex,1)[0];
    console.log(correctBird);
    view.answerBird = correctBird.id;
    this.createAnswerCard(correctBird);

    //creates the cards to be used for guessing
    for (var i = 0; i < 6; i++){
        var bird = this.birdList[i];
        switch (view.subLevel){
            case 0:
                this.createImageCard(bird);
                break;
            case 1:
                this.createNameCard(bird);
                break;
            case 2:
                this.createSpectrogramCard(bird);
                break;
        }
    }
    
    // Shuffle the order of the cards.
    shuffleElements(this.cardContainer);
        
    // Reassign event handlers to cards
    this.container.find(".card").click(function (e) { view.onCardClicked($(this)); });
    makeNonClickable(this.container.find(".flipped-overlay"));

    // Reset score (also updates display)
    this.setScore(0);    

    // Bring everything into view
    switchView(g_views.gameView);
}

// destroy wavesurfer (player) objects
GameView.prototype.destroyWaveSurfers = function()
{
    $.each(this.waveSurfers, function (key, value) {
        value.destroy();
    });
    this.waveSurfers = [];
}

GameView.prototype.pauseGame = function()
{

}

GameView.prototype.resumeGame = function()
{

}

GameView.prototype.endGame = function(gameWon)
{
    // Set up summary screen if the game was a win
    // Otherwise, return to level select screen
    if (gameWon)
        g_views.levelCompleteView.displaySummary(this.level, this.subLevel, this.score, this.increasedSkillBirds);
    else
        switchView(g_views.levelSelectView);

    // Clean up any timers we have going

    // Clean up wavesurfer players
    this.destroyWaveSurfers();

    // Clear selected cards
    this.selectedCard = null;

    // Clear stats etc
    this.birdGuessCount = {};
    this.increasedSkillBirds = [];
}

GameView.prototype.setScore = function(score)
{
    this.score = score;
    this.scoreDisplay.text(score);
}

/*GameView.prototype.matchCards = function(cardA, cardB)
{
    // Clear selected state
    cardA.removeClass("selected-card");
    cardB.removeClass("selected-card");

    // Compare IDs of cards
    var cardAID = parseInt(cardA.attr("data-id"));
    var cardBID = parseInt(cardB.attr("data-id"));
    if (cardAID == cardBID)
    {
        // Look up bird in database
        var bird = g_database.getBirdById(cardAID);

        // Increment attempt counter (but only once, since it's a match)
        var attemptCount = this.birdGuessCount[bird.id] + 1;
        this.birdGuessCount[bird.id] = attemptCount;
        console.log("match for bird", bird.id, "after", attemptCount, "attempts");

        // Points = maximum of 300 points per pair, divided by attempt count
        var pointsToAdd = Math.floor(300 / attemptCount);
        this.setScore(this.score + pointsToAdd);

        // Add skill points for bird
        if (g_stats.addSkillPointsForBird(bird.id, this.subLevel, attemptCount))
            this.increasedSkillBirds.push(bird);

        // Flip cards over
        cardA.removeClass("selected-card");
        cardA.addClass("flipped-card");
        cardB.removeClass("selected-card");
        cardB.addClass("flipped-card");
        this.checkEndCondition();
    }
    else
    {
        // No match. TODO: Better feedback here.
        alert("Not a match");

        // Increment attempt counter for both birds
        this.birdGuessCount[cardAID] = this.birdGuessCount[cardAID] + 1;
        this.birdGuessCount[cardBID] = this.birdGuessCount[cardBID] + 1;
    }
}*/

GameView.prototype.checkEndCondition = function()
{
    var view = this;
    // Simple, check to see if all birds have been answered
    console.log(view.answerBirdList.length);
    if (view.answerBirdList.length <= 0)
    {
        
        // DEBUG: dump out guesses for each bird
        $.each(this.birdGuessCount, function (birdId, attemptCount) {
            console.log("guesses:", birdId, attemptCount);
        });

        // Display win summary.
        this.endGame(true);
    } else {
        this.startNewRound();
    }
}

GameView.prototype.onCardClicked = function(card)
{ 
    
    var view = this;
    if (parseInt(card.attr("data-id")) == view.answerBird)
    {
        this.lives++;
        this.lives = this.lives >= 7 ? 6 : this.lives;
        this.animateBird();
        this.destroyWaveSurfers();
        this.setScore(this.score + (10*this.lives));
        this.checkEndCondition();
    }
    else
    {
        // No match. TODO: Better feedback here.
        alert("Not the right birb. Try again!");
        this.lives--;
        this.animateBird();
        if(this.lives <= 0){
            this.endGame(false);
        }
        //card.attr("selectable") = false;
    }
    
    
    // Same card clicked twice
    // [] needed because of dom object vs jquery object.
    /*if (this.selectedCard && this.selectedCard[0] == card[0])
    {
        card.removeClass("selected-card");
        this.selectedCard = null;
        return;
    }

    // Mark as selected
    card.addClass("selected-card");
    
    // Have a card selected?
    if (this.selectedCard != null)
    {
        // Match the cards
        var cardA = this.selectedCard;
        var cardB = card;
        this.selectedCard = null;
        this.matchCards(cardA, cardB);
    }
    else
    {
        // First of the pair
        this.selectedCard = card;
    }*/
    
}

GameView.prototype.loadGameImages = function(){
    var view = this;
    fabric.Image.fromURL("../learning-module/media/game/22079.jpg", function(oImg){
            oImg.set({width: 100, 
                      height: 100, 
                      left: (view.canvas.width/6 * view.lives), 
                      top : view.canvas.height - 100,
                      selectable: false,
                      });
            view.canvas.add(oImg);
    });
    
    fabric.Image.fromURL("../learning-module/media/game/mango.png", function(oImg){
        oImg.set({
                  width: 70,
                  height: 100,
                  left: view.canvas.width - 70,
                  top: view.canvas.height - 100,
                  selectable: false
                 });
        view.canvas.add(oImg);
    });
    
    view.canvas.renderAll();
}

GameView.prototype.animateBird = function (){  
    var view = this;
    var newLeft = this.canvas.width/6 * view.lives;
    this.canvas.item(0).animate('left', newLeft, {
        onChange: this.canvas.renderAll.bind(this.canvas),
        duration: 1000,
        easing: fabric.util.ease.easeInBounce
    });
}

g_views.gameView = new GameView();
