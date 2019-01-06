'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;


/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect(process.env.MONGO_URI, { useMongoClient: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({'extended': false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


var Schema = mongoose.Schema;

var url = new Schema({
  original: {type: String, required: true},
  short: {type: Number, unique: true}
});

var URL = mongoose.model('URL', url);

app.route('/api/shorturl/new').post(function(req, res){
  
  var query = URL.findOne({original: req.body.url});
  
  query.then(function(doc){
    
    if (!doc) {
      var findHighestIndex = URL.find({}).sort({short: -1}).limit(1);
      findHighestIndex.then(function(doc){
        if (!doc[0]) {
          var newUrl = new URL({original: req.body.url, short: 1});
          newUrl.save().then(function(doc){
            res.json({"original-url": req.body.url, "short-url": 1});
          });
        }
        else{
          var newUrl = new URL({original:req.body.url, short: doc[0].short + 1});
          newUrl.save().then(function(doc){
            res.json({"original-url": req.body.url, "short-url": doc.short});
          });
        }
        
      });
    }
    else{
      res.json({"original-url": doc.original, "short-url": doc.short});
    }
  });
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});
