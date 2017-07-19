const aws = require('aws-sdk');
const request = require('request');
const uuid = require('uuid');

const S3_BUCKET = process.env.S3_BUCKET_NAME;

exports.getSignedRequest = (req, res) => {
  const s3 = new aws.S3();
  console.log('request', req.query);
  const fileName = req.query['file-name'];
  const fileType = req.query['file-type'];
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    console.log(JSON.stringify(returnData));

    res.write(JSON.stringify(returnData));
    res.end();
  });
}

exports.uploadImage = async (req, res) => {
  console.log(req.body);
  try {
    const url = req.body.url;
    const imageURL = await uploadImageToS3(url);
    console.log('imageURL', imageURL);
    const result = { imageURL };
    res.status(200).json(result);
  }
  catch(error) {
    console.log('Error: ' + error);
    res.status(500).json(error);
  }
}

function uploadImageToS3(url) {
  return new Promise(function(resolve, reject){
    let contentType = '';
    let fileName = '';

    request.get({url: url, encoding: null}, function(err, res) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log('status code: ', res.statusCode);
        console.log(res.headers);
        console.log(typeof res.body);
        console.log(res.url);

        let extension = 'jpg';
        if (contentType === 'image/png') {
          extension = 'png';
        }

        contentType = res.headers['content-type'];
        // create a unique filename using uuid
        fileName = `${uuid.v4()}.${extension}`;

        const s3 = new aws.S3();

        s3.putObject({
          Bucket: S3_BUCKET,
          Key: fileName,
          Body: res.body,
          ContentType: contentType,
          ACL: 'public-read'
        }, function(error, data){
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log(data);
            const awsURL = `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`;
            console.log(awsURL);
            resolve(awsURL);
          }
        });
      }
    });
  });
}
