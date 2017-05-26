const express = require('express');
const https = require('https');
const cool = require('cool-ascii-faces');

const app = express();

app.set('port', (process.env.PORT || 5000));

// root route
app.get('/', function(req, res) {
  res.send('Hello World!');
});

// start the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
