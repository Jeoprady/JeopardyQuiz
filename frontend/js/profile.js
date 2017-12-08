var link = "http://localhost:8000";

var questions = [];

function body_onload() {
  renderProfile();
  play.onclick = play_onclick;

  var logout = document.getElementById('logout');
  logout.onclick = logout_onclick;
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

function logout_onclick() {
  var link = "http://localhost:8000";

  var email = sessionStorage.getItem("email");

  var profile = {
      method: "POST",
      headers: {
          'content-type': 'application/json'
      },
      body: JSON.stringify({
          userID: email,
      })
  }

  fetch(link + "/logout?auth=" + localStorage.getItem("auth"), profile)
  .then(function(res) {
    if (res.ok) {
      sessionStorage.removeItem("email");
      localStorage.removeItem("auth");
      location.href = "../html/index.html"
    }
    else {
      res.json().then(function(data) {
        console.log(data.message);
      });
    }
  })
  .catch(function(err) {
    console.log(err);
  });
}


function play_onclick() {
  var auth = localStorage.getItem("auth");

  var profile = {
      method: "GET",
      headers: {
          'content-type': 'application/json'
      }
  }

  fetch(link + "/play?auth=" + auth, profile)
  .then(function(res) {
    if (res.ok) {
      res.json().then(function(data) {
        // var play = document.getElementById("play");
        // play.style.display = 'none';
        //
        // var center = document.getElementById("center");
        // center.style.height = '0%';
        //
        // var grid = document.getElementById("grid");
        // grid.style.display = 'block';
        // grid.style.height = '100%';

        // console.log(data);
        // questions = data;
        localStorage.setItem("questions", JSON.stringify(data));
        location.href = "../html/play.html";
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
