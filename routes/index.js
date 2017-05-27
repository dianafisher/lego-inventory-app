const express = require('express');
const cool = require('cool-ascii-faces');

const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const { catchErrors } = require('../handlers/errorHandlers');

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Lego Inventory' });
  // res.send('Hello Legos!');
  res.render('index');
});

router.get('/cool', function(req, res) {
  res.send(cool());
});

router.get('/barcodes/:code', barcodeController.lookupBarCode);

module.exports = router;
