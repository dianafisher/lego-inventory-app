const https = require('https');

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
    console.log('headers: ', response.headers);
    response.on('data', function(d) {
      console.log('BODY: ' + d);
      console.log(d.toString());
      const data = d.toString();
      res.json(data);
    })
  })
  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  })

  const postData = JSON.stringify({
    'upc': code
  });

  console.log(postData);
  // req.write('{ "upc": "4002293401102" }')
  request.write(postData);

  // other requests
  request.end()
};
