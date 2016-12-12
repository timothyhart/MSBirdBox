var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');

// Export app, so that our route handlers can access the "global variables".
var app = {};
module.exports = app;

// Set up database connection
// TODO: Convert to connection pools.
var mysql = require('mysql');
var dbConfig = require('./config/database');
app.dbConnection = mysql.createConnection(dbConfig.connection);
app.dbConnection.query('USE ' + dbConfig.database);

// Set up passport
app.passport = passport;
require('./config/passport');

// Set up express
app.express = express();
app.express.set('views', path.join(__dirname, 'views'));
app.express.set('view engine', 'ejs');

// Kinda crappy for now, allow CORS from everything, we'll limit this later..
app.express.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Default route handlers
app.express.use(favicon());
app.express.use(logger('dev'));
app.express.use(bodyParser.urlencoded({ extended: true }));
app.express.use(bodyParser.json());
app.express.use(cookieParser());

// auth stuff
app.express.use(session({
    secret: 'blah',
    resave: true,
    saveUninitialized: true
}));
app.express.use(passport.initialize());
app.express.use(passport.session());
app.express.use(flash());

// static file handler
app.express.use(express.static(path.join(__dirname, 'public')));

// Route handlers
app.express.use('/api', require('./routes/api'));
app.express.use('/account', require('./routes/account'));

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

