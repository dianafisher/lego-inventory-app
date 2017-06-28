const express = require('express');
const cool = require('cool-ascii-faces');
const csv = require('csv');
const ObjectID = require('mongodb').ObjectID;
const https = require('https');
const DB = require('../db');
const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const bricksetController = require('../controllers/bricksetController');
const sampleController = require('../controllers/sampleController');

const { catchErrors } = require('../handlers/errorHandlers');

// specify the collection in our inventory database
const LEGOS_COLLECTION = "legos";
const ITEMS_COLLECTION = "items";

let db;  // variable to hold our database

// Generic error handler used by all endpoints
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Lego Inventory' });
  // res.send('Hello Legos!');
  res.render('index');
});

router.get('/cool', function(req, res) {
  console.log(req.headers);

  res.send(cool());
});

/* Reverse a string */
router.get('/reverse/:text', (req, res) => {
  const reverse = [...req.params.text].reverse().join('');
  res.send(reverse);

});

/* Barcode Lookup */

/* "/barcodes/:code"
 * GET: perform barcode lookup using api.upcitemdb.com
 */

router.get('/barcodes/:code', barcodeController.lookupBarCode);
router.get('/find/:code', barcodeController.findDocumentWithCode);
router.get('/downloadImage', barcodeController.downloadImage);

router.get('/testKey', bricksetController.testApiKey);
router.get('/getSets', bricksetController.getSets);

router.post('/countDocs', function(req, res, next) {

  /*
    Request to count the number of documents in a collection.

    Requst: { collectionName: string }

    Response:
    {
      success: boolean,
      count: number,
      error: string
    }
  */

  var requestBody = req.body;
  var database = new DB;
  console.log(req.body);
  console.log(requestBody.collectionName);

  database.connect()
  .then(
    function(count) {
      return database.countDocuments(requestBody.collectionName)
    }
  )
  .then(
    function(count) {
      return {
        "success": true,
        "count": count,
        "error": ""
      };
    },
    function(err) {
      console.log("Failed to count the documents: " + err);
      return {
        "success": false,
        "count": 0,
        "error": "Failed to count the documents " + err
      };
    }
  )
  .then(
    function(resultObject) {
      database.close();
      res.json(resultObject);
    }
  )
});

router.post('/addDoc', function(req, res, next) {
  let requestBody = req.body;
  let database = new DB;

  console.log(requestBody);
  database.connect()
  .then(
    function() {
      // returning will pass the promise returned by addDoc to
      // the next .then in the chain
      return database.addDocument(requestBody.collectionName, requestBody.document)
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
});

router.delete('/api/items/:id', function(req, res, next) {
  //req.params.id
  let database = new DB;
  database.connect()
  .then(
    function() {
      return database.removeDocument('items', req.params.id);
    }
  )
  .then(
    function() {
      return {
        "success": true,
        "error": ""
      };
    },
    function(error) {
      console.log("Failed to delete item: " + error);
      return {
        "success": false,
        "error": error.message
      };
    }
  )
  .then(
    function(resultObject) {
      database.close();
      res.json(resultObject);
    }
  )
});

router.post('/getDocs', function(req, res, next) {
  /* Request from client to read a sample of the documents from a collection;
    the request should be of the form:

    {
      collectionName: string;
      numberDocs: number; // How many documents should be in the result set
    }

    The response will contain:

    {
      success: boolean;
      documents: string;	// Sample of documents from collection
      error: string;
    }
  */

  let requestBody = req.body;
  let database = new DB;

  database.connect()
  .then(
    function() {
      return database.getDocuments(requestBody.collectionName, requestBody.numberDocs)
    }
  ) // No function is provided to handle the connection failing and so that
			// error will flow through to the next .then
  .then(
    function(docs) {
      return {
        "success": true,
        "documents": docs,
        "error": ""
      };
    },
    function(error) {
      console.log("Failed to retrieve docs: " + error);
      return {
        "success": false,
        "documents": null,
        "error": error.message
      };
    }
  )
  .then(
    function(resultObject) {
      database.close();
      res.json(resultObject);
    }
  )
});

// LEGOS API routes



/*  "/api/sets"
 *  GET: finds all sets
 */
router.get("/api/sets", function(req, res) {
  db.collection(LEGOS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get sets");
    } else {
      res.status(200).json(docs);
    }

  });
});

/*  "/api/sets"
 *  POST: creates a new set
 */
router.post("/api/sets", function(req, res) {
  console.log('body', req.body);
  var newLego = req.body;

  if (!req.body.title) {
    // return res.status(500).json(err);
    handleError(res, "Invalid user input", "Must provide a set title.", 400);
  }
  else {
    db.collection(LEGOS_COLLECTION).insertOne(newLego, function(err, doc) {
      if (err) {
        // return res.status(500).json(err);
        handleError(res, err.message, "Failed to create new set.");
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
  }
});

/*  "/api/sets/:id"
 *  GET: find set by id
 */
router.get("/api/sets/:id", function(req, res) {
  db.collection(LEGOS_COLLECTION).findOne({_id: new ObjectID(req.params.id)}, function(err, result){
    if (err) {
      handleError(res, err.message, "Failed to get set");
    } else {
      res.status(200).json(doc);
    }
  });
});

/*  "/api/sets/:id"
 *  PUT: update set by id
 */
router.put("/api/sets/:id", function(req, res) {
  var updateDoc = req.body;
  console.log('updateDoc', updateDoc);
  console.log(req.params.id);
  delete updateDoc._id;

  db.collection(LEGOS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, result){
    if (err) {
      handleError(res, err.message, "Failed to update set");
    } else {
      updateDoc._id = req.params.id;
      res.status(200).json(updateDoc);
    }
  });
});

/*  "/api/sets/:id"
 *  DELETE: deletes set by id
 */
router.delete("/api/sets/:id", function(req, res) {
  db.collection(LEGOS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result){
    if (err) {
      handleError(res, err.message, "Failed to delete set");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});


module.exports.setDB = function(database) {
  // console.log(database);
  db = database;
}

module.exports.router = router;
