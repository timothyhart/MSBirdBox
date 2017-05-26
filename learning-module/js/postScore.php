<?php
$db = DB::getInstance();
$userID = $_POST['userID'];
$score = $_POST['score'];
//TODO rest of data

$db->updateScore($score, $userID);
 ?>
