//mongoose/mongodb set-up
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/betfriend');
var driverSchema = mongoose.Schema(
    {
        'betfairName': {type: String, unique:true},
        'odds': Number,
        'familyName': String,
        'givenName': String,
        'nationality': String
    }
);
exports.Data = mongoose.model('data', driverSchema);

var raceSchema = mongoose.Schema(
    {
        'round': String,
        'raceName': String,
        'circuitId': String,
        'circuitName': String,
        'date': String,
        'time': String
    }
);
exports.Race = mongoose.model('race', raceSchema);
