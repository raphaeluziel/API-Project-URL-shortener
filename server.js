'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

// Not sure but I added this:
const assert = require('assert');

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
  
  URL.findOne({original: req.body.url}, function(err, data){
    
    if(data == null) {
      
      console.log('none found');
      

        console.log('entering chain');
        var x = URL.find({})
        .sort({short: -1})
        .limit(1)
        .exec(function(err, dataP, next){
          if (err) return console.log('ERROR ON CHAIN')
          console.log('the answer is: ', dataP[0].short);
        });
        
      
      var newRecord = new URL({
        original: req.body.url,
        short: 200001
      });
      
      console.log(newRecord, 'need to create one');
      
      newRecord.save(function(err, doc){
        if (err) return console.log('ERROR');
        console.log('creating a new record with: ', doc.original);
        res.json({"Original_URL": doc.original, "Short_URL": doc.short});
      });     
      
    }
    
    else{
      console.log('found it');
      res.json({"Original_URL": data.original, "Short_URL": data.short});
    }

    
  });
  
  
});



app.listen(port, function () {
  console.log('Node.js listening ...');
});
