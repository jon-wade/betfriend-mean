var client = angular.module('client', ['ngRoute']);

client.config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: './home/home.html',
        controller: 'homeCtrl'
    });
});

client.controller('homeCtrl', [function(){
    //controller function here

}]);


