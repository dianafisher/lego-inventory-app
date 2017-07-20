// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });

const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const assert = require('assert');
const cors = require('cors');
const expressValidator = require('express-validator');

const errorHandlers = require('./handlers/errorHandlers');
const index = require('./routes/index');

// create our Express app
const app = express();

// app.use indicates global middleware
// serves up static files from the public folder. Anything in public/ will just be served up as the file it is
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.set('views', path.join(__dirname, 'views')); // this is the folder where we keep our ejs files
app.set('view engine', 'ejs'); // we use the EJS engine

// Form submits will be url encoded via the bodyParser package
// Takes the raw requests and turns them into usable properties on req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use expressValidator to validate data
app.use(expressValidator({
  customValidators: {
    isUPC: function(value) {
      /* A valid UPC-A code contains 12 numbers.  No letters, characters, or
        other content of any kind may appear.
        source: https://en.wikipedia.org/wiki/Universal_Product_Code
      */
      const numbers = /^\d+$/;
      const length = value.length;

      return length === 12 && numbers.test(value);
    }
  }
}));

// set up the port
app.set('port', (process.env.PORT || 5000));

// To prevent errors from Cross Origin Resource Sharing, set headers to allow CORS
app.use(cors());
app.options('*', cors());

// Define a single route
app.use('/', index.router);


// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// pass variables to our templates + all requests
// app.use((req, res, next) => {
//   res.locals.h = helpers;
//   // res.locals.flashes = req.flash();  // pull out any flashes that need to be shown
//   // res.locals.user = req.user || null;
//   res.locals.currentPath = req.path;
//   next();
// });

// If that above routes didnt work, we 404 them and forward to error handler
// app.use(errorHandlers.notFound);

// One of our error handlers will see if these errors are just validation errors
// app.use(errorHandlers.flashValidationErrors);

// Otherwise this was a really bad error we didn't expect! Shoot eh
// if (app.get('env') === 'development') {
//   /* Development Error Handler - Prints stack trace */
//   app.use(errorHandlers.developmentErrors);
// }

// production error handler
// app.use(errorHandlers.productionErrors);

// // start the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
