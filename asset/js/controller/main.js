






superlucky.controller('mainController', function ($scope,$http,$routeParams) {
	$scope.move_category = function(category){
		if(superlucky.main_category!=category){
			superlucky.main_category = category;
			location.href = "#"+$routeParams.user_id+"/"+category;
		}
	}
});
