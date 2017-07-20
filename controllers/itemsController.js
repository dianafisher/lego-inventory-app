const util = require('util');
const ObjectID = require('mongodb').ObjectID;
const https = require('https');
const DB = require('../db');
const ITEMS_COLLECTION = "items";

exports.validateItem = (req, res, next) => {
  console.log('body', req.body);

  req.sanitizeBody('title');

  // check the request body for upc and imageURL
  req.checkBody('upc', 'UPC cannot be empty').notEmpty();
  req.checkBody('title', 'Title cannot be empty').notEmpty();

  req.checkBody('upc', 'Invalid UPC').isUPC();

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

exports.addItem = (req, res) => {
  let requestBody = req.body;
  let database = new DB;

  database.connect()
  .then(
    function() {
      // returning will pass the promise returned by addDoc to
      // the next .then in the chain
      return database.addDocument(ITEMS_COLLECTION, requestBody)
    })
    // No function is provided to handle the connection failing and so that
    // error will flow through to the next .then
  .then(
    function(docs) {
      return {
        "success": true,
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
