function LoginView(){
  var view = this;
    view.container = $(".login-view");
    view.container.find(".login-button").click(function (e){ view.onLoginButtonPressed(); });
    view.loginForm = view.container.find(".login");
    view.IDTextField = view.loginForm.find(".username");
    view.pwdTextField = view.loginForm.find(".password");
}

LoginView.prototype.onLoginButtonPressed = function () {

  var view = this;
  var userID = view.IDTextField.val();
  var password = view.pwdTextField.val();


  var data = {"userID": userID, "password": password };


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
        console.log(g_views);
        switchView(g_views.titleView);
	//location.reload();
      }
else {
alert("Incorrect username or password");
}
    }
  })
};

g_views.loginView = new LoginView();
