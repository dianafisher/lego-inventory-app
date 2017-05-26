const express = require('express');
const https = require('https');
const cool = require('cool-ascii-faces');

const index = require('./routes/index');

// create our Express app
const app = express();

// set up the port
app.set('port', (process.env.PORT || 5000));

app.use('/', index);

// app.get('/', function(req, res) {
//   res.send('Hello World!');
// });
//
// app.get('/barcode/:code', function(req, res) {
//   const code = req.params.code;
//   if (!code) {
//     console.error('Need to supply a barcode!');
//   }
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// start the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
