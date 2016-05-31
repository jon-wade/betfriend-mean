var ergast = require('./callApi.js');
var db = require('../db/database.js');
var mongooseConfig = require('../db/mongoose-config.js');

//populate db
exports.go = function() {
    getRaceCalendar().then(function() {console.log('done getRaceCalendar()');});
    getDriverData().then(function() {console.log('done getDriverData()');});
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

var saveData = function(item) {
    return new Promise(function (resolve, reject) {
        console.log('Saving', item);

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

        var checkComplete = function () {
            if (complete === 3) {
                console.log('Updating complete for this driver');
                resolve(true);
            }
        };
    });
};

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
                console.log('Race calendar:', data);
                data.forEach(function(item){
                    db.controller.create({
                        'round': item.round,
                        'raceName': item.raceName,
                        'circuitId': item.Circuit.circuitId,
                        'circuitName': item.Circuit.circuitName,
                        'date': item.date,
                        'time': item.time
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
