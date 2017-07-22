const express = require('express');
const cool = require('cool-ascii-faces');

const https = require('https');

const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const bricksetController = require('../controllers/bricksetController');
const awsController = require('../controllers/awsController');
const itemsController = require('../controllers/itemsController');
const userController = require('../controllers/userController');

const { catchErrors } = require('../handlers/errorHandlers');

// specify the collection in our inventory database
const LEGOS_COLLECTION = "legos";
const ITEMS_COLLECTION = "items";

const ITEMS_PER_PAGE = 10;

// Generic error handler used by all endpoints
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

router.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

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

/*
 * Respond to GET requests to /account.
 * Upon request, render the 'account.html' web page in views/ directory.
 */
router.get('/account', (req, res) => res.render('account'));

/* USERS */

router.post('/register',
  userController.validateRegister,
  userController.register
);

/* ITEMS API */

/* POST /api/items
 * Creates a new item
 */
router.post('/api/items',
  itemsController.validateItem,
  itemsController.uploadImage,
  itemsController.addItem
)
/* PUT /api/upc
 * Looks up an item by UPC-A barcode.
 */
router.put('/api/upc',
  barcodeController.lookupBarCode
)

/* Barcode Lookup */

/* "/barcodes"
 *
 * PUT: perform barcode lookup using api.upcitemdb.com
 * GET: get document with upc code
 */

router.put('/barcodes', barcodeController.lookupBarCode);
router.get('/barcodes', barcodeController.findDocumentWithCode);

// router.get('/downloadImage', barcodeController.downloadImage);

router.get('/testKey', bricksetController.testApiKey);
router.get('/getSets', bricksetController.getSets);

router.get('/sign-s3', awsController.getSignedRequest);

router.post('/image', awsController.uploadImage);


module.exports.router = router;
