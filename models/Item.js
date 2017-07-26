const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const AWSImage = new mongoose.Schema({
  originalUrl: {
    type: String,
    unique: true,
    required: 'Please provide a url for this image!'
  },
  awsUrl: {
    type: String,
    unique: true,
    required: 'Please provide the AWS url for this image!'
  }
});

const Item = new mongoose.Schema({
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
  description: String,
  ean: String,
  asin: String,
  brand: {
    type: String,
    trim: true,
    required: 'Please enter a brand!'
  },
  gtin: String,
  model: String,
  color: String,
  size: String,
  dimension: String,
  weight: String,
  currency: String,
  lowest_recorded_price: Number,
  images: [String],
  awsImages: [AWSImage]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}, { collection: 'items' });


// Definie our indexes
Item.index({
  upc: 'text',
});


module.exports = mongoose.model('Item', Item);
