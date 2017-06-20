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
  $data = { "success": 1,
            "userID": $r0w[0],
           "level": $row[4],
            "isAdmin": $row[5]};
} else {
    $data = { "success": 0}
}
echo json_encode($data);




$con->close();

 ?>
