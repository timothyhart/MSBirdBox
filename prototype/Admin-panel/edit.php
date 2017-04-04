<!DOCTYPE html>
<html lang="en">
<head>
	<title>Bird Box: Edit</title>
	<?php require_once 'Includes/head.inc'; ?>
</head>

<body>
	<div id="layout">
		<div id="main">
			<div class="header">
			<?php
				$db = DB::getInstance();
				$birdId = $_POST['birdId'];
		    ?>
			    <h1>Edit</h1>
			    <h2>Edit bird <?php echo $birdId ?></h2>
			</div>
			<div class="content">
			    <?php 
			    	$bird = $db->get('birdinfo', array('birdID', '=', $birdId));
			    	$id = $bird->results()[0]->birdID;
			    	$name = $bird->results()[0]->name;
			    	$speciesName = $bird->results()[0]->speciesName;
			    	$description = $bird->results()[0]->description;
			    	$source1 = $bird->results()[0]->source1;
			    	$source2 = $bird->results()[0]->source2;
			    	$photo = $bird->results()[0]->photo;
			    	$photoSource = $bird->results()[0]->photoSource;
			    	$trophycall = $bird->results()[0]->trophycall;
			    	$trophycallSource = $bird->results()[0]->trophycallSource;
			    	$envirocall = $bird->results()[0]->trophycall;
			    ?>

			   <form class="pure-form pure-form-aligned" id="editform" role="form" action="#" method="POST" enctype="multipart/form-data">
			    	<div class="pure-control-group">
			            <label for="name"> Bird Name: </label>
			              <input type="text" name="name" id="name" value="<?php echo $name;?>" autocomplete="off" onkeypress="hide('name')">
			            <?php
			            // if (isset($_POST['name'])){
			            //   if(isset($validation->errors()['name'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['name'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	<div class="pure-control-group">
			            <label for="speciesName"> Bird Species Name: </label>
			              <input type="text" class="form-control" name="speciesName" id="speciesName" value="<?php echo $speciesName;?>" autocomplete="off" onkeypress="hide('speciesName')">
			            <?php
			            // if (isset($_POST['speciesName'])){
			            //   if(isset($validation->errors()['speciesName'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['speciesName'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	<div class="pure-control-group">
			            <label for="description"> Description: </label>
			              <textarea name="description" class="form-control" id="description"  autocomplete="off" onkeypress="hide('description')"><?php echo $description;?>"</textarea>
			            <?php
			            // if (isset($_POST['description'])){
			            //   if(isset($validation->errors()['description'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['description'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	<div class="pure-control-group">
			            <label for="source1"> Source 1: </label>
			              <input type="text" class="form-control" name="source1" id="source1" value="<?php echo $source1;?>" autocomplete="off" onkeypress="hide('source1')">
			            <?php
			            // if (isset($_POST['source1'])){
			            //   if(isset($validation->errors()['source1'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['source1'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	<div class="pure-control-group">
			            <label for="source2"> Source 2: </label>
			              <input type="text" class="form-control" name="source2" id="source2" value="<?php echo $source2;?>" autocomplete="off" onkeypress="hide('source2')">
			            <?php
			            // if (isset($_POST['source2'])){
			            //   if(isset($validation->errors()['source2'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['source2'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	<div class="pure-control-group">
			            <label for="photoupload"> Photo: <img class="resultsimg" src="../public/database/photos/australasian-figbird.jpg"></label>
			              <input type="file" class="form-control" name="photoupload" id="photoupload">
		          	</div>
		          	<div class="pure-control-group">
			            <label for="photo"> Photo Source: </label>
			              <input type="text" class="form-control" name="photoSource" id="photoSource" value="<?php echo $photoSource;?>" autocomplete="off" onkeypress="hide('photoSource')">
			            <?php
			            // if (isset($_POST['photoSource'])){
			            //   if(isset($validation->errors()['photoSource'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['photoSource'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	<div class="pure-control-group">
			            <label for="clipupload"> Trophy Call: </label>
			              <input type="file" class="form-control" name="clipupload" id="clipupload">
		          	</div>
		          	<div class="pure-control-group">
			            <label for="clipSource"> Trophy Call Source: </label>
			              <input type="text" class="form-control" name="clipSource" id="clipSource" value="<?php echo $trophycallSource;?>" autocomplete="off" onkeypress="hide('clipSource')">
			            <?php
			            // if (isset($_POST['clipSource'])){
			            //   if(isset($validation->errors()['clipSource'])) {
			            //     echo '<span class="alert alert-danger">';
			            //     echo $validation->errors()['clipSource'];
			            //     echo '</span>';
			            //   }
			            // }
			            ?>
		          	</div>
		          	</br>
			            <input type="submit" class="pure-button edit-submit-button" value="Update">
		      </div>
		  </div>
	    </form>
	</div>
</body>
</html>