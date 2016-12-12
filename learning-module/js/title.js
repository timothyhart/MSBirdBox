function TitleView() {
    var view = this;
    view.container = $(".title-view");

    // Hook button events
    view.container.find(".play-button").click(function (e) { view.onPlayButtonPressed(); });
    view.container.find(".my-birds-button").click(function (e) { view.onMyBirdsButtonPressed(); });
    view.container.find(".achievements-button").click(function (e) { view.onAchievementsButtonPressed(); });
}

TitleView.prototype.onPlayButtonPressed = function ()
{
    switchView(g_views.levelSelectView);
}

TitleView.prototype.onMyBirdsButtonPressed = function ()
{
    g_views.libraryView.open();
}

TitleView.prototype.onAchievementsButtonPressed = function ()
{
    switchView(g_views.achievementsView);
}

g_views.titleView = new TitleView();
