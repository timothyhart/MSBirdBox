var g_currentView = null;
var g_currentModal = null;
var g_views = {};

function switchView(view)
{
    if (g_currentView)
    {
        if (Object.getPrototypeOf(g_currentView).hasOwnProperty("onDeactivate"))
            g_currentView.onDeactivate();

        g_currentView.container.removeClass("active-view");
    }
   
    g_currentView = view;
    if (g_currentView)
    {
        g_currentView.container.addClass("active-view");
        if (Object.getPrototypeOf(g_currentView).hasOwnProperty("onActivate"))
            g_currentView.onActivate();
    }
}

// Prevent event from executing on any elements covered by this element.
function makeNonClickable(element)
{
    element.click(function (e)
    {
        e.preventDefault();
        e.stopPropagation();
    });
}

// Shuffle DOM elements
// https://standardofnorms.wordpress.com/2012/04/08/shuffling-all-the-children-of-a-parent-element-in-javascript/
function shuffleElements(parent)
{
    var children = parent.children();
    while (children.length)
        parent.append(children.splice(Math.floor(Math.random() * children.length), 1));
}

// Load database (need a better way of doing this)
var g_database = new Database();
g_database.load();

// Load stats
/*var g_stats = new Stats();
g_stats.load();*/

// Make all modals non-clickable
makeNonClickable($(".base-modal"));
