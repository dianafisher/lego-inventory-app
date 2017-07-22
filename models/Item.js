const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const itemSchema = new mongoose.Schema({
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
  model: String,
  color: String,
  size: String,
  dimension: String,
  images: [String],
  productImage: String,

}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}, { collection: 'items' });

itemSchema.index({
  upc: 'text'
});


module.exports = mongoose.model('Item', itemSchema);
