const util = require('util');
const ObjectID = require('mongodb').ObjectID;
const https = require('https');
const DB = require('../db');
const awsController = require('../controllers/awsController');
const ITEMS_COLLECTION = "items";

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

exports.addItem = async (req, res) => {
  let requestBody = req.body;
  let database = new DB;

  // read the productImage from res.locals
  requestBody.productImage = res.locals.productImage;

  database.connect()
  .then(
    function() {
      // returning will pass the promise returned by addDoc to
      // the next .then in the chain
      return database.addDocument(ITEMS_COLLECTION, requestBody)
    })
    // No function is provided to handle the connection failing and so that
    // error will flow through to the next .then() in the chain
  .then(
    function(docs) {
      console.log('success', docs);
      return {
        "success": true,
        "document": docs,
        "error": ""
      };
    },
    function(error) {
      console.log('Failed to add document ' + error);
      return {
        "success": false,
        "error": "Failed to add document " + error
      };
    })
  .then(
    function(resultObject) {
      database.close();
      res.json(resultObject);
    }
  )
};
