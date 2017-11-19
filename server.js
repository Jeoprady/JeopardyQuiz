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

app.use(function(req,res,next) {
	if (req.path === "/auth/signin") {
		return next();
	}
  else {
    var authToken = req.query.auth;
    if (authToken == null || authToken == undefined || authToken == "")
      return res.status(400).json({message: "unauthorized_access"});

    var params = [];
    var query = "SELECT * FROM Users WHERE AuthToken = '" + authToken + "'";

    db.get(query, params, function(err, user) {
  		if(err) {
  			return res.status(500).json({message: "Internal server error"});
  		}

  		if(user == null) {
  			return res.status(401).json({message: "unauthorized_access"});
  		}

      var time   = moment(new Date(user.AuthTokenIssued));
      var expiry = time.add(1, 'h');
			//console.log(expiry);
			var curr   = moment(new Date());
			//console.log(curr);
			if (moment(curr) > moment(expiry))
        return res.status(400).json({message: "auth token expired"});
      else
  		  return next();
  	});
	}
});

var port = process.env.PORT || 8000;
var server = app.listen(port, function() {
  console.log(`App listening on port ${port}`);
});

app.get('/', function(req, res) {
  return res.status(200).send('ok');
});

app.post('/auth/signin', function (req, res) {
  //var {userID, password} = req.body;
  var data = {
    userID : req.body.userID,
    password : req.body.password
  }

  if (data.userID === undefined || data.password === undefined || data.userID.length === 0 || data.password.length ===0)
    return res.status(400).json({message: "invalid_data"});

  var params = [];
  //console.log(data.userID + " " + data.password);
  var currentQuery = "SELECT * FROM Users"; //Password can be case-sensitive

  db.all(currentQuery, params, function(err, rows) {
    if (err) {
      //console.log("here!!!");
      return res.status(500).json({message: "Internal server error"});
    }
    else {
      var flag = false;
      for (var i = 0; i < rows.length; i++) {
        //console.log(rows[i].UserID + " " + rows[i].UserPassword);
        if (rows[i].UserID === data.userID) {
          if (rows[i].UserPassword === data.password) {
            flag = true;
            //console.log("FOUND CORRECT MATCH!!!");
            var authToken = hat();
            //var timeStamp = moment().format('MMMM Do YYYY, hh:mm:ss a');
            var timeStamp = new Date();
            var insertParams = [];
            var insertQuery = "UPDATE Users SET AuthToken = '" + authToken + "', AuthTokenIssued = '" + timeStamp + "' WHERE UserID = '" + data.userID + "' AND UserPassword = '" + data.password + "'";
            //console.log(insertQuery);
            db.run(insertQuery, insertParams, function(err, result) {
                if (err) {
                  return res.status(500).json(
                    {message: err});
                }
                else {
                  return res.status(200).json(
                    {
                      message: "success",
                      authToken: authToken,
                    });
                }
              });
          }
          else {
            return res.status(401).json({message: "invalid_credentials"});
          }
        }
      }
      if (!flag)
        return res.status(401).json({message: "invalid_credentials_empty_table"});
    }
  });
});
