//packages required to scrape and parse BetFair's site
var unirest = require('unirest');
var htmlparser = require('htmlparser');
var select = require('soupselect').select;

exports.retrieveURL = function(){
    return new Promise(function(resolve, reject){
        unirest.get('https://www.betfair.com/sport/motor-sport').end(function(response, reject) {

            var handler = new htmlparser.DefaultHandler(function(error, dom) {
                if (error) {
                    //do something on error
                }
                else {
                    var elements = select(dom, '.ui-clickselect-container');
                    var events = elements[2].children;
                    for (var i=0; i<events.length; i++){
                        if(events[i].children != undefined){
                            for (var j=0; j<events[i].children.length; j++){
                                if (events[i].children[j].attribs != undefined) {
                                    //console.log(events[i].children[j].attribs);
                                    if (events[i].children[j].attribs.title != undefined){
                                        if (events[i].children[j].attribs.title.includes('Monaco')){
                                            var url = events[i].children[j].attribs.href;
                                            //console.log(url);
                                            resolve(url);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            var parser = new htmlparser.Parser(handler);
            parser.parseComplete(response.body);

        });
    });
};



