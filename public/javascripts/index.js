angular.module('appModule', ['btford.socket-io'])
    .directive('animateShow', function () {
        return function (scope, elm, attrs) {
            elm.addClass('transitioned faded-hide');
            setTimeout(function () {
                elm.addClass('faded-show');
                elm.removeClass('faded-hide');
            }, 200);
        };
    })

    .factory('mySocket', function (socketFactory) {
        return socketFactory();
    })

    .controller('TweetController', function ($scope, $sce, $http, mySocket) {
        mySocket.on('tweet', function (ev, data) {
            console.log('event, data', ev, data);
        });

        $scope.tweets = [];
        $scope.pulses = 1;
        $scope.pulseCount = $scope.pulses; // do it once right away
        $scope.interval = 5000; // 5 secs * 9 pulses = 45secs
        $scope.mediaOrientation = 'landscape';
        $scope.update = function () {
            $scope.pulseCount++;
            console.log('update', $scope.pulseCount);
            if ($scope.pulseCount < $scope.pulses) {
                $scope.$apply();
                return; //update every 6th pulse, a.k.a 30
            }
            $scope.pulseCount = 0;
            $http.get('/lastTweet')
                .then(function (response) {
                    if ($scope.tweets.length > 0 && response.data.id == $scope.tweets[0].id)
                        return; //is same tweet
                    $scope.tweets = [];
                    var theTweet = response.data;
                    if (theTweet.retweeted_status !== undefined)
                        theTweet = theTweet.retweeted_status;

                    console.log('the tweet', theTweet);

                    if (theTweet.entities.media && theTweet.entities.media.length > 0) {
                        var size = theTweet.entities.media[0].sizes.small;
                        if (size.h > size.w) {
                            $scope.mediaOrientation = 'portrait';
                        } else if (size.w > size.h) {
                            $scope.mediaOrientation = 'landscape';
                        } else {
                            $scope.mediaOrientation = 'square';
                        }
                    }

                    $scope.tweets.push(theTweet);
                });
        };
        $scope.update();
        setInterval($scope.update, $scope.interval);
        $scope.prettyDate = function (tweet) {
            return prettyDate(tweet.created_at);
        };
        $scope.tweetBody = function (tweet) {
            var html;
            html = tweet.text.replace(/((https?|s?ftp|ssh)\\:\/\/[^"\s\<\>]*[^.,;'">\:\s\<\>\)\]\!])/g, function (F) {
                return '<a target="_blank" href="' + F + '">' + F + "</a>";
            }).replace(/\\B@([_a-z0-9]+)/ig, function (F) {
                return F.charAt(0) + '<a target="_blank" href="http://www.twitter.com/' + F.substring(1) + '">' + F.substring(1) + "</a>";
            }).replace(/\\B#([_a-z0-9]+)/ig, function (F) {
                return F.charAt(0) + '<a target="_blank" href="http://www.twitter.com/#!/search?q=' + F.substring(1) + '">' + F.substring(1) + "</a>";
            });
            return $sce.trustAsHtml(html);
        };
    });

function prettyDate(time) {
    var date = new Date(time.replace(/-/g, "/").replace("T", " ").replace("+", " +")),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
    if (isNaN(day_diff) || day_diff < 0)    return;
    if (day_diff == 0) {
        if (diff < 60) return Math.floor(diff) + "s";
        if (diff < 120) return "1m";
        if (diff < 3600) return Math.floor(diff / 60) + "m";
        if (diff < 7200) return "1h";
        if (diff < 86400) return Math.floor(diff / 3600) + "h";
    }
    else {
        if (day_diff == 1)
            return "1d";
        if (day_diff < 7)
            return day_diff + "d";
        if (day_diff == 7)
            return "1w";
        if (day_diff > 7)
            return Math.ceil(day_diff / 7) + "w";
    }
}
