var link = "http://localhost:8000";

var questions = [];

function body_onload() {
  renderProfile();
  questions = JSON.parse(localStorage.getItem("questions"));
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
