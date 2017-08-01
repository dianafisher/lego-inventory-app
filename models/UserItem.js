const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const timestamps = require('mongoose-timestamp');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;  // use ES6 promises
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const UserItem = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true
  },
  title: {
    type: String,
    trim: true,
    required: 'Please enter an item title!'
  },
  upc: {
    type: String,
    unique: true,
    trim: true,
    required: 'Please enter a upc code!'
  },
  created: {
    type: Date,
    default: Date.now
  },
  description: String,
  ean: String,
  asin: String,
  brand: {
    type: String,
    trim: true,
    required: 'Please enter a brand!'
  },
  model: String,
  color: String,
  size: String,
  dimension: String,
  image: String,
  tags: [String],
  count: Number
}, { collection: 'useritems' });

 UserItem.index({
   title: 'text',
   brand: 'text'
 });

 UserItem.statics.getTagsList = function() {
   return this.aggregate([
     { $unwind: '$tags' }, // Deconstructs an array field from the input documents to output a document for each element.
     { $group: { _id: '$tags', count: { $sum: 1 } } },
     { $sort: { count: -1 } }
   ]);
 };

 module.exports = mongoose.model('UserItem', UserItem);
