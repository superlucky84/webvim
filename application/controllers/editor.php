<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Editor extends CI_Controller {
	public function prototype(){

		$string = file_get_contents($_SERVER['DOCUMENT_ROOT']."/asset/file/ctest.txt");

		$string = preg_replace("/\t/","    ",$string);
		$string = preg_replace("/\n\r/","\n",$string);
		$string = preg_replace("/\r/","\n",$string);
		//$string = preg_replace("/\r/","<br>",$string);

		echo json_encode(array(
			'result' => 'true',
			'data'   => $string
		));
	}

}
