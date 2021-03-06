/* itemsController.js
 *
 */
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
        let error = {
          type: 'validation',
          errors: result.array()
         }
        // let message = 'Validation errors: ' + util.inspect(result.array());
        let message = JSON.stringify(error);
        res.status(400).send(message);
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
  .catch(function(err) {
    console.log('Promise rejected: ' + err);
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
  console.log(req.query);
  const page = req.query.page || 1;
  const limit = 10; // limit 10 items per page
  const skip = (page * limit) - limit;

  console.log('skip', skip);

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
    // res.redirect(`/api/items/page/${pages}`);
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

// get a single item
exports.getItem = async (req, res) => {
  const itemId = req.params.id;

  const item = await Item.findOne({ _id: itemId });
  if (!item) {
    res.status(404).send('Item not found');
  } else {
    const result = {item};
    res.status(200).json(result);
  }
}

/***/
exports.getItemByUPC = async (req, res, next) => {
  const upc = req.body.upc;
  const item = await Item.findOne({
    upc: upc
  });
  // console.log('item:', item);
  // add the item to the req object for the next middleware
  if (item) {
    req.item = item;
  }
  next();
}

/* createItem() takes the data received from the upcitemdb API and
 * stores it in an Item document.
 *
 * if req.item exists, then the item has already been created previously,
 *
 * if req.doc exists, then a document returned from the upcitemdb API
 * should be saved to the Item collection
 */
exports.createItem = async (req, res, next) => {
  // if the request already contains an item, then nothing needs to be done here so just return the item
  if (req.item) {
    // res.status(200).json(req.item);
    next();
    return;
  }
  if (req.doc) {
    const doc = req.doc;
    doc.awsImages = [req.awsImage];
    console.log(doc);
    const item = await (new Item(doc)).save();
    const result = {
      success: true,
      item: item,
      error: ''
    }
    // res.json(result);
    req.item = item;
    next();
  } else {
    const error = {
      msg: 'No item or document found'
    };
    res.status(404).json(error);
  }

}
