
login.dialog_instance = null;

// enter Event
login.directive('ngEnter', function () {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13) {
				scope.$apply(function (){
					scope.$eval(attrs.ngEnter);
				});
				event.preventDefault();
			}
		});
	};
});


login.service('loginservice',function(){
	this.main_scope = null;
	this.main_scope_setting = function($scope){
		this.main_scope = $scope;
	}
});
login.controller('loginController', function ($scope,$http,$modal,loginservice) {

	$scope.open = function (size) {
		login.dialog_instance = $modal.open({
			templateUrl: 'myModalContent.html',
			controller: 'dialogController',
			size: size,
			resolve: {
			}
		});
	};

	$scope.signup = function () {
		login.dialog_instance = $modal.open({
			templateUrl: 'signin.html',
			controller: 'dialogController',
			size: 'sm',
			backdrop : false,
			resolve: {}
		});
	};


	// Login Event
	$scope.login_button = function(){
		$http({
			url: '/user/login',
			method: "POST",
			data: {
				id   : $scope.id,
				pass : $scope.pass
			}
		}).
		success(function(data){
			if(data.result == 'true'){
				location.replace('/');
			}
			else{
				$scope.dialog_msg = "fail login";
				$scope.open('sm');
			}
		}).
		error(function(data){
			alert('SERVER_ERROR.');
		});
	}

	// 서비스에 스코프 전달
	loginservice.main_scope_setting($scope);

});


login.controller('dialogController', function ($scope,$http,loginservice) {
	$scope.alert_msg = loginservice.main_scope.dialog_msg;

	$scope.ok = function(){
		login.dialog_instance.dismiss('cancel');
	};

	$scope.regist = function(){
		$http({
			url: '/user/signup',
			method: "POST",
			data: {
				id   : $scope.id,
				pass : $scope.pass
			}
		}).
		success(function(data){
			if(data.result == 'true'){
				loginservice.main_scope.id = $scope.id;
				loginservice.main_scope.pass = $scope.pass;
				login.dialog_instance.dismiss('cancel');

				loginservice.main_scope.dialog_msg = 'success';
				loginservice.main_scope.open('sm');

			}
			else{
				login.dialog_instance.dismiss('cancel');
				loginservice.main_scope.dialog_msg = data.msg;
				loginservice.main_scope.open('sm');
			}


		}).
		error(function(data){
			alert('서버오류 입니다.');
		});
	}


});
