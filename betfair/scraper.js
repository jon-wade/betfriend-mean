//import getUrl method
var getUrl = require('./getUrl.js');
var getOdds = require('./getOdds.js');
var db = require('../db/database.js');
var mongooseConfig = require('../db/mongoose-config.js');

var scrapeBetfair = function() {
  return new Promise(function(resolve, reject){
      var url = "";
      //TODO: grand prix race name hardcoded
      getUrl.retrieveURL('Canadian')
          .then(function(response){
              return url=response;
          })
          .then(function(url){
              var array = getOdds.retrieveOdds(url);
              resolve(array);
          });
  });
};

exports.go = function() {
    return new Promise(function (resolve, reject) {
        scrapeBetfair().then(function (res) {
            //clear database
            db.controller.delete({}, mongooseConfig.Data);
            db.controller.delete({}, mongooseConfig.Race);
            //console.log('Response:', res);
            //populate database with betfair data
            for (i=0; i<res.drivers.length; i++) {
                db.controller.create({'betfairName': res.drivers[i], 'odds': res.odds[i]}, mongooseConfig.Data);
            }
            resolve();
        });
    });
};








