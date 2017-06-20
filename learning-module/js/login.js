function LoginView(){
  var view = this;
    view.container = $(".login-view");
    view.container.find(".login-button").click(function (e){ view.onLoginButtonPressed(); });
    view.container.find(".register-button").click(function (e){ view.onRegisterButtonPressed(); });
    view.loginForm = view.container.find(".login");
    view.regForm = view.container.find(".register");
    view.IDLoginTextField = view.loginForm.find(".username");
    view.pwdLoginTextField = view.loginForm.find(".password");
    view.nameRegTextField = view.loginForm.find(".username");
    view.pwdRegTextField = view.loginForm.find(".password");
}

LoginView.prototype.onLoginButtonPressed = function () {

  var view = this;
  var userID = view.IDLoginTextField.val();
  var password = view.pwdLoginTextField.val();


  var data = {"userID": userID, "password": password, "action": 0 };


  var loginURL = "js/login.php";
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
        //console.log(g_views);
        switchView(g_views.titleView);
	      location.reload();
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


  var loginURL = "js/login.php";
  $.ajax({
    url: loginURL,
    method: 'POST',
    data: data,
    success: function(res){
    alert(res);
      }
else {
alert("Incorrect username or password");
}
    }
  })
}

g_views.loginView = new LoginView();
