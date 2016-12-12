
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var config = require('./config.js');

// setup working directories
console.log(config);
require('./util/init-paths')();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(errorHandler());
}

// setup routes
{
    var index = require('./routes/index');
    var segment = require('./routes/segment');
    var segmentlist = require('./routes/segmentlist');
    var database = require('./routes/database');
    var compare = require('./routes/compare');
    var list = require('./routes/list');
    var merge = require('./routes/merge');
    var spectrogram = require('./routes/spectrogram');
    var waveform = require('./routes/waveform');
    var raw = require('./routes/raw');
    app.get('/', index);
    app.get('/segment', segment);
    app.get('/segment/:name', segment);
    app.get('/segmentlist', segmentlist);
    app.get('/database', database);
    app.get('/compare', compare);
    app.get('/list', list);
    app.get('/merge/:name/:name2', merge);
    app.get('/spectrogram/:name', spectrogram);
    app.get('/waveform/:name', waveform);
    app.get('/raw/:name', raw);
}

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
