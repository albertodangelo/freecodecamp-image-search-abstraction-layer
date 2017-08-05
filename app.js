var express = require('express');
var app = express();
var GoogleImages = require('google-images');
var mongodb = require('mongodb').MongoClient;
var config = require('./config');
var path = require('path');

// Provide Google CSE-ID and API KEY 
const client = new GoogleImages(config.CREDENTIALS.googleSearchId, config.CREDENTIALS.googleApiId );

// connect to MongoDB
var url = config.CREDENTIALS.mongodb;

// Static HTML page if no param sent to server
app.use(express.static(path.join(__dirname, 'public')));

// Avoid wrong data in Mongo due to browser Favicon lookup as URL Param
app.get('/favicon.ico', function(req, res) {
    res.status(204);
});


// GOOGLE IMAGE SERACH
app.get('/api/search/:search_term', function(req, res){

	var searchterm = req.params['search_term'];
	var query = req.query;
	var offset = 1;

	// write search term to MongoDB
	mongodb.connect(url, function( err, db ){
				
		if(err) throw err;

		var collection = db.collection('googleImageSearchTerms');
		
		var doc = {term:searchterm, time: Date()}
		collection.insert(doc, function(err, data) {
			if (err) throw err;
		//	console.log(JSON.stringify(doc));
			db.close();
		})
	});

	// proceed google search
	if(query.offset) {
		offset = query.offset
	}

	client.search(searchterm, {page:offset})
	.then( function(images){
		//console.log(images);
		res.send(JSON.stringify(images));
	});
	
});



// LAST SEARCH STATISTICS
app.get('/api/lastsearch/', function(req, res){

	mongodb.connect(url, function( err, db ){
				
		if(err) throw err;

		var collection = db.collection('googleImageSearchTerms');
		

		collection.find({},{
			term:1,
			time:1,	
			_id:0
		}).sort({"time": -1}).limit(10).toArray(function(err, docs){
			if(err)throw err;
			
			res.send(JSON.stringify(docs));
			db.close();
		});
	});

	
});

app.listen(3000);

// paginate results
//client.search('Steve Angello', {page: 10});

// search for certain size
//client.search('Steve Angello', {size: 'large'});

