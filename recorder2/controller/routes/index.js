var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  //res.send('This is the backend for the Bird Box Recorder. Please use the front-end instead.');
  res.sendFile(__dirname + "/../public/index.html");
});

module.exports = router;
