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