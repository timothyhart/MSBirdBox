var PassSession = function(){
  console.log("Passing the session");
  if(sessionStorage.getItem("userID") === null && sessionStorage.getItem("isAdmin") === null){
    localStorage.setItem("userID", -1);
    localStorage.setItem("isAdmin", 0);
  } else {
    localStorage.setItem("userID", sessionStorage.getItem("userID"));
    localStorage.setItem("isAdmin", sessionStorage.getItem("isAdmin"));
  }
}

var RetrieveSession = function (){
  console.log("Retrieving the session");
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
