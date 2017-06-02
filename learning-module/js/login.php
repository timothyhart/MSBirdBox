<?php
$userID = intval($_POST["userID"]);
$pwd = $_POST["password"];

//echo var_dump($_POST);
$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "SELECT * FROM User WHERE userID = '".$userID."' AND password = $pwd";

 if(mysqli_query($con, $sql)){
   echo "worked";
 } else {
   die ('did not work ' . mysqli_error($con));
 }

 //echo $result;

$con->close();

 ?>
