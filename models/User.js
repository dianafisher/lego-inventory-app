const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;  // use ES6 promises
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const UserItem = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  upc: {
    type: String,
    unique: true,
    trim: true,
  },
  description: String,
  ean: String,
  asin: String,
  brand: {
    type: String,
    trim: true,
  },
  model: String,
  color: String,
  size: String,
  dimension: String,
  image: String,
  tags: [String],
  count: Number
 });


const userSchema = new Schema({
  email: {
    type: String,
    index: { unique: true },
    lowercase: true,
    trim: true,
    // validate: [validator.isEmail, 'Invalid Email Address'],
    require: [true, 'Please provide an email address']
  },
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
    trim: true
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,  
}, { collection: 'users' })

// set up indexes
userSchema.index({
  email: 'text'
});

userSchema.plugin(timestamps);

// configure options for passportLocalMongoose
const options = {
  usernameField: 'email',
  errorMessages: {
    IncorrectPasswordError: 'Password or email are incorrect',
    IncorrectUsernameError: 'Password or email are incorrect',
    UserExistsError: 'A user with the given email is already registered.'
  }
}
userSchema.plugin(passportLocalMongoose, options);
userSchema.plugin(mongodbErrorHandler);

module.exports = exports = mongoose.model('User', userSchema);
