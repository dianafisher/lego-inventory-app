/*
  Catch Errors handler

  Instead of using try{} catch(e) in each controller, wrap the functions in
  catchErrors() to catch any error thrown and pass it along to our express
  middleware with next()
*/
exports.catchErrors = (fn) => {
  return function(req, res, next) {
    return fn(req, res, next).catch(next);
  };
};


/*
  Development Error Hanlder

  In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
*/
exports.developmentErrors = (err, req, res, next) => {
  console.log('errorHandler:', err.message);
  err.stack = err.stack || '';
  const errorDetails = {
    message: err.message,
    status: err.status,    
    stack: err.stack
  };

  res.status(err.status || 500);
  res.json(errorDetails);
};

/*
  Production Error Handler

  No stacktraces are leaked to user
*/
exports.productionErrors = (err, req, res, next) => {
  res.status(err.status || 500);
  res.json('error', {
    message: err.message,
    error: {}
  });
};

/*
  Not Found Error Handler

  If we hit a route that is not found, respond with 404 error
*/
exports.notFound = (req, res, next) => {
  console.log(req.url);
  res.status(404).json({
    success: false,
    error: `${req.url} not found`
  })
};
