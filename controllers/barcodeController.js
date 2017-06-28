const https = require('https');
const download = require('image-downloader');

const DB = require('../db');

/* "/barcodes/:code"
 * PUT: perform barcode lookup using api.upcitemdb.com
 */

exports.lookupBarCode = async (req, res) => {
  console.log(req.body);
  const collection = req.body.collection;
  const code = req.body.code;

  // getProductFromCode(code)
  // .then(saveToDatabase)
  // .then(formatResult)
  // .then(
  //   function(resultObject) {
  //     console.log(resultObject);
  //     res.json(resultObject);
  //   }
  // )
  // .catch(
  //   function(error) {
  //     console.log('Error: ' + error);
  //     res.status(500).json(error);
  //   }
  // )

  try {
    const doc = await getProductFromCode(code);
    const result = await saveToDatabase(collection, doc);
    // Return status 201 to indicate the document was created
    res.status(201).json(formatResult(result));
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
function getProductFromCode(code) {
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
          // something is wrong
          let message = data.message + ' 💀'
          reject(message);
        }
        resolve(data);
      });

    });

    request.on('error', function(e) {
      console.log('problem with request: ' + e.message);
      reject(e.message);
    });

    const postData = JSON.stringify({
      'upc': code
    });

    // console.log(postData);
    request.write(postData);
    // end the request
    request.end();

  });
}

/* "/barcodes/:code"
 * GET: perform barcode lookup using api.upcitemdb.com
 */
exports.findDocumentWithCode = async (req, res) => {
  const code = req.params.code;

  try {
    const docs = await findCodeInDatabase(collection, code);
    res.json(formatResult(docs));
  } catch(error) {
    console.log('Error: ' + error);
    res.status(500).json(error);
  }
}

/*
 Searches the database for a document with the provided upc barcode
 */
function findCodeInDatabase(collection, code) {
  return new Promise(function(resolve, reject) {
    let database = new DB;
    const query = {
      "items": {
        $elemMatch: {
          "upc": code
        }
      }
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
