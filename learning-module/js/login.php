<?php
$userID = isset($_POST["userID"]) ? intval($_POST["userID"]) : null;
$pwd = isset($_POST["password"]) ? $_POST["password"] : null;
$action = isset($_POST["action"]) ? intval($_POST["action"]) : null;
$name = isset($_POST["name"]) ? $_POST["name"] : null;


$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

switch($action){
  case 0: $sql = "SELECT * FROM User WHERE userID = '$userID'";

  $result = mysqli_query($con, $sql);
  $row = mysqli_fetch_row($result);
  if($row[2] === $pwd){
    $data = array(1, $userID, $row[4], $row[5]);
  } else {
      $data = array(0);
  }
  echo json_encode($data);
  break;
  case 1: $maxsql = "SELECT MAX(userID) AS userID FROM User";
  $result = mysqli_query($con, $maxsql);
  $row = mysqli_fetch_row($result);
  $maxID = $row[0] + 1;

  echo $name;
  $sql = "INSERT INTO User (userID, name, password) VALUES('$maxID', '$name', '$pwd' )";
 if(!mysqli_query($con, $sql)){
   die('This went wrong: ' . mysqli_error($con));
 } else {
   echo "You have been registered successfully. Your username is " + $maxID;
 }

}





$con->close();

 ?>
