var client = angular.module('client', []);

client.config(function(){
    .when('/', {
        templateUrl: './home/home.html',
        controller: 'homeCtrl'
    })
});

