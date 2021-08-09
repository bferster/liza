<?php
	$ch=curl_init($url);
	$fp=fopen("example_homepage.txt", "w");
	
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_exec($ch);
	if(curl_error($ch))   fwrite($fp, curl_error($ch));
	curl_close($ch);
	fclose($fp);
?>