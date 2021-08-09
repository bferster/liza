<?php
	$url="https://api.wit.ai/".$_REQUEST['c']."?v=20210806";
	$header = array();
	$header[]="Authorization: Bearer 3ISBCQZSCQ37KJIZA7U2VFFSGEM75NDH";
	$data=json_encode($_REQUEST['q']);

	$ch=curl_init();
	curl_setopt($ch,CURLOPT_URL, $url);
	curl_setopt($request, CURLOPT_POST, 1);
	curl_setopt($ch,CURLOPT_HTTPHEADER,$header); 
	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	curl_setopt($ch,CURLOPT_RETURNTRANSFER, true); 
	echo curl_exec($ch); 
	curl_close($ch); 

?>
