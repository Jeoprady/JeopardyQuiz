var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var cors = require('cors');
var hat = require('hat');
var moment = require('moment');
var transactionDatabase = require("sqlite3-transactions").TransactionDatabase;

var db = new transactionDatabase(new sqlite3.Database('./Jeopardy.db'));

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(bodyParser.json());

var port = process.env.PORT || 8000;
var server = app.listen(port, function() {
  console.log(`App listening on port ${port}`);
});

app.get('/', function(req, res) {
  return res.status(200).send('ok');
});
