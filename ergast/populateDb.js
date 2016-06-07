var ergast = require('./callApi.js');
var db = require('../db/database.js');
var mongooseConfig = require('../db/mongoose-config.js');


//utility functions
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

//functions that collect and save data from the API
var getDriverData = function() {
    return new Promise(function (resolve, reject) {
        //TODO: race number hardcoded into the driver list call
        console.log('Fetching driver detail data from the API...');
        ergast.getData('http://ergast.com/api/f1/2016/6/drivers.json')
            .then(function (res, rej) {
                var complete = 0;
                if (rej) {
                    console.log('getDriverData cannot populate database due to error in callApi.js: ', rej);
                }
                else {
                    var data = res.body.MRData.DriverTable.Drivers;
                    console.log('Cleaning and saving data...');
                    cleanData(data);
                    for (var i=0; i<data.length; i++){
                        saveData(data[i]).then(function(res){
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
        console.log('Fetching race calendar from API...');
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
                    }, mongooseConfig.Race);
                    counter++;
                    if(counter===21){
                        resolve();
                    }
                });
            }
        });
    });
};
var getDriverCircuitHistory = function(circuitId, driverId) {
    return new Promise(function(resolve, reject){
        console.log('Fetching driver circuit history from API...');
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
        console.log('Fetching driver current manufacturer from API...');
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
        console.log('Fetching manufacturer circuit history from API...');
        ergast.getData('http://ergast.com/api/f1/circuits/' + circuitId + '/constructors/' + manufacturerId + '/results.json?limit=1000').then(function(res, rej){
            if(rej){
                console.log('getManufacturerCircuitHistory cannot populate database due to error in callApi.js: ', rej);
                reject(rej);
            }
            else {
                var circuitHistory = res.body.MRData.RaceTable.Races;
                db.controller.create(
                    {
                        'manufacturerId': manufacturerId,
                        'circuitHistory': circuitHistory
                    }
                    , mongooseConfig.Manufacturer);

                resolve(res);
            }
        });

    });
};
var getDriverSeasonPoints = function () {
    return new Promise(function(resolve, reject){
        console.log('Fetching driver season points from the API...');
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
        console.log('Fetching manufacturer season points from the API...');
        ergast.getData('http://ergast.com/api/f1/current/constructorStandings.json').then(function(res, rej){
            if(rej) {
                console.log('getManufacturerSeasonPoints cannot populate database due to error in callApi.js: ', rej);
            }
            else {
                //console.log('getManufacturerSeasonPoints:', res.body.MRData.StandingsTable.StandingsLists[0].ConstructorStandings);
                var pointsTable = res.body.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
                pointsTable.forEach(function(item){
                    var manufacturerId = item.Constructor.constructorId;
                    var seasonPoints = parseInt(item.points);
                    db.controller.update({'manufacturerId': manufacturerId}, {'seasonPoints': seasonPoints}, mongooseConfig.Manufacturer);
                });
                resolve();
            }
        });
    });
};

//functions that read from the database
var getNextRace = function(){
    return new Promise(function(resolve, reject){
        var dateNow = new Date();
        db.controller.read({}, 'raceDate _id round raceName circuitId circuitName', mongooseConfig.Race)
            .then(function(data) {
                for (var i=0; i<data.length; i++) {
                    var diff = data[i].raceDate - dateNow;
                    //console.log(diff);
                    if (diff>0){
                        resolve(
                            {
                                '_id' : data[i]._id,
                                'round': data[i].round,
                                'raceName': data[i].raceName,
                                'circuitId': data[i].circuitId,
                                'raceDate': data[i].raceDate
                            }
                        );
                        break;
                    }
                }
                reject("No more races this season, sorry!!");
            });
    });
};
var getDbData = function(field){
    return new Promise(function(resolve, reject){
        db.controller.read({}, '_id ' + field, mongooseConfig.Data)
            .then(function(data) {
                if(data){
                    resolve(data);
                }
                else {
                    reject("Error retrieving data in getDbData!");
                }
            });
    });
};

//functions that write to the database
var saveData = function(item) {
    return new Promise(function (resolve, reject) {
        //console.log('Saving', item);

        var complete = 0;

        db.controller.update({'betfairName': new RegExp(item.familyName, "i")}, {'familyName': item.familyName}, mongooseConfig.Data)
            .then(function(res){
                if (res) {
                    complete++;
                    checkComplete();
                }
            });
        db.controller.update({'betfairName': new RegExp(item.familyName, "i")}, {'givenName': item.givenName}, mongooseConfig.Data)
            .then(function(res){
                if (res) {
                    complete++;
                    checkComplete();
                }
            });
        db.controller.update({'betfairName': new RegExp(item.familyName, "i")}, {'nationality': item.nationality}, mongooseConfig.Data)
            .then(function(res){
                if (res) {
                    complete++;
                    checkComplete();
                }
            });

        db.controller.update({'betfairName': new RegExp(item.familyName, "i")}, {'driverId': item.driverId}, mongooseConfig.Data)
            .then(function(res){
                if (res) {
                    complete++;
                    checkComplete();
                }
            });

        var checkComplete = function () {
            if (complete === 4) {
                console.log('Updating complete for this driver');
                resolve(true);
            }
        };
    });
};

//populate db
exports.go = function() {

    var stepOne = function(){
        return new Promise(function(resolve, reject) {
            var driverArray, circuitId;
            var manufacturerArray=[];

            getRaceCalendar().then(function() {
                getNextRace().then(function(res) {
                    circuitId=res.circuitId;
                    checkComplete();
                })
            });

            getDriverData().then(function() {
                //get driver season points in parallel here
                getDriverSeasonPoints().then(function(res){
                    //who knows what should go here
                });
                getDbData('driverId').then(function(res) {
                    driverArray=res;
                    getDriverManufacturer().then(function(){
                        getDbData('manufacturerId').then(function(res) {
                            deDupe(res).then(function(res){
                                manufacturerArray = res;
                                getManufacturerSeasonPoints().then(function(){
                                    checkComplete();
                                });
                            });
                        });
                    });
                })
            });

            var checkComplete = function(){
                if (driverArray != undefined && circuitId != undefined && manufacturerArray != undefined){
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

    stepOne().then(function(res){


        res.driverArray.forEach(function(item){
            getDriverCircuitHistory(res.circuitId, item.driverId).then(function(res){
                console.log('Saved circuit history data for...', item.driverId);
            });
        });

        res.manufacturerArray.forEach(function(item){
            getManufacturerCircuitHistory(res.circuitId, item).then(function(res){
                console.log('Saved circuit history data for...', item);
            });
        });

    });

};




