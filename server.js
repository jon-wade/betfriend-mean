var express = require('express');
var db = require('./db/database.js');
var populate = require('./db/populateDb.js');
var utility = require('./db/utility.js');
var mongooseConfig = require('./db/mongoose-config.js');

var raceData, driverData, manufacturerData;

var databaseRefresh = function() {
    //clear database
    console.log('clearing the db...');
    db.controller.delete({}, mongooseConfig.Data);
    db.controller.delete({}, mongooseConfig.Race);
    db.controller.delete({}, mongooseConfig.Manufacturer);


//populate the database
    console.log('populating the db...');
    populate.go().then(function(){
        utility.getNextRace().then(function(res, rej){
            raceData = res;
        });
        utility.getDriverObject().then(function(res, rej){
            driverData = res;
        });
        utility.getManufacturerObject().then(function(res, rej){
            manufacturerData = res;
        });
    });
};



databaseRefresh();

//refresh the database every hour
setInterval(databaseRefresh, 3600000);

//web server
var app = express();
app.use(express.static(__dirname + '/public'));

//app.get('/', function(req, res) {
//    res.sendFile('/public/index.html');
//});

app.get('/raceData', function(req, res){
    res.send(raceData);
});

app.get('/driverData', function(req, res){
    res.send(driverData);
});

app.get('/manufacturerData', function(req, res){
    res.send(manufacturerData);
});

app.get('*', function(req, res) {
    res.sendFile('index.html', {root: __dirname + '/public/'});
});

app.listen(8080);
console.log("App is listening on port 8080");



