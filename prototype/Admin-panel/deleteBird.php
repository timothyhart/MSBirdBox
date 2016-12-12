<!DOCTYPE html>
<html lang="en">
<head>
	<title>Bird Box: Delete</title>
	<?php require_once 'Includes/head.inc'; ?>
</head>

<body>
	<?php
		$db = DB::getInstance();
		$birdId = $_POST['birdId'];
	    $db->delete('birdinfo', array('birdID', '=', $birdId));
    ?>
	<div class="container">
	    <h2>Delete</h2>
	    <p>Bird <?php echo $birdId ?> deleted </p>
	    <form action="index.php">
	    	<input type="submit" class="btn btn-classic" value="Home">
	    </form>
	</div>
</body>
</html>