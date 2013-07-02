var http = require('http');
var Future = require('futures').future;

var get_joke = function(cat) {
    var future = Future.create();
    var url = "http://api.icndb.com/jokes/random";
    if (cat) {
        url += "?limitTo=[" + cat + "]";
    }
    http.get(url, function(res) {
        var response = '';
        res.on('data', function (chunk) {response += chunk;});
        res.on('end', function () {
            future.fulfill(undefined, JSON.parse(response).value.joke);
        });
    }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    return future;
}

module.exports.get_joke = get_joke;