//import getUrl method
var getUrl = require('./getUrl.js');

exports.scrapeBetfair = function() {
  return new Promise(function(resolve, reject){
      var url = "";
      getUrl.retrieveURL()
          .then(function(response){
              return url=response;
          })
          .then(function(url){
              //console.log(url);
              resolve(url);
          });
  });
};









