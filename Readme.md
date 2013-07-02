
Wit Demo
=======

We are going to write a small node application that will using Twilio to return jokes or ... by sms based on what a user is asking

 * No linguistic analysis needed
 * ...

Prerequisites
---------------

To access the Wit API :

 * [Wit account](https://wit.ai/)
 * [Twilio account](http://www.twilio.com/) (optional if no sms needed)

For the server implementation you will need :

 * [Node.js](http://nodejs.org/)


Create initial Node.js script
-----------------------------

On the command line type :

``` bash
$ mkdir wit-demo && cd wit-demo
wit-demo$ touch app.js
wit-demo$ touch package.json
```

#### The package.json file

The package.json is a file that describes your application. It should look like :

``` json
{
  "name": "wit-demo",
  "description": "wit app demo",
  "version": "0.0.1",
  "private": true,
  "dependencies"  : { "futures": ">=2.1.0" }
}
```

We are using a [Future][future] library to make our code cleaner. After creating this package.json you need
to execute inside a console :

```bash
wit-demo$ npm install
```

This will install the dependencies for our project.

#### The app.js file

The app.js file is where the main application will be. For now let's just create a simple http server that will return
"Hello world".

``` javascript
var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(8766, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8766/');
```

You should now be able to start your server
``` bash
wit-demo$ node app.js
```

and go to [Local Server][localserver]

``` html
Hello World
```

To stop your server you need to kill the node application `ctrl-c` inside your terminal

Request to Wit API
------------------

The Wit API has been build based on a single endpoint :

``` html
https://api.wit.ai/
```

### Authentication

Wit API is using an OAuth authentication system. Every request should contains the Authorization header containing your
acccess token that can be found in [Wit Console > Settings page][console_settings]

The Header of all your http request against Wit API should look like :

``` html
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

For the purpose of this demo we will use the following access token

``` html
FSN2DG6YY64JD2T6WG5D6NVIXWU2F2QK
```

### The Hello World example

Wit API contains multiple action but only one is enough to get started. This endpoint takes as parameter a user text
and Wit will interpret this user text to a machine meaning.

``` html
/message?q=Hello%20World
```

We will now change our node.js application to request wit for every request made on our server.
To make the code clearer we create another file using the following command form the root of our nodejs application

``` bash
wit-demo$ touch wit.js
```

This file will look like :

``` javascript
var https = require('https');
var Future = require('futures').future;

var request_wit = function(user_text) {
    var future = Future.create();
    var options = {
        host: 'api.wit.ai',
        path: '/message?q=' + encodeURIComponent(user_text),
        //This is the Authorization header added to access your Wit account
        headers: {'Authorization': 'Bearer FSN2DG6YY64JD2T6WG5D6NVIXWU2F2QK'}
    };
    https.request(options, function(res) {
        var response = '';
        res.on('data', function (chunk) {response += chunk;});
        res.on('end', function () {
            future.fulfill(undefined, JSON.parse(response));
        });

    }).on('error', function(e) {
            future.fulfill(e, undefined);
        }).end();
    return future;
}

module.exports.request_wit = request_wit;
```

We can now update our app.js to use this new module :

``` javascript
var http = require('http');
var wit = require('./wit');
var url = require('url');

http.createServer(function (req, res) {
    var queryObject = url.parse(req.url,true).query;
    var wit_request = wit.request_wit(queryObject.text);
    wit_request.when(function(err, response){
        if (err) console.log(err)//Manage Error here
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(response));
    });
}).listen(8766, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8766/');
```

Now let's restart our server

``` bash
wit-demo$ node app.js
```

and go to our [Local Server][localserver_hello]

We have in this response 3 differents informations :

* `msg_id`: a unique message id assigned by Wit for every request
* `msg_body`: the user text interpreted by Wit
* `outcome`: the outcome of the interpretation. Inside this outcome you will find the `intent` of the user, some
`slots` and a level of `confidence` about the interpretation done by Wit.

```json
{
   "msg_id":"48ca3bbf-47d6-4b85-8e40-8532a4a676b5",
   "msg_body":"Hello World",
   "outcome":{
      "intent":"hello",
      "slots":[],
      "confidence":0.9864419291503023
   }
}
```

### The Joke Example

Now we need to make our server answer a joke whenever the user ask for one. Let's try to ask Wit API for a joke
[Joke Request][localserver_joke]

```json
{
   "msg_id":"c1e2435d-6ed4-4578-b6f2-53493f67d1a8",
   "msg_body":"give me a joke",
   "outcome":{
      "intent":"goodbye",
      "slots":[],
      "confidence":0.6286263044076409
   }
}
```

We see that this intent was not recognize correctly by the system. To fix this problem you need go into your
[Wit Console Inbox][console_inbox] and correct the system on the user text we just entered. At the same time we
will add some variations for this new intent by going to the [Wit intent page][console_intent]

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/fix_joke.png" alt="Fix Joke" style="width: 600px;"/>

Let's add those following variations :

 * tell me a joke
 * do you know a joke
 * do you know something fun

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/add_variations_joke.png" alt="Fix Joke" style="width: 600px;"/>

And let's ask again our local server [Joke Request][localserver_joke]. We see that the user text was now correctly
interpreted byt Wit.

``` json
{
   "msg_id":"78e3ad29-cd39-4ea6-bf1f-a1ea75aac264",
   "msg_body":"give me a joke",
   "outcome":{
      "intent":"tell_joke",
      "slots":[],
      "confidence":0.9948950613841209
   }
}
```

We need now to change our server so that we send back a joke to the end user. To do so we are going to create a new file
to request for a joke to the [ICNDb][icndb].

```bash
wit-demo$ touch joke.js
```

This file will include a basic http get to the [ICNDb][icndb] server

``` javascript
var http = require('http');
var Future = require('futures').future;

var get_joke = function() {
    var future = Future.create();
    http.get("http://api.icndb.com/jokes/random", function(res) {
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
```

We also need to change the app.js to read the response from wit, switch/case on the intent founded by the interpretation
and executing the correct behavior based on the intent. The app.js file looks now like this.

``` javascript
var http = require('http');
var wit = require('./wit');
var joke = require('./joke');
var url = require('url');

http.createServer(function (req, res) {
    var queryObject = url.parse(req.url,true).query;
    var wit_request = wit.request_wit(queryObject.text);
    res.writeHead(200, {'Content-Type': 'text/plain'});
    wit_request.when(function(err, wit){
        if (err) console.log(err)//Manage Error here
        switch (wit.outcome.intent)
        {
            case "hello":
                res.end("Hello, how are you?");
                break;
            case "tell_joke":
                joke.get_joke().when(function(err, the_joke){
                    res.end(the_joke);
                });
                break;
        }

    });
}).listen(8766, '127.0.0.1');

console.log('Server running at http://127.0.0.1:8766/');
```

Let's ask the system for a joke again. However we are going to use another text input `a joke please?` to check that
Wit can interpret correctly sentence that have not been adding as variation in [Console][console_intent].

[do you know a joke? >][localserver_funny]

```
Don't worry about tests, Chuck Norris's test cases cover your code too.
```

### Adding a slot to the Joke Example

[ICNDb][icndb] allow us to ask for a specific category of joke. The list of categories available can be found here:

```json
GET http://api.icndb.com/categories
{ "type": "success", "value": [ "explicit", "nerdy" ] }
```

We will now change our intent to be able to retrieve this piece of information from the user Input. to do so we will
go to the [tell_joke intent page][console_intent] and add a 2 new variations by typing in the `Type an example` input
as follow :

 * I want a nerdy joke
 * do you have any explicit joke?

Then you need to click on the first one added. In this page concerning the 'I want a nerdy joke' variation we will
select the word 'nerdy' with our mouse. A popin should open and you should be able to write 'category' in it. It will
tell the system that this word defined the category of the joke. We call it a slot. Then press `Enter` and a second
popin appears. The second popin is here to defined the type of the slot. Here we want a new type not listed yet.
We then write 'joke_categories' as a type and press enter.

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/add_variation_slot_category.png" alt="Fix Joke" style="width: 600px;"/>

A new line is added to the variation's page and we have now
to tell the system the value of the category that correspond to the word nerdy. As we are lazy we decide to call it
'nerdy'. Now we validate our variation and go to the second variation 'do you have any explicit joke?' by clicking on it.

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/variation_added_with_slot_displayed.png" alt="Fix Joke" style="width: 600px;"/>

We do the same for the 'explicit' word present in the variation. As we already gave information about the type of the
'category' slot the system doesn't ask us again. We just have to select the type and enter the value for this word.
Again let's be lazy and put explicit as the value and validate our variation.

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/2nd_variation_with_slot.png" alt="Fix Joke" style="width: 600px;"/>

Let's add another variation 'Do you have any joke about nerds and chuck?' and select the word nerds which will be a
'category' slot and the value will be 'nerdy' as it means the same for the end system.

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/3rd_variation_with_slot_and_same_value.png" alt="Fix Joke" style="width: 600px;"/>

Now let's try this with the system. In the [console][console] you are always invited to test some sentence to check
if the system works properly with your current configuration. You have a 'Try out a sentence' box where for our example
we will type 'Do you have any nerds joke ?'. The system recognize immediatly that the intent of this sentence is
'tell joke' and find out that there was a category added as well. It recognize the value of the category to be 'nerdy'
which is exactly what we want.

> <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/test_sentence_for_slot.png" alt="Fix Joke" style="width: 600px;"/>

The next step is to use this information in our application to request specific joke based on the slot category.
When you request the sentence 'Do you have any nerds joke ?' directly to Wit API you will get in response the following
json. In this json you can see that the 'slots' table has 1 element which correspond to the slot 'category' define here
by the word 'nerds' present in the sentence.

```json
{
   "msg_id":"5491ac27-8ed9-41cb-a9d8-ac736d381996",
   "msg_body":"Do you have any nerds joke ?",
   "outcome":{
      "intent":"tell_joke",
      "slots":[
         {
            "end":21,
            "start":16,
            "name":"category",
            "type":"joke categories",
            "value":"nerdy",
            "body":"nerds"
         }
      ],
      "confidence":0.99508656112909
   }
}
```

Let's change our `app.js` to retrieve this information and send it to our joke module (we will change the joke module
at the same time). The case when the intent is "tell_joke" will now look like this.
```javascript
...
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
...
```

The `joke.js` function will now start like this to take into account the category:

```javascript
...
var get_joke = function(cat) {
    var future = Future.create();
    var url = "http://api.icndb.com/jokes/random";
    if (cat) {
        url += "?limitTo=[" + cat + "]";
    }
    http.get(url, function(res) {
        var response = '';
...
```

We can now either request :

 * [a 'nerdy' joke >][localserver_joke_nerdy]

 * [an 'explicit' one >][localserver_joke_explicit]

### The datetime slot

[Console][console] comes with predefined type of slot so the user doesn't have to manage everything himself. One of the
type is `datetime`. For example when a client send a request with "Send me a joke in 2 hours",
the system should be able to recognize the time and send it back to the client. Let's say we want to have our service
send us a response but at a later date. We would need to manage request like :

 * Send me a nerdy joke in 2 hours.
 * Give me an explicit joke tomorrow at 9am.
 * I want to receive a joke Tuesday next week at 8pm.

If you have added a 'datetime' slot for your 'tell joke' intent, the system will automatically manage those date for you
Let's take the last example here 'I want to receive a joke Tuesday next week at 8pm'. Knowing that I've requested this
sentence on Tuesday July 2nd and that I've called my slot 'when'. We can see that the result of the called as correctly
recognized the date in the input and give us the value of this date.

```json
{
   "msg_id":"40a87a7c-4c05-4e21-bff1-754cece0aa2d",
   "msg_body":"I want to receive a joke Tuesday next week at 8pm",
   "outcome":{
      "intent":"tell_joke",
      "slots":[
         {
            "end":49,
            "start":25,
            "name":"when",
            "type":"datetime",
            "value":{
               "from":"2013-07-09T20:00:00.000-07:00",
               "to":"2013-07-09T20:01:00.000-07:00"
            },
            "body":"Tuesday next week at 8pm"
         }
      ],
      "confidence":0.9957657847401923
   }
}
```

If we request the same using the [console ui][console] we can see that the correct group of word have been recognized

>  <img src="https://raw.github.com/wit-ai/wit-demo/gh-pages/img/joke_datetime_ui_example.png" alt="Fix Joke" style="width: 600px;"/>

You can now try it for yourself and implement the server that would send you a joke at the time asked.

Heroku integration
------------------

We will quickly deploy our application on heroku so we are able to respond to request not only locally.
To do so

Twilio integration
------------------

The next step for our service is to be integrated to Twilio to receive and send SMS.

[localserver]: http://127.0.0.1:8766/
[localserver_hello]: http://127.0.0.1:8766/?text=Hello%20World
[localserver_joke]: http://127.0.0.1:8766/?text=give%20me%20a%20joke
[localserver_joke_nerdy]: http://127.0.0.1:8766/?text=Do%20you%20have%20any%20nerds%20joke%20%3F
[localserver_joke_explicit]: http://127.0.0.1:8766/?text=any%20explicit%20joke%20in%20stock%3F
[localserver_funny]: http://127.0.0.1:8766/?text=a%20joke%20please
[console]: https://console.wit.ai/
[console_settings]: https://console.wit.ai/#/settings
[console_inbox]: https://console.wit.ai/#/inbox
[console_intent]: https://console.wit.ai/#/intents/tell_joke
[future]: https://github.com/coolaj86/futures/tree/v2.0/future
[icndb]: http://www.icndb.com/api/