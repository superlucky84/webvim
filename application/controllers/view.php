<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class View extends CI_Controller {

   public function __construct(){
		parent::__construct();
   }

	public function index(){
		$this->main();
	}

	/*
	 * 메인 페이지
	 */
	public function main(){

		$this->load->view('main.html',array(
			'version' => "16",
		));
	}

	/*
	 * 에디터 페이지
	 */
	public function editor(){
		$this->load->view('editor.html');
	}

}
