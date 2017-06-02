function LoginView(){
  var view = this;
    view.container = $(".login-view");
    view.container.find(".login-button").click(function (e){ view.onLoginButtonPressed(); });
}

LoginView.prototype.onLoginButtonPressed = function () {

  var userID = view.container.find(".username").value;
  var password = view.container.find(".password").value;

  var data = {"userID": userID, "password": password }

  var loginURL = "js/login.php";
  $.ajax({
    url: loginURL,
    method: "POST",
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
