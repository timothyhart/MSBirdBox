<?php

	function getbirds(&$birdIds, &$birdPhotos, &$birdNames, &$birdSpeciesNames, &$birdTrophyCalls, &$birdDescriptions, &$birdPhotoSources, &$birdClipSources, &$birdSources1, &$birdSources2, $db){

	    $birds = $db->get('birdinfo', array('birdID', '>', 0));
	    for ($bird=0; $bird < $birds->count(); $bird++){
	    	$birdIds[$bird] = $birds->results()[$bird]->birdID;
	    	$birdPhotos[$bird] = $birds->results()[$bird]->photo;
	    	$birdNames[$bird] = $birds->results()[$bird]->name;
	    	$birdSpeciesNames[$bird] = $birds->results()[$bird]->speciesName;
	    	$birdTrophyCalls[$bird] = $birds->results()[$bird]->clip;
		$birdEnviroCalls[$bird] = $birds->results()[$bird]->envirocall;
	    	$birdDescriptions[$bird] = $birds->results()[$bird]->description;
	    	$birdPhotoSources[$bird] = $birds->results()[$bird]->photoSource;
	    	$birdClipSources[$bird] = $birds->results()[$bird]->clipSource;
			$birdSources1[$bird] = $birds->results()[$bird]->source1;
			$birdSources2[$bird] = $birds->results()[$bird]->source2;
  		}
	}

function getMostCommonbirds(&$birdIds, &$birdPhotos, &$birdNames, &$birdSpeciesNames, &$birdTrophyCalls, &$birdDescriptions, &$birdPhotoSources, &$birdClipSources, &$birdSources1, &$birdSources2, $db){

	$birds = $db->get('birdinfo', array('birdID', '>', 0));
	    for ($bird=0; $bird < $birds->count(); $bird++){
	    	$birdIds[$bird] = $birds->results()[$bird]->birdID;
	    	$birdPhotos[$bird] = $birds->results()[$bird]->photo;
	    	$birdNames[$bird] = $birds->results()[$bird]->name;
	    	$birdSpeciesNames[$bird] = $birds->results()[$bird]->speciesName;
	    	$birdTrophyCalls[$bird] = $birds->results()[$bird]->clip;
	    	$birdEnviroCalls[$bird] = $birds->results()[$bird]->envirocall;
	    	$birdDescriptions[$bird] = $birds->results()[$bird]->description;
	    	$birdPhotoSources[$bird] = $birds->results()[$bird]->photoSource;
	    	$birdClipSources[$bird] = $birds->results()[$bird]->clipSource;
			$birdSources1[$bird] = $birds->results()[$bird]->source1;
			$birdSources2[$bird] = $birds->results()[$bird]->source2;
  		}
	}

	function getBird($birdId, $db){
		$bird = $db->get('birdinfo', array('birdID', '=', $birdId));
		return $bird;
	}

	// Forces all string properties in $obj to be UTF-8 encoded, so it can be converted to a json object.
	function fixMalformedCharacters($obj) {
		if (is_array($obj)) {
			foreach ($obj as $key => $value) {
				$obj[$key] = fixMalformedCharacters($value);
			}
			return $obj;
		} else if (is_object($obj)) {
			foreach ($obj as $key => $value) {
				$obj->$key = fixMalformedCharacters($value);
			}
			return $obj;
		} else if (is_string($obj)) {
			return utf8_encode($obj);
		} else {
			return $obj;
		}
	}

	function birdDataExport($db){
		$birds = $db->get('birdinfo', array('birdID', '>', 0));

		$birdsArray = array();
		for ($bird=0; $bird < $birds->count(); $bird++){
			$birdsArray[] = $birds->results()[$bird];
		}
        
      

		// Apparently there are malformed characters in the data we're getting back.
		// This causes json_encode to return an empty string, (and hide an error in json_last_error()).
		// FIXME: Perhaps it would be better to set the database connection to UTF-8 and let it handle the conversion.
		$birdsArray = fixMalformedCharacters($birdsArray);
		echo json_encode($birdsArray, JSON_PRETTY_PRINT);
	}

function commonBirdDataExport($db){
//Common Birds is not fully implemented so it does the exact same as birdDataExport for now	
//$birds = $db->get('birdinfo', array('common', '=', 1));

	$birds = $db->get('birdinfo', array('birdID', '>', 0));
	$birdsArray = array();
	for ($bird=0; $bird < $birds->count(); $bird++){
		$birdsArray[] = $birds->results()[$bird];
	}

	// Apparently there are malformed characters in the data we're getting back.
	// This causes json_encode to return an empty string, (and hide an error in json_last_error()).
	// FIXME: Perhaps it would be better to set the database connection to UTF-8 and let it handle the conversion.
	$birdsArray = fixMalformedCharacters($birdsArray);
	echo json_encode($birdsArray, JSON_PRETTY_PRINT);
}

	function singleBirdDataExport($birdId, $db){
		$bird = $db->get('birdinfo', array('birdID', '=', $birdId));
		echo json_encode($bird->results()[0], JSON_PRETTY_PRINT);
	}

?>
