const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('rname');
  req.checkBody('name', 'You must supply a name!').notEmpty();

  req.checkBody('email', 'Invalid email!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    remove_dots: false,
    remove_extension: false,
    gmail_remove_subaddress: false
  });

  // check that password is not blank
  req.checkBody('password', 'Password cannot be blank!').notEmpty();

  req.getValidationResult().then(
    function(result){
      if (!result.isEmpty()) {
        res.status(400).send('There have been validation errors: ' + util.inspect(result.array()));
        return;
      }
      else {
        // valid, no errors
        console.log('no validation errors');
        next();
      }
    }, function(error) {
      console.log('Failed to get validation result ' + error);
    })
  .catch(function() {
    console.log('Promise rejected');
  });
}

// middleware to handle user registration
exports.register = async (req, res, next) => {
  console.log(req.body);
  // create a new user
  const user = new User({ email: req.body.email, name: req.body.name});

  console.log('inside userController',user);
  try {
    // promisify User.register so that it returns a Promise
    const registerWithPromise = promisify(User.register, User);

    // store password as a hash in the db.
    await registerWithPromise(user, req.body.password);

    // next middleware
    next();
  } catch(error) {
    console.log('userController Error: ' + error);
    // what type of error is it?
    if (error.name === 'UserExistsError') {
      res.status(422).json(error);
    } else {
      res.status(500).json(error);
    }

  }
}

exports.getUsers = async (req, res) => {
  const users = await User.find({});
  res.json(users);
}

/* findItem will search the User document for an item by it's UPC code.
 *
 */
exports.findItem = async (req, res, next) => {
  const upc = req.body.upc;
  // get the user from the token in the request
  const decoded = req.decoded;

  // const user = await User.findOne({ _id: decoded._id },
  //   {
  //     "items.upc": true,
  //     "items.title": true,
  //     "items.count": true
  //   }
  // );
  // if (user) {
  //   console.log(user);
  //   res.json(user);
  // } else {
  //   res.status(404).send('User not found');
  // }

  // find the user with the user id listed in the decoded token
  await User.findOne({ _id: decoded._id }, function (err, user) {

    if (user) {
      // filter out the item with the corresponding upc
      const item = user.items.filter(function (item) {
        return item.upc = upc;
      }).pop();
      console.log('found item', item);
      // update the count value of the item
      let newCount = item.count + 1;
      console.log('newCount = ', newCount);
      item.count = newCount;
      // save the user with the new data
      user.save(function (err) {
        if (err) {
          console.log('error saving user:', err.message);
        }
      });
      res.json(user);
    } else {
      console.log('error', err);
      res.status(404).send('User not found');
    }

  });

  // user = User.findOne({ _id: decoded.id} );
  // if (user) {
  //   const item = user.items.filter(function (item) {
  //     return item.upc = upc;
  //   }).pop();
  //   if (item) {
  //     console.log('found item', item);
  //     let newCount = item.count + 1;
  //     console.log('newCount = ', newCount);
  //     item.count = newCount;
  //     user.save(function (err) {
  //       if (err) {
  //         console.log('error saving user:', err.message);
  //       }
  //     });
  //     res.json(user);
  //   } else {
  //     console.log('no item found, continue..');
  //   }
  //   next();
  // } else {
  //   res.status(404).send('User not found');
  // }

}

exports.deleteItem = async (req, res) => {
  //find the user with the user id listed in the decoded token
  console.log('params', req.params);
  const decoded = req.decoded;
  await User.findOne({ _id: decoded._id }, function (err, user) {

    if (user) {
      const itemId = req.params.id;
      user.items.id(itemId).remove();
      user.save(function (err) {
        if (err) {
          console.log(err);
        }
        res.json(user);
      });
    } else {
      res.status(404).send('User not found');
    }
  });

// Favorite.update( {cn: req.params.name}, { $pullAll: {uid: [req.params.deleteUid] } } )



}


exports.addItem = async (req, res) => {
  if (req.item) {
    const item = req.item;
    const decoded = req.decoded;
    console.log('decoded', decoded);
    const user = await User.findOne({ _id: decoded._id });
    // const user = await User.findById(user.id);
    if (user) {
      user.items.push({
        title: item.title,
        upc: item.upc,
        description: item.description,
        ean: item.ean,
        asin: item.asin,
        brand: item.brand,
        model: item.model,
        color: item.color,
        size: item.size,
        dimension: item.dimension,
        image: item.awsImages[0].awsUrl,
        count: 1
      });
      user.save(function(err) {
        if (!err) {
          console.log('Success!');
          res.status(200).json(user);
        }
      });
    } else {
      res.status(404).send('User not found');
    }
  } else {
    res.status(404).send('Item not found');
  }

}

exports.getItems = async (req, res) => {
  const decoded = req.decoded;
  console.log('decoded', decoded);
  const user = await User.findOne({ _id: decoded._id });
  if (user) {
    let page = req.query.page || 1;
    console.log('page', page);
    const limit = 3; // limit 10 items per page
    let skip = (page * limit) - limit;
    const count = user.items.length;
    console.log('count', count);
    // calculate the number of pages we have
    const pages = Math.ceil(count / limit);
    console.log('skip', skip);

    if (page > pages) {
      console.log('skipped beyond the end of the array');
      // page number goes beyond length of array,
      // so just return the last page that makes sense.
      page = pages;
      skip = (page * limit) - limit;
    }
    let arr = [];
    const items = user.items;
    for (var i = skip; i < skip+limit; i++) {
      if (i < items.length) {
        arr.push(items[i]);
      } else {
        break;
      }
    }

    const result = {
      arr,
      page,
      pages,
      count
    };
    res.status(200).json(result);
  } else {
    res.status(404).send('User not found');
  }
}
