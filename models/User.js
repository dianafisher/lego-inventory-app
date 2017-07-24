const mongoose = require('mongoose');
const timestamps = require('mongoose-timestamp');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;  // use ES6 promises
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  username: {
    type: String,
    required: 'Please provide a username.',
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
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(mongodbErrorHandler);

module.exports = exports = mongoose.model('User', userSchema);
