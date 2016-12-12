var debug = require('debug')('birdbox-learning-module-statserver');
var app = require('./app');

app.express.set('port', process.env.PORT || 3000);

var server = app.express.listen(app.express.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
