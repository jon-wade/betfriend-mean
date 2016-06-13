//packages required to scrape and parse BetFair's site
var unirest = require('unirest');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;

exports.retrieveOdds = function(url) {
    return new Promise(function(resolve, reject){
        var driverArray = [];
        var oddsArray = [];
        var stub = 'https://www.betfair.com';
        var fullUrl = stub + url;
        console.log('fullUrl: ', fullUrl);
        unirest.get(fullUrl).end(function(res, err) {
            if(err){
                console.log('Page scrape request failed, error: ', err);
            }
            else {
                var handler = new htmlparser.DefaultHandler(function(error, dom) {
                    if (error) {
                        console.log('html parser failed, error: ', error);
                        reject();
                    }
                    else {
                        var drivers = select(dom, '.runner-name');
                        var prices = select(dom, '.ui-runner-price');

                        for (var i = 0; i < drivers.length; i++) {
                            driverArray.push(drivers[i].children[0].data);
                            //console.log(prices[i].children[0].data);
                            if (prices[i].children[0].data.includes('EVS')){
                                oddsArray.push(2);
                            }
                            else {
                                oddsArray.push(eval(prices[i].children[0].data.replace(/[\s]+/g, ''))+1);
                            }
                        }
                    }
                    resolve({
                        drivers: driverArray,
                        odds: oddsArray
                    });
                });
            }
            var parser = new htmlparser.Parser(handler);
            parser.parseComplete(res.body);
        });
    });
};