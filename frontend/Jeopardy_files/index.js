function body_onload() {
  btnSignIn.onclick = btnSignIn_onclick;
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
