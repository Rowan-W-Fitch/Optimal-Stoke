const http = require('http');
const fs = require('fs');
const express = require('express');
const env = require('dotenv');
env.config();
const path = require('path');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());
//for html templating
app.engine('html', require('ejs').renderFile);

//for the db
const {Pool} = require('pg');
//db connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB,
  password: process.env.DB_PASS,
  port:5432,
})

//home page get request

//ryan and riley: the render function tells node.js that you want to display an html file,
//so on line 33, I'm telling node.js that I want it to display an html file called 'yo.html'
router.get('/', function(req, res){
  res.render(path.join(__dirname + '/yo.html'), {err:""});
});


/* begin the helper functions and router function for homepage post request */

//helper function to check if passwords match
function passVal(p1, p2){
  if(p1 == p2) return true;
  else return false;
}

//helper function to query db of all usernames
async function queryUserNames(usr){
  try{
    const res = await pool.query(`SELECT exists(SELECT 1 FROM test WHERE username = '${usr}' LIMIT 1)`);
    return res.rows;
  }
  catch (err){
    return err.stack;
  }
}

//helper function to see if username is inside query list
async function userExists(username){
  var query = await queryUserNames(username);
  return query[0].exists;
}

//helper function to insert new username, password into db
async function insertUsrPass(p1, p2, usr){
  var passMatch = passVal(p1,p2);
  var usrExists = await userExists(usr);
  if (passMatch && !usrExists){

    pool.query(`INSERT INTO test(pass, username) VALUES ('${p1}', '${usr}');`, (err, res) => {
      if(err) console.log(err);
    });
    return true;
  }
  else if(!passMatch) return 'passwords dont match';
  else return 'username already exists';
}

//helper function to determine where to route the user
async function routeResp(p1, p2, usr, res){
  var insrtVal = await insertUsrPass(p1, p2, usr);
  if(insrtVal == true) res.redirect('http://localhost:8000/spots');
  else if(insrtVal == 'passwords dont match') res.render(path.join(__dirname + '/yo.html'), {err:insrtVal});
  else res.render(path.join(__dirname + '/yo.html'), {err:insrtVal});
}

//home page post request
app.post('/', function(req, res){
  var p1 = req.body.pass1;
  var p2 = req.body.pass2;
  var usr = req.body.username;
  routeResp(p1, p2, usr, res);
});
/* end the stuff for homepage post request */

//about page
router.get('/about', function(req, res){
  res.sendFile(path.join(__dirname+ '/about.html'));
});

//top spots page
router.get('/spots', function(req, res){
  res.sendFile(path.join(__dirname+ '/spots.html'));
});


//example of basic query
// pool.query('SELECT * FROM test', (err, res) => {
//   console.log(res.rows)
//   pool.end()
// });

app.use('/', router);
app.listen(process.env.PORT);

console.log(`Listening on port ${process.env.PORT}...`);
