//Dependenies
require ('dotenv/config');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {verify} = require('jsonwebtoken');
const {hash, compare} = require('bcryptjs');
const database = require('./fakeDB');

//Instance of express app
const app = express();

//Middleware
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.listen(process.env.PORT || 8000, () => {
  console.log('server listening');
});

//Endpoint for registering user

app.post('/register', function(req,res) {
  const {email, password} = req.body;
  const {fakeDB} = database;
  //Check if user exists

  try {
    const user = fakeDB.find(user => user.email === email);
    if (user) { throw new Error('User already exists'); }

    hash(password, 10)
      .then((response) => {
        //Insert the user in fakeDB.

        fakeDB.push({
          id: fakeDB.length,
          email,
          password: response
        });

        res.send({message: 'User created'});
      });



  } catch(error) {
    res.send({error: 'ERROR!'});
  }

});
//Endponit for login user
//Endpoint for logout user
//Protected route
//Get new access token with a refresh token

