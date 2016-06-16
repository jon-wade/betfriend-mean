var ergast = require('./../ergast/callApi.js');
var db = require('./database.js');
var mongooseConfig = require('./mongoose-config.js');
var utility = require('./utility.js');
var scraper = require('./../betfair/scraper.js');


//functions that help to clean up data before sending to the database
var deDupe = function(res) {
    return new Promise(function(resolve, reject){
        var counter = 0;
        var newArray = [];
        res.forEach(function(item) {
            if (counter === 0) {
                newArray.push(item.manufacturerId);
                counter ++;
            }
            else {
                var duplicate = false;
                newArray.forEach(function(check) {
                    if (item.manufacturerId === check){
                        //is already stored in the array
                        duplicate = true;
                    }
                });
            }
            if (duplicate === false) {
                newArray.push(item.manufacturerId);
                counter ++;
            }
        });
        resolve(newArray);
    });
};
var cleanData = function(data){
    var clean = function(item) {
        switch (item.familyName) {
            case 'Pérez':
                item.familyName = 'Perez';
                break;
            case 'Räikkönen':
                item.familyName = "Raikkonen";
                break;
            case 'Hülkenberg':
                item.familyName = "Hulkenberg";
                break;
            case 'Gutiérrez':
                item.familyName = "Gutierrez";
        }
    };
    data.forEach(clean);
    return data;
};

//utility functions
var pointsLookup = function(position){
    if (position > 10) {
        return 0;
    }
    else {
        var table =
        {
            '1': 25,
            '2': 18,
            '3': 15,
            '4': 12,
            '5': 10,
            '6': 8,
            '7': 6,
            '8': 4,
            '9': 2,
            '10': 1
        };
        return table[position];
    }
};

