<?php
require_once ("../../prototype/Admin-panel/classes/DB.php");
require_one ("../../prototype/Admin-panel/classes/DB.php");
$db = DB::getInstance();
$userID = $_POST['userID'];
$score = $_POST['score'];
//TODO rest of data

$db->updateScore($score, $userID);
 ?>
