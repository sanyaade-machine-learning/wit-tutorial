var http = require('http');
var wit = require('./wit');
var joke = require('./joke');
var url = require('url');

http.createServer(function (req, res) {
    var queryObject = url.parse(req.url, true).query;
    var wit_request = wit.request_wit(queryObject.text);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    wit_request.when(function (err, wit) {
        if (err) console.log(err)//Manage Error here
        switch (wit.outcome.intent) {
            case "hello":
                res.end("Hello, how are you?");
                break;
            case "tell_joke":
                var cat;
                if (wit.outcome.slots.length == 1 && wit.outcome.slots[0].type == "joke categories") {
                    cat = wit.outcome.slots[0].value;
                }
                joke.get_joke(cat).when(function (err, the_joke) {
                    res.end(the_joke);
                });
                break;
            default:
                res.end(JSON.stringify(wit));
        }
    });
}).listen(8766, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8766/');