//functions that collect and save data from the API
var getDriverData = function() {
    return new Promise(function (resolve, reject) {
        //TODO: race number hardcoded into the driver list call
        //console.log('Fetching driver detail data from the API...');
        ergast.getData('http://ergast.com/api/f1/2016/7/drivers.json')
            .then(function (res, rej) {
                var complete = 0;
                if (rej) {
                    console.log('getDriverData cannot populate database due to error in callApi.js: ', rej);
                }
                else {
                    var data = res.body.MRData.DriverTable.Drivers;
                    //console.log('Cleaning and saving data...');
                    cleanData(data);
                    for (var i=0; i<data.length; i++){
                        saveApiData(data[i]).then(function(res){
                            if(res){
                                complete++;
                                if(complete === 22){
                                    resolve();
                                }
                            }
                        });
                    }
                }
    });
})};
var getRaceCalendar = function() {
    return new Promise(function(resolve, reject){
        //console.log('Fetching race calendar from API...');
        ergast.getData('http://ergast.com/api/f1/2016.json').then(function(res, rej){
            if (rej){
                console.log('getRaceCalendar cannot populate database due to error in callApi.js: ', rej);
                reject();
            }
            else {
                var data = res.body.MRData.RaceTable.Races;
                var counter = 0;
                //console.log('Race calendar:', data);
                data.forEach(function(item){
                    db.controller.create({
                        'round': item.round,
                        'raceName': item.raceName,
                        'circuitId': item.Circuit.circuitId,
                        'circuitName': item.Circuit.circuitName,
                        'raceDate': item.date + 'T' + item.time
                    }, mongooseConfig.Race).then(function(){
                        counter++;
                        console.log('counter', counter);
                        checkComplete(counter);
                    });
                });
                var checkComplete = function(counter){
                    if (counter===21){
                        console.log('resolving...');
                        resolve();
                    }
                };
            }
        });
    });
};
var getDriverCircuitHistory = function(circuitId, driverId) {
    return new Promise(function(resolve, reject){
        //console.log('Fetching driver circuit history from API...');
        ergast.getData('http://ergast.com/api/f1/circuits/' + circuitId + '/drivers/' + driverId + '/results.json').then(function(res, rej){
            if(rej){
                console.log('getDriverCircuitHistory cannot populate database due to error in callApi.js: ', rej);
                reject(rej);
            }
            else {
                var data = res.body.MRData.RaceTable;
                //console.log('data.Races=', data.Races);
                db.controller.update({'driverId': driverId}, {'circuitHistory': data.Races}, mongooseConfig.Data);
                resolve(res);
            }
        });
    });
};
var getDriverManufacturer = function() {
    return new Promise(function(resolve, reject){
        //console.log('Fetching driver current manufacturer from API...');
        ergast.getData('http://ergast.com/api/f1/current/last/results.json').then(function(res, rej){
            if(rej){
                console.log('getDriverManufacture cannot populate database due to error in callApi.js: ', rej);
                reject(rej);
            }
            else {
                //console.log('getDriverManufacture response=', res.body.MRData.RaceTable.Races[0].Results);
                var data = res.body.MRData.RaceTable.Races[0].Results;
                data.forEach(function(item){
                    var driverId = item.Driver.driverId;
                    var constructorId = item.Constructor.constructorId;
                    var constructorName = item.Constructor.name;
                    //update db with manufacturer data
                    db.controller.update({'driverId': driverId}, {'manufacturerId': constructorId}, mongooseConfig.Data);
                    db.controller.update({'driverId': driverId}, {'manufacturerName': constructorName}, mongooseConfig.Data);
                    resolve();
                });

            }
        });
    });
};
var getManufacturerCircuitHistory = function (circuitId, manufacturerId){
    return new Promise(function(resolve, reject){
        //console.log('Fetching manufacturer circuit history from API...');
        ergast.getData('http://ergast.com/api/f1/circuits/' + circuitId + '/constructors/' + manufacturerId + '/results.json?limit=1000').then(function(res, rej){
            if(rej){
                console.log('getManufacturerCircuitHistory cannot populate database due to error in callApi.js: ', rej);
                reject(rej);
            }
            else {
                var circuitHistory = res.body.MRData.RaceTable.Races;
                db.controller.create({'manufacturerId': manufacturerId, 'circuitHistory': circuitHistory}, mongooseConfig.Manufacturer);
                resolve(res);
            }
        });
    });
};
var getDriverSeasonPoints = function () {
    return new Promise(function(resolve, reject){
        //console.log('Fetching driver season points from the API...');
        ergast.getData('http://ergast.com/api/f1/current/driverStandings.json').then(function(res, rej){
            if(rej) {
                console.log('getDriverSeasonPoints cannot populate database due to error in callApi.js: ', rej);
            }
            else {
                //console.log('getDriverSeasonPoints:', res.body.MRData.StandingsTable.StandingsLists[0].DriverStandings);
                var pointsTable = res.body.MRData.StandingsTable.StandingsLists[0].DriverStandings;
                pointsTable.forEach(function(item){
                    var driverId = item.Driver.driverId;
                    var seasonPoints = parseInt(item.points);
                    db.controller.update({'driverId': driverId}, {'seasonPoints': seasonPoints}, mongooseConfig.Data);
                });
                resolve();
            }
        });
    });
};
var getManufacturerSeasonPoints = function () {
    return new Promise(function(resolve, reject){
        //console.log('Fetching manufacturer season points from the API...');
        ergast.getData('http://ergast.com/api/f1/current/constructorStandings.json').then(function(res, rej){
            if(rej) {
                console.log('getManufacturerSeasonPoints cannot populate database due to error in callApi.js: ', rej);
            }
            else {
                //console.log('getManufacturerSeasonPoints:', res.body.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
                var counter = 0;
                var pointsTable = res.body.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
                pointsTable.forEach(function(item){
                    var manufacturerId = item.Constructor.constructorId;
                    var seasonPoints = parseInt(item.points);
                    db.controller.update({'manufacturerId': manufacturerId}, {'seasonPoints': seasonPoints}, mongooseConfig.Manufacturer).then(function(){
                        counter++;
                        checkComplete(counter);
                    });
                });
                var checkComplete = function(counter){
                    if (counter === 11) {
                        resolve();
                    }
                };
            }
        });
    });
};

