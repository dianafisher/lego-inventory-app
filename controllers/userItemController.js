/* userItemController.js
 *
 */
const mongoose = require('mongoose');
const util = require('util');
const https = require('https');
const UserItem = mongoose.model('UserItem');

exports.validateItem = (req, res, next) => {
  console.log('body', req.body);

  req.sanitizeBody('title');

  // check that fields are not empty
  req.checkBody('upc', 'UPC cannot be empty').notEmpty();
  req.checkBody('title', 'Title cannot be empty').notEmpty();

  // check that the upc code is valid
  req.checkBody('upc', 'Invalid UPC').isUPC();

  // if provided, check that the imageURL is valid
  if (req.body.imageUrl) {
    req.checkBody('imageUrl', 'Invalid URL').isURL();
  }

  req.getValidationResult().then(
    function(result){
      if (!result.isEmpty()) {
        let error = {
          type: 'validation',
          errors: result.array()
         }
        // let message = 'Validation errors: ' + util.inspect(result.array());
        let message = JSON.stringify(error);
        res.status(400).send(message);
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
  .catch(function(err) {
    console.log('Promise rejected: ' + err);
  });
}

exports.findUserItemWithUPC = async (req, res, next) => {
  if (req.upcItem) {
    // get the user id out of the auth token.
    const decodedUser = req.decoded;
    // get the upc item out of the req object.
    const upcItem = req.upcItem;

    // does this user already have this item?
    await UserItem.findOne({ userId: decodedUser._id, upc: upcItem.upc })
      .then(item => {
        console.log('item found', item);
        if (item) {
          // update count value of item.
          let count = item.count;
          console.log('count', count);
          // increment value of count
          count += 1;
          item.count = count;

          // save the updated UserItem document
          item.save(function (err) {
            if (err) {
              console.log(err.message);
              res.status(400).json(err);
            } else {
              res.status(200).json(item);
            }
          })


        } else {
          // item not found, so call next middleware
          next();
        }

      })
      .catch(err => {
        res.status(500).send(err);
      })
  } else {
    const error = {
      success: false,
      message: 'upcItem not found in request'
    }
    res.status(404).json(error);
  }
}

// create a new UserItem from a UPCItem
exports.createUserItem = async (req, res) => {
  console.log('userItemController.createUserItem');
  if (req.upcItem) {
    // get the user id out of the auth token.
    const decodedUser = req.decoded;
    // get the upc item out of the req object.
    const upcItem = req.upcItem;

    // UserItem not found, so create a new one for this user.
    let data = {
      userId: decodedUser._id,
      title: upcItem.title,
      upc: upcItem.upc,
      description: upcItem.description,
      ean: upcItem.ean,
      asin: upcItem.asin,
      brand: upcItem.brand,
      model: upcItem.model,
      color: upcItem.color,
      size: upcItem.size,
      dimension: upcItem.dimension,
      image: upcItem.awsImages[0].awsUrl,
      count: 1
    };
    console.log(data);
    UserItem.create(data)
      .then(useritem => {
        res.status(200).json(useritem);
      })
      .catch(err => {
        res.status(500).send(err);
      })
  }
  else {
    const error = {
      success: false,
      message: 'upcItem not found in request'
    }
    res.status(404).json(error);
  }
};

// get list of UserItems with pagination
exports.getUserItems = async (req, res) => {
  const decodedUser = req.decoded;

  console.log(req.query);

  let page = req.query.page || 1;
  console.log('page', page);
  const limit = 10; // limit to 10 documents per page
  let skip = (page * limit) - limit;
  console.log('skip', skip);

  const itemsPromise = UserItem.find({ userId: decodedUser._id })
    .skip(skip)
    .limit(limit)
    .sort({ created: 'desc' });

  // count the number of UserItem records in the database for this User
  const countPromise = UserItem.count({ userId: decodedUser._id });

  // wait for both promises to return
  const [items, count] = await Promise.all([itemsPromise, countPromise]);

  // calculate the number of pages we have
  const pages = Math.ceil(count / limit);

  if (!items.length && skip) {
    console.log(`page ${page} does not exist!`);

    const error = {
      success: false,
      message: `page ${page} does not exist!`
    }
    res.status(400).json(error);
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

// Delete a UserItem
exports.deleteItem = async (req, res) => {
  const decodedUser = req.decoded;

  await UserItem.findOneAndRemove({ userId: decodedUser._id, _id: req.params.itemId })
    .then(() => {
      res.status(204)
    })
    .catch(err => {
      res.status(500).send(err);
    })
}

// Find a UserItem by UPC code
exports.getUserItemByUPC = async (req, res) => {
  const decodedUser = req.decoded;

  await UserItem.find({ userId: decodedUser._id, upc: req.params.upc })
    .then(item => {
      res.status(200).json(item);
    })
    .catch(err => {
      res.send(500, err)
    })
}
