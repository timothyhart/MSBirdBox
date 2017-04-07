<?php
    require_once 'core/init.php';
    require_once 'classes/DB.php';
    require_once 'Includes/birdfunctions.inc';
    $db = DB::getInstance();

    header("Content-Type: application/json");
    birdDataExport($db);
?>
