(function() {
"use strict";
var _ = require("lodash");
var striptags = require('striptags');
var cheerio = require('cheerio');
var express = require("express");
var express_app = express();

var Alexa = require('alexa-app');
var app = new Alexa.app('savagelove');

var FeedParser = require('feedparser');
var feedparser = new FeedParser();
var request = require('request');
var req = request('http://www.thestranger.com/seattle/Rss.xml?author=259'); //gets articles by author 'Dan Savage' from rss feed

//for letters to be assembled
var letter = {};
//yesterday's letter
var yesterday = {};
//random letter
var randomletter = {};
//launch alexa 
app.launch(function(req, res) {
	var prompt = "Which letter would you like to listen to? You can say today's, or yesterday's.";
	res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent("getletteroftheday", {
    "slots": { "date": "letterdays" },
    //alexa-app will use this to construct utterance combinations
    'utterances': ['{get|get me|find|play|play me|read|read me} {-|date} {the} {letter|savage love|letter of the day|savage love letter of the day} {for} {-|date}']
  },
function(request, response) {
	var date = request.slot("date");
	var reprompt = "Would you like to listen to today's letter, or yesterday's?";

	if(_.isEmpty(date)) {
		var prompt = "I didn't hear that. Would you like to hear today's letter, or yesterday's?";
		response.say(prompt).reprompt(reprompt).shouldEndSession(false);
		return true;
	} 

	if(date == "today" || date == "today's") {
		response.say("Here's today's letter of the day. " + letter.question + " Signed, " + letter.signed + " (" + letter.acronym + ") " + letter.answer);
	}

	if(date == "yesterday" || date == "yesterday's") {
		response.say("Here's yesterday's letter of the day. " + yesterday.question + " Signed, " + yesterday.signed + " (" + yesterday.acronym + ") " + yesterday.answer);
	}

	if(date == "random" || date == "random letter") {
		response.say("Here's a random letter for you." + randomletter.question + " Signed, " + randomletter.signed + " (" + randomletter.acronym + ") " + randomletter.answer);
	}
});

// connect the alexa-app to AWS Lambda
exports.handler = app.lambda();

//handle 'request' errors 
req.on('error', function (error) {
  // handle any request errors 
});
 
//sets up feedparser
req.on('response', function (res) {
  var stream = this; // `this` is `req`, which is a stream 

  if (res.statusCode !== 200) {
    this.emit('error', new Error('Bad status code'));
  }
  else {
    stream.pipe(feedparser); //get RSS data as soon as app launches?
  }

});
 
feedparser.on('error', function (error) {
  // always handle errors 
});

feedparser.on('readable', function(req, res) {
	var stream = this;
	var post;

	while (post = stream.read()) {
		
	var dateNow = new Date();
	var dateNowParse = dateNow.toString().split('2017')[0];
	var letterdate = post.pubDate.toString().split('2017')[0];
	 	
	 	if (post.title.includes("Letter of the Day")) {
	 		//temporary hard-coded value, just for testing purposes
	 		if (letterdate.includes('Apr 11')) {
			
				letter.title = post.title.split("Letter of the Day:")[1];
				
				var questy = post.description;
				var questionBreaks = striptags(questy);
				letter.questy = questionBreaks.replace(/\r?\n|\r/g, " ");
				var fulltextbody = letter.questy.replace(String.fromCharCode(92),String.fromCharCode(92,92));

				
				//cheerio is essentially jquery for server, hence the dollar sign
				var $ = cheerio.load(post.description);
				//letter signee is usually, though not always, the last <em>...</em> element in the blockquote tag
				//var signed = $( "blockquote" ).first().find( "em" ).last().text();
				letter.signed = $( "blockquote" ).first().find( "p em" ).text();
				var splitletter = fulltextbody.split(letter.signed);
				letter.question = splitletter[0];
				letter.answer = splitletter[1];
				
				var letters = letter.signed.split(" ").map(function(post) {
					var firstletter = post[0];
					return firstletter;
				});
				//converts first letters of each word into acronym and strips commas, needed to identify the signee of the letter
				var signee = letters.toString().replace(/,/g,"");

				
				//combine these regular expressions -- this one gets rid of special characters 
				letter.acronym = signee.replace(/[^\w\s]/gi, "");
			
		 	}

		 	//yesterday's letter, hardcoded for now, just for prototyping
		 	if (letterdate.includes("Apr 10")) {

				yesterday.title = post.title.split("Letter of the Day:")[1];
				
				var questy = post.description;
				var questionBreaks = striptags(questy);
				yesterday.questy = questionBreaks.replace(/\r?\n|\r/g, " ");
				var fulltextbody = yesterday.questy.replace(String.fromCharCode(92),String.fromCharCode(92,92));

				
				//cheerio is essentially jquery for server, hence the dollar sign
				var $ = cheerio.load(post.description);
				//letter signee is usually, though not always, the last <em>...</em> element in the blockquote tag
				//var signed = $( "blockquote" ).first().find( "em" ).last().text();
				yesterday.signed = $( "blockquote" ).first().find( "p em" ).text();
				var splitletter = fulltextbody.split(yesterday.signed);
				yesterday.question = splitletter[0];
				yesterday.answer = splitletter[1];
				
				var letters = yesterday.signed.split(" ").map(function(post) {
					var firstletter = post[0];
					return firstletter;
				});


				//converts first letters of each word into acronym and strips commas, needed to identify the signee of the letter
				var signee = letters.toString().replace(/,/g,"");

				//combine these regular expressions -- this one gets rid of special characters 
				yesterday.acronym = signee.replace(/[^\w\s]/gi, "");
		 	}

		 	//yesterday's letter, hardcoded for now, just for prototyping
		 	if (letterdate.includes("Mar 28")) {

				randomletter.title = post.title.split("Letter of the Day:")[1];
				
				var questy = post.description;
				var questionBreaks = striptags(questy);
				randomletter.questy = questionBreaks.replace(/\r?\n|\r/g, " ");
				var fulltextbody = randomletter.questy.replace(String.fromCharCode(92),String.fromCharCode(92,92));

				
				//cheerio is essentially jquery for server, hence the dollar sign
				var $ = cheerio.load(post.description);
				//letter signee is usually, though not always, the last <em>...</em> element in the blockquote tag
				//var signed = $( "blockquote" ).first().find( "em" ).last().text();
				randomletter.signed = $( "blockquote" ).first().find( "p em" ).text();
				var splitletter = fulltextbody.split(randomletter.signed);
				randomletter.question = splitletter[0];
				randomletter.answer = splitletter[1];
				
				var letters = randomletter.signed.split(" ").map(function(post) {
					var firstletter = post[0];
					return firstletter;
				});


				//converts first letters of each word into acronym and strips commas, needed to identify the signee of the letter
				var signee = letters.toString().replace(/,/g,"");

				//combine these regular expressions -- this one gets rid of special characters 
				randomletter.acronym = signee.replace(/[^\w\s]/gi, "");
		 	}
		}
		
	}

});



module.exports = app;
})();
