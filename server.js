//import express application server
var express = require('express');

//use mongoose to connect to MongoDB and allows the creation of a model/schema
//need to start up the database before running this code ($ mongod --dbpath=<path to storage folder> --port=<port number to listen on, normally 27017>
var mongoose = require('mongoose');

//import getUrl method
var scraper = require('./scraper/scraper.js');

//create an instance of express
var app = express();

//connect to mongoDB via mongoose
mongoose.connect('mongodb://localhost/betfriend');

scraper.scrapeBetfair().then(function(response){
    console.log(response);
});

//set-up schema for database
var Schema = mongoose.Schema(
    {
        'name': String,
        'age': Number
    }
);

//create a mongoose model
var Data = mongoose.model('data', Schema);

//create some test data
//Data.create({'name': 'Jon', 'age': 44}, function(err, res){
//    if (err) {
//        console.log('Data error', err);
//        mongoose.disconnect();
//    }
//    else {
//        console.log('Data added', res);
//        mongoose.disconnect();
//    }
//});


app.use(express.static(__dirname + '/public'));

app.get('*', function(req, res) {
        res.sendFile('/public/index.html')
    });

app.listen(8080);
console.log("App is listening on port 8080");
