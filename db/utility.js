var db = require('./database.js');
var mongooseConfig = require('./mongoose-config.js');

exports.getNextRace = function(){
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
                                'circuitName': data[i].circuitName,
                                'raceDate': data[i].raceDate,
                                'status': true
                            }
                        );
                        break;
                    }
                }
                reject("No more races this season, sorry!!");
            });
    });
};

exports.getDriverObject = function(){
    return new Promise(function(resolve, reject){
        db.controller.read({}, 'familyName _id givenName odds driverId manufacturerId manufacturerName seasonPoints circuitHistory circuitHistoryScore', mongooseConfig.Data)
            .then(function(data) {
                resolve(data);
            });
    });
};

exports.getManufacturerObject = function(){
    return new Promise(function(resolve, reject){
        db.controller.read({}, 'manufacturerId circuitHistory seasonPoints _id circuitHistoryScore', mongooseConfig.Manufacturer)
            .then(function(data){
                resolve(data);
        });
    });
};

exports.getDbData = function(field, modelName){
    return new Promise(function(resolve, reject){
        db.controller.read({}, '_id ' + field, modelName)
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