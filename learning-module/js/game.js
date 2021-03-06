function GameView() {
    var view = this;
    view.canvas = new fabric.Canvas('bird-box-canvas');
    view.canvas.setHeight(200);
    view.canvas.setWidth(window.innerWidth-100);
    view.container = $(".game-view");
    view.answerContainer = view.container.find(".answer-card")
    view.cardContainer = view.container.find(".cards-container");
    view.scoreDisplay = view.container.find(".score-panel");
    view.level = 0;
    view.subLevel = 0;
    view.score = 0;
    view.selectedCard = null;
    view.waveSurfers = [];
    view.perfectRound = true;
    view.lives = 2;
    view.answerBirdList = {};
    view.answerBird = 0;
    view.hasGuessedThisRound = false;
    view.identifiedBirdandTime = [];

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
    card.append($("<div>").attr("class", "name").text(bird.name));
    card.append($("<div>").attr("class", "image").append($("<img>").attr("src", bird.photo).attr("alt", bird.name)));
    card.append($("<audio>").attr("id", "audio-player" + bird.id).attr("src", bird.clip).attr("type", "audio/ogg"));
    var playButton = $("<button>").attr("class", "play-button").appendTo(card);
    playButton.click(function (e) {
        document.getElementById("audio-player" + bird.id).paused ? document.getElementById("audio-player" + bird.id).play() : document.getElementById("audio-player" + bird.id).pause();
    });
}

GameView.prototype.createAudioCard = function(bird)
{
    var card = $("<div>").attr("class", "waveform-card").attr("data-id", bird.id).appendTo(this.answerContainer);
    //card.append($("<div>").attr("class", "flipped-overlay"));

    var waveSurferElem = $("<div>").attr("class", "image").appendTo(card);
    waveSurferElem.click(function (e) {
        e.stopPropagation();
    });

    var waveSurfer = WaveSurfer.create({
        container: waveSurferElem[0],
        waveColor: "#595959",
        height: 160,
        width: 200,
    });
    this.waveSurfers.push(waveSurfer);
    waveSurfer.load(bird.clip);

    var playButton = $("<button>").attr("class", "play-button").appendTo(card);
    playButton.click(function (e) {
        e.stopPropagation();
        waveSurfer.playPause();
    });
}

GameView.prototype.createSpectrogramCard = function(bird)
{
    var card = $("<div>").attr("class", "spectrogram-card").attr("data-id", bird.id).appendTo(this.answerContainer);
    //card.append($("<div>").attr("class", "flipped-overlay"));
    card.append($("<div>").attr("class", "image").append($("<img>").attr("src", bird.spectrogram).attr("alt", bird.name)));
}


//Creating the answer and buttons for guessing.
GameView.prototype.createAnswerCard = function (bird){
    var view = this;
    if (view.subLevel === 0)
        this.createAudioCard(bird);
    else if (view.subLevel === 1)
        this.createSpectrogramCard(bird);
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

    this.birdGuessCount = {};

    view.startNewRound();


    switchView(g_views.gameView);
}

