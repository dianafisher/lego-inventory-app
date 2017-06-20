const express = require('express');
const cool = require('cool-ascii-faces');
const csv = require('csv');
const soap = require('soap');

const router = express.Router();

const barcodeController = require('../controllers/barcodeController');
const bricksetController = require('../controllers/bricksetController');
const sampleController = require('../controllers/sampleController');

const { catchErrors } = require('../handlers/errorHandlers');

// specify the collection in our inventory database
const LEGOS_COLLECTION = "legos";

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

router.get('/sample', sampleController.getRandomSet);

module.exports = router;
