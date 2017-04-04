// Switches to the view specified by view
// Assumes that view.root and view.navName exists

var g_currentView = null;

function switchView(view) {
    if (g_currentView === view)
        return;
        
    if (g_currentView) {
        if (Object.getPrototypeOf(g_currentView).hasOwnProperty("onDeactivate"))
            g_currentView.onDeactivate();

        g_currentView.navItem.removeClass("active");
        g_currentView.root.removeClass("active-view");
    }

    g_currentView = view;
    if (g_currentView)
    {
        g_currentView.navItem.addClass("active");
        g_currentView.root.addClass("active-view");
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

// shuffle function from http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffleArray(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

// These can be called recursively, and use a global counter to ensure it is only removed and added once
var g_loadingModalRecursionCount = 0;
$(document).ready(function () { makeNonClickable($(".loading-modal")); });

function beginLoadingModal() {
    if ((g_loadingModalRecursionCount++) == 0) {
        $("body").addClass("loading-modal-active");
    }
}

function endLoadingModal() {
    if ((--g_loadingModalRecursionCount) <= 0) {
        g_loadingModalRecursionCount = 0;
        $("body").removeClass("loading-modal-active");
    }
}

// Helper function for setting the position of an absolute-positioned element
// Expects a jQuery selector as the element parameter.
function setAbsoluteElementRect(element, left, top, width, height) {
    element.attr("style", "left: " + left + "px; width: " + width + "px;" + "top:" + top + "px; height: " + height + "px;"); 
}

// Location/hash tracker
function LocationHashTracker() {
    var instance = this;
    
    // name -> callback
    instance.actionTable = {};
    instance.hashChangeInProgress = false;
    
    // Requires browser support
    window.onhashchange = function() { instance.onHashChangeEvent(); };
}

// expects a callback of action, params (map)
LocationHashTracker.prototype.registerAction = function(actionName, callback) {
    this.actionTable[actionName] = callback;
}

LocationHashTracker.prototype.setAction = function(action, params) {
    var hashString = action;
    if (params !== undefined) {
        $.each(params, function(key, value) {
            hashString = hashString + "/" + key + "=" + value;
        });
    }
    
    this.hashChangeInProgress = true;
    location.hash = hashString;
    this.hashChangeInProgress = false;
}

LocationHashTracker.prototype.onHashChangeEvent = function() {
    if (this.hashChangeInProgress)
        return false;
        
    // Handle empty hashes.
    if (window.location.hash.length < 1)
        return false;
        
    // HACK: Ignore hash changes when modal dialog is active.
    // This means that we can lose events, but better than leaving in an inconsistent state.
    if (g_loadingModalRecursionCount)
        return false;
    
    var splitHash = window.location.hash.slice(1).split("/");
    var actionName = splitHash[0];
    var params = {};
    
    // Parse parameters
    if (splitHash.length > 1) {
        $.each(splitHash.slice(1), function(index, value) {
            var pair = value.split("=");
            if (pair.length != 2)
                return;
                
            params[pair[0]] = pair[1];
        });
    }
    
    //console.log(actionName, params);
    
    var callback = this.actionTable[actionName];
    if (!callback)
        return false;
    
    return callback(actionName, params);
}

// toastr setup
toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}
