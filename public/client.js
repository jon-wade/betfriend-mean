var client = angular.module('client', ['ngRoute']);

client.config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        templateUrl: './home/home.html',
        controller: 'homeCtrl'
    });

    $locationProvider.html5Mode(true);
});

client.controller('homeCtrl', [function(){
    //controller function here

}]);