//functions that write to the database
var saveScraperData = function() {
    return new Promise(function(resolve, reject){
        scraper.go().then(function(response){
            //write results to db, check scraper.js for example code
            //console.log('saveScraperData response', response);
            var counter = 0;

            //populate database with betfair data

            for (var i=0; i<response.drivers.length; i++){
                if (response.drivers[i] !== 'Carlos Sainz Jr') {
                    db.controller.update({'betfairName': new RegExp(response.drivers[i], "i")}, {'odds': response.odds[i]}, mongooseConfig.Data).then(function(){
                        counter++;
                        checkComplete(counter);
                    });
                }
                else {
                    db.controller.update({'betfairName': "Carlos Sainz"}, {'odds': response.odds[i]}, mongooseConfig.Data).then(function(){
                        counter++;
                        checkComplete(counter);
                    });
                }
            }

            var checkComplete = function(counter){
                if (counter === 22) {
                    //console.log('calling resolve()');
                    resolve();
                }
            };

        }, function(error){
            //output error message to the UI to say that results are not available
            console.log('saveScraperData error:', error);
        });
    });

};


var saveApiData = function(item) {
    return new Promise(function (resolve, reject) {

        db.controller.create({
            'familyName': item.familyName,
            'givenName': item.givenName,
            'nationality': item.nationality,
            'driverId': item.driverId,
            'betfairName': item.givenName + ' ' + item.familyName
        }, mongooseConfig.Data)
            .then(function(success){
                //console.log('Driver successfully created', success);
                resolve(true);
            }, function(error){
                console.log('Driver saving error', error);
                reject();
            });
    });
};
var updateDriverScore = function(driverId, position, factor){

    var newScore = (pointsLookup(position) * factor);

    db.controller.update({'driverId': driverId}, {$inc: {'circuitHistoryScore': newScore}}, mongooseConfig.Data);

};
var updateManufacturerScore = function(manufacturerId, position, factor){

    var newScore = (pointsLookup(position) * factor);

    db.controller.update({'manufacturerId': manufacturerId}, {$inc: {'circuitHistoryScore': newScore}}, mongooseConfig.Manufacturer);

};

var scoreDriverData = function(season, currentYear, driverId, position){
    return new Promise(function(resolve, reject){
        if (parseInt(season) > currentYear - 10) {
            switch(parseInt(season)){
                case currentYear - 1:
                    updateDriverScore(driverId, position, 0.25).then(function(){resolve()});
                    break;
                case currentYear - 2:
                    updateDriverScore(driverId, position, 0.18).then(function(){resolve()});
                    break;
                case currentYear - 3:
                    updateDriverScore(driverId, position, 0.14).then(function(){resolve()});
                    break;
                case currentYear - 4:
                    updateDriverScore(driverId, position, 0.12).then(function(){resolve()});
                    break;
                case currentYear - 5:
                    updateDriverScore(driverId, position, 0.10).then(function(){resolve()});
                    break;
                case currentYear - 6:
                    updateDriverScore(driverId, position, 0.08).then(function(){resolve()});
                    break;
                case currentYear - 7:
                    updateDriverScore(driverId, position, 0.06).then(function(){resolve()});
                    break;
                case currentYear - 8:
                    updateDriverScore(driverId, position, 0.04).then(function(){resolve()});
                    break;
                case currentYear - 9:
                    updateDriverScore(driverId, position, 0.02).then(function(){resolve()});
                    break;
                case currentYear - 10:
                    updateDriverScore(driverId, position, 0.01).then(function(){resolve()});
                    break;
                default:
                    resolve();
            }
        }
    });
};

