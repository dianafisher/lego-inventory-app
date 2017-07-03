const https = require('https');
const aws = require('aws-sdk');
const request = require('request');
const uuid = require('uuid');

const S3_BUCKET = process.env.S3_BUCKET_NAME;
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
      console.log('result', result);

      // await uploadImageToS3('https://i5.walmartimages.com/asr/ea171e00-5f06-44f3-8836-4d1ed9fb8a02_1.1fa613f5c05415a92718cf038928eea0.jpeg?odnHeight=450&odnWidth=450&odnBg=ffffff');

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
        // upload the product image to S3
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

    // items can have multiple image urls, process them and store them
    if (firstItem.images.length) {
      handleItemImageURLs(document, firstItem.images);
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

function handleItemImageURLs(document, urls) {

  urls.forEach((url, index) => {
    console.log(url);
    // check if the url starts with '//', append http if it does.
    if (url.startsWith('//')) {
      // append http
      urls[index] = 'http:' + url;
    }
  });

  document.images = urls;
}

async function uploadImageToS3(url) {

  let contentType = '';
  let fileName = '';

  try {

    request.get({url: url, encoding: null}, function(err, res) {
      if (err) {
        console.log(error);
      } else {
        console.log('status code: ', res.statusCode);
        console.log(res.headers);
        console.log(typeof res.body);
        console.log(res.url);

        let extension = 'jpg';
        // create a unique filename using uuid
        if (contentType === 'image/png') {
          extension = 'png';
        }

        contentType = res.headers['content-type'];
        fileName = `${uuid.v4()}.${extension}`;

        const s3 = new aws.S3();

        s3.putObject({
          Bucket: S3_BUCKET,
          Key: fileName,
          Body: res.body,
          ContentType: contentType,
          ACL: 'public-read'
        }, function(err, data){
          if (err) {
            console.log(err);
          } else {
            console.log(data);

            console.log(`https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`);
          }

        })
      }
    });

  } catch(err) {
    console.log(err);
  }
}

function getSignedAWSRequest(fileName, fileType) {
  const s3 = new aws.S3();

  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  return new Promise(function(resolve, reject){
    s3.getSignedUrl('putObject', s3Params, (err, data) => {
      if(err){
        console.log(err);
        reject(err);
      }
      const returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      };
      console.log(JSON.stringify(returnData));
      resolve(returnData);
    });
  });
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
