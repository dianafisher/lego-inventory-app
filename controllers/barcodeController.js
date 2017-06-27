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
