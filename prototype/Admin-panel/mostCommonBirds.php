<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel: Most Common Birds</title>
    <?php require_once 'Includes/head.inc'; ?>
</head>

<body>
<div id="layout">
    <div id="main">
        <div class="header">
            <h1> Brisbane Bird Data </h1>
            <h2> Currently showing most common brisbane birds.</h2>
        </div>
        <div class="content">
            <form action="exportCommonBirdsData.php" method="POST">
                <input id="addbirdbutton" type="submit" class="pure-button data-export-button" value="Export Data">
            </form>
            <table class="pure-table">
                <thead>
                <tr>
                    <th>Photo</th>
                    <th>Bird ID</th>
                    <th>Bird Name</th>
                    <th>Species Name</th>
                    <th>Bird Calls</th>
                    <th>Description</th>
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

                getMostCommonbirds($birdIds, $birdPhotos, $birdNames, $birdSpeciesNames, $birdTrophyCalls, $birdDescriptions, $birdPhotoSources, $birdTrophyCallSources, $birdSources1, $birdSources2, $db);
                // echo the details of of the job into table view for users to see
                for ($bird = 0;
                     $bird < sizeof($birdIds);
                     $bird++) {
                    echo '<tr>';
                    echo '<td><img class="resultsimg" src="../public/database/photos/' . $birdPhotos[$bird] . '" alt="' . $birdPhotos[$bird] . '"></td>';
                    echo '<td>' . $birdIds[$bird] . '</td>';
                    echo '<td>' . $birdNames[$bird] . '</td>';
                    echo '<td>' . $birdSpeciesNames[$bird] . '</td>';
                    echo '<td> 
										<audio class="audioplayer" controls>
											<source src="../public/database/clips/' . $birdTrophyCalls[$bird] . '" type="audio/ogg">
											<source src="' . $birdTrophyCalls[$bird] . '" type="audio/mpeg">
										</audio>
										<audio class="audioplayer" controls>
											<source src="../public/database/clips/' . $birdEnviroCalls[$bird] . '" type="audio/ogg">
											<source src="' . $birdEnviroCalls[$bird] . '" type="audio/mpeg">
										</audio>
								</td>';
                    echo '<td>' . $birdDescriptions[$bird] . '</td>';
                }
                ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

</body>
</html>