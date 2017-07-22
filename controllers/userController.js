const mongoose = require('mongoose');
const User = mongoose.model('User');
const promsify = require('es6-promisify');

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('name');
  req.checkBody('name', 'You must supply a name!').notEmpty();
  req.checkBody('email', 'Invalid email!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_extension: false
  });
  // check that password is not blank
  req.checkBody('password', 'Password cannot be blank!').notEmpty();

  req.getValidationResult().then(
    function(result){
      if (!result.isEmpty()) {
        res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
        return;
      }
      else {
        // valid, no errors
        console.log('no validation errors');
        next();
      }
    }, function(error) {
      console.log('Failed to get validation result ' + error);
    })
  .catch(function() {
    console.log('Promise rejected');
  });
}

// middleware to handle user registration
exports.register = async (req, res, next) => {
  // create a new user
  const user = new User({
    email: req.body.email,
    name: req.body.name
  });

  // promisify User.register so that it returns a Promise
  const registerWithPromise = promisify(User.register, User);
  await registerWithPromise(user, req.body.password); // stores password as a hash in the db.

  next();
}
