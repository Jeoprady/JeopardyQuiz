var link = "http://localhost:8000";

var questions = [];
var currScore = 0;
var highScore;

var id;

function body_onload() {
  renderProfile();
  questions = JSON.parse(localStorage.getItem("questions"));

  var buttons = document.getElementsByClassName('col-sm-2');
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].onclick = btn_click;
  }

  var sub = document.getElementById('submit');
  sub.onclick = sub_onclick;

  var leave = document.getElementById('leave');
  leave.onclick = leave_onclick;
}

function leave_onclick() {
  if (currScore > highScore) {
    
  }
}

function sub_onclick() {
  var ans = document.getElementById("answer");
  console.log(ans.value);

  var buttons = document.getElementsByClassName('col-sm-2');
  for (var i = 0; i < buttons.length; i++) {
    if (i == id) {
      var div = document.getElementById("" + i);
      if (ans.value.toLowerCase() == questions[id].AnswerText.toLowerCase()) {
        div.innerHTML = "CORRECT!";
        currScore += parseInt(questions[id].DollarValue);

        var cur = document.getElementById("curScore");
        cur.innerHTML = "Current Score: " + currScore;
      }
      else {
        div.innerHTML = "INCORRECT!";
      }

      var buttons = document.getElementsByClassName('col-sm-2');
      for (var i = 0; i < buttons.length; i++) {
        if (i == id) {
          document.getElementById("" + i).removeAttribute("onclick");
        }
      }
    }
  }
}

function btn_click() {
  console.log("id: " + this.id);
  id = parseInt(this.id);
  var ques = document.getElementById("myModalLabel");
  ques.innerHTML = questions[parseInt(this.id)].QuestionText;
  console.log(questions[parseInt(this.id)].AnswerText);
}

function renderProfile() {
  var email = sessionStorage.getItem("email");
  var auth = localStorage.getItem("auth");

  var profile = {
      method: "GET",
      headers: {
          'content-type': 'application/json'
      }
  }

  fetch(link + "/profile?auth=" + auth + "&email=" + email, profile)
  .then(function(res) {
    if (res.ok) {
      res.json().then(function(data) {
        var name = document.getElementById("name");
        name.innerHTML = data.profile.Name + " ( " + data.profile.NickName + " ) ";

        var score = document.getElementById("score");
        score.innerHTML = "High Score: " + data.profile.HighScore;
        highScore = data.profile.HighScore;

        for (var i = 0; i < questions.length; i++) {
          var el = document.getElementById("" + i);
          el.innerHTML = '<label id="catTlt">' + questions[i].CategoryTitle + '</label>' +
            '<label id="dolVal">$' + questions[i].DollarValue + '</label>'
        }
      });
    }
    else {
      res.json().then(function(data) {
          alert(data.message)
      });
    }
  })
  .catch(function(err) {
    console.log("Error");
  });
}
