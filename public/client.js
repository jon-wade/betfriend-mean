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

client.controller('homeCtrl', ['$http', '$scope', '$rootScope', '$interval', '$location', function($http, $scope, $rootScope, $interval, $location){
    //controller function here
    //switch off navigation
    $rootScope.bckHide = true;
    $rootScope.fwdHide = true;

    //methods for clicking through to the next page
    $scope.getPredictionPage = function(){
        $location.path('/prediction');
    };

    console.log('stylesheets: ', document.styleSheets);



    //get data required for the home page from the server
    $http({
        'url': '/raceData',
        'method': 'GET'
    }).then(function(success){
        //on success
        console.log(success);

        if (success.data.status) {
            $scope.errorStatus = false;
            $scope.raceName = success.data.raceName;
            $rootScope.round = success.data.round;
            $scope.circuitName = success.data.circuitName;

            var link = document.createElement("link");
            link.href = "css/round-" + $rootScope.round + ".css";
            link.id = "current-gp";
            link.type = "text/css";
            link.rel = "stylesheet";

            document.getElementsByTagName( "head" )[0].appendChild(link);

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
        }
        else {
            $scope.errorStatus = true;
            $scope.errorMessage = success.data.content;
        }


    }, function(error){
        //on error
        console.log('There has been an error fetching data from the db:', error);
    });
}]);

client.controller('predictionCtrl', ['$http', '$scope', '$rootScope', '$location', '$window', function($http, $scope, $rootScope, $location, $window){

    //switch on the back button
    $rootScope.bckHide = false;
    $rootScope.fwdHide = true;

    $rootScope.previous = function(){
        $window.history.back();
    };

    $scope.dc = 50;
    $scope.st = 50;

    console.log('stylesheets: ', document.styleSheets);


    $http({
        'url': '/driverData',
        'method': 'GET'
    }).then(function(success){

        //driverData received
        $scope.driverData = success.data;
        console.log('driverData', $scope.driverData);


        $http({
            'url': '/manufacturerData',
            'method': 'GET'
        }).then(function(success){
            console.log('manufacturerData', success);
            $scope.manufacturerData = success.data;

            var populateScores = function() {

                $scope.total = 0;

                $scope.driverData.forEach(function(driver){
                    var driverId = driver.driverId;
                    //console.log('driverId:', driverId);
                    var driverManufacturer = driver.manufacturerId;
                    //console.log('driverManufacturer:', driverManufacturer);
                    var index = 0;
                    for (var i=0; i<$scope.manufacturerData.length; i++){
                        if(driverManufacturer === $scope.manufacturerData[i].manufacturerId){
                            index = i;
                            //console.log('index:', index);
                        }
                    }

                    var driverSeasonPoints = driver.seasonPoints;
                    //console.log('driverSeasonPoints:', driverSeasonPoints);
                    var manufacturerSeasonPoints = $scope.manufacturerData[index].seasonPoints;

                    var driverCircuitHistoryScore = driver.circuitHistoryScore;
                    var manufacturerCircuitHistoryScore = $scope.manufacturerData[index].circuitHistoryScore;


                    //console.log('manufacturerSeasonPoints:', manufacturerSeasonPoints);
                    //
                    //console.log('$rootScope.round - 1:', $rootScope.round-1);
                    //console.log('$scope.dc:', $scope.dc);

                    var combinedSeasonScore = (100 - $scope.dc) * ((driverSeasonPoints) / ($rootScope.round -1));
                    combinedSeasonScore += $scope.dc * (manufacturerSeasonPoints / (2 * ($rootScope.round -1)));
                    combinedSeasonScore /= 100;

                    var combinedCircuitScore = (100 - $scope.dc) * (driverCircuitHistoryScore);
                    combinedCircuitScore += $scope.dc * (manufacturerCircuitHistoryScore/2);
                    combinedCircuitScore /= 100;

                    var totalScore = (100 - $scope.st) * combinedSeasonScore;
                    totalScore += $scope.st * combinedCircuitScore;
                    totalScore /=100;


                    //console.log('combinedSeasonScore:', combinedSeasonScore);
                    driver.combinedSeasonScore = combinedSeasonScore;
                    driver.combinedCircuitScore = combinedCircuitScore;
                    driver.totalScore = totalScore;

                    $scope.total += totalScore;


                });
            };

            populateScores();

            $scope.$watch('dc', function(newValue, oldValue){
                if (oldValue>newValue){
                    populateScores();
                }
                else if(oldValue<newValue){
                    populateScores();
                }
            });
            $scope.$watch('st', function(newValue, oldValue){
                if (oldValue>newValue){
                    populateScores();
                }
                else if(oldValue<newValue){
                    populateScores();
                }
            });


        }, function(error){

        });

    }, function(error){
        console.log(error);
    });


}]);


