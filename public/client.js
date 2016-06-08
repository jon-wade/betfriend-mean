var client = angular.module('client', ['ngRoute']);

client.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        templateUrl: './home/home.html',
        controller: 'homeCtrl'
    });

    $locationProvider.html5Mode(true);
});

client.controller('homeCtrl', ['$http', function($http){
    //controller function here
    $http({
        'url': '/homeData',
        'method': 'GET'
    }).then(function(success){
        //on success
        console.log(success);




    }, function(error){
        //on error
        console.log(error);
    });
}]);


