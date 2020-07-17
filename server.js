//import required libraries
const express = require('express');
const fs = require('fs');
const path = require('path');
const Datastore = require('nedb');
const { RSA_NO_PADDING } = require('constants');
const { time } = require('console');

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


app.get('/home',(req,res) => {
    res.contentType('.html');
    fs.readFile('activedata.html', (error, data) => {
        console.log('sent activedata.html to ', req.ip);
        res.send(data);
    });
})

app.get('/',(req,res) => {
    res.redirect('/home/');
    console.log('redirected to /home');
    res.end();
});

app.post('/home/api/update/', (req,res) => {

    //setup required variables
    var error = true;
    var status = 0;
    const timestamp = Date.now();
    var auth = req.body.pass == "nicehacks";
    var success = "failed to store values, internal server error";

    //log incoming data
    console.log('api request for json sent by ', req.ip);
    console.log('req body : ', req.body); 
    console.log('req timestamp : ' , timestamp);

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
        errordb.insert({
            timestamp : timestamp,
            ip : req.ip,
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

app.post('/home/api/test/', (req,res) => {

    console.log('test request to api for json');

    var status = 0;
    var error = "";

    console.log(req.body);
});

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

app.get('/api/app/get/', (req, res) => {

});

function addData(req, res)
{
    var dataBase = JSON.parse(fs.readFile('test.json'));
    var input = {
        "title" : req.body.title,
        "des" : req.body.des
    }
    dataBase.addData(input);
}

module.exports = router;