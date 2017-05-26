var express = require("express");
var app = require("../app");
var util = require("../modules/util");
var mysql = require("mysql");
var router = express.Router();

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'birdbox',
  password: 'birdbox',
  database: 'birdbox'
});

connection.connect();

router.post('/updateScore', (req, res)=>{
  var sql = "UPDATE User SET points = points + " + req.score + "WHERE userID = " + req.userID;

  connection.query(sql);
});
