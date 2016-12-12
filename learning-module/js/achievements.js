function AchievementsView() {
    var view = this;
    view.container = $(".achievements-view");
    view.cardsContainer = view.container.find(".cards-container");

    // Hook button events
    view.container.find(".home-button").click(function (e) { view.onHomeButtonPressed(); });
}

AchievementsView.prototype.onHomeButtonPressed = function ()
{
    switchView(g_views.titleView);
}

g_views.achievementsView = new AchievementsView();
