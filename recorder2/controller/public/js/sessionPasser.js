var PassSession = function(){
  if(sessionStorage.getItem("userID") === null && sessionStorage.getItem("isAdmin") === null){
    localStorage.setItem("userID", -1);
    localStorage.setItem("isAdmin", 0);
  } else {
    localStorage.setItem("userID", sessionStorage.getItem("userID"));
    localStorage.setItem("isAdmin", sessionStorage.getItem("isAdmin"));
  }
}

var RetrieveSession = function (){
  if(localStorage.getItem("userID") === null && localStorage.getItem("isAdmin") === null){
    sessionStorage.setItem("userID", -1);
    sessionStorage.setItem("isAdmin", 0);
  } else {
    sessionStorage.setItem("userID", localStorage.getItem("userID"));
    sessionStorage.setItem("userID", localStorage.getItem("isAdmin"));

    localStorage.removeItem("userID");
    localStorage.removeItem("isAdmin");
  }
}
