

// 컨트롤러 간 공유
superlucky.service('editorservice',function(){

	this.htmlspecialchars = function(str,except_tag) {
		if (typeof(str) == "string") {
			str = str.replace(/&/g, "&amp;"); /* must do &amp; first */
			str = str.replace(/"/g, "&quot;");
			str = str.replace(/'/g, "&#039;");
			if(!except_tag){
				str = str.replace(/</g, "&lt;");
				str = str.replace(/>/g, "&gt;");
			}
			str = str.replace(/ /g, "&nbsp;");
		}
		return str;
	}
	this.rhtmlspecialchars = function(str,except_tag) {
		if (typeof(str) == "string") {
			str = str.replace(/&nbsp;/ig, " ");
			if(!except_tag){
				str = str.replace(/&gt;/ig, ">");
				str = str.replace(/&lt;/ig, "<");
			}
			str = str.replace(/&#039;/g, "'");
			str = str.replace(/&quot;/ig, '"');
			str = str.replace(/&amp;/ig, '&'); /* must do &amp; last */
		}
		return str;
	}

	this.dialog_instance = null;
	this.main_scope = null;
	this.main_scope_setting = function($scope){
		this.main_scope = $scope;
	}

})
// 다이얼로그 컨트롤러
.controller('editorDialogController', function ($scope,$http,$modal,editorservice) {


})
// 타이핑 앱 컨트롤러
.controller('editorController', function ($scope,$http,$modal,editorservice) {

	var $navbar = angular.element(document.getElementById('navbar'));
	$navbar.find("li").removeClass('active');
	angular.element(document.getElementById('editor')).addClass('active');
	angular.element(".mainpage").addClass("fl");


	// Class 정의  (판 클레스)
	function editor_pann(){

		// EDITOR NUM 판
		this.$DIV = angular.element(document.getElementById('editor_area'));
		// NUM OBJ
		this.numObj = null;
		// VISUAL OBJ
		this.visualObj = null;


		// vi모드 (NORMAL, INSERT, COMMAND)
		this.MODE = "NORMAL";
		// 전체 행 개수
		this.TOTAL_ROW = 0;
		// 라인 인스턴스
		this.line_ins = null;
		// 커서 인스턴스
		this.cur_ins = null;
		// 폰트 넓이
		this.font_width = 9;
		// 폰트 높이
		this.font_height = 15;
		// 일반모드 QUEUE
		this.common_queue = [];
		// 이벤트
		this.event_memory = null;
		// 판 시작라인
		this.START_ROW = 1;
		// 현재 판 전체라인 
		this.PANN_ROW =   1;
		// 현재 판 실제라인 (길어서 두줄 된것까지)
		this.PANN_LINE = 1;
		// 판 높이 px
		this.PANN_HEIGHT = 0;
		// 판 넓이 px
		this.PANN_WIDTH = 0;
		// 판 넘버 넓이
		this.PANN_NUM_WIDTH = 0;
		// 판 에디터 넓이
		this.PANN_EDITOR_WIDTH = 0;
		// 판 에디터 넓이 컬럼개수
		this.PANN_EDITOR_WIDTH_COLUMN = 0

		// 라인배열
		this.PANN = [];
		this.LINE_CHANGE = false;

		this.key_shift_rule = { 'A' : "a", 'B' : "b", 'C' : "c", 'D' : "d", 'E' : "e", 'F' : "f", 'G' : "g", 'H' : "h", 'I' : "i", 'J' : "j", 'K' : "k", 'L' : "l", 'M' : "m", 'N' : "n", 'O' : "o", 'P' : "p", 'Q' : "q", 'R' : "r", 'S' : "s", 'T' : "t", 'U' : "u", 'V' : "v", 'W' : "w", 'X' : "x", 'Y' : "y", 'Z' : "z", "1" : "!", "2" : "@", "3" : "#", "4" : "$", "5" : "%", "6" : "^", "7" : "&", "8" : "*", "9" : "(", "0" : ")" };




		// 컬럼위치 재정렬
		// reset_type 이 있을경우 line_ins.end값 무시
		if(typeof this.cursor_column_reset != "function"){
			editor_pann.prototype.cursor_column_reset = function(line_end,reset_type){
				var _this = this;

				var cal_column = 1;
				if(line_end < _this.cur_ins.COLUMN && !reset_type){
					cal_column = line_end;
				}else{
					cal_column = _this.cur_ins.COLUMN;
				}

				var top = _this.numObj.row_to_px(_this.cur_ins.ROW);

				var line_cnt = Math.ceil(cal_column / _this.PANN_EDITOR_WIDTH_COLUMN);
				top = top + ((line_cnt-1)*_this.font_height);

				cal_column = _this.PANN_EDITOR_WIDTH_COLUMN - ((_this.PANN_EDITOR_WIDTH_COLUMN * line_cnt) - cal_column);

				var left  = (cal_column-1) * _this.font_width;

				_this.cur_ins.$CURSOR_DIV.css("left",left+"px");
				_this.cur_ins.$CURSOR_DIV.css("top",top+"px");

			}
		}



		// 입력모드 queue insert
		if(typeof this.queue_insert != "function"){
			editor_pann.prototype.queue_insert = function(qchar){
				var _this = this;
				_this.common_queue.push(qchar);
				if(_this.common_queue.length > 3){
					_this.common_queue.splice(0,_this.common_queue.length-3);
				}
			}
		}
		// 입력모드 queue get
		if(typeof this.queue_get != "function"){
			editor_pann.prototype.queue_get = function(count){
				var _this = this;
				return _this.common_queue.slice(_this.common_queue.length-count,_this.common_queue.length);
			}
		}

		// 파일로드
		if(typeof this.file_load != "function"){
			editor_pann.prototype.file_load = function(){
				var _this = this;
				$http({ url: '/editor/prototype', method: "GET", async:false }).
					success(function(data){

						//var pann = data.data.replace(/[\&]/g,"&amp;").replace(/[ ]/g,"&nbsp;").split(/\n/);
						_this.PANN = data.data.split(/\n/);

						// TOTAL_ROk
						_this.TOTAL_ROW = _this.PANN.length;
						
						// 넘버 클래스 인스턴스 생성
						_this.numObj = new number_line(_this.font_height);

						// 판 넓이계산
						_this.pann_calcul_width();

						// 판 높이계산
						_this.pann_calcul_height();

						// 라인 인스턴스 생성
						_this.line_ins = new editor_line(_this.font_width);

						// 커서 인스턴스 생성
						_this.cur_ins = new editor_cursor(_this.font_width,_this.font_height,_this.$DIV.find(".editor_cursor"));

						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
						_this.$DIV.attr("contenteditable",false);
						_this.cur_ins.cursor_blink();

						
					}).
					error(function(data){
						alert('SERVER ERROR');
					});
			}
		}
		// 판높이 계산
		if(typeof this.pann_calcul_height != "function"){
			editor_pann.prototype.pann_calcul_height = function(){
				var _this = this;

				_this.$DIV.html('<div style="position:relative;"><div class="editor_cursor">&nbsp;</div></div>');
				//_this.$DIV.append('<div style="position:relative;"><div class="editor_visual">&nbsp;</div></div>');
				//_this.$NUM_DIV.html('');
				_this.numObj.$NUM_DIV.html('');

				var accrue = 1;
				var accrue_px = 0;
				var num = 0;
				for(line_key in _this.PANN){
					var line_org = _this.PANN[line_key];
					var line = editorservice.htmlspecialchars(line_org);
					if(!line){
						line = "&nbsp;";
					}

					var $SPAN = angular.element("<pre class='editor_line'>"+line+"</pre>"); 

					_this.$DIV.append($SPAN);
					num = parseInt(line_key) + 1;

					var $NUM_SPAN = angular.element("<div class='editor_line'>"+num+"</div>");
					var h_px = _this.font_height;
					var h = 1;
					if((line_org.length * _this.font_width) >= _this.PANN_EDITOR_WIDTH){
						h = Math.ceil((line_org.length * _this.font_width) / _this.PANN_EDITOR_WIDTH);
						if(h==1) h++;
						h_px = h *_this.font_height;
					}

					$NUM_SPAN.attr("data-accrue",accrue);
					accrue += h;

					$NUM_SPAN.attr("data-accrue_px",accrue_px);
					$NUM_SPAN.attr("data-num",num);
					$NUM_SPAN.css("height",h_px+"px");

					accrue_px += h_px;

					//_this.$NUM_DIV.append($NUM_SPAN);
					_this.numObj.$NUM_DIV.append($NUM_SPAN);

				}


				// 판 높이 계산
				_this.PANN_HEIGHT = parseInt(window.innerHeight-130);
				_this.PANN_HEIGHT = (Math.floor(_this.PANN_HEIGHT/_this.font_height)) * _this.font_height;
				angular.element("#editor_pann").css("height",_this.PANN_HEIGHT+"px");

				// PANN ROW
				_this.PANN_LINE = Math.floor(_this.PANN_HEIGHT / _this.font_height);
				_this.PANN_ROW = _this.numObj.line_to_row(_this.PANN_LINE);
				

			}
		}
		// 판넓이 계산
		if(typeof this.pann_calcul_width != "function"){
			editor_pann.prototype.pann_calcul_width = function(){
				var _this = this;

				// 판 넓이 계산
				_this.PANN_WIDTH = window.innerWidth-17;
				angular.element("#editor_pann").css("width",_this.PANN_WIDTH+"px");

				// 라인 넓이 계산
				_this.PANN_NUM_WIDTH = String(_this.TOTAL_ROW).length * _this.font_width;

				_this.PANN_EDITOR_WIDTH = _this.PANN_WIDTH - (_this.PANN_NUM_WIDTH + 17);

				_this.PANN_EDITOR_WIDTH_COLUMN = Math.floor(_this.PANN_EDITOR_WIDTH / _this.font_width);

				angular.element("#editor_area").css("width",_this.PANN_EDITOR_WIDTH+"px");

			}
		}

		// 판 다시계산
		if(typeof this.pann_resize != "function"){
			editor_pann.prototype.pann_resize = function(){
				var _this = this;
				_this.pann_calcul_width();
				_this.pann_calcul_height();
				_this.cur_ins.$CURSOR_DIV = _this.$DIV.find(".editor_cursor");

			}
		}


		// 모드면경
		if(typeof this.mode_change != "function"){
			editor_pann.prototype.mode_change = function(TYPE){
				var _this = this;

				// 입력모드
				if(TYPE=="INSERT"){
					console.log("INSERT MODE");
					_this.$DIV.attr("contenteditable",true);
					_this.MODE = "INSERT";

					// 커서 숨기기
					_this.cur_ins.cursor_blink_stop('hide');

					//_this.$DIV.find(".editor_cursor").css("width","1px");

					document.getElementById("editor_area").focus();


					// 디자인 모드 변경시 문자 안들어 가도록 함
					editorPann.event_memory.preventDefault();

					// 입력 모드에 커서위치 잡기
					_this.cur_ins.set_insert_cursor(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

					// 판 scrollTop
					var top = _this.numObj.row_to_px(_this.START_ROW);
					angular.element("#editor_pann")[0].scrollTop=top;


				}
				// 일반모드
				else if(TYPE=="NORMAL"){
					console.log("NORMAL MODE");
					_this.$DIV.attr("contenteditable",false);
					_this.MODE = "NORMAL";
					$scope.keytarget = "";

					// 커서위치 재정렬
					_this.cur_ins.COLUMN--;

					//_this.$DIV.find(".editor_cursor").css("width","10px");

					document.getElementById("editor_target").focus();
					console.log(_this.cur_ins.ROW);
					console.log(_this.cur_ins.COLUMN);
					console.log('');

					// 일반모드에 커서위치 잡기
					_this.cur_ins.set_normal_cursor(_this.line_ins.line_string,_this.$DIV.find("pre"));
					console.log(_this.cur_ins.ROW);
					console.log(_this.cur_ins.COLUMN);

					// 라인 업데이트
					_this.PANN[_this.cur_ins.ROW-1] = editorservice.rhtmlspecialchars(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).html());
					//라인 바꼈을 경우에만 해줌
					if(_this.LINE_CHANGE){
						_this.pann_calcul_height();
						_this.cur_ins.$CURSOR_DIV = _this.$DIV.find(".editor_cursor");
						_this.LINE_CHANGE = false;
					}

					// 라인 정보 다시분석
					_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

					// 컬럼리셋
					_this.cursor_column_reset(_this.line_ins.end);
					
					// 커서 출현시키기
					_this.cur_ins.cursor_blink();



				}
				// 명령모드
				else if(TYPE=="COMMAND"){
					_this.MODE = "COMMAND";
				}
			}
		}

		// 키코드 액션
		if(typeof this.key_esc != "function"){
			editor_pann.prototype.key_esc = function(keyCode){
				var _this = this;
				if(_this.MODE!="NORMAL"){
					_this.mode_change("NORMAL");
				}
			}
		}

		// 키코드 액션
		if(typeof this.key_fun != "function"){
			editor_pann.prototype.key_fun = function(keyCode,keyChar,ctrlKey){
				var _this = this;

				// 큐에 넣기
				_this.queue_insert(keyChar);

				console.log(_this.common_queue);

				// 입력모드일때 바인딩
				if(_this.MODE=="INSERT"){

					console.log("input");

					// 라인 변경시 처리
					var pre_height = _this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).css('height');
					setTimeout(function() {
						var change_height = _this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).css('height');
						if(pre_height != change_height){
							//_this.$NUM_DIV.find("div").eq(_this.cur_ins.ROW-1).css('height',change_height);
							_this.numObj.$NUM_DIV.find("div").eq(_this.cur_ins.ROW-1).css('height',change_height);

							_this.LINE_CHANGE = true;
						}
					}, 0);


					// 텝키
					if(keyCode==9){
						var tapnode = document.createTextNode('    ');
						var carotnode = document.createElement('span');
						var caretID = '_caret';
						carotnode.id = caretID;
						window.getSelection().getRangeAt(0).insertNode(carotnode);
						window.getSelection().getRangeAt(0).insertNode(tapnode);

						var cc = _this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).find("#_caret")[0];
						var range = document.createRange();
						range.selectNode(cc);
						var selection = window.getSelection();
						selection.removeAllRanges();
						selection.addRange(range);
						range.deleteContents();
					}


					/*
					var orig_st = _this.$DIV.find("div").eq(_this.ROW+1).html().replace(/&nbsp;/g," ");
					var res = String.fromCharCode(keyCode);
					var pre_string  = orig_st.substr(0,_this.cur_ins.COLUMN-1);
					var next_string = orig_st.substring(_this.cur_ins.COLUMN-1,orig_st.length);
					var return_text = pre_string+res+next_string;
					return_text = return_text.replace(/ /g,"&nbsp;");
					_this.$DIV.find("div").eq(_this.ROW+1).html(return_text);
					_this.cur_ins.COLUMN++;
					// 커서위치 재정렬
					_this.cursor_column_reset();
					*/

				}
				// 일반모드일때 바인딩
				else if(_this.MODE=="NORMAL"){

					//_this.cur_ins.cursor_blink_stop('show');
					_this.cur_ins.$CURSOR_DIV.show();
					
					// 비주얼박스를 그리거나 취소함
					if(_this.visualObj){
						console.log("keyCodekeyCode");
						console.log(keyCode);
						if( keyCode==27 || keyCode==86 ){
							_this.visualObj = null;
							_this.$DIV.find(".editor_visual").remove();
						}else{
							setTimeout(function() {
								_this.visualObj.render(_this.cur_ins.ROW,_this.cur_ins.COLUMN);
							}, 0);
						}
					}else if("v" == _this.queue_get(1).join('')){
						//비주얼 모드
						_this.visualObj = new editor_visual("none",_this.font_width,_this.font_height,_this.cur_ins.ROW,_this.cur_ins.COLUMN,_this.$DIV,_this.PANN_EDITOR_WIDTH_COLUMN);
					}

					// z + z
					if("zz"==_this.queue_get(2).join('')){
						_this.START_ROW = _this.cur_ins.ROW - Math.round(_this.PANN_LINE/2);
						if(_this.START_ROW < 1){
							_this.START_ROW = 1;
						}
						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;
					}
					// z + enter
					else if(13==keyCode && "z"==_this.queue_get(2).join('').replace(/[^a-z]/g,'')){
						_this.START_ROW = _this.cur_ins.ROW;
						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;
					}
					// z + -
					else if(189==keyCode && "z"==_this.queue_get(2).join('').replace(/[^a-z]/g,'')){
						_this.START_ROW = _this.cur_ins.ROW - _this.PANN_LINE+1;

						if(_this.START_ROW < 1){
							_this.START_ROW = 1;
						}

						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;
					}
					// 한페이지 뒤로
					else if(ctrlKey && "f" == keyChar){

						var diff_cur = _this.cur_ins.ROW - _this.START_ROW;

						var start_line = _this.numObj.row_to_line(_this.START_ROW);
						var last_line = start_line + _this.PANN_LINE -1;

						_this.START_ROW = _this.numObj.line_to_row(last_line) + 1;
						if(_this.START_ROW > _this.TOTAL_ROW){
							_this.START_ROW = _this.numObj.line_to_row(start_line);
						}

						start_line = _this.numObj.row_to_line(_this.START_ROW);
						last_line = start_line + _this.PANN_LINE -1;

						if( _this.numObj.line_to_row(last_line) >= _this.TOTAL_ROW){
							last_line  = _this.numObj.row_to_line(_this.TOTAL_ROW);
							start_line = last_line - _this.PANN_LINE + 1;
							_this.START_ROW = _this.numObj.line_to_row(start_line);
						}

						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;

						_this.cur_ins.ROW = _this.START_ROW+diff_cur;
						if(_this.cur_ins.ROW > _this.TOTAL_ROW){
							_this.cur_ins.ROW = _this.TOTAL_ROW;
						}

						var top = _this.numObj.row_to_px(_this.cur_ins.ROW);
						_this.$DIV.find(".editor_cursor").css("top",top+"px");
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

					}
					// 한페이지 앞으로
					else if(ctrlKey && "b" == keyChar){

						var diff_cur = _this.cur_ins.ROW - _this.START_ROW;

						var start_line = _this.numObj.row_to_line(_this.START_ROW);
						var last_line = start_line + _this.PANN_LINE -1;



						start_line = start_line - _this.PANN_LINE;
						console.log("start_line");
						console.log(start_line);

						if(start_line < 0){
							start_line = 1;
						}
						_this.START_ROW = _this.numObj.line_to_row(start_line);
						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;

						_this.cur_ins.ROW = _this.START_ROW+diff_cur;
						if(_this.cur_ins.ROW <= 1){
							_this.cur_ins.ROW = 1;
						}
						var top = _this.numObj.row_to_px(_this.cur_ins.ROW);
						_this.$DIV.find(".editor_cursor").css("top",top+"px");
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));



						/*
						var han = _this.PANN_ROW;
						var han_px =  han * _this.font_height;

						_this.START_ROW -= han;
						if(_this.START_ROW < 1){
							_this.START_ROW = 1;
						}
						han_px = (_this.START_ROW-1) * _this.font_height;
						angular.element("#editor_pann")[0].scrollTop=han_px;

						_this.cur_ins.ROW -= han;
						if(_this.cur_ins.ROW < 1){
							_this.cur_ins.ROW = 1;
						}
						var top = (_this.cur_ins.ROW-1) * _this.font_height;
						_this.$DIV.find(".editor_cursor").css("top",top+"px");
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
						*/
					}

					// 반페이지 뒤로
					else if(ctrlKey && "d" == keyChar){

						var diff_cur = _this.cur_ins.ROW - _this.START_ROW;

						var start_line = _this.numObj.row_to_line(_this.START_ROW);
						var last_line = start_line + _this.PANN_LINE -1;


						_this.START_ROW = Math.round((_this.numObj.line_to_row(last_line) - _this.START_ROW)/2) + _this.START_ROW;
						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;

						_this.cur_ins.ROW = _this.START_ROW+diff_cur;
						if(_this.cur_ins.ROW > _this.TOTAL_ROW){
							_this.cur_ins.ROW = _this.TOTAL_ROW;
						}

						var top = _this.numObj.row_to_px(_this.cur_ins.ROW);
						_this.$DIV.find(".editor_cursor").css("top",top+"px");

						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

					}
					// 반페이지 앞으로
					else if(ctrlKey && "u" == keyChar){

						var diff_cur = _this.cur_ins.ROW - _this.START_ROW;

						var start_line = _this.numObj.row_to_line(_this.START_ROW);
						var last_line = start_line + _this.PANN_LINE -1;

						_this.START_ROW = _this.START_ROW - Math.round((_this.numObj.line_to_row(last_line) - _this.START_ROW)/2);
						if(_this.START_ROW < 1){
							_this.START_ROW = 1;
						}

						var top = _this.numObj.row_to_px(_this.START_ROW);
						angular.element("#editor_pann")[0].scrollTop=top;

						_this.cur_ins.ROW = _this.START_ROW+diff_cur;
						if(_this.cur_ins.ROW < 1){
							_this.cur_ins.ROW = 1;
						}

						var top = _this.numObj.row_to_px(_this.cur_ins.ROW);
						_this.$DIV.find(".editor_cursor").css("top",top+"px");
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

					}
					// 첫번째 줄로 이동
					else if('gg' == _this.queue_get(2).join('')){
							_this.cur_ins.ROW = 1;

							// 라인분석
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
							// 커서위치 재정렬
							_this.cursor_column_reset(_this.line_ins.end);

							var top = (_this.cur_ins.ROW-1) * _this.font_height;
							_this.$DIV.find(".editor_cursor").css("top",top+"px");

							// 판을 처음으로 이동
							_this.START_ROW = 1;
							angular.element("#editor_pann")[0].scrollTop=0;

					}
					// 마지막 줄로 이동
					else if('G' == keyChar){
							_this.cur_ins.ROW = _this.TOTAL_ROW;

							// 라인분석
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
							// 커서위치 재정렬
							_this.cursor_column_reset(_this.line_ins.end);

							//var top = (_this.cur_ins.ROW-1) * _this.font_height;
							var top = _this.numObj.row_to_px(_this.cur_ins.ROW);
							_this.$DIV.find(".editor_cursor").css("top",top+"px");

							// 판을 마지막으로 이동

							var last_line  = _this.numObj.row_to_line(_this.TOTAL_ROW);
							var start_line = last_line - _this.PANN_LINE + 1;
							_this.START_ROW = _this.numObj.line_to_row(start_line);

							var top = _this.numObj.row_to_px(_this.START_ROW);
							angular.element("#editor_pann")[0].scrollTop=top;
					}
					// 줄삭제
					else if('dd' == _this.queue_get(2).join('')){

						_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).remove();
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
						_this.TOTAL_ROW--;
						// queue 비우기
						_this.common_queue = []

					}
					// 모드변경
					else if(["A","a","I","O","i","o"].indexOf(keyChar) > -1){
						if("a" == keyChar){
							_this.cur_ins.COLUMN++;
							_this.cursor_column_reset(_this.line_ins.end,"FORCE");
						}
						else if("A" == keyChar){
							_this.cur_ins.COLUMN = _this.line_ins.end+1;
							_this.cursor_column_reset(_this.line_ins.end,"FORCE");
						}
						else if("I" == keyChar){
							_this.cur_ins.COLUMN = _this.line_ins.start+1;
							_this.cursor_column_reset(_this.line_ins.end);
						}
						else if("O" == keyChar){
							_this.$DIV.find("pre").eq(_this.cur_ins.ROW-2).after("<pre class='editor_line'></pre>");
							//_this.cur_ins.ROW--;
							_this.cur_ins.COLUMN = 1;
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

						}
						else if("o" == keyChar){
							_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).after("<pre class='editor_line'></pre>");
							_this.cur_ins.ROW++;
							_this.cur_ins.COLUMN = 1;
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
						}
						_this.mode_change("INSERT");
					}
					// 한글자 삭제
					else if("x" == keyChar){
						//var orig_st = _this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).html().replace(/&nbsp;/g," ");
						var orig_st = editorservice.rhtmlspecialchars(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).html());
						var pre_string  = orig_st.substr(0,_this.cur_ins.COLUMN-1);
						var next_string = orig_st.substring(_this.cur_ins.COLUMN,orig_st.length);
						var return_text = pre_string+next_string;
						//return_text = return_text.replace(/ /g,"&nbsp;");
						return_text = editorservice.htmlspecialchars(return_text);
						_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1).html(return_text);
						// 커서위치 재정렬
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
					}
					// 판의 처음으로 이동
					else if("H" == keyChar){
						_this.cur_ins.ROW = _this.START_ROW;
						//var top = _this.row_to_px(_this.cur_ins.ROW);
						//_this.$DIV.find(".editor_cursor").css("top",top+"px");

						_this.cursor_column_reset(_this.line_ins.end);


						// 라인분석
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
					}
					// 판의 중간으로 이동
					else if("M" == keyChar){

						var start_line = _this.numObj.row_to_line(_this.START_ROW);
						var last_line = start_line + _this.PANN_LINE -1;


						_this.cur_ins.ROW = Math.round((_this.numObj.line_to_row(last_line) - _this.START_ROW)/2) + _this.START_ROW;


						_this.cursor_column_reset(_this.line_ins.end);

						// 라인분석
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
					}
					// 판의 마지막으로 이동
					else if("L" == keyChar){
						//_this.cur_ins.ROW = _this.START_ROW + _this.PANN_ROW -1;

						var start_line = _this.numObj.row_to_line(_this.START_ROW);
						var last_line = start_line + _this.PANN_LINE -1;
						_this.cur_ins.ROW = _this.numObj.line_to_row(last_line);

						//var top = (_this.cur_ins.ROW-1) * _this.font_height;
						//var top = _this.row_to_px(_this.cur_ins.ROW);
						//_this.$DIV.find(".editor_cursor").css("top",top+"px");

						_this.cursor_column_reset(_this.line_ins.end);

						// 라인분석
						_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
					}
					// 왼쪽
					else if("h" == keyChar){
						if(_this.cur_ins.COLUMN > 1){
							if(_this.line_ins.end < _this.cur_ins.COLUMN){
								_this.cur_ins.COLUMN = _this.line_ins.end;
							}
							_this.cur_ins.COLUMN--;

							_this.cursor_column_reset(_this.line_ins.end);

						}
					}
					// 오른쪽
					else if("l" == keyChar){
						if(_this.line_ins.end > _this.cur_ins.COLUMN){
							if(_this.line_ins.end < _this.cur_ins.COLUMN){
								_this.cur_ins.COLUMN = _this.line_ins.end;
							}

							_this.cur_ins.COLUMN++;

							_this.cursor_column_reset(_this.line_ins.end);

						}
					}
					// 아래로
					else if("j" == keyChar){
						if(_this.cur_ins.ROW <= _this.TOTAL_ROW){
							_this.cur_ins.ROW++;

							// 커서의 실제라인
							var cursor_line = _this.numObj.row_to_line(_this.cur_ins.ROW);

							// 마지막 ROW의 실제라인
							var start_line = _this.numObj.row_to_line(_this.START_ROW);
							var last_line = start_line + _this.PANN_LINE -1;

							if(cursor_line > last_line){
								start_line = cursor_line - _this.PANN_LINE +1;
								_this.START_ROW = _this.numObj.line_to_row(start_line);
								var move_pann = _this.numObj.line_to_px(start_line);
								angular.element("#editor_pann")[0].scrollTop=move_pann;
							}

							// 라인분석
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));

							// 커서위치 재정렬
							_this.cursor_column_reset(_this.line_ins.end);
						}
					}
					// 위로
					else if("k" == keyChar){
						if(_this.cur_ins.ROW > 1){
							_this.cur_ins.ROW--;

							console.log(_this.START_ROW);
							console.log(_this.cur_ins.ROW);
							if( _this.START_ROW > _this.cur_ins.ROW){
								_this.START_ROW = _this.cur_ins.ROW;

								var move_pann = _this.numObj.row_to_px(_this.START_ROW);
								angular.element("#editor_pann")[0].scrollTop=move_pann;
							}

							// 라인분석
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
							// 커서위치 재정렬
							_this.cursor_column_reset(_this.line_ins.end);

						}
					}
					// 라인 끝으로 이동
					else if("$" == keyChar){
						_this.cur_ins.COLUMN = _this.line_ins.end;

						// 커서위치 재정렬
						_this.cursor_column_reset(_this.line_ins.end);

					}
					// 라인 처음으로 이동
					else if("^" == keyChar){
						_this.cur_ins.COLUMN = _this.line_ins.start+1;

						// 커서위치 재정렬
						_this.cursor_column_reset(_this.line_ins.end);

					}
					// 한단어 이동(w)
					else if("w" == keyChar){

						if(_this.line_ins.end < _this.cur_ins.COLUMN){
							_this.cur_ins.COLUMN = _this.line_ins.end;
						}

						var return_column = _this.cur_ins.move_w("w",_this.line_ins.line_string);
						if(return_column=='next_line'){

							if(_this.cur_ins.ROW >= _this.TOTAL_ROW){
								return false;
							}

							_this.cur_ins.ROW++;
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
							_this.cur_ins.COLUMN = _this.line_ins.start;
							_this.cur_ins.COLUMN = _this.cur_ins.move_w("w",_this.line_ins.line_string);
						}else{
							_this.cur_ins.COLUMN = return_column;
						}
						_this.cursor_column_reset(_this.line_ins.end);
					}
					// 한단어 이동(w)
					else if("e" == keyChar){

						if(_this.line_ins.end < _this.cur_ins.COLUMN){
							_this.cur_ins.COLUMN = _this.line_ins.end;
						}

						var return_column = _this.cur_ins.move_w("e",_this.line_ins.line_string);
						if(return_column=='next_line'){

							if(_this.cur_ins.ROW >= _this.TOTAL_ROW){
								return false;
							}

							_this.cur_ins.ROW++;
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
							_this.cur_ins.COLUMN = _this.line_ins.start;
							_this.cur_ins.COLUMN = _this.cur_ins.move_w("e",_this.line_ins.line_string);
						}else{
							_this.cur_ins.COLUMN = return_column;
						}
						_this.cursor_column_reset(_this.line_ins.end);
					}
					// 한단어 뒤로(b)
					else if("b" == keyChar){

						if(_this.line_ins.end < _this.cur_ins.COLUMN){
							_this.cur_ins.COLUMN = _this.line_ins.end;
						}
						var return_column = _this.cur_ins.move_b(_this.line_ins.line_string);
						if(return_column=='prev_line'){
							if(_this.cur_ins.ROW == 1){
								return false;
							}
							_this.cur_ins.ROW--;
							_this.line_ins.row_analisys(_this.$DIV.find("pre").eq(_this.cur_ins.ROW-1));
							_this.cur_ins.COLUMN = _this.line_ins.end;
							_this.cur_ins.COLUMN = _this.cur_ins.move_b(_this.line_ins.line_string);
						}else{
							_this.cur_ins.COLUMN = return_column;
						}
						_this.cursor_column_reset(_this.line_ins.end);
					}

					// 되돌리기
					else if("u" == keyChar){

					}
					//else if([58].indexOf(keyCode) > -1){
						//_this.mode_change("COMMAND");
					//}

					//_this.cur_ins.cursor_blink();

				}
			}
		}
		// 키코드 esc
		if(typeof this.key_esc != "function"){
			editor_pann.prototype.key_esc = function(keyCode){
				var _this = this;
				if(_this.MODE!="NORMAL" && keyCode==27){
					_this.mode_change("NORMAL");
				}
			}
		}
		// 키코드 잡기
		if(typeof this.keycode != "function"){
			editor_pann.prototype.keycode = function(ev){

				var _this = this;

				var keyCode = 0;
				if(ev.keyCode==0){
					keyCode = ev.which;
				}else{
					keyCode = ev.keyCode;
				}

				return keyCode;
			}
		}
	}


	// Class 정의 (라인 클레스)
	function editor_line(font_width){

		// 폰트 넓이
		this.font_width = font_width;
		// ROW 시작점
		this.start = 1;
		// ROW 종료점
		this.end = 1;
		// 한라인이 차지하는 줄 수 (라인이 엄청 길때)
		this.line_size = 0;
		// 라인의 넓이 픽셀
		this.line_width = 0;
		// list_string
		this.line_string = "";

		// line 분석 (라인의 시작픽셀 종료필셀 구함)
		if(typeof this.line_analisys != "function"){
			editor_line.prototype.line_analisys = function($ROW,start_line,line,PANN_EDITOR_WIDTH_COLUMN){
				var _this = this;

				_this.row_analisys($ROW);

				var line_cnt = Math.ceil(_this.end / PANN_EDITOR_WIDTH_COLUMN);
				//var line_cnt = line - start_line + 1;
				if(line_cnt==1){
					return {
						'start' : _this.start,
						'end' :_this.end 
					};
				}
				// 여러줄의 ROW일때
				else{
					var line_cnt = line - start_line + 1;
					var end = line_cnt * PANN_EDITOR_WIDTH_COLUMN;
					var start = end - PANN_EDITOR_WIDTH_COLUMN;

					var minus = (line_cnt - 2 ) * PANN_EDITOR_WIDTH_COLUMN;

					start = start - minus;
					end = end - minus;

					return {
						'start' : start,
						'end' :  end
					};
				}


				//console.log("_this.start");
				//console.log(_this.start);
				//console.log(_this.end);


			}
		}

		// ROW 분석
		if(typeof this.row_analisys != "function"){
			editor_line.prototype.row_analisys = function(line){
				var _this = this;

				var line_string = editorservice.rhtmlspecialchars(line.html());
				_this.line_string = line_string;

				var line_width = parseInt(line.css('width').replace(/[^0-9]/,""));
				var string_width = _this.line_string.length*_this.font_width;

				_this.line_size = 1;
				if(line_width < string_width){
					_this.line_size = Math.ceil(string_width / line_width);

				}
				_this.line_width = _this.line_size * _this.font_width;

				// start 구하기
				var start_match = line_string.match(/^[ ]+/);
				if(start_match){
					_this.start = start_match[0].length ;
				}else{
					_this.start = 0;
				}

				// end 구하기
				var end_match = line_string.match(/$/);
				if(end_match){
					_this.end = end_match['index'];
				}
			}
		}



	}
	// Class 정의 (커서클레스)
	function editor_cursor(font_width,font_height,$CURSOR_DIV){
		// 행
		this.ROW    = 1;
		// 열
		this.COLUMN = 1;
		// 폰트 넓이
		this.font_width = font_width;

		// 폰트 높이
		this.font_height = font_height;

		// 커서 돔 객체
		this.$CURSOR_DIV = $CURSOR_DIV;
		this.cursor_interval = null;

		if(typeof this.cursor_blink != "function"){
			editor_cursor.prototype.cursor_blink = function(){
				var _this = this;
				_this.$CURSOR_DIV.show();
				_this.cursor_interval = setInterval(function(){
					if(_this.$CURSOR_DIV.css('display')=='block'){
						_this.$CURSOR_DIV.hide();

					}else{
						_this.$CURSOR_DIV.show();
					}
				},350);
			}
		}
		if(typeof this.cursor_blink_stop != "function"){
			editor_cursor.prototype.cursor_blink_stop = function(show_hide){
				var _this = this;

				if('show'==show_hide){
					_this.$CURSOR_DIV.show();
				}else{
					_this.$CURSOR_DIV.hide();
				}
				clearInterval(_this.cursor_interval);
				_this.cursor_interval = null;
			}
		}

		// 일반모드에 커서위치 잡기
		if(typeof this.set_normal_cursor != "function"){
			editor_cursor.prototype.set_normal_cursor = function(line_string,lines){
				var _this = this;
				var org_length = line_string.length;
				//var new_length = lines.eq(_this.ROW-1).html().replace(/(&nbsp;|&amp;)/g," ").length;
				var new_length = editorservice.rhtmlspecialchars(lines.eq(_this.ROW-1).html()).length;
				var diff_len = new_length - org_length;
				_this.COLUMN = _this.COLUMN + diff_len;
			}
		}
		// 입력 모드에 커서위치 잡기
		if(typeof this.set_insert_cursor != "function"){
			editor_cursor.prototype.set_insert_cursor = function(line){
				var _this = this;

				//var orig_st = line.html().replace(/&nbsp;/g," ");
				console.log(line.html());
				var orig_st = editorservice.rhtmlspecialchars(line.html().replace(/&lt;/g,"<").replace(/&gt;/g,">"),true);
				console.log(orig_st);
				var pre_string  = orig_st.substr(0,_this.COLUMN-1);
				var next_string = orig_st.substring(_this.COLUMN-1,orig_st.length);

				var return_text = pre_string+"<caret>caret</caret>"+next_string;
				return_text = editorservice.htmlspecialchars(return_text,true);

				line.html(return_text);
				var cc = line.find("caret")[0];
				var range = document.createRange();
				range.selectNode(cc);
				var selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				range.deleteContents();
			}
		}

		// 단어이동 forward
		if(typeof this.move_w != "function"){
			editor_cursor.prototype.move_w = function(move_type,line_string){

				var _this = this;

				var start_pos = _this.COLUMN;

				var line_s_cut = line_string.substr(start_pos);
				var w_anal = null;

				if("w" == move_type){
					if(line_string.substring(start_pos-1,start_pos).match(/[^\w ]/)){
						var w_anal = line_s_cut.match(/((^|[ ]|[^\w])[\w]|[^\w ])/);
					}else{
						var w_anal = line_s_cut.match(/(([ ]|[^\w])[\w]|[^\w ])/);
					}
				}
				else if("e" == move_type){
					var w_anal = line_s_cut.match(/([^\w ]|[\w]([ ]|[^\w]|$))/);
				}
				if(w_anal==null){
					return 'next_line';
				}

				var cursor = start_pos;
				if(w_anal){
					cursor = w_anal['index']+start_pos;
					if(w_anal[0].substr(0,1)==" "){
						cursor = cursor+1;
					}
					cursor =  cursor+1;
				}
				return cursor;
			}
		}
		// 단어이동 back
		if(typeof this.move_b != "function"){
			editor_cursor.prototype.move_b = function(line_string){
				var _this = this;
				var start_pos = _this.COLUMN;

				var line_s_cut = line_string.substr(0,start_pos-1);
				line_s_cut = line_s_cut.split("").reverse().join("");

				var w_anal = line_s_cut.match(/([^\w ]|[\w]([ ]|[^\w]|$))/);
				var cursor = start_pos;
				if(w_anal){
					cursor = start_pos - w_anal['index']-1;
				}else{
					return 'prev_line';
				}
				return cursor;
			}
		}

	}
	// 넘버라인 판 클래스
	function number_line(font_height){

		// EDITOR 판
		this.$NUM_DIV = angular.element(document.getElementById('editor_num_area'));
		this.font_height = font_height;

		// 해당 라인의 ROW 구하기
		if(typeof this.line_to_row != "function"){
			number_line.prototype.line_to_row = function(line){
				var _this = this;
				for(var i = line ; i >= 1 ; i--){
					if(_this.$NUM_DIV.find("[data-accrue='"+i+"']").length > 0){
						return _this.$NUM_DIV.find("[data-accrue='"+i+"']").data('num');
					}
				}
			}
		}

		// 해당 Row의 라인 구하기
		if(typeof this.row_to_line != "function"){
			number_line.prototype.row_to_line = function(row){
				var _this = this;
				return parseInt(_this.$NUM_DIV.find("[data-num='"+row+"']").data('accrue'));
			}
		}

		// 해당 Row의 모든 line반환
		if(typeof this.row_to_lineall != "function"){
			number_line.prototype.row_to_lineall = function(row){
				var _this = this;
				var start_line = _this.row_to_line(row);
				var height_px = parseInt(_this.$NUM_DIV.find("[data-num='"+row+"']").css('height').replace(/[^0-9]/g,""));
				var cnt_line =  height_px / _this.font_height;

				var line_array = [];
				for(var i=0 ; i < cnt_line ; i++){
					line_array.push(start_line+i);
				}
				return line_array;
			}
		}


		// ROW 의 px 반환
		if(typeof this.row_to_px != "function"){
			number_line.prototype.row_to_px = function(ROW){
				var _this = this;
				return parseInt(_this.$NUM_DIV.find("[data-num='"+ROW+"']").data('accrue_px'));
			}
		}

		// line 의 px 반환
		if(typeof this.line_to_px != "function"){
			number_line.prototype.line_to_px = function(line){
				var _this = this;
				return (line-1) * _this.font_height;
			}
		}

		// 현재 커서의 라인을 반환
		if(typeof this.cursor_to_line != "function"){
			number_line.prototype.cursor_to_line = function(row,column,PANN_EDITOR_WIDTH_COLUMN){
				var _this = this;

				var line = _this.row_to_line(row);
				var line_cnt = Math.ceil(column / PANN_EDITOR_WIDTH_COLUMN);
				return line+(line_cnt-1);
			}
		}

	}

	// 비쥬얼 블럭 클래스
	function editor_visual(visual_type, font_width, font_height, s_row, s_column, $PANN_DIV, PANN_EDITOR_WIDTH_COLUMN){
		// 비쥬얼 모드의 세가지 타입(shift, ctrl, none)
		this.visual_type = visual_type;

		// 처음상태 기억
		this.ROW = s_row;
		this.COLUMN = s_column;
		//$BLOCK.css('display','block');
		//this.BLOCK = $BLOCK;
		this.font_width  = font_width;
		this.font_height = font_height;

		this.$PANN_DIV = $PANN_DIV;
		this.PANN_EDITOR_WIDTH_COLUMN = PANN_EDITOR_WIDTH_COLUMN;


		if(typeof this.render != "function"){
			editor_visual.prototype.render = function(l_row,l_column){
				var _this = this;

				var numObj = new number_line(_this.font_height);

				var start_line = numObj.cursor_to_line(_this.ROW,_this.COLUMN,_this.PANN_EDITOR_WIDTH_COLUMN);
				var end_line   = numObj.cursor_to_line(l_row,l_column,_this.PANN_EDITOR_WIDTH_COLUMN);
				console.log(start_line);
				console.log(end_line);
				// 해당하는 라인 추출
				var reverse_row = false;
				if(start_line > end_line){
					var tmp_line = start_line;
					start_line = end_line;
					end_line = tmp_line;
					reverse_row = true;
				}

				var line_array = [];
				for (var i = start_line; i <= end_line; i++) {
					line_array.push(i);
				}
				console.log(line_array);



				// 해당하는 라인만큼 div를 만듬

				var line_ins = new editor_line(_this.font_width);

				_this.$PANN_DIV.find(".editor_visual").remove();
				for(line_key in line_array){
					var line = line_array[line_key];

					if(_this.$PANN_DIV.find("[data-line='"+line+"']").length ==0){
						_this.$PANN_DIV.prepend('<div style="position:relative;"><div class="editor_visual" data-line="'+line+'">&nbsp;</div></div>');
					}
					var $line = _this.$PANN_DIV.find("[data-line='"+line+"']");
					var top =  ((line-1)*_this.font_height);
					$line.css('top',top+"px").css('width','10px').css('display','block');

					var current_line = numObj.cursor_to_line(l_row,l_column,_this.PANN_EDITOR_WIDTH_COLUMN);
					if(start_line == line && end_line == line ){
						var width_row = l_column - _this.COLUMN;

						if(width_row > 0){
							var left  = (_this.COLUMN-1) * _this.font_width;
						}else{
							var left  = (l_column-1) * _this.font_width;
							width_row = (width_row * -1)-1;
						}
						var width = (width_row+1) * _this.font_width;
						$line.css('width',width+"px");
						$line.css('left',left+"px");
					}
					else if( end_line > line){
						

						var $ROW = _this.$PANN_DIV.find("pre").eq(numObj.line_to_row(line)-1);
						var left_width_obj = line_ins.line_analisys($ROW,numObj.line_to_row(line),line,_this.PANN_EDITOR_WIDTH_COLUMN);

						console.log("left_width_obj");
						console.log(left_width_obj);


						if(start_line == line){
							var left  = (_this.COLUMN-1) * _this.font_width;
							var width = (left_width_obj.end - _this.COLUMN + 1) * _this.font_width;
						}else{

							var left = 0;
							var width = left_width_obj.end * _this.font_width;
						}


						$line.css('width',width+"px");
						$line.css('left', left+"px");


					}
					/*
					else if(start_line == line){
						var left  = (_this.COLUMN-1) * _this.font_width;
					}
					*/

					else if(start_line < line && end_line == line){
						var left = 0;
						var width = (l_column) * _this.font_width;
						$line.css('width',width+"px");
						$line.css('left',left+"px");
					}
				}


			}
		}
	}

	// 인스턴스 생성
	var editorPann = new editor_pann();
	editorPann.file_load();

	// 리사이즈 바인딩
	angular.element(window).resize(function(){
		editorPann.pann_resize();
	});

	// 키 에벤트 바인딩
	$scope.key_esc = function(event){
		editorPann.key_esc();
	}
	$scope.key_down = function(event){
		editorPann.event_memory = event;

		var keyCode = editorPann.keycode(event);

		var keyChar = String.fromCharCode(keyCode);
		if(keyChar.match(/[0-9]/) && event.shiftKey){
			keyChar = editorPann.key_shift_rule[keyChar];
		}
		if(keyChar.match(/[A-Z]/) && !event.shiftKey){
			keyChar = editorPann.key_shift_rule[keyChar];
		}

		editorPann.key_fun(keyCode,keyChar,event.ctrlKey);

		// 브라우저 기본 이벤트 무시
		if(editorPann.MODE=="INSERT" && keyCode==9){
			event.preventDefault();
		}
		if(event.ctrlKey){
			event.preventDefault();
		}
	}
	$scope.editor_blur = function(event){
		if(editorPann.MODE == "NORMAL"){
			setTimeout(function() {
				angular.element(".editor_cursor").css('color','red').html("FOCUS_OUT");
			}, 0);
		}
	}
	$scope.key_blur = function(event){
		if(editorPann.MODE == "INSERT"){
			setTimeout(function() {
				editorPann.mode_change("NORMAL");
			}, 0);
		}
	}
	$scope.key_target = function(event){
		setTimeout(function() {
			$("#editor_target").focus();
			angular.element(".editor_cursor").html("&nbsp;");
		}, 0);
	}
	document.getElementById("editor_target").focus();

});
