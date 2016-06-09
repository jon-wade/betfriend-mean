var client = angular.module('client', ['ngRoute']);

client.config(function($routeProvider, $locationProvider) {
    $routeProvider
        .when('/',
            {
                templateUrl: './home/home.html',
                controller: 'homeCtrl'
            })
        .when('/prediction',
            {
                templateUrl: '/prediction/prediction.html',
                controller: 'predictionCtrl'
            })
        .otherwise('/');

    $locationProvider.html5Mode(true);
});

client.controller('homeCtrl', ['$http', '$scope', '$interval', '$location', function($http, $scope, $interval, $location){
    //controller function here

    //methods for clicking through to the next page
    $scope.getPredictionPage = function(){
        $location.path('/prediction');
    };

    //get data required for the home page from the server
    $http({
        'url': '/raceData',
        'method': 'GET'
    }).then(function(success){
        //on success
        console.log(success);
        $scope.raceName = success.data.raceName;
        $scope.round = success.data.round;
        $scope.circuitName = success.data.circuitName;

        var dateNow = new Date();
        var raceDate = new Date(success.data.raceDate);
        var diff = raceDate - dateNow;

        //homepage countdown timer
        var timer = function(){
            var d = diff / (1000*60*60*24);
            var h = (diff % (1000*60*60*24)) / (1000*60*60);
            var m = ((diff % (1000*60*60*24)) % (1000*60*60)) / (1000*60);
            var s = (((diff % (1000*60*60*24)) % (1000*60*60)) % (1000*60)) / 1000;

            $scope.days = Math.floor(d);
            $scope.hours = Math.floor(h);
            $scope.minutes = Math.floor(m);
            $scope.seconds = Math.floor(s);
        };

        timer();
        $interval(function() {diff -= 1000; timer();}, 1000);


    }, function(error){
        //on error
        console.log('There has been an error fetching data from the db:', error);
    });
}]);

client.controller('predictionCtrl', ['$http', '$scope', '$location', function($http, $scope, $location){

    $scope.dc = 50;
    $scope.st = 50;

    $http({
        'url': '/driverData',
        'method': 'GET'
    }).then(function(success){
        console.log('driverData', success);
        //driverData received
        $scope.driverData = success;
    }, function(error){
        console.log(error);
    });

    $http({
        'url': '/manufacturerData',
        'method': 'GET'
    }).then(function(success){
        console.log('manufacturerData', success);
    }, function(error){});

}]);


