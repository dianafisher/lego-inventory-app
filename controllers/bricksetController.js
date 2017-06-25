const soap = require('soap');
const https = require('https');
const parseString = require('xml2js').parseString;

const apiKey = process.env.BRICKSET_KEY;
const userHash = process.env.BRICKSET_USERHASH;
const username = process.env.BRICKSET_USERNAME;

// exports.hopethisworks = (req, res) => {
//   var barcode = req.query.barcode || req.body.barcode;
//   var wsdlUrl = 'http://www.searchupc.com/service/UPCSearch.asmx?wsdl';
//   soap.createClient(wsdlUrl, function(err, soapClient){
//     // we now have a soapClient - we also need to make sure there's no `err` here.
//     if (err){
//         return res.status(500).json(err);
//       }
//     soapClient.GetProduct({
//       upc : '9780201896831',
//       accesstoken : '924646BB-A268-4007-9D87-2CE3084B47BC'
//     }, function(err, result){
//       if (err){
//         return res.status(500).json(err);
//       }
//       return res.json(result);
//     });
//   });
// }

exports.testApiKey = (req, res) => {
  const options = {
    hostname: 'brickset.com',
    path: `/api/v2.asmx/checkKey?apiKey=${apiKey}`,
    method: 'GET'
  };
  const request = https.request(options, function(response) {
    console.log('statusCode:', response.statusCode);
    console.log('headers:', response.headers);
    let xml = '';
    response.on('data', function(d) {
      // console.log(d.toString());
      xml += d.toString();
    });
    response.on('end', function() {
      console.log('ended');
      console.log('xml', xml);
      parseString(xml, function(err, result){
        console.dir(result);
        console.log(err);
        res.json(result);
      });
    });
  });
  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // finish sending the request
  request.end();
}

exports.getSets = (req, res) => {
  console.log('query params', req.query);
  const setNumber = req.query.number || '';
  const theme = req.query.theme || '';
  const subtheme = req.query.subtheme || '';
  const blank = '';
  let pageNumber = '1';

  const options = {
    hostname: 'brickset.com',
    path: `/api/v2.asmx/getSets?apiKey=${apiKey}&userHash=${userHash}&query=${blank}&theme=${theme}&subtheme=${subtheme}&setNumber=${setNumber}&year=${blank}&owned=${blank}&wanted=${blank}&orderBy=${blank}&pageSize=${blank}&pageNumber=${pageNumber}&userName=${username}`,
    method: 'GET'
  };
  const request = https.request(options, function(response) {
    console.log('statusCode:', response.statusCode);
    console.log('headers:', response.headers);
    let xml = '';
    response.on('data', function(d) {
      // console.log(d.toString());
      xml += d.toString();
    });
    response.on('end', function() {
      console.log('ended');
      console.log('xml', xml);
      parseString(xml, {'explicitArray': false}, function(err, result){
        console.dir(result);
        console.log(err);
        res.json(result);
      });
    });
  });
  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  // finish sending the request
  request.end();
};
