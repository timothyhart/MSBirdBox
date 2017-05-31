<?php
$userID = intval($_POST["userID"]);
$score = intval($_POST["score"]);
$method = intval($_POST["method"]);
$level = intval($_POST["level"]);

$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

switch ($method) {
    case "updateScore":
    $sql="UPDATE User SET points = points+$score WHERE userID = '".$userID."'";
    $result = mysqli_query($con,$sql);
    break;
  case "updateLevel":
    $sql="UPDATE User SET level = IF(level < $level, $level, level) WHERE userID = $userID";
    $result = mysqli_query($son, $sql);
    break;
  }

$con->close();

 ?>
