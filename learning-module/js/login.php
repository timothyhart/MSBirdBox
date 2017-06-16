<?php
$userID = intval($_POST["userID"]);
$pwd = $_POST["password"];


$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "SELECT password FROM User WHERE userID = '$userID'";

$result = mysqli_query($con, $sql);
$row = mysqli_fetch_row($result);
if($row[0] === $pwd){
echo 1;
}





$con->close();

 ?>
