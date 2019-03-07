<?
error_reporting(0);
$url=$_GET['url'];
echo file_get_contents($url);
?>