var scoreManufacturerData = function (season, currentYear, manufacturerId, positionOne, positionTwo){
    return new Promise(function(resolve, reject){
        if (parseInt(season) > currentYear -10){
            switch (parseInt(season)){
                case currentYear-1:
                    updateManufacturerScore(manufacturerId, positionOne, 0.25).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.25).then(function(){resolve()});
                    break;
                case currentYear-2:
                    updateManufacturerScore(manufacturerId, positionOne, 0.18).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.18).then(function(){resolve()});
                    break;
                case currentYear-3:
                    updateManufacturerScore(manufacturerId, positionOne, 0.14).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.14).then(function(){resolve()});
                    break;
                case currentYear-4:
                    updateManufacturerScore(manufacturerId, positionOne, 0.12).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.12).then(function(){resolve()});
                    break;
                case currentYear-5:
                    updateManufacturerScore(manufacturerId, positionOne, 0.10).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.10).then(function(){resolve()});
                    break;
                case currentYear-6:
                    updateManufacturerScore(manufacturerId, positionOne, 0.08).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.08).then(function(){resolve()});
                    break;
                case currentYear-7:
                    updateManufacturerScore(manufacturerId, positionOne, 0.06).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.06).then(function(){resolve()});
                    break;
                case currentYear-8:
                    updateManufacturerScore(manufacturerId, positionOne, 0.04).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.04).then(function(){resolve()});
                    break;
                case currentYear-9:
                    updateManufacturerScore(manufacturerId, positionOne, 0.02).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.02).then(function(){resolve()});
                    break;
                case currentYear-10:
                    updateManufacturerScore(manufacturerId, positionOne, 0.01).then(function(){resolve()});
                    updateManufacturerScore(manufacturerId, positionTwo, 0.01).then(function(){resolve()});
                    break;
                default:
                    resolve();
            }
        }
    });
};


var populateDriverCircuitHistoryScore = function() {

    return new Promise(function(resolve, reject){
        db.controller.read({}, 'driverId circuitHistory', mongooseConfig.Data)
            .then(function(res){
            var driverArray = res;
            //var currentYear = new Date().getFullYear();
            var counterOne = 0;

            driverArray.forEach(function(item){
                db.controller.update({'driverId': item.driverId}, {'circuitHistoryScore': 0}, mongooseConfig.Data)
                    .then(function(){
                        //console.log('populateDriverCircuitHistory counter=', counterOne);
                        //var driverId = item.driverId;
                        //var length = item.circuitHistory.length;
                        //var counterTwo = 0;
                        //console.log('item.circuitHistory', item.circuitHistory);
                        counterOne++;
                        //TODO: needs to be fixed when circuit history data is available
                        //item.circuitHistory.forEach(function(record){
                        //    console.log('hello...');
                        //    var season = record.season;
                        //    var position = parseInt(record.Results[0].position);
                        //    scoreData(season, currentYear, driverId, position).then(function(){
                        //        counterTwo++;
                        //        console.log('counterTwo', counterTwo);
                        //        if (counterTwo === length-1){
                        //            counterOne++;
                        //        }
                        //    });
                        //});
                        checkComplete(counterOne);
                    });
                var checkComplete = function(counterOne){
                    if (counterOne===21){
                        resolve(true);
                    }
                };
            });
        });
    });
};

var populateManufacturerCircuitHistoryScore = function() {

    return new Promise(function(resolve, reject){
        db.controller.read({}, 'manufacturerId', mongooseConfig.Manufacturer)
            .then(function(res) {
            var manufacturerArray = res;
            //console.log('res:', res);
            //var currentYear = new Date().getFullYear();
            var counterOne = 0;

            manufacturerArray.forEach(function(record) {
                db.controller.update({'manufacturerId': record.manufacturerId}, {'circuitHistoryScore': 0}, mongooseConfig.Manufacturer)
                    .then(function() {
                        counterOne++;
                        //TODO: To fix when manufacturer circuit history data is available
                        //db.controller.read({'manufacturerId': record.manufacturerId}, 'circuitHistory manufacturerId', mongooseConfig.Manufacturer
                        //    .then(function(res){
                        //        console.log('manufacturerId:', res[0].manufacturerId);
                        //        res[0].circuitHistory.forEach(function(item){
                        //
                        //      });
                        //  });
                        checkComplete(counterOne);
                    });


                var checkComplete = function (counterOne) {
                    if (counterOne === 10) {
                        resolve(true);
                    }
                }
            });
        });
    });
};

