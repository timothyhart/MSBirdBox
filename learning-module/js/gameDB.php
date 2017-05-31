<?php
$userID = intval($_POST['userID']);
$score = intval($_POST['score']);

$dump = var_dump($_POST);
echo "<script>console.log('Tim is awesome: ".$dump."');</script>";

$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}


$sql="UPDATE User SET points = points+$score WHERE userID = '".$userID."'";
$result = mysqli_query($con,$sql);

$con->close();

 ?>
