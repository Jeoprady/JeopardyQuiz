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
	if (req.path === "/auth/signin" || req.path === "/" || req.path === "/signup" || req.path === "/play") {
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


app.get('/play',function (req,res) {
  var currentQuery = "SELECT * FROM Users;"
  var params = [];
  db.all(currentQuery, params, function(err, results) {
    if (err)
      return res.status(500).json({message: "Internal server error"});
    else
      console.log(results);
  });
})

app.get('/questions', function(req, res) {
  var categoryTitle = req.query.categoryTitle;
  var airDate = req.query.airDate;
  var questionText = req.query.questionText;
  var dollarValue = req.query.dollarValue;
  var answerText = req.query.answerText;
  var showNumber = req.query.showNumber;

  if (dollarValue !== undefined) {
    var n = 0;
    if (dollarValue.charAt(0) == "$")
      n = 1;

    for (var i = n; i < dollarValue.length; i++) {
      var c = dollarValue.charAt(i);
      if ((c < '0' || c > '9') && c !== ",")
        return res.status(400).json({message : "invalid_data"});
    }
  }

  if (airDate !== undefined) {
    var data = airDate.split("-");
    airDate = data[1] + "/" + data[2] + "/" + data[0].substring(2);
  }

  var params = [];
  var category = "";
  if (categoryTitle !== undefined)
    category = "('" + categoryTitle + "' IS NULL OR LOWER(c.CategoryTitle) = LOWER('" + categoryTitle + "' ))";

  var date = "";
  if (airDate !== undefined)
    date = "('" + airDate + "' IS NULL OR q.AirDate = '" + airDate + "' )";

  var question = "";
  if (questionText !== undefined)
    question = "('" + questionText + "' IS NULL OR q.QuestionText LIKE '%" + questionText + "%')";

  var answer = "";
  if (answerText !== undefined)
    answer = "('" + answerText + "' IS NULL OR q.AnswerText LIKE '%" + answerText + "%')";

  var dollar = "";
  if (dollarValue !== undefined)
    dollar = "('" + dollarValue + "' IS NULL OR q.DollarValue = '" + dollarValue + "' )";

  var showNum = "";
  if (showNumber !== undefined)
    showNum = "('" + showNumber + "' IS NULL OR q.ShowNumber = '" + showNumber + "' )";

  var searchCriterias = [category, date, question, answer, dollar, showNum];

  var concatSearch = "";
  for (var i = 0; i < searchCriterias.length; i++) {
    if (searchCriterias[i] != "") {
      if (concatSearch == "")
        concatSearch += " " + searchCriterias[i];
      else
        concatSearch += " AND " + searchCriterias[i];
    }
  }

  var currentQuery = "SELECT *  FROM Questions `q` INNER JOIN Categories `c` ON (q.CategoryCode = c.CategoryCode) WHERE" + concatSearch + " ORDER BY AirDate";

  if (concatSearch == "")
    currentQuery = "SELECT * FROM Questions `q` INNER JOIN Categories `c` ON (q.CategoryCode = c.CategoryCode)";

  db.all(currentQuery, params, function(err, results) {
    if (err)
      return res.status(500).json({message: "Internal server error"});
    /*if (results.length > 5000)
      return res.status(400).json({message: "too_many_results"});*/
    else
      return res.status(200).json(results);
  });
});
