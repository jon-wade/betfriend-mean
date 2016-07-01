//import getUrl method
var getUrl = require('./getUrl.js');
var getOdds = require('./getOdds.js');
var db = require('../db/database.js');
var mongooseConfig = require('../db/mongoose-config.js');

var scrapeBetfair = function(currentRoundName) {
  return new Promise(function(resolve, reject){
      var url = "";
      getUrl.retrieveURL(currentRoundName)
          .then(function(response){
              //console.log('getUrl.retrieveURL response =', response);
              return response;
          }, function(error){
              //console.log('getUrl.retrieveURL error =', error);
              return error;
          })
          .then(function(data){
              if (data.status){
                  getOdds.retrieveOdds(data.content).then(function(data){
                      resolve(data);
                  });
              }
              else {
                  reject(data);
              }
          });
  });
};

exports.go = function(currentRoundName) {
    return new Promise(function (resolve, reject) {
        scrapeBetfair(currentRoundName).then(function (res) {
            //console.log('scrapeBetfair Response:', res);
            resolve(res);
        }, function(rej){
            reject(rej);
        });
    });
};








