function LoginView(){
  var view = this;
    view.container = $(".login-view");
    view.container.find(".login-button").click(function (e){ view.onLoginButtonPressed(); });
    var IDTextField = view.container.find(".username");
    var pwdTextField = view.container.find(".password");
}

LoginView.prototype.onLoginButtonPressed = function () {

  var view = this;

  var userID = IDTextField.value;
  var password = pwdTextField.value;


  var data = {"userID": userID, "password": password };
  console.log(data);

  var loginURL = "js/login.php";
  $.ajax({
    url: loginURL,
    method: 'POST',
    data: data,
    success: function(res){
      if(res.userID !== null){
        sessionStorage.setItem('userID', res.userID);
        sessionStorage.setItem('level', res.level);
        sessionStorage.setItem('isAdmin', res.isAdmin);
        console.log(res);
        switchView(g_views.titleView);
      }
    }
  })
};

g_views.loginView = new LoginView();
