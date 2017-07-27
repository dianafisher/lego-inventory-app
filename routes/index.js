// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });

const express = require('express');
const cool = require('cool-ascii-faces');
const jwt = require('jsonwebtoken');   // for token generation
const https = require('https');

const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const bricksetController = require('../controllers/bricksetController');
const awsController = require('../controllers/awsController');
const itemsController = require('../controllers/itemsController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const upcController = require('../controllers/upcController');

const { catchErrors } = require('../handlers/errorHandlers');

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

router.post('/api/register',
  userController.validateRegister,
  userController.register,
  authController.login
);

// router.post('/api/login', authController.login);
router.get('/api/logout', authController.logout);
router.post('/api/login', authController.authenticate);

// route middleware to verify a token
// any routes after this middleware will require a token
router.use(function(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    // verfiy secret and check expiration
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token, return an error
    return res.status(403).send({
        success: false,
        message: 'No token provided.'
    });
  }

});

router.get('/api/users',
  userController.getUsers
);

router.get('/api/me/from/token', authController.meFromToken);

/* ITEMS */

router.get('/api/items', catchErrors(itemsController.getItems));

/* POST /api/items
 * Creates a new item
 */
router.post('/api/items',
  itemsController.validateItem,
  itemsController.uploadImage,
  itemsController.addItem
)
/* GET /api/items/:id
 * Get an item by the specified id
 */
 router.get('/api/items/:id', catchErrors(itemsController.getItem));

/* PUT /api/upc
 * Looks up an item by UPC-A barcode.
 */
// router.put('/api/upc',
//   barcodeController.lookupBarCode
// )

/* UPC */
router.put('/api/upc',
  authController.isLoggedIn,
  itemsController.getItemByUPC,
  upcController.lookupUPC,
  awsController.uploadImage,
  itemsController.createItem
);

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
