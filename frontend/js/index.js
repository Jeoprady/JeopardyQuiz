function body_onload() {
  btnSignIn1.onclick = btnSignIn_onclick;
  btnSignUp1.onclick = btnSignUp_onclick;
}

function btnSignUp_onclick() {
  var signin = document.getElementById("form-signin");
  signin.style.display = 'none';

  var signup = document.getElementById("form-signup");
  signup.style.display = 'block';

  // var btn = document.getElementById("btnSignIn2");
  // btn.style.display = 'none';

  return false;
}

function btnSignIn_onclick() {
  var link = "http://localhost:8000";

  var email = inputEmail.value;
  var password  = inputPassword.value;

  var loginCredentials = {
      method: "POST",
      headers: {
          'content-type': 'application/json'
      },
      body: JSON.stringify({
          userID: email,
          password: password
      })
  }

  fetch(link + "/auth/signin", loginCredentials)
  .then(function(res) {
    if (res.ok) {
      res.json().then(function(data) {
        localStorage.setItem("auth", data.authToken);
        location.href = "../html/profile.html?auth=" + data.authToken;
      });
    }
    else {
      console.log("Server Error");
    }
  })
  .catch(function(err) {
    console.log("Error");
  });
}
