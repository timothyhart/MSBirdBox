<?php
$userID = intval($_POST['userID']);
$score = intval($_POST['score']);

$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}


$sql="UPDATE User SET points = points+$score WHERE userID = '".$userID."'";
$result = mysqli_query($con,$sql);
echo "<script>console.log($result)</script>;";
$con->close();

 ?>
