// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });

const passport = require('passport');
const mongoose = require('mongoose');
const promisify = require('es6-promisify');
const jwt = require('jsonwebtoken');   // for token generation
const User = mongoose.model('User');

exports.login = (req, res) => {
  try {
    console.log('request body', req.body);
    User.authenticate({ session: false })(req.body.email, req.body.password, function(err, user, options) {
      if (err) {
        console.log('err', err);
        res.status(500).json(err);
      }
      if (!user) {
        res.status(400).send({
          message: options.message,
          success: false
        });
      } else {

        // if user is found and password is right
        // create a token
        let u = {
          name: user.name,
          email: user.email,
          _id: user._id.toString()
        }
        var token = jwt.sign(u, process.env.JWT_SECRET, {
          expiresIn: '24h' // expires in 24 hours
        });

        req.login(user, function(err) {
          res.send({
            message: `${user.name} is now logged in!`,
            success: true,
            token: token
          })
        })
      }
    })

  } catch(error) {
    console.log('authController Error: ' + error);
    res.status(500).json(error);
  }

}

exports.logout = (req, res) => {
  console.log('session', req.session);
  req.logout();
  res.status(200).send({
    message: 'You are now logged out! 👋',
    success: true
  });

  // if (req.session) {
  //   // delete session object
  //   req.session.destroy(function(err) {
  //     if(err) {
  //       res.status(500).json(error);
  //     } else {
  //       res.status(200).send({
  //         message: 'You are now logged out! 👋',
  //         success: true
  //       })
  //     }
  //   });
  // }
  // req.session.destroy();

}

// exports.isLoggedIn = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     next();  // carry on!
//     return;
//   }
//   const error = {
//     message: 'You must be logged in to do that!',
//     success: false
//   };
//   res.status(401).json(error);
// }

exports.authenticate = async (req, res) => {
  try {
    console.log('request body', req.body);
    User.authenticate({ session: false })(req.body.email, req.body.password, function(err, user, options) {
      if (err) {
        console.log('err', err);
        res.status(500).json(err);
      }
      if (!user) {
        res.status(400).send({
          message: options.message,
          success: false
        });
      } else {

        // if user is found and password is right
        // create a token
        let u = {
          name: user.name,
          email: user.email,
          _id: user._id.toString()
        }
        var token = jwt.sign(u, process.env.JWT_SECRET, {
          expiresIn: '24h' // expires in 24 hours
        });

        req.login(user, function(err) {
          res.send({
            message: `${user.name} is now logged in!`,
            success: true,
            token: token
          })
        })
      }
    })

  } catch(error) {
    console.log('authController Error: ' + error);
    res.status(500).json(error);
  }

}