//populate db
exports.go = function() {

    return new Promise(function(resolve, reject){

        /*stepOne
         * in parallel get current race calendar and next race in the championship
         * in parallel get driver first name, id etc and then add in season points and the manufacturer the driver drives for
         * once both are completed start stepTwo by returning an object with the driverArray, manufacturerArray and circuitId
        */
        var stepOne = function(){
            return new Promise(function(resolve, reject) {
                var driverArray, circuitId;
                var manufacturerArray=[];
                var grc = false;
                var gdd = false;

                getRaceCalendar().then(function() {
                    utility.getNextRace().then(function(res) {
                        circuitId=res.circuitId;
                        console.log('circuitId=', circuitId);
                        grc = true;
                        checkComplete();
                    })
                });

                getDriverData().then(function() {
                    //get driver season points in parallel here
                    getDriverSeasonPoints().then(function(res){
                    });
                    utility.getDbData('driverId', mongooseConfig.Data).then(function(res) {
                        driverArray=res;
                        console.log('driverArray', driverArray);
                        getDriverManufacturer().then(function(){
                            utility.getDbData('manufacturerId', mongooseConfig.Data).then(function(res) {
                                deDupe(res).then(function(res){
                                    manufacturerArray = res;
                                    gdd = true;
                                    console.log('manufacturerArray', manufacturerArray);
                                    checkComplete();
                                });
                            });
                        });
                    })
                });

                var checkComplete = function(){
                    if (gdd===true && grc===true){
                        console.log('resolving stepOne');
                        resolve (
                            {
                                'driverArray': driverArray,
                                'circuitId': circuitId,
                                'manufacturerArray': manufacturerArray
                            }
                        );
                    }
                };
            });
        };

        /*stepTwo
         * with the object returned from stepOne
         * in parallel get the driverCircuitHistory and the manufacturerCircuitHistory
         * once the manufacturer data is populated in the db, get the manufacturer's season points and add them into the db
         * then, when both processes are complete, start stepThree
         */
        var stepTwo = function(res){

            return new Promise(function(resolve, reject){

                var driverComplete = false;
                var manufacturerComplete = false;
                var scraperComplete = false;
                var driverArrayLength = res.driverArray.length;
                var manufacturerArrayLength = res.manufacturerArray.length;
                var counterDriver = 0;
                var counterManufacturer = 0;

                res.driverArray.forEach(function(item){
                    getDriverCircuitHistory(res.circuitId, item.driverId).then(function(res){
                        //console.log('Saved circuit history data for...', item.driverId);
                        counterDriver ++;
                        if (counterDriver === driverArrayLength){
                            driverComplete = true;
                            console.log('driverComplete:', driverComplete);
                            checkComplete();
                        }
                    });
                });

                res.manufacturerArray.forEach(function(item){
                    getManufacturerCircuitHistory(res.circuitId, item).then(function(res){
                        //console.log('Saved circuit history data for...', item);
                        counterManufacturer ++;
                        if (counterManufacturer === manufacturerArrayLength) {
                            getManufacturerSeasonPoints().then(function(){
                                manufacturerComplete = true;
                                console.log('manufacturerComplete:', manufacturerComplete);
                                checkComplete();
                            });
                        }
                    });
                });


                saveScraperData().then(function(){
                    scraperComplete = true;
                    console.log('scraperComplete:', scraperComplete);
                    checkComplete();
                });

                var checkComplete = function(){
                    if (driverComplete === true && manufacturerComplete === true && scraperComplete === true) {
                        console.log('resolving stepTwo...');
                        resolve();
                    }
                };
            });
        };

        /* stepThree
         * in parallel, add in the circuitHistory score to both the driver and manufacturer database collection
         */
        var stepThree = function(){

            return new Promise(function(resolve, reject){

                var pdchs = false;
                var pmchs = false;

                populateDriverCircuitHistoryScore()
                    .then(function(res){
                        console.log('populateDriverCircuitHistoryScore =', res);
                        pdchs = true;
                        checkComplete();
                    });
                populateManufacturerCircuitHistoryScore()
                    .then(function(res){
                        console.log('populateManufacturerHistoryScore =', res);
                        pmchs = true;
                        checkComplete();
                    });

                var checkComplete = function(){
                    if (pdchs === true && pmchs === true){
                        resolve(true);
                    }
                };
            });
        };

        stepOne().then(function(res){
            stepTwo(res).then(function(res){
                stepThree().then(function(res){
                    setTimeout(function(){resolve(); console.log("database population complete"); }, 2000);
                });
            });
        });
    });
};




