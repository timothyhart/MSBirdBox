<?php
$userID = intval($_POST["userID"]);
$pwd = $_POST["password"];


$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

$sql = "SELECT * FROM User WHERE userID = '$userID'";

$result = mysqli_query($con, $sql);
$row = mysqli_fetch_row($result);
if($row[2] === $pwd){
  $data = array(1, $userID, $row[4], $row[5]);
} else {
    $data = array(0);
}
echo json_encode($data);




$con->close();

 ?>
