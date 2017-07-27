const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = (req, res) => {
  try {
    console.log('request body', req.body);
    User.authenticate()(req.body.email, req.body.password, function(err, user, options) {
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
        req.login(user, function(err) {
          res.send({
            message: `${user.name} is now logged in!`,
            success: true,
          })
        })
      }
    })
    // passport.authenticate('local', function(err, user, info) {
    //   console.log('err', err);
    //   console.log('user', user);
    //   console.log('info', info);
    //   if (err) {
    //     console.log('Error: ' + err);
    //     res.status(500).json(err);
    //   }
    //   if (!user) {
    //     res.status(404).send('No user returned');
    //   }
    //   if (info) {
    //
    //     res.status(200).json(info);
    //   }
    // });
  } catch(error) {
    console.log('authController Error: ' + error);
    res.status(500).json(error);
  }

}

exports.logout = (req, res) => {
  req.logout();
  res.status(200).send({
    message: 'You are now logged out! 👋',
    success: true
  })
}

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();  // carry on!
    return;
  }
  const error = {
    message: 'You must be logged in to do that!',
    success: false
  };
  res.status(500).json(error);
}
