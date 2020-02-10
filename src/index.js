//Dependenies
require ('dotenv/config');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {verify} = require('jsonwebtoken');
const {hash, compare} = require('bcryptjs');
const database = require('./fakeDB');
const {createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken} = require('./tokens');
const {isAuth} = require('./isAuth')

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
        console.log(fakeDB);

        res.send({message: 'User created'});
      });



  } catch(error) {
    res.send({error: 'ERROR!'});
  }

});
//Endponit for login user

app.post('/login', function(req,res) {
  const {email, password} = req.body;
  const {fakeDB} = database;

  try {
    const user = fakeDB.find(user => user.email === email);
    if (!user) {
      throw new Error('User does not exist');
    }
    compare(password, user.password)
      .then(response => {
        if (!response) {
          throw new Error('Password not correct');
        }

        const accessToken = createAccessToken(user.id);
        const refreshToken = createRefreshToken(user.id);

        //Put refresh token in database
        user.refreshToken = refreshToken;
        console.log(fakeDB);
        
        //Send token RefreshToken as a cookie and accessToken as a regular response
        sendRefreshToken(res, refreshToken);
        sendAccessToken(req, res, accessToken);

      });

  } catch(error) {
    res.send({error: error.message});
  }
});



//Endpoint for logout user
app.post('/logout', (req, res) => {
  const {fakeDB} = database;
  try {
    const userId = isAuth(req);
    const user = fakeDB.find(user => user.id === userId);
    console.log('the user is');
    console.log(user);
    delete user['refreshToken'];
    res.clearCookie('refreshToken', {path: '/refresh_token'});
    return res.send({
      message: 'Logged out'
    });
  }
  catch(error) {
    res.send({error: error.message});
  }
});


//Protected route
app.post('/protected', (req,res) => {
  try {
    const userId = isAuth(req);
    console.log(userId);
    console.log(database.fakeDB);
    if (userId !== null) {
      res.send({
        data: 'This is protected data'
      });
    }
  } catch(error) {
    res.send({error: error.message});
  }
});


//Get new access token with a refresh token
app.post('/refresh_token', (req,res) => {
  const token = req.cookies.refreshToken;
  const {fakeDB} = database;
  //If we don't have a token in request:
  if (!token) return res.send({accessToken: ''});
  let payload = null;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch(error) {
    return res.send({accessToken: ''});
  }

  const user = fakeDB.find(user => user.id === payload.userId);
  if (!user) return res.send({accessToken: ''});
  //User exists, check if refreshToken exists on user
  if (user.refreshToken !== token) {
    return res.send({accessToken: ''});
  }
  //TOken exists, create new refresh and access token
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);
  user.refreshToken = refreshToken;
  //All done, send new refresh and access token;
  sendRefreshToken(res,refreshToken);
  return res.send({accessToken});
});



app.listen(process.env.PORT || 8000, () => {
  console.log('server listening');
});
