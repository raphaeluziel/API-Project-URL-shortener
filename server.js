'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var cors = require('cors');

// For validating the URL's
const dns = require('dns');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;


/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, { useMongoClient: true });

// mongoose promise library
mongoose.Promise = global.Promise;

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({'extended': false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


var Schema = mongoose.Schema;

var urlSchema = new Schema({
  original: {type: String, required: true},
  ipaddress: {type: String, unique: true},
  short: {type: Number, unique: true}
});

var urlModel = mongoose.model('urlModel', urlSchema);

app.route('/api/shorturl/new').post(function(req, res){
  
  var host = req.body.url;

  // If URL does not begin with http(s):// or www. then it's not a valid URL
  if((host.search(/http:\/\//) < 0) && (host.search(/https:\/\//) < 0) && (host.search(/www\./) < 0)){
    res.json({"error": "invalid URL"});
  }
  // If it IS a valid URL, remove the protocol and the www
  else{
    var host = host.replace(/^https:\/\//, "").replace(/http:\/\//, "").replace(/\/.*$/, "");

    // Look up the url to see if it valid
    dns.lookup(host, function(error, ipaddress, ipfamily){
        if(error){
          res.json({"error": "URL not found"});
        }
        // If valid, then create or find the short URL
        else{
          shortUrl(ipaddress);
        }
      });
  }

var shortUrl = function(ipaddress){
  
  // See if the ip address is already in the database
  var query = urlModel.findOne({ipaddress: ipaddress});
  
  query.then(function(doc){
    
    // If it is not already in the database, create a new short url
    if (!doc) {
      
      // Find the highest number used thus far for your short urls
      var findHighestIndex = urlModel.find({}).sort({short: -1}).limit(1);
      findHighestIndex.then(function(doc){
        // If the database is empty, the short url will be 1
        if (!doc[0]) {
          var newUrl = new urlModel({original: req.body.url, ipaddress: ipaddress, short: 1});
          newUrl.save().then(function(doc){
            res.json({"original-url": req.body.url, "short-url": 1, "IP": ipaddress});
          });
        }
        // Otherwise, add 1 to highest short url to form the next short url
        else{
          var newUrl = new urlModel({original:req.body.url, ipaddress: ipaddress, short: doc[0].short + 1});
          newUrl.save().then(function(doc){
            res.json({"original-url": req.body.url, "short-url": doc.short, "IP": ipaddress});
          });
        }
      });
    }
    // If the url's ip address is already in the database, then retrieve it!
    else{
      res.json({"original-url": doc.original, "short-url": doc.short, "IP": ipaddress});
    }
  });
}

});

// This section will redirect the user to the apropriate website
// when they use the shortened url in the browser
app.route('/api/shorturl/new/:data_string?').get(function(req, res){
  
  // Extract the shortened URL number (counter) from the full URL
  var shortUrl = req.path.replace("/api/shorturl/new/", "");
  
  // Find that short url in the database
  var query = urlModel.findOne({short: shortUrl});
  
  query.then(function(doc){
    // If no short url has been generated for this website yet, let user know
    if (!doc) {
      res.json({"message": "no url with this short url exists yet"});
    }
    // Otherwise redirect to the ip address of the shortened URL
    else{
      res.redirect(doc.original);
    }
  });  
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
