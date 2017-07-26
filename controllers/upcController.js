const https = require('https');
const mongoose = require('mongoose');

/* lookupUPC() takes the provided upc code and first searches the
 * items collection for a match.  If none found, the upcitemdb.com api
 * is called and a new item stored in the database.
 */
exports.lookupUPC = async (req, res, next) => {

  if (req.item) {
    /* if the request contains an item, then we have found this upc in
       the database and do not have to call the upcitemdb.com api
    */
    // go on to the next middleware
    next();
    return;
  }
  try {
    const upc = req.body.upc;
    const doc = await getProductByUPC(upc);
    // console.log('document', doc);
    req.doc = doc;
    next();
  } catch(error) {
    // if an error occurred while looking up the barcode, return an error status
    res.status(error.statusCode).json(error);
  }
}

/*
 Calls the upcitemdb.com API to find a product with the provided barcode.
 */
function getProductByUPC(upc) {
  return new Promise(function(resolve, reject){
    let opts = {
      hostname: 'api.upcitemdb.com',
      path: '/prod/trial/lookup',
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      }
    }

    let str = '';

    const request = https.request(opts, function(response){
      console.log('statusCode: ', response.statusCode);

      response.on('data', function(d) {
        str += d.toString();
      });

      response.on('end', function() {
        const data = JSON.parse(str);
        if (response.statusCode !== 200) {
          // if the upcitemdb api returns a status code of
          // something other than 200, then something is wrong
          let error = {
            statusCode: response.statusCode,
            message: data.message + ' ☠️'
          };
          reject(error);
        } else {
          console.log(data);
          const count = data.total;
          const item = itemFromData(data);
          // console.log(item);
          if (!item) {
            let error = {
              statusCode: 404,
              message: 'No item found in response from api.upcitemdb.com'
            }
            reject(error);
          }
          resolve(item);
        }
      });

    });

    request.on('error', function(e) {
      console.log('problem with request: ' + e.message);
      reject(e.message);
    });

    const postData = JSON.stringify({
      'upc': upc
    });

    // console.log(postData);
    request.write(postData);
    // end the request
    request.end();

  });
}

/* itemFromData() takes the data received from the upcitemdb api and
 * pulls out the item data from it.
 */
function itemFromData(data) {
  // console.log(data);
  const count = data.total;
  console.log(`There are ${count} items in data.`);
  if (count) {
    // grab the first item out of the list
    const item = data.items[0];
    // make sure the urls provided are valid urls
    if (item.images.length) {
      fixURLs(item.images);
    }
    // remove the offers array, if it exists
    if (item.offers) {
      delete(item.offers);
    }
    return item;
  }
  return null;
}

/* fixURLs() prepends 'http:' to any urls that start with '//'
 *
 */
function fixURLs(urls) {

  urls.forEach((url, index) => {
    console.log(url);
    // check if the url starts with '//', append 'http:' if it does.
    if (url.startsWith('//')) {
      // append http
      urls[index] = 'http:' + url;
    }
  });

}
