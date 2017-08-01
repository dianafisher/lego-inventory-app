// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });

const express = require('express');
// const session = require('express-session');
// const MongoStore = require('connect-mongo')(session);
const https = require('https');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');
const assert = require('assert');
const cors = require('cors');
const passport = require('passport');  // for user authentication

const expressValidator = require('express-validator');
const errorHandlers = require('./handlers/errorHandlers');

// set up mongoose
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  config: { autoIndex: false },
  useMongoClient: true,
});
mongoose.set('debug', true);
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', (err) => {
  console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
});

// import our models
require('./models/Item');
require('./models/User');
require('./models/UPCItem');
require('./models/UserItem');

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
      if (!value) {
        return false;
      }
      const length = value.length;
      const numbers = /^\d+$/;

      return length === 12 && numbers.test(value);
    }
  }
}));

// populates req.cookies with any cookies that came along with the request
// app.use(cookieParser());

// // set up express session
// app.use(session({
//   secret: process.env.SECRET,
//   key: process.env.KEY,
//   resave: false,
//   saveUninitialized: false,
//   store: new MongoStore({ mongooseConnection: mongoose.connection })
// }));

// set up Passport JS to handle user authentication
// initialize passport
app.use(passport.initialize());
// our app uses persistent login sessions, so use passport.session()
// app.use(passport.session());

const User = mongoose.model('User');

// set up passport-local LocalStrategy
// passport-local-mongoose implements a LocalStrategy and serializeUser/deserializeUser
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// set up the port
app.set('port', (process.env.PORT || 5000));

// To prevent errors from Cross Origin Resource Sharing, set headers to allow CORS
app.use(cors());
app.options('*', cors());

// pass variables to all requests
app.use((req, res, next) => {
  console.log('%s %s', req.method, req.url);

  res.locals.currentPath = req.path;
  next();
});

// Define a single route
app.use('/api', index.router);


app.use(errorHandlers.notFound);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get('env') === 'development') {
  /* Development Error Handler - Prints stack trace */
  app.use(errorHandlers.developmentErrors);
}

// production error handler
// app.use(errorHandlers.productionErrors);

// // start the app
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;
