const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const LocalStrategy = require('passport-local').Strategy;

// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, function(err, user) {
//       if (err) { return done(err); }
//       if (!user) {
//         return done(null, false, { message: 'Incorrect username.' });
//       }
//       if (!user.validPassword(password)) {
//         return done(null, false, { message: 'Incorrect password.' });
//       }
//       return done(null, user);
//     });
//   }
// ));


exports.login = (req, res) => {
  try {
    console.log('authController');
    User.authenticate()(req.body.username, req.body.password, function(err, user, options) {
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
            success: true,
            user: user
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
    console.log('Error: ' + error);
    res.status(500).json(error);
  }

}
