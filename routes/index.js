const express = require('express');
const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const { catchErrors } = require('../handlers/errorHandlers');

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Lego Inventory' });
  res.send('Hello Legos!');
});

router.get('/barcodes/:code', catchErrors(barcodeController.lookupBarCode));

module.exports = router;
