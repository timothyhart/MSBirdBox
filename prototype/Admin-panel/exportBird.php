<!DOCTYPE html>
<html lang="en">
<meta http-equiv="content-type" content="application/json; charset=UTF-8">
<head>
	<title>Bird Box: Admin Panel</title>
	<?php 
	require_once 'core/init.php';
	require_once 'classes/DB.php';
	require_once 'Includes/birdfunctions.inc'; 
	?>
</head>

<body>
	<div id="layout">
		<div id="main">
			<div id="content">
		    <?php 
			    $db = DB::getInstance();
			    $birdId = $_POST['birdId'];
		    	singleBirdDataExport($birdId, $db); 
		    ?>
		</div>
	</div>
</div>
</body>
</html>