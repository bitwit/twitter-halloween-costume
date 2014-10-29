var fs = require('fs');
var Twit = require('twit');
var io;

var options = {
    "credentials": {
        "consumer_key": "lXbQ5pIa8nGjO6CeG1qrmggfQ",
        "consumer_secret": "G0HroY5xaiaRaEWRdgXVmji8zcO7tQVg41Nw4ASh4gORZWJx5N",
        "access_token": "904900248-dws5MxAG5UnG69rjM8SEaSPoDYSFosJTG2Lr8lCR",
        "access_token_secret": "TvHy5MtlVBKPvcQHJUJGjmYMuzProzGTAPMid88TQaTgy"
    },
    "account": {
        "screen_name": "irtu4fun"
    }
};
var T = new Twit(options.credentials);

// Setup
var timeOfLastTweet = null;
var unfilteredTweets = [];
var lastTweet = null;
var newTweet = null;

fs.readFile("last-tweet.json", 'utf8', function (err, data) {
    if (!err) {
        lastTweet = JSON.parse(data);
    }
});



var addUnfilteredTweet = function (tweet) {
    var now = new Date().getTime();
    //if our array is small an there has been no tweet in the last 15 seconds
    if(unfilteredTweets.length === 0 && now - timeOfLastTweet > 15000){
        return doRetweet(tweet);
    }

    unfilteredTweets.push(tweet);
    if(unfilteredTweets.length > 10){
        unfilteredTweets = unfilteredTweets.splice(Math.max(unfilteredTweets.length - 5, 1));
    }
    console.log('Tweet queue', unfilteredTweets.length);
};

var doRetweet = function(tweet){
    timeOfLastTweet = new Date().getTime();
    console.log('retweet this ->', tweet.text);
    writeLastTweet(tweet);
    //T.post('statuses/retweet/:id', { id: tweet.id_str }, function (err, data, response) {
    //});
};

var evaluateTweet = function () {
    if (newTweet != null) {
        writeLastTweet(newTweet);
    }
};

var writeLastTweet = function (tweet) {
    lastTweet = tweet;
    fs.writeFile("last-tweet.json", JSON.stringify(tweet), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Latest Tweet -> ", tweet.text);
            io.emit('tweet', tweet);
        }
    });
};

var tickMonitor = function () {
    if(unfilteredTweets.length){
        var tweetToRT = unfilteredTweets.splice(Math.floor(Math.random * unfilteredTweets.length), 1);
        doRetweet(tweetToRT[0]);
    }
    setTimeout(tickMonitor, 10000);
};

var start = function (server) {
    io = require('socket.io')(server);
    tickMonitor();
    //Monitor a hashtag
    var stream = T.stream('statuses/filter', { track: 'halloween' });
    stream.on('tweet', function (tweet) {
        addUnfilteredTweet(tweet);
    });
};

module.exports = start;