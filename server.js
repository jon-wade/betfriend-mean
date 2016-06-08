var express = require('express');
var scraper = require('./betfair/scraper.js');
var db = require('./db/database.js');
var populate = require('./db/populateDb.js');
var utility = require('./db/utility.js');

var homeData;

scraper.go().then(function() {
    populate.go().then(function(){
        utility.getNextRace().then(function(res, rej){
            homeData = res;
        });
    });
});


//web server
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile('/public/index.html');
});

app.get('/homeData', function(req, res){
    res.send(homeData);
});

app.listen(8080);
console.log("App is listening on port 8080");



