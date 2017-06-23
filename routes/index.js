const express = require('express');
const cool = require('cool-ascii-faces');
const csv = require('csv');
const soap = require('soap');
const ObjectID = require('mongodb').ObjectID;
const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const bricksetController = require('../controllers/bricksetController');
const sampleController = require('../controllers/sampleController');

const { catchErrors } = require('../handlers/errorHandlers');

// specify the collection in our inventory database
const LEGOS_COLLECTION = "legos";

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
router.get('/barcodes/:code', barcodeController.lookupBarCode);
router.get('/sets/', bricksetController.testApiKey);

router.get('/test/:code', function(req, res) {
  const barcode = req.params.code;
  var wsdlUrl = 'http://www.searchupc.com/service/UPCSearch.asmx?wsdl';

  soap.createClient(wsdlUrl, function(err, soapClient) {
    // we now have a soapClient - we also need to make sure there's no `err` here.
    if (err){
      return res.status(500).json(err);
    }
    soapClient.GetProduct({
      upc : barcode,
      accesstoken : '924646BB-A268-4007-9D87-2CE3084B47BC'
    }, function(err, result){
      if (err){
        return res.status(500).json(err);
      }
      // now we have the response, but the webservice returns it as a CSV string. Let's use the parser
      var responseAsCsv = result.GetProductResult;
      csv.parse(responseAsCsv, {columns : true}, function(err, parsedResponse){
        if (err) {
          return res.status(500).json(err);
        }
        // finally, we're ready to return this back to the client.
        return res.json(parsedResponse);
      });
    });

  });
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


router.get('/sample', sampleController.getRandomSet);

module.exports.setDB = function(database) {
  console.log(database);
  db = database;
}

module.exports.router = router;
