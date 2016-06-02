var ergast = require('./callApi.js');
var db = require('../db/database.js');
var mongooseConfig = require('../db/mongoose-config.js');

var getDriverData = function() {

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

var getDriverId = function(){
    return new Promise(function(resolve, reject){
        db.controller.read({}, '_id driverId', mongooseConfig.Data)
            .then(function(data) {
                if(data){
                    resolve(data);
                }
                else {
                    reject("Error retrieving data in getDriverId!");
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
                reject();
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

//populate db
exports.go = function() {

    var stepOne = function(){
        return new Promise(function(resolve, reject) {
            var driverArray;
            var circuitId;

            getRaceCalendar().then(function() {
                getNextRace().then(function(res) {
                    circuitId=res.circuitId;
                    checkComplete();
                })
            });

            getDriverData().then(function() {
                getDriverId().then(function(res) {
                    driverArray=res;
                    checkComplete();
                })
            });

            var checkComplete = function(){
                if (driverArray != undefined && circuitId != undefined){
                    resolve (
                        {
                            'driverArray': driverArray,
                            'circuitId': circuitId
                        }
                    );
                }
            };
        });
    };

    stepOne().then(function(res){

        console.log('res.circuitId = ', res.circuitId);
        console.log('item.driverId[0] = ', res.driverArray[0].driverId);

        res.driverArray.forEach(function(item){
            getDriverCircuitHistory(res.circuitId, item.driverId).then(function(res){
                console.log('Saved circuit history data for...', item.driverId);
            });
        });
    });

};




