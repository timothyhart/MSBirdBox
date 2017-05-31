<?php
$userID = intval($_POST["userID"]);
$score = intval($_POST["score"]);

$dump = var_dump($_POST);
echo $dump;

$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}


$sql="UPDATE User SET points = points+$score WHERE userID = '".$userID."'";
$result = mysqli_query($con,$sql);
echo $result;
$con->close();

 ?>
