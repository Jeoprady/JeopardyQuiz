var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var cors = require('cors');
var hat = require('hat');
var moment = require('moment');
var transactionDatabase = require("sqlite3-transactions").TransactionDatabase;
var cons = require('consolidate');
var path = require('path');

var db = new transactionDatabase(new sqlite3.Database('./Jeopardy.db'));

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
  extended:true
}));
app.use(bodyParser.json());
app.engine('html', cons.swig);
app.set('views', __dirname + '/frontend/html');
app.set('view engine', 'html');
app.use(express.static(path.join(__dirname, 'frontend')));


app.use(function(req,res,next) {
	if (req.path === "/auth/signin" || req.path === "/" || req.path === "/signup" || req.path === "/play" || req.path == "/logout" || req.path == "/highScore") {
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
  return res.render('index', { title: 'FilmedIn' });
});

app.post('/signup', function(req, res) {
  var data = {
    userID : req.body.userID,
    password : req.body.password,
    name : req.body.name,
    nickName : req.body.nickName,
    highScore : 0
  }


  var insertQuery = "INSERT INTO Users(UserID,UserPassword) VALUES ('" + data.userID+ "','" + data.password + "');";
  var par = []
  db.run(insertQuery, par, function(err, result) {
    if (err) {
      return res.status(500).json(
        {message: err});
    }
    else {
      var insertInfoQuery = "INSERT INTO UserInfo(UserID,HighScore,Name,NickName) VALUES ('" + data.userID+ "','" + data.highScore + "','" + data.name + "','" + data.nickName + "');"
      db.run(insertInfoQuery, par, function(err, result) {
        if (err) {
          return res.status(500).json(
            {message: err});
        }
        //TODO: else?
         else {
           return res.status(200).json(
             {message: "success"});
         }
      });
    }
    });
  });

app.get('/profile', function (req, res) {
  var email = req.query.email;

  var params = [];
  var query = "SELECT * FROM UserInfo WHERE UserID = '" + email + "'";
  db.get(query, params, function(err, user) {
    if(err) {
      return res.status(500).json({message: "Internal server error"});
    }

    if(user == null) {
      return res.status(401).json({message: "unauthorized_access"});
    }

    return res.status(200).json({
      message: "success",
      profile: user
    })
  });
});

app.post('/auth/signin', function (req, res) {
  //var {userID, password} = req.body;
  var data = {
    userID : req.body.userID,
    password : req.body.password
  }

  if (data.userID === undefined || data.password === undefined || data.userID.length === 0 || data.password.length ===0) {
    console.log("undefined username");
    return res.status(400).json({message: "invalid_data"});
  }

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
            console.log("invalid_credentials");
            return res.status(401).json({message: "invalid_credentials"});
          }
        }
      }
      if (!flag) {
        console.log("empty table");
        return res.status(401).json({message: "invalid_credentials_empty_table"});
      }
    }
  });
});

app.post('/highScore', function (req, res) {
  var user = req.body.userID;
  var score = req.body.highScore;
  var updateQuery = "UPDATE UserInfo SET HighScore = " + score + " WHERE UserID IS '" + user + "';";
  console.log(updateQuery);
  var params = [];
  db.run(updateQuery, params, function(err, results) {
    if (err)
      return res.status(500).json({message: err.message});
    else
      //console.log(results);
      return res.status(200).json({message: "Success"});
  });
});

app.post('/logout', function(req,res) {
  var email = req.body.userID;
  //console.log(email);
  var updateQuery = "UPDATE Users SET AuthToken = NULL, AuthTokenIssued = NULL WHERE UserID IS '" + email + "';";
  console.log(updateQuery);
  var params = []
  db.run(updateQuery, params, function(err, results) {
    if (err)
      return res.status(500).json({message: err.message});
    else
      //console.log(results);
      return res.status(200).json({message: "Success"});
  });

});

app.get('/play',function (req,res) {
  var check;
  var test;
  var queQuer = "SELECT CategoryTitle, DollarValue, QuestionText, AnswerText FROM Categories INNER JOIN Questions ON Questions.CategoryCode = Categories.CategoryCode ORDER BY RANDOM() LIMIT 30;"
  var params = [];
  db.all(queQuer, params, function(err, results) {
    if (err)
      return res.status(500).json({message: "Internal server error"});
    else
      //console.log(results);
      return res.status(200).json(results);
  });
});
