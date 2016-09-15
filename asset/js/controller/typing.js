

// 컨트롤러 간 공유
superlucky.service('typingservice',function(){

	this.dialog_instance = null;
	this.main_scope = null;
	this.main_scope_setting = function($scope){
		this.main_scope = $scope;
	}

})
// 다이얼로그 컨트롤러
.controller('dialogController', function ($scope,$http,$modal,typingservice) {

	// STOP 클릭
	$scope.close = function(){
		typingservice.dialog_instance.dismiss('cancel');
	};

	// NEXT 클릭
	$scope.next = function(){
		typingservice.main_scope.next();
		typingservice.dialog_instance.dismiss('cancel');
	};

	// PLAY 클릭
	$scope.play = function(){
		typingservice.main_scope.play();
		typingservice.dialog_instance.dismiss('cancel');
	};

	// 타이핑 소요시간
	$scope.record_time  = (Math.round(typingservice.main_scope.record_time/60*100))/100;
	// 타이핑 유효 수
	$scope.active_count = typingservice.main_scope.active_count;
	// CPM (분당 타이핑수)
	$scope.cpm = Math.round((60 * $scope.active_count) / $scope.record_time);

})
// 타이핑 앱 컨트롤러
.controller('typingController', function ($scope,$http,$modal,typingservice) {

	var $navbar = angular.element(document.getElementById('navbar'));
	$navbar.find("li").removeClass('active');
	angular.element(document.getElementById('typingio')).addClass('active');

	angular.element(".mainpage").removeClass("fl");

	// dialog
	dialog = function(size){
		typingservice.dialog_instance = $modal.open({
			templateUrl: 'dialog_comm',
			controller: 'dialogController',
			size: size,
			backdrop : false,
			resolve: {
			}
		});
	}


	var typing = {
		$DIV : angular.element(document.getElementById('typing_area')),
		$TIME : angular.element(document.getElementById('timecnt')),
		page : 1,
		range_page :10,
		record_time : 0,
		record_play_stat : false,
		record_interval : null,
		play_interval : null,
		record_history : {},
		show_cnt : -1,  // process typing cnt
		word_total : 0, // total word cnt
		show_code : [13,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,186,187,188,189,190,191,192,219,220,221,222],

		record_history : {},
		record_init : function(){
			typing.record_interval = setInterval(function(){
				typing.record_time++;
				typing.$TIME.html(typing.record_time);
			},16);

		},
		record_history_write : function(htime,keycode){
		    if(this.record_play_stat==false){
				if(!typing.record_history[htime]){
					typing.record_history[htime] = new Array();
				}
				typing.record_history[htime].push(keycode);
				//console.log(typing.record_history);
			}
	    },
		keycode : function(ev){
			var keyCode = 0;
			if(ev.keyCode==0){
				keyCode = ev.which;
			}else{
				keyCode = ev.keyCode;
			}
			return keyCode;
		},
		init : function(){


			$http({ url: '/typing/prototype?page='+typing.page+'&page_range='+typing.range_page, method: "GET", async:false }).
			success(function(data){

				if(data.result == 'true'){
					var data_string = data.data;


					data_string = data_string.replace(/\t/g,"    ");
					data_string = data_string.replace(/\n\r/g,"\n");
					data_string = data_string.replace(/\r/g,"\n");
					data_string = data_string.replace(/[ㄱ-ㅎ가-힣]/g,"");

					var words_array = data_string.split('');

					clearInterval(typing.record_interval);
					clearInterval(typing.play_interval);

					typing.word_total = 0;
					typing.record_time = 0;
					typing.show_cnt = -1;
					typing.show_init_cnt = -1;
					typing.record_play_stat = false;
					typing.record_time = 0;
					typing.record_history = {};
					typing.$TIME.html('0');


					typing.$DIV.html('');
					typing.$DIV.hide();


					$scope.complate = false;
					$scope.keycode = 0;

					var space_jump = true;
					for(word in words_array){

						var words_text = words_array[word];

						if(words_text == " "){
							if(space_jump){
								typing.show_cnt++;
							}
							words_text = "&nbsp;";
						}else if(space_jump){
							typing.show_init_cnt = typing.show_cnt;
							space_jump = false;
						}

						if(words_text == "\n"){
							words_text = "↵";
						}

						var class_t = "init";
						if(typing.word_total==0){
							class_t += " cursor";
						}

						var $SPAN = angular.element("<span class='"+class_t+"'>"+words_text+"</span>");
						typing.$DIV.append($SPAN);
						//$SPAN.addClass('ng-ani-enter');

						if(words_text == "↵"){
							typing.$DIV.append("<br>");
						}

						typing.word_total++;

					}

					typing.$DIV.show('slow');
					typing.$DIV.find('span').eq(0).removeClass("cursor");
					typing.$DIV.find('span').eq(typing.show_cnt+1).addClass("cursor");

				}
				else{
					alert('fail');
				}

			}).
			error(function(data){
				alert('SERVER ERROR');
			});

	    },
		key_remove : function(keyCode){
			if(keyCode == 8 && typing.show_cnt > -1){
				typing.record_history_write(typing.record_time,keyCode);

				$SPAN = typing.$DIV.find('span');
				$SPAN.eq(typing.show_cnt).attr('class','init');

				var remove_cursor_cnt = typing.show_cnt +1;
				$SPAN.eq(typing.show_cnt).addClass("cursor");
				$SPAN.eq(remove_cursor_cnt).removeClass("cursor");

				typing.show_cnt--;
			}
		},
		key_fun : function(keyCode){
			if(typing.show_code.indexOf(keyCode) > -1){

				if(typing.record_play_stat==false){
					if(typing.show_cnt == typing.show_init_cnt){
						this.record_init();
					}
					typing.record_history_write(this.record_time,keyCode);
				}

				$scope.keycode = keyCode;
				$SPAN = typing.$DIV.find('span').eq(++typing.show_cnt);

				var cursor_cnt = typing.show_cnt + 1;
				var change_code = $SPAN.text().charCodeAt(0);

				// Spacebar
				if(change_code==160){
					change_code = 32;
				}
				// Enter
				if(change_code==8629){
					change_code = 13;
				}

				if(change_code==keyCode){
					$SPAN.attr('class','green');
				}
				else{
					$SPAN.attr('class','red');
				}

				if(change_code==13){
					for(var i=typing.show_cnt+1; i<=typing.word_total ; i++){
						var next_code = typing.$DIV.find('span').eq(i).text().charCodeAt(0);
						if(next_code!=160){
							typing.show_cnt = i-1;
							typing.$DIV.find('span').eq(cursor_cnt).removeClass("cursor");
							typing.$DIV.find('span').eq(i).addClass("cursor");
							break;
						}
					}
				}else{
					typing.$DIV.find('span').eq(cursor_cnt).addClass("cursor");
				}

				//console.log((typing.show_cnt+1)+" / "+typing.word_total);
				if(typing.show_cnt+1 == typing.word_total ){
					if(typing.record_play_stat==false){
						clearInterval(typing.record_interval);
					}else{
						clearInterval(typing.play_interval);
					}
					dialog("sm");
					$scope.record_time  = typing.record_time;
					$scope.active_count = typing.word_total;
					$scope.complate = true;
					$scope.replay_btn = false;

				}

			}
			$scope.keytarget = "";
	    }
	}

	$scope.focus_cursor = function(){
		document.getElementById("ng_target").focus();
	};

	$scope.key_blur = function(){
		document.getElementById("ng_target").focus();
	}
	document.getElementById("ng_target").focus();

	$scope.key_down = function(event){
		if(typing.record_play_stat==false){
			var keyCode = typing.keycode(event);
			typing.key_remove(keyCode);
		}
	};

	$scope.key_press = function(event){
		if(typing.record_play_stat==false){
			var keyCode = typing.keycode(event);
			typing.key_fun(keyCode);
		}
	}

	$scope.play = function(event){

		//typing.show_cnt = -1;
		typing.show_cnt = typing.show_init_cnt;

		typing.record_play_stat = true;
		$scope.replay_btn = true;

		$SPAN = typing.$DIV.find('span');
		$SPAN.removeClass('red');
		$SPAN.removeClass('green');
		$SPAN.removeClass('init');
		$SPAN.addClass('init');

		var time_cnt = 0;

		typing.play_interval = setInterval(function(){
			if(typing.record_history[time_cnt]){
				var keyCodeTimeLine = typing.record_history[time_cnt];

				for (arKey in keyCodeTimeLine){
					var keyCode = keyCodeTimeLine[arKey];
					//console.log(keyCode);
					if(keyCode==8){
						typing.key_remove(keyCode);
					}else{
						//console.log('key_fun');
						typing.key_fun(keyCode);
					}
				}

			}
			time_cnt++;
		},16);

		//typing.record_play_stat = false;

	}

	$scope.next = function(){
		$scope.focus_cursor();
		typing.page++;
		typing.init();
	};
	$scope.restart = function(){
		$scope.focus_cursor();
		typing.init();
	};


	// 서비스에 스코프 전달
	typingservice.main_scope_setting($scope);

	// 타이핑 앱 1페이지로 실행
	typing.init(1);

});
