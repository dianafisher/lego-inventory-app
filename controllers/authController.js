const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.login = (req, res) => {
  try {
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
