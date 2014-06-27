var http = require('http');
var wit = require('./wit');
var joke = require('./joke');
var url = require('url');

var port = process.env.PORT || 8766;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

http.createServer(function (req, res) {
    if (req.url === '/favicon.ico') {
        return;
    }
    var queryObject = url.parse(req.url, true).query;
    var wit_request = wit.request_wit(queryObject.Body);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    wit_request.when(function (err, wit) {
        //res.end(JSON.stringify(wit));
        if (err) console.log(err);//Manage Error here
        var outcome = wit.outcomes[0];
        switch (outcome.intent) {
            case "hello":
                res.end("Hello, how are you?");
                break;
            case "tell_joke":
                var cat;
                if (outcome.entities.category) {
                    cat = outcome.entities.category[0].value;
                }
                joke.get_joke(cat).when(function (err, the_joke) {
                    res.end(the_joke);
                });
                break;
            default:
                res.end(JSON.stringify(wit));
        }
    });
}).listen(port);

console.log('Server running at http://127.0.0.1:' + port);