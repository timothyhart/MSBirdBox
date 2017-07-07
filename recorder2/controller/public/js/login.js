function LoginView(root){
  var view = this;
    view.root = root;
    view.container = $(".login-view");
    view.container.find(".login-button").click(function (e){ view.onLoginButtonPressed(); });
    view.container.find(".register-button").click(function (e){ view.onRegisterButtonPressed(); });
    view.loginForm = view.container.find(".login");
    view.regForm = view.container.find(".register");
    view.IDLoginTextField = view.loginForm.find(".username");
    view.pwdLoginTextField = view.loginForm.find(".password");
    view.nameRegTextField = view.regForm.find(".name");
    view.pwdRegTextField = view.regForm.find(".password");
}

LoginView.prototype.onLoginButtonPressed = function () {

  var view = this;
  var userID = view.IDLoginTextField.val();
  var password = view.pwdLoginTextField.val();

console.log("Loggin in");
  var data = {"userID": userID, "password": password, "action": 0 };


  var loginURL = LOGIN_URL;
  $.ajax({
    url: loginURL,
    method: 'POST',
    data: data,
    success: function(res){
      res = $.parseJSON(res);
      if(res[0] === 1){
	       //alert("correct");
        sessionStorage.setItem('userID', res[1]);
        sessionStorage.setItem('level', res[2]);
        sessionStorage.setItem('isAdmin', res[3]);

        root.style = "display: none";
        switchView(g_views.statusPage);
        console.log("Should have switched by now");
	      //location.reload();
      }
else {
alert("Incorrect username or password");
}
    }
  })
};

LoginView.prototype.onRegisterButtonPressed = function () {
  var view = this;
  var name = view.nameRegTextField.val();
  var password = view.pwdRegTextField.val();


  var data = {"name": name, "password": password, "action": 1 };


  var loginURL = LOGIN_URL;
  $.ajax({
    url: loginURL,
    method: 'POST',
    data: data,
    success: function(res){
      alert(res);
    }
  });
};
