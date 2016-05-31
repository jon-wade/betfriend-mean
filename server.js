var express = require('express');
var scraper = require('./betfair/scraper.js');
var db = require('./db/database.js');
var populate = require('./ergast/populateDb.js');

scraper.go().then(function() {
    populate.go();
});


//web server
var testData = {
    'test': 'hello world'
};


//web server
var app = express();
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile('/public/index.html');
});

app.get('/data', function(req, res){
    res.send(testData);
});

app.listen(8080);
console.log("App is listening on port 8080");



