<!DOCTYPE html>
<html lang="en">
<head>
	<title>Bird Box: Admin Panel</title>
	<?php require_once 'Includes/head.inc'; ?>
</head>

<body>
	<div id="layout">
		<div id="main">
			<div class="header">
				<h1> Brisbane Bird Data </h1>
				<h2> Currently showing all stored birds.</h2>
			</div>
			<div class="content">
			</br></br>
			    <form action="addBird.php" method="POST">
			    	<input id="addbirdbutton" type="submit" class="pure-button add-entry-button" value="Add Entry">
			    </form>
			    <form action="exportdata.php" method="POST">
			    	<input id="addbirdbutton" type="submit" class="pure-button data-export-button" value="Export Data">
			    </form>
			    </br>
			    <table class="pure-table">
				    <thead>
					    <tr>
						    <th>Photo </th>
						    <th>Bird ID</th>
						    <th>Bird Name</th>
						    <th>Species Name</th>
						    <th>Bird Calls</th>
						    <th>Description</th>
						    <th>Actions</th>
					    </tr>
				    </thead>

				    <tbody>
			        <?php
					$db = DB::getInstance();
			        $birdIds = array();
			        $birdPhotos = array();
			        $birdNames = array();
			        $birdSpeciesNames = array();
			        $birdTrophyCalls = array();
			        $birdEnviroCalls = array();
			        $birdDesciptions = array();
			        $birdPhotoSources = array();
			        $birdTrophyCallSources = array();
			        $birdSources1 = array();
			        $birdSources2 = array();

			       getbirds($birdIds, $birdPhotos, $birdNames, $birdSpeciesNames, $birdTrophyCalls, $birdDescriptions, $birdPhotoSources, $birdTrophyCallSources, $birdSources1, $birdSources2, $db);
			        // echo the details of of the job into table view for users to see
			        for ($bird = 0; $bird < sizeof($birdIds); $bird++){
				        echo '<tr>';
							echo '<td><img class="resultsimg" src="../public/database/photos/'.$birdPhotos[$bird].'" alt="'.$birdPhotos[$bird].'"></td>';
					        echo '<td>'.$birdIds[$bird].'</td>';
							echo '<td>'.$birdNames[$bird].'</td>';
							echo '<td>'.$birdSpeciesNames[$bird].'</td>';
							echo '<td> 
										<audio class="audioplayer" controls>
											<source src="../public/database/clips/'.$birdTrophyCalls[$bird].'" type="audio/ogg">
											<source src="'.$birdTrophyCalls[$bird].'" type="audio/mpeg">
										</audio>
										<audio class="audioplayer" controls>
											<source src="../public/database/clips/'.$birdEnviroCalls[$bird].'" type="audio/ogg">
											<source src="'.$birdEnviroCalls[$bird].'" type="audio/mpeg">
										</audio>
								</td>';
							echo '<td>'.$birdDescriptions[$bird].'</td>';
							echo '<td> 
									<form action="edit.php" method="POST">
		          						<input type="text" name="birdId" style="display:none" value='.$birdIds[$bird].'>
		          						<button type="submit" class="pure-button add-entry-button action-buttons"><i class="fa fa-pencil-square-o"></i></button>
		          					</form>
		          					<form action="deleteBird.php" method="POST">
		          						<input type="text" name="birdId" style="display:none" value='.$birdIds[$bird].'>
		          						<button type="submit" class="pure-button action-buttons"><i class="fa fa-times"></i></button>
		          					</form>
		          					<form action="exportBird.php" method="POST">
		          						<input type="text" name="birdId" style="display:none" value='.$birdIds[$bird].'>
		          						<button type="submit" class="pure-button action-buttons data-export-button"><i class="fa fa-share"></i></button>
		          					</form>
		          				  </td>';
			        }
3
			        ?>
			      </tbody>
			    </table>
		  </div>
		</div>
	</div>
</body>

</html>