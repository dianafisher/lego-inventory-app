const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('username');
  req.checkBody('username', 'You must supply a username!').notEmpty();

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
  console.log(req.body);
  // create a new user
  const user = new User({
    username: req.body.username
  });

  console.log('inside userController',user);
  try {
    // promisify User.register so that it returns a Promise
    const registerWithPromise = promisify(User.register, User);

    // store password as a hash in the db.
    await registerWithPromise(user, req.body.password);
    
    // next middleware
    next();
  } catch(error) {
    console.log('Error: ' + error);
    res.status(500).json(error);
  }

}
