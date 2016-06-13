//import getUrl method
var getUrl = require('./getUrl.js');
var getOdds = require('./getOdds.js');
var db = require('../db/database.js');
var mongooseConfig = require('../db/mongoose-config.js');

var scrapeBetfair = function() {
  return new Promise(function(resolve, reject){
      var url = "";
      //TODO: grand prix race name hardcoded
      getUrl.retrieveURL('European')
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

exports.go = function() {
    return new Promise(function (resolve, reject) {
        scrapeBetfair().then(function (res) {
            //console.log('scrapeBetfair Response:', res);
            resolve(res);
        }, function(rej){
            //TODO: deal with non-availability of scraped data here
            reject(rej);
        });
    });
};








