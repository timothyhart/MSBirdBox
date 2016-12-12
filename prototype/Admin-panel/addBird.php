<!DOCTYPE html>
<html lang="en">
<head>
	<title>Bird Box: Add Bird</title>
	<?php require_once 'Includes/head.inc'; ?>
</head>

<body>
	<?php
		$db = DB::getInstance();
		if(Input::exists()){
			$validate = new Validate();
			$validation = $validate->check($_POST, array(
				'name' => array(
					'required' => true,
				),
				'speciesName' => array(
					'required' => true,
				),
				'description' => array(
					'required' => true,
				),
				'source1' => array(
					'required' => true,
				),
				'source2' => array(
					'required' => true,
				),
				'photoSource' => array(
					'required' => true,
				),
				'clipSource' => array(
					'required' => true,
				),
			));

			if ($validation->passed()){
				$photo_target_dir = "../public/database/photos/";
				$target_file = $photo_target_dir . basename($_FILES["photoupload"]["name"]);
				$uploadOk = 1;
				$imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);
				// Check if image file is a actual image or fake image
				if(isset($_POST["submit"])) {
				    $check = getimagesize($_FILES["photoupload"]["tmp_name"]);
				    if($check !== false) {
				        echo "File is an image - " . $check["mime"] . ".";
				        $uploadOk = 1;
				    } else {
				        echo "File is not an image.";
				        $uploadOk = 0;
				    }
				}
				// Check if $uploadOk is set to 0 by an error
				if ($uploadOk == 0) {
				    echo "Sorry, your file was not uploaded.";
				// if everything is ok, try to upload file
				} else {
				    if (move_uploaded_file($_FILES["photoupload"]["tmp_name"], $target_file)) {
				        echo "The file ". basename( $_FILES["photoupload"]["name"]). " has been uploaded.";
				    } else {
				        echo "Sorry, there was an error uploading your file.";
				    }
				}

				$clip_target_dir = "../public/database/clips/";
				$clip_target_file = $clip_target_dir . basename($_FILES["clipupload"]["name"]);
				$uploadOk = 1;
				$audioFileType = pathinfo($clip_target_file,PATHINFO_EXTENSION);
				if (move_uploaded_file($_FILES["clipupload"]["tmp_name"], $clip_target_file)) {
				        echo "The file ". basename( $_FILES["clipupload"]["name"]). " has been uploaded.";
				    }
				try{
					$db->insert('birdinfo', array(
						'name' => Input::get('name'),
						'speciesName' => Input::get('speciesName'),
						'description' => Input::get('description'),
						'source1' => Input::get('source1'),
						'source2' => Input::get('source2'),
						'photo' => basename( $_FILES["photoupload"]["name"]),
						'photoSource' => Input::get('photoSource'),
						'clip' => basename( $_FILES["clipupload"]["name"]),
						'clipSource' => Input::get('clipSource')
					));
				}
				catch(Exception $e){
					die($e->getMessage());
				}
			}
		}
	?>
	<div class="container">
	    <h2>Add Bird</h2>
	    <p>Fill out the below details to add a bird to the database. </p>
	    <form class="form-horizontal" role="form" action="#" method="POST" enctype="multipart/form-data">
	    	<div class="form-group">
	            <label class="control-label col-sm-2" for="name"> Bird Name: </label>
	            <div class="col-sm-5">
	              <input type="text" class="form-control" name="name" id="name" value="<?php echo escape(Input::get('name'));?>" autocomplete="off" onkeypress="hide('name')">
	            </div>
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
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="speciesName"> Bird Species Name: </label>
	            <div class="col-sm-5">
	              <input type="text" class="form-control" name="speciesName" id="speciesName" value="<?php echo escape(Input::get('speciesName'));?>" autocomplete="off" onkeypress="hide('speciesName')">
	            </div>
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
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="description"> Description: </label>
	            <div class="col-sm-5">
	              <textarea name="description" class="form-control" id="description" value="<?php echo escape(Input::get('description'));?>" autocomplete="off" onkeypress="hide('description')"></textarea>
	            </div>
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
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="source1"> Source 1: </label>
	            <div class="col-sm-5">
	              <input type="text" class="form-control" name="source1" id="source1" value="<?php echo escape(Input::get('source1'));?>" autocomplete="off" onkeypress="hide('source1')">
	            </div>
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
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="source2"> Source 2: </label>
	            <div class="col-sm-5">
	              <input type="text" class="form-control" name="source2" id="source2" value="<?php echo escape(Input::get('source2'));?>" autocomplete="off" onkeypress="hide('source2')">
	            </div>
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
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="photoupload"> Photo: </label>
	            <div class="col-sm-5">
	              <input type="file" class="form-control" name="photoupload" id="photoupload">
	            </div>
          	</div>
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="photo"> Photo Source: </label>
	            <div class="col-sm-5">
	              <input type="text" class="form-control" name="photoSource" id="photoSource" value="<?php echo escape(Input::get('photoSource'));?>" autocomplete="off" onkeypress="hide('photoSource')">
	            </div>
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
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="clipupload"> Clip: </label>
	            <div class="col-sm-5">
	              <input type="file" class="form-control" name="clipupload" id="clipupload">
	            </div>
          	</div>
          	<div class="form-group">
	            <label class="control-label col-sm-2" for="photo"> Clip Source: </label>
	            <div class="col-sm-5">
	              <input type="text" class="form-control" name="clipSource" id="clipSource" value="<?php echo escape(Input::get('clipSource'));?>" autocomplete="off" onkeypress="hide('clipSource')">
	            </div>
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
          	<div class="form-group">
	            <input type="submit" class="btn btn-info" value="Add">
          </div>
	    </form>
	</div>
</body>
</html>