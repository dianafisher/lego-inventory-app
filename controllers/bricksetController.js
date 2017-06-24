const soap = require('soap');
const https = require('https');
const parseString = require('xml2js').parseString;

var apiWSDL = 'https://brickset.com/api/v2.asmx?WSDL';
const apiKey = process.env.BRICKSET_KEY;

// xml data is extracted from wsdl file created
// var xml = require('fs').readFileSync('./bmicalculator.wsdl','utf8');

//based on searching brickset.com
var minYear = 1990;

function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.hopethisworks = (req, res) => {
  var barcode = req.query.barcode || req.body.barcode;
  var wsdlUrl = 'http://www.searchupc.com/service/UPCSearch.asmx?wsdl';
  soap.createClient(wsdlUrl, function(err, soapClient){
    // we now have a soapClient - we also need to make sure there's no `err` here.
    if (err){
        return res.status(500).json(err);
      }
    soapClient.GetProduct({
      upc : '9780201896831',
      accesstoken : '924646BB-A268-4007-9D87-2CE3084B47BC'
    }, function(err, result){
      if (err){
        return res.status(500).json(err);
      }
      return res.json(result);
    });
  });
}

exports.testApiKey = (req, res) => {
  // soap.createClient(apiWSDL, function(err, client) {
  //   if (err) {
  //     console.error("error creating client", err);
  //     return res.status(500).json(err);
  //   }
  //   console.log(client.describe());
  //   var requestElement = {
  //     "apiKey": key
  //   }
  //   client.addSoapHeader({});
  //   client.checkKey(requestElement, function(err, result, body) {
  //     if (err) {
  //       // console.error(err);
  //       console.log('last request: ', client.lastRequest);
  //
  //       return res.status(500).json(err);
  //     }
  //     var requestResult = result['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0];
  //     var response = result.checkKeyResult;
  //     console.log('response', response);
  //   });
  // });

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

exports.lookupSet = (req, res) => {
  // soap.createClient(apiWSDL, function(err, client) {
  //   if (err) {
  //     console.error("error creating client", err);
  //     return res.status(500).json(err);
  //   }
  //   client.login({
  //     apiKey: key,
  //     username: 'dfisher',
  //     password: 'city8252'
  //   }, function(err, result) {
  //     if (err) {
  //       console.error(err);
  //       console.log('last request: ', client.lastRequest);
  //
  //       return res.status(500).json(err);
  //     }
  //
  //     var response = result.loginResult;
  //     console.log(response);
  //   });
  // });

  const userHash = '';
  const query = '';
  const theme = '';
  const username = '';
  let pageNumber = '1';
  const setNumber = '9489-1';

  const options = {
    hostname: 'brickset.com',
    path: `/api/v2.asmx/getSets?apiKey=${apiKey}&userHash=${userHash}&query=${query}&theme=${theme}&subtheme=${theme}&setNumber=${setNumber}&year=${theme}&owned=${theme}&wanted=${theme}&orderBy=${theme}&pageSize=${theme}&pageNumber=${pageNumber}&userName=${username}`,
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
}

exports.doesnotwork = (req, res) => {

  //first, determine the year
  var year = getRandomInt(minYear, (new Date()).getFullYear());
  console.log('chosen year', year);

  var p = new Promise(function(resolve, reject) {

          soap.createClient(apiWSDL, function(err, client) {
              if(err) throw new Error(err);

              var args = {
                  apiKey:key,
                  userHash:'',
                  query:'',
                  theme:'',
                  subtheme:'',
                  setNumber:'',
                  year:year,
                  owned:'',
                  wanted:'',
                  orderBy:'',
                  pageSize:'2000',
                  pageNumber:'1',
                  userName:''
              }
              var userArgs = {
                apiKey: key,
                username: 'dfisher',
                password: 'city8252'
              }
              client.login(userArgs, function(err, res) {
                if (err) {
                  reject(err);
                }
                var lr = res.loginResult;
                console.log('lr', lr);
                resolve();
              });

              // client.getSets(args, function(err, result) {
              //     if(err) reject(err);
              //     if(!result) {
              //         return getRandomSet();
              //     }
              //     console.log('result', result);
              //     var sets = result.getSetsResult.sets;
              //     console.log('i found '+sets.length+' results');
              //     if(sets.length) {
              //         var chosen = getRandomInt(0, sets.length-1);
              //         var set = sets[chosen];
              //         // now that we have a set, try to get more images
              //         if(set.additionalImageCount > 0) {
              //             client.getAdditionalImages({apiKey:key, setID:set.setID}, function(err, result) {
              //                 if(err) reject(err);
              //                 console.log('i got more images', result);
              //                 set.additionalImages = result;
              //                 resolve(set);
              //             });
              //         } else {
              //             resolve(set);
              //         }
              //     }
              // });
          });


      });

      return p;
};
