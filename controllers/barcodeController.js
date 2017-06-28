const https = require('https');
const download = require('image-downloader');

const DB = require('../db');

/* "/barcodes/:code"
 * GET: perform barcode lookup using api.upcitemdb.com
 */
exports.lookupBarCode = (req, res) => {
  const code = req.params.code;

  var opts = {
    hostname: 'api.upcitemdb.com',
    path: '/prod/trial/lookup',
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
    }
  }
  var request = https.request(opts, function(response) {
    console.log('statusCode: ', response.statusCode);
   //  console.log('headers: ', response.headers);
    let str = '';
    response.on('data', function(d) {
      str += d.toString();
    });
    response.on('end', function() {
      const data = JSON.parse(str);
      console.log(data);
      let items = data.items;
      console.log(items.length);
      if (items.length) {
        let doc = items[0];

        let database = new DB;
        database.connect()
        .then(
          function() {
            // returning will pass the promise returned by addDoc to
            // the next .then in the chain
            return database.addDocument('items', doc)
          })
          // No function is provided to handle the connection failing and so that
      		// error will flow through to the next .then
        .then(
          function(docs) {
            return {
              "success": true,
              "documents": docs,
              "error": ""
            };
          },
          function(error) {
            console.log('Failed to add document ' + error);
            return {
              "success": false,
              "documents": null,
              "error": "Failed to add document " + error
            };
          })
        .then(
          function(resultObject) {
            console.log('resultObject', resultObject);
            database.close();
            res.json(resultObject);
          }
        )
      }

    });
  });

  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  const postData = JSON.stringify({
    'upc': code
  });

  // console.log(postData);
  request.write(postData);

  // other requests
  request.end();
};

exports.lookupCode = async (req, res) => {
  const code = req.params.code;

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
    const result = await saveToDatabase(doc);
    res.json(formatResult(result));
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
    console.log('Failed to lookup code ' + error);
    return {
      "success": false,
      "data": null,
      "error": "Failed to lookup code " + error
    };
  }
}

function saveToDatabase(doc) {
  return new Promise(function(resolve, reject){
    let database = new DB;
    database.connect()
    .then(
      function(){
        return database.addDocument('items', doc);
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
