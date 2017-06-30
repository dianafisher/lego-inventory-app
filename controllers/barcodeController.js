const https = require('https');
const download = require('image-downloader');

const DB = require('../db');

/* "/barcodes/:code"
 * PUT: perform barcode lookup using api.upcitemdb.com
 */

exports.lookupBarCode = async (req, res) => {
  console.log(req.body);
  const collection = req.body.collection;
  const upc = req.body.upc;

  try {
    // 1. Check if we already have this product in our database
    const product = await findUPCInDatabase(collection, upc);
    // 2. If we do have it in our database, return it.
    console.log(product);
    if (product.length) {
      console.log('found in database!');
      const result = product[0];
      res.status(200).json(formatResult(result));
    } else {
      console.log('🤷');
      // 3. Otherwise, call the upcitemdb API to find the product.
      const doc = await getProductByUPC(upc);
      const result = await saveToDatabase(collection, doc);
      // Return status 201 to indicate the document was created
      res.status(201).json(formatResult(result));
    }

  } catch(error) {
    console.log('Error: ' + error);
    res.status(500).json(error);
  }

};

function formatResult(data, error) {
  if (data) {
    return {
      "success": true,
      "data": data,
      "error": ""
    };
  } else {
    console.log('Error ' + error);
    return {
      "success": false,
      "data": null,
      "error": "Error " + error
    };
  }
}

/*
  Saves the provided document to the database.
*/
function saveToDatabase(collection, doc) {
  return new Promise(function(resolve, reject){
    let database = new DB;
    database.connect()
    .then(
      function(){
        return database.addDocument(collection, doc);
      }
    )
    .then(
      function(docs) {
        database.close();
        resolve(docs);
      }
    )
    .catch(
      function(error) {
        console.log(error);
        database.close();
        reject(error);
      }
    )
  });
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
        const reduced = reduceDataFromUPCResponse(data);
        console.log(reduced);
        resolve(reduced);
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

function reduceDataFromUPCResponse(data) {
  console.log(data);
  const count = data.total;
  console.log(`There are ${count} items in data.`);
  if (count) {
    let document = {};
    // for now, we will just focus on the first item in the list
    const firstItem = data.items[0];
    document.upc = firstItem.upc;
    document.title = firstItem.title;
    document.description = firstItem.description;
    document.ean = firstItem.ean;
    document.brand = firstItem.brand;
    document.model = firstItem.model;
    document.color = firstItem.color;
    document.size = firstItem.size;
    document.dimension = firstItem.dimension;
    // if there are images, just grab the first one
    if (firstItem.images.length) {
      document.imageURL = firstItem.images[0];
    } else {
      document.imageURL = '';
    }
    // Amazon asin
    document.asin = firstItem.asin;
    document.elid = firstItem.elid;

    return document;
  }
  return null;
}

/* "/barcodes/:code"
 * GET: perform barcode lookup using api.upcitemdb.com
 */
exports.findDocumentWithCode = async (req, res) => {
  console.log(req.query);
  const collection = req.query.collection;
  const upc = req.query.upc;

  try {
    const docs = await findUPCInDatabase(collection, upc);
    res.json(formatResult(docs));
  } catch(error) {
    console.log('Error: ' + error);
    res.status(500).json(error);
  }
}

/*
 Searches the database for a document with the provided upc barcode
 */
function findUPCInDatabase(collection, upc) {
  return new Promise(function(resolve, reject) {
    let database = new DB;
    // const query = {
    //   "items": {
    //     $elemMatch: {
    //       "upc": upc
    //     }
    //   }
    // };

    const query = {
      "upc": upc
    };

    database.connect()
    .then(
      function() {
        return database.findDocument(collection, query);
      }
    )
    .then(
      function(docs) {
        database.close();
        resolve(docs);
      }
    )
    .catch(
      function(error) {
        console.log(error);
        database.close();
        reject(error);
      }
    )
  })
}

exports.downloadImage = (req, res) => {
  // Download to a directory and save with the original filename
  const options = {
    url: 'http://c.shld.net/rpx/i/s/i/spin/10138019/prod_1588765312',
    dest: `./public/images/photo.jpg`                  // Save to /path/to/dest/image.jpg
  }

  download.image(options)
    .then(({ filename, image }) => {
      console.log('File saved to', filename)
      resultObject = {
        "success": true,
        "error": {}
      };
      res.json(resultObject);
    }).catch((err) => {
      throw err
    })

  // // Download to a directory and save with an another filename
  // options = {
  //   url: 'http://someurl.com/image2.jpg',
  //   dest: '/path/to/dest/photo.jpg'        // Save to /path/to/dest/photo.jpg
  // }
  //
  // download.image(options)
  //   .then(({ filename, image }) => {
  //     console.log('File saved to', filename)
  //   }).catch((err) => {
  //     throw err
  //   })
};

exports.download = async (req, res, next) => {
  const options = {
    url: 'http://someurl.com/image.jpg',
    dest: '/path/to/dest'
  };

  const { filename, image } = await download.image(options)
  console.log(filename) // => /path/to/dest/image.jpg
  next();

}
