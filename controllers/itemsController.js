const mongoose = require('mongoose');
const util = require('util');
const https = require('https');
const Item = mongoose.model('Item');
const awsController = require('../controllers/awsController');

exports.validateItem = (req, res, next) => {
  console.log('body', req.body);

  req.sanitizeBody('title');

  // check that fields are not empty
  req.checkBody('upc', 'UPC cannot be empty').notEmpty();
  req.checkBody('title', 'Title cannot be empty').notEmpty();

  // check that the upc code is valid
  req.checkBody('upc', 'Invalid UPC').isUPC();

  // if provided, check that the imageURL is valid
  if (req.body.imageUrl) {
    req.checkBody('imageUrl', 'Invalid URL').isURL();
  }

  req.getValidationResult().then(
    function(result){
      if (!result.isEmpty()) {
        res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
        return;
      }
      else {
        // valid
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

// upload an image to AWS S3
exports.uploadImage = async (req, res, next) => {
  if (!req.body.imageUrl) {
    // nothing to upload, so skip to the next middleware
    next();
    return;
  }
  const awsURL = await awsController.uploadImageToS3(req.body.imageUrl);
  console.log('awsURL', awsURL);
  // save the returned AWS url to res.locals for the next middleware
  res.locals.productImage = awsURL;
  next();
}

// create a new item
exports.addItem = async (req, res) => {
  let requestBody = req.body;

  // read the productImage from res.locals
  requestBody.productImage = res.locals.productImage;

  const item = await (new Item(requestBody)).save();
  const result = {
    success: true,
    item: item,
    error: ''
  }
  res.json(result);
};

// get items with pagination
exports.getItems = async (req, res) => {
  // query the database for the list of all items
  const page = req.params.page || 1;
  const limit = 10; // limit 10 items per page
  const skip = (page * limit) - limit;

  const itemsPromise = Item.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  // count the number of item records in the database
  const countPromise = Item.count();

  // wait for both promises to return
  const [items, count] = await Promise.all([itemsPromise, countPromise]);

  // calculate the number of pages we have
  const pages = Math.ceil(count / limit);
  if (!items.length && skip) {
    console.log(`page ${page} does not exist!`);
    res.redirect(`/api/items/page/${pages}`);
    return;
  }

  const result = {
    items,
    page,
    pages,
    count
  };

  res.json(result);
}
