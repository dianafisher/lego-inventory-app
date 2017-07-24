const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;  // use ES6 promises
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
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
  items: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Item'
    }
  ]
}, { collection: 'users' })

userSchema.plugin(timestamps);
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = exports = mongoose.model('User', userSchema);
