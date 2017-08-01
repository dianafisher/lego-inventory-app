/* upcItemController.js
 *
 */
const mongoose = require('mongoose');
const util = require('util');
const https = require('https');
const UPCItem = mongoose.model('UPCItem');

UPCItem.on('index', function(err) {
    if (err) {
        console.error('UPCItem index error: %s', err);
    } else {
        console.info('UPCItem indexing complete');
    }
});

// GET items with pagination
exports.getUPCItems = async (req, res) => {
  // query the database for the list of all items
  const page = req.query.page || 1;
  const limit = 10; // limit 10 items per page
  const skip = (page * limit) - limit;

  const itemsPromise = UPCItem.find()
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  // count the number of item records in the database
  const countPromise = UPCItem.count();

  // wait for both promises to return
  const [items, count] = await Promise.all([itemsPromise, countPromise]);

  // calculate the number of pages we have
  const pages = Math.ceil(count / limit);
  if (!items.length && skip) {
    console.log(`page ${page} does not exist!`);
    // res.redirect(`/api/items/page/${pages}`);
    return;
  }

  const result = {
    items,
    page,
    pages,
    count
  };

  res.json(result);
}

// GET a single item
exports.getUPCItem = async (req, res) => {
  const itemId = req.params.id;

  const item = await UPCItem.findOne({ _id: itemId });
  if (!item) {
    res.status(404).send('Item not found');
  } else {
    const result = {item};
    res.status(200).json(result);
  }
}

/* getItemByUPC() performs a search by the UPC value
 *
 */
exports.getItemByUPC = async (req, res, next) => {
  console.log('getItemByUPC');
  const upc = req.body.upc;
  const upcItem = await UPCItem.findOne({
    upc: upc
  });
  // console.log('item:', item);
  // add the item to the req object for the next middleware
  if (upcItem) {
    req.upcItem = upcItem;
  }
  next();
}

/* createUPCItem() takes the data received from the upcitemdb API and
 * stores it in a UPCItem document.
 *
 * if req.item exists, then the item has already been created previously,
 *
 * if req.doc exists, then a document returned from the upcitemdb API
 * should be saved to the Item collection
 */
exports.createUPCItem = async (req, res, next) => {
  console.log('createUPCItem');
  // if the request already contains an item, then nothing needs to be done here
  if (req.upcItem) {
    next();
    return;
  }
  // if the upcitemdb API returned a document for this barcode, then it will
  // exist on the req object. If a doc object exists on the req object,
  // save it as a UPCItem in our database
  if (req.doc) {
    const doc = req.doc;
    // set awsImages on the doc prior to saving it.
    doc.awsImages = [req.awsImage];
    console.log('doc', doc);
    // create a upcItem document from the doc object.
    const upcItem = await (new UPCItem(doc)).save();
    // add the upcItem to the req object for the next middleware
    req.upcItem = upcItem;
    next();
  } else {
    const error = {
      msg: 'No UPC item or document found'
    };
    res.status(404).json(error);
  }

}
