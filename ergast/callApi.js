var unirest = require('unirest');

exports.getData = function(url){
    console.log('Calling: ', url);
    return new Promise(function(resolve, reject){
        unirest.get(url)
            .end(function(res, rej){
                if(rej){
                    console.log('Error retrieving data from F1 db in callApi.js:', rej);
                    reject(rej);
                }
                else {
                    //console.log(res.toJSON().body.MRData.DriverTable.Drivers);
                    resolve(res.toJSON());
                }
            });
    });
};



