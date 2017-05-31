<?php
$userID = intval($_POST["userID"]);
$score = intval($_POST["score"]);
$method = $_POST["method"];
$level = intval($_POST["level"]);

echo var_dump($_POST);
$con = mysqli_connect('localhost','birdbox','birdbox','birdbox');
if (!$con) {
    die('Could not connect: ' . mysqli_error($con));
}

switch ($method) {
    case "updateScore":
    $sql="UPDATE User SET points = points+$score WHERE userID = '".$userID."'";
    $result = mysqli_query($con,$sql);
    echo "score updated";
    break;
  case "updateLevel":
    $sql="UPDATE User SET level = $level WHERE userID = '".$userID."'";
    $result = mysqli_query($son, $sql);
    echo "level updated";
    break;
  }

$con->close();

 ?>
