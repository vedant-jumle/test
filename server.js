//import required libraries
const express = require('express');
const fs = require('fs');
const path = require('path');
const Datastore = require('nedb');
const { RSA_NO_PADDING } = require('constants');
const { time } = require('console');
const pass_auth = 'nicehacks';

//setup express
const app = express();
const router = express.Router();
const port = process.env.PORT || 80;

//setup error.db
const errordb = new Datastore('error.db');
errordb.loadDatabase();

//setup database.db
const database = new Datastore('database.db');
database.loadDatabase();

//start server
app.listen(port, () => {
    console.log('listening to port : ', port);
    console.log('server started');
});
app.use(express.static('public'));
app.use(express.json({limit : '1mb'}));

//route to get the home page
app.get('/home',(req,res) => {
    res.contentType('.html');
    fs.readFile('activedata.html', (error, data) => {
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log('sent activedata.html to ', ip);
        res.send(data);
    });
})

//route for the default home page
app.get('/',(req,res) => {
    res.redirect('/home/');
    console.log('redirected to /home');
    res.end();
});


//route to update the database
app.post('/home/api/update/', (req,res) => {

    //setup required variables
    var error = true;
    var status = 0;
    const timestamp = Date.now();
    var auth = req.body.pass == "nicehacks";
    var success = "failed to store values, internal server error";
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //log incoming data
    console.log('api request for json sent by ', ip);
    console.log('req body : ', req.body); 
    console.log('req timestamp : ' , timestamp, "\n");

    //setup data to store in database.db
    const storeValue = {
        timestamp: timestamp,
        title : req.body.title,
        des : req.body.des
    };
    
    //check if sent password is correct
    if(auth)
    {
        //insert the req data in database.db
        database.insert(storeValue);
        success = "values stored";
        error = false;
    }
    else{
        //insert the error in error.db
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        errordb.insert({
            timestamp : timestamp,
            ip : ip,
            pass : req.body.pass
        });
    }

    //setup data which has to be sent to client in res.body
    var sendValue = {
        timestamp : timestamp,
        status : success,
        error : error
    };

    res.send(sendValue);
});


//route to test the api (not implemented)
app.post('/home/api/test/', (req,res) => {

    console.log('test request to api for json');

    var status = 0;
    var error = "";

    console.log(req.body);
});


//route to fetch all values in the database
app.get('/api/get/', (req,res) => {
    res.contentType('application/json');

    var res_json = {};
    database.find({}, (error, data) => {
        if(error)
        {
            res.send({error : error});
            console.log(error);
            return;
        }else{
            res.send(data);
        }
    });
});


//dedicated route for the android and ios apps
app.get('/api/app/get/', (req, res) => {

});

//route for reseting the database
app.post('/api/reset/', (req,res) => {
  res.contentType("application/json");
  
  var response;
  var auth = req.body.pass == pass_auth
  if(auth)
    {
      database.remove({},{multi : true}, (error, numRemoved) => {
        if(error)
          {
            response = {
              error : error,
              status : "failed to clear database.db"
            };
          }
        else
          {
            response = {
              error : 'no error',
              status : "cleared data"
            };
            
          }
      });
      errordb.remove({},{multi:true}, (error, numRemoved) => {
        if(error)
          {
            response = {
              error : error,
              status : "failed to clear error.db"
            };
          }
        else
          {
            response = {
              error : 'no error',
              status : "cleared data"
            };
            
          }
      });
    }
  res.send(response);
})


//route to download database.db
app.post('/api/download/database/', (req,res) => {
  console.log('database requested');
  
  const auth = req.body.pass == pass_auth;
  var response = {status : false};
  
  if(auth){
    response.status = true;
    //res.download("./database.db");
  }
  
});


//route to download error.db
app.post('/api/download/error/', (req,res) => {
  console.log('errors requested');
  
  const auth = req.body.pass == pass_auth;
  var response = {status : false};
  res.contentType('application/json');
  res.send(response);
});


module.exports = router;