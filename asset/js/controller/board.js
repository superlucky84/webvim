



// 컨트롤러 간 공유
superlucky.service('boardservice',function(){

	this.dialog_instance = null;
	this.main_scope = null;
	this.main_scope_setting = function($scope){
		this.main_scope = $scope;
	}

})
// 다이얼로그 컨트롤러
.controller('boardDialogController', function ($scope,$http,$modal,boardservice) {

	$scope.categoryJ = 1;

	// STOP 클릭
	$scope.close = function(){
		boardservice.dialog_instance.dismiss('cancel');
	};

	// WRITE 클릭
	$scope.write = function(){

		boardservice.main_scope.write({
			'user_id'  : superlucky.user_id,
			'category' : $scope.categoryJ,
			'subject'  : $scope.subject,
			'contents' : $scope.contents
		});

		boardservice.dialog_instance.dismiss('cancel');
	};

	$scope.contents  = "";

	// EDITOR 옵션
	$scope.options = {
		  height: 200,
		  lang :'ko-KR',
		  disableResizeEditor: true,

          toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            //['fontname', ['fontname']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'hr']],
            ['view', ['fullscreen', 'codeview']],
            ['help', ['help']]
          ]
	};


})
// 게시판 앱 컨트롤러
.controller('boardController', function ($scope,$http,$modal,$routeParams,boardservice) {

	// category nabi
	var $navbar = angular.element(document.getElementById('navbar'));
	$navbar.find("li").removeClass('active');
	angular.element(document.getElementById('board')).addClass('active');

	angular.element(".mainpage").removeClass("fl");

	
	var board = {
		page : 1,
		paging_range : 0,
		// 글 목록보기
		list : function(page){
			if(page){
				board.page = page;
			}

			$scope.list_hide = true;

			$http({ url: '/board/lists?user_id='+$routeParams.user_id+'&page='+board.page, method: "GET", async:false }).
			success(function(data){
				if(data.result=='true'){

					// list print
					$scope.lists = data.data;
					$scope.contents = data.contents;
					$scope.list_hide = false;
					$scope.none_hide = true;


					// paging print
					var paging = data.paging;
					if(data.data){
						var paging_obj = [];
						for(var i = paging.start ; i <= paging.end ; i++){
							var class_n = "";
							if(i == board.page){
								var class_n = "active";
							}
							paging_obj.push({
								i       : i,
								class_n : class_n
							});
						}
						$scope.pagings = paging_obj;

						// prev disabled
						$scope.paging_prev = "";
						if(paging.start == 1){
							$scope.paging_prev = "disabled";
						}
						// next disabled
						$scope.paging_next = "";
						if(paging.end >= paging.total){
							$scope.paging_next = "disabled";
						}

						board.paging_range = paging.paging_range;
						board.paging_total = paging.total;

					}
					else{
						$scope.none_hide = false;
					}

				}
			}).
			error(function(data){
				alert('SERVER ERROR');
			});
		},
		// 글쓰기
		write : function(send_data){
			$http({
				url: '/board/write',
				method: "POST",
				data: send_data
			}).
			success(function(data){
				board.list(1);
			}).
			error(function(data){
				alert('SERVER_ERROR.');
			});
		}
	};


	$scope.list = function(e){
		var page = $(e.target).data('page');
		if(page=='pprev'){
			page = board.page - board.paging_range;
			if(page < 1){
				page = 1;
			}
		}
		if(page=='nnext'){
			page = board.page + board.paging_range;
			if(page > board.paging_total){
				page = board.paging_total;
			}
		}
		board.list(page);
	}

	$scope.view = function(e){

		var target = angular.element(e.target);
		var board_seq = target.data("no");
		var $TR = target.parent();
		var toggle_chk = $TR.next(".active").length;

		$TR.parent().children(".active").remove();

		if(toggle_chk==0){
			$TR.after("<tr ng-hide='list_hide' class='active ng-ani-enter' style='height:200px'><td colspan='4'>"+$scope.contents[board_seq]+"</td><tr>");
		}
	}

	$scope.write = function(data){
		board.write(data);
	}
	$scope.write_dialog = function(){
		dialog('lg');
	}

	boardservice.main_scope_setting($scope);

	board.list();

	// dialog
	dialog = function(size){
		boardservice.dialog_instance = $modal.open({
			templateUrl: 'dialog_comm',
			controller: 'boardDialogController',
			size: size,
			backdrop : false,
			resolve: {
			}
		});
	}


});
