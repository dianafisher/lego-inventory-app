// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });

const express = require('express');
const cool = require('cool-ascii-faces');
const jwt = require('jsonwebtoken');   // for token generation
const https = require('https');

const router = express.Router();

// const barcodeController = require('../controllers/barcodeController');
// const bricksetController = require('../controllers/bricksetController');
const awsController = require('../controllers/awsController');
// const itemsController = require('../controllers/itemsController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const upcitemdbController = require('../controllers/upcitemdbController');
const userItemController = require('../controllers/userItemController');
const upcItemController = require('../controllers/upcItemController');

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

// POST - create a new User
router.post('/users',
  userController.validateRegister,
  userController.register,
  authController.login
);

router.post('/login', authController.login);
router.get('/logout', authController.logout);

// route middleware to verify a token
// any routes defined after this middleware will require a token
router.use(function(req, res, next) {
  const token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    // verfiy secret and check expiration
    jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
      if (err) {
        const error = {
          success: false,
          message: err.message,
          name: err.name
        };
        console.log(error);       
        return res.status(403).json(error);
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
        message: 'Access Denied.  No token provided.'
    });
  }

});

router.get('/users',
  userController.getUsers
);

/* ITEMS */

router.get('/upc/items', catchErrors(upcItemController.getUPCItems));
// router.get('/items', userController.getItems);
router.get('/items', userItemController.getUserItems);

router.get('/user/items', catchErrors(userItemController.getUserItemByUPC));

/* POST /api/items
 * Creates a new item
 */
// router.post('/api/items',
//   itemsController.validateItem,
//   itemsController.uploadImage,
//   itemsController.addItem
// )
/* GET /api/items/:id
 * Get an item by the specified id
 */
 router.get('/items/:id', catchErrors(userItemController.getItemById));

/* PUT /upc
 * Looks up an item by UPC-A barcode.
 */
router.put('/upc',
  upcItemController.getItemByUPC,
  upcitemdbController.lookupUPC,
  awsController.uploadImage,
  catchErrors(upcItemController.createUPCItem),
  catchErrors(userItemController.findUserItemWithUPC),
  catchErrors(userItemController.createUserItem)
);

/* DELETE /items/:id
 * Deletes UserItem with provided id
 */
router.delete('/items/:id',
  catchErrors(userItemController.deleteItem)
);

/* UPDATE /items/:id
 * Updates UserItem with provided id
 */
router.put('/items/:id',
  catchErrors(userItemController.updateItem)
);

router.post('/image', awsController.uploadImage);


module.exports.router = router;