GameView.prototype.startNewRound = function(){

    var view = this;
    this.container.find(".card").remove();
    this.container.find(".waveform-card").remove();
    this.container.find(".spectrogram-card").remove();
    //picks a random bird to be correct for this level
    var randBirdIndex = Math.floor(Math.random() * (view.birdList.length-1));

    //to ensure there is no out of bounds exceptions
    randBirdIndex = randBirdIndex >= view.answerBirdList.length ? view.answerBirdList.length - 1 : randBirdIndex;
    var correctBird = view.answerBirdList.splice(randBirdIndex,1)[0];
    //console.log(correctBird);
    view.answerBird = correctBird.id;
    this.createAnswerCard(correctBird);

    //creates the cards to be used for guessing
    for (var i = 0; i < 6; i++){
        var bird = this.birdList[i];
        this.createImageCard(bird);
        }


    // Shuffle the order of the cards.
    shuffleElements(this.cardContainer);

    // Reassign event handlers to cards
    this.container.find(".card").click(function (e) { view.onCardClicked($(this),e); });
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
    var view = this;
    // Set up summary screen if the game was a win
    // Otherwise, return to level select screen
    var data = {"userID": sessionStorage.getItem("userID"),
                "score": view.score,
                "level": view.level+1};//view.score};

    if (gameWon) {
        g_views.levelCompleteView.displaySummary(this.level, this.subLevel, this.score, this.increasedSkillBirds);
        data.method = "updateScore";
        $.ajax({url: "js/gameDB.php",
                method: 'POST',
                data: data,
                success: function(msg){
                  alert(msg);
                }
              });
        if (view.perfectRound){
          data.method = "updateLevel";
          $.ajax({url: "js/gameDB.php",
                  method: 'POST',
                  data: data,
                  success: function(msg){
                    alert(msg);
                  }
                });
            }
    }
    else {
        g_views.gameView = new GameView();
        switchView(g_views.levelSelectView);
    }
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
    var view = this;
    view.score += score;
    document.getElementById("score-panel").innerHTML = "Score: " + view.score;
}

GameView.prototype.checkEndCondition = function()
{
    var view = this;
    // Simple, check to see if all birds have been answered
    //console.log(view.answerBirdList.length);
    if (view.answerBirdList.length <= 0)
    {
        // Display win summary.
        this.endGame(true);
    } else {
        this.startNewRound();
    }
}

GameView.prototype.onCardClicked = function(card, e)
{

    var view = this;
    console.log();
    if (e.target.tagName !== "BUTTON" ){
        if (parseInt(card.attr("data-id")) == view.answerBird)
        {
            view.lives++;
            view.lives = view.lives > 6 ? 6 : view.lives;
            view.animateBird();
            view.destroyWaveSurfers();
            view.setScore(10*(view.level+1)*this.lives);
            var date = new Date();
            if(!view.hasGuessedThisRound){
              //identifiedBirdandTime.push({"UserID", card.attr("data-id"), date});
            }
            view.checkEndCondition();
        }
        else
        {
            // No match. TODO: Better feedback here.
            alert("Not the right birb. Try again!");
            view.lives--;
            perfectRound = false;
            if(view.lives <= 0){
                view.endGame(false);
            }

            view.animateBird();
            view.hasGuessedThisRound = true;

            card.empty();
            card.append($("<div>").attr("class", "flipped-card flipped-overlay"));
        }
    }
}

GameView.prototype.loadGameImages = function(){
    var view = this;
    fabric.Image.fromURL("../learning-module/media/game/loribird.png", function(oImg){
            oImg.set({width: 100,
                      height: 100,
                      left: (document.getElementById("bird-box-canvas").width/6 * view.lives),
                      top : view.canvas.height - 100,
                      selectable: false,
                      });
            oImg.name = "bird";
            view.canvas.add(oImg);
    });

    fabric.Image.fromURL("../learning-module/media/game/mango.png", function(oImg){
        oImg.set({
                  width: 90,
                  height: 100,
                  left: document.getElementById("bird-box-canvas").width - 90,
                  top: view.canvas.height - 100,
                  selectable: false
                 });
        oImg.name = "mango";
        view.canvas.add(oImg);
    });

    view.canvas.renderAll();
}

GameView.prototype.animateBird = function (){
    var view = this;
    var newLeft = document.getElementById("bird-box-canvas").width/6 * view.lives;
    //console.log(newLeft)
    var index = this.getBirdImageIndex();
    this.canvas.item(index).animate('left', newLeft, {
        onChange: this.canvas.renderAll.bind(this.canvas),
        duration: 1500,
        easing: fabric.util.ease.easeInBounce
    });
}

GameView.prototype.getBirdImageIndex = function () {
    var view = this;
    var index = -1;
    var images = view.canvas.getObjects();
    console.log(images);
    for (var i = 0; i < images.length; i++){
        if(images[i].name === "bird"){
            index = i;
        }
    }
    return index;

}

g_views.gameView = new GameView();
