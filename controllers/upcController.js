const https = require('https');
const mongoose = require('mongoose');

exports.lookupUPC = async (req, res) => {
  console.log(req.body);
  const upc = req.body.upc;
  try {
    const doc = await getProductByUPC(upc);
    console.log('document', doc);
    res.status(200).send(doc);
  } catch(error) {
    res.status(500).json(error);
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
          let message = data.message + ' ☠️'
          reject(message);
        }

        console.log(data);
        const count = data.total;

        const item = itemFromData(data);
        console.log(item);
        if (!item) {
          reject('No item found in response from api.upcitemdb.com');
        }
        resolve(item);
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

function itemFromData(data) {
  console.log(data);
  const count = data.total;
  console.log(`There are ${count} items in data.`);
  if (count) {
    // grab the first item out of the list
    const item = data.items[0];
    // make sure the urls provided are valid urls
    if (item.images.length) {
      validateURLs(item.images);
    }
    // remove the offers array, if it exists
    if (item.offers) {
      delete(item.offers);
    }
    return item;
  }
  return null;
}

function validateURLs(urls) {

  urls.forEach((url, index) => {
    console.log(url);
    // check if the url starts with '//', append http if it does.
    if (url.startsWith('//')) {
      // append http
      urls[index] = 'http:' + url;
    }
  });

}
