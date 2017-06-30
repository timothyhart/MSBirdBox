var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

(function() {
    var childProcess = require("child_process");
    var oldSpawn = childProcess.spawn;
    function mySpawn() {
        console.log('spawn called');
        console.log(arguments);
        var result = oldSpawn.apply(this, arguments);
        return result;
    }
    childProcess.spawn = mySpawn;
})();

// Export app, so that our route handlers can access the "global variables".
var app = {};
module.exports = app;

// Our module imports (which require app exported, so must be loaded afterwards)
var Config = require("./modules/config");
var PathInitializer = require("./modules/path-initializer");
var RecorderController = require("./modules/recorder-controller");
var RecordingHelpers = require("./modules/recording-helpers");
var SplitterInterface = require("./modules/splitter-interface");

// Load config
app.config = new Config();
app.config.load();

// Create working paths
if (!PathInitializer.createDataDirectories()) {
    throw new Error("Failed to create data directories.");
}

// Create recorder controller instance
app.recorderController = new RecorderController();

// Create recording helpers instance
app.recordingHelpers = new RecordingHelpers();

// Create splitter interface instance
app.splitterInterface = new SplitterInterface();

// Load recording schedule
app.recorderController.loadSchedule();

// Set up express
app.express = express();
app.express.set('views', path.join(__dirname, 'views'));
app.express.set('view engine', 'hjs');

// Kinda crappy for now, allow CORS from everything, we'll limit this later..
app.express.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Default route handlers
app.express.use(favicon());
app.express.use(logger('dev'));
app.express.use(bodyParser.json());
app.express.use(bodyParser.urlencoded({ extended: true }));
app.express.use(cookieParser());
app.express.use(express.static(path.join(__dirname, 'public')));

// Route handlers
app.express.use('/', require('./routes/index'));
app.express.use('/status', require('./routes/status'));
app.express.use('/settings', require('./routes/settings'));
app.express.use('/recordings', require('./routes/recordings'));


/// catch 404 and forwarding to error handler
app.express.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.express.get('env') === 'development') {
    app.express.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.express.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
