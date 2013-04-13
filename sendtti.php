<?php

	//
	// Posts a tti file to the proxy
	//

	$f = file_get_contents($argv[1]);
  	// echo urlencode($f);
	$urltopost = "http://localhost:8080/tti";
	$datatopost = array("page" => 200, "file" => $f);

	$ch = curl_init ($urltopost);
	curl_setopt ($ch, CURLOPT_POST, true);
	curl_setopt ($ch, CURLOPT_POSTFIELDS, $datatopost);
	curl_setopt ($ch, CURLOPT_RETURNTRANSFER, true);
	$returndata = curl_exec ($ch);
	echo $returndata;

?>
