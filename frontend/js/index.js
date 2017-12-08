function body_onload() {
  btnSignIn1.onclick = btnSignIn1_onclick;
  btnSignUp1.onclick = btnSignUp1_onclick;
  btnSignIn2.onclick = btnSignIn2_onclick;
  btnSignUp2.onclick = btnSignUp2_onclick;
}

function btnSignUp1_onclick() {
  var signin = document.getElementById("form-signin");
  signin.style.display = 'none';

  var signup = document.getElementById("form-signup");
  signup.style.display = 'block';

  return false;
}

function btnSignIn2_onclick() {
  var signin = document.getElementById("form-signin");
  signin.style.display = 'block';

  var signup = document.getElementById("form-signup");
  signup.style.display = 'none';

  return false;
}

function btnSignIn1_onclick() {
  var link = "http://localhost:8000";

  var email = inputEmailIn.value;
  var password  = inputPasswordIn.value;

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
        sessionStorage.setItem("email", email);
        location.href = "../html/profile.html?auth=" + data.authToken;
      });
    }
    else {
      res.json().then(function(data) {
        console.log(data.message);
      });
    }
  })
  .catch(function(err) {
    console.log("Error");
  });
}

function btnSignUp2_onclick() {
  var link = "http://localhost:8000";

  var name = inputName.value;
  var nick = inputNickname.value;
  var email = inputEmailUp.value;
  var password  = inputPasswordUp.value;

  var signUpCredentials = {
      method: "POST",
      headers: {
          'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        nickName: nick,
        userID: email,
        password: password
      })
  }

  fetch(link + "/signup", signUpCredentials)
  .then(function(res) {
    if (res.ok) {
        location.href = "../html/index.html";
    }
    else {
      console.log("Server Error");
    }
  })
  .catch(function(err) {
    console.log("Error");
  });
}
