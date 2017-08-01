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

const upcItemSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: 'Please enter an item title!'
  },
  upc: {
    type: String,
    index: { unique: true },
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
}, { collection: 'upcitems' });


// Define compound indexes at the schema level
upcItemSchema.index({
  title: 1, brand: -1
});

// assign a function to the 'methods' object of our upcItemSchema
// cb is the callback function
upcItemSchema.methods.findSimilarBrands = function(cb) {
  return this.model('UPCItem').find({ brand: this.brand }, cb);
};

// assign a function to the 'statics' object of our upcItemSchema
upcItemSchema.statics.findByTitle = function(title, cb) {
  return this.find({ title: new RegExp(title, 'i' ) }, cb);
}

module.exports = mongoose.model('UPCItem', upcItemSchema);
