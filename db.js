/*
This module provides helper methods to allow the application
to interact with a MongoDB database.
*/

const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

function DB() {
  this.db = null;   // The MongoDB database connection
}

DB.prototype.connect = function() {
  // Connect to the database specified by the connect string / uri

  // Trick to cope with the fact that "this" will refer to a different
  // object once in the promise's function.
  let self = this;

  // This method returns a javascript promise (rather than having the caller
	// supply a callback function).

  return new Promise(function(resolve, reject) {
    if (self.db) {
      // Already connected
      resolve();
    } else {
      var _this = self;

      MongoClient.connect(process.env.DATABASE)
      .then(
        function(database){
          _this.db = database;

          // Indicate to the caller that the request was completed succesfully,
          resolve();

        },
        function(err) {
          console.log("Error connecting: " + err.message);

          // indicate to the caller that the request failed and pass back the error
          reject(err.message);
        }
      )
    }
  })
}

DB.prototype.close = function() {

	// Close the database connection. This if the connection isn't open
	// then just ignore, if closing a connection fails then log the fact
	// but then move on. This method returns nothing – the caller can fire
	// and forget.

	if (this.db) {
		this.db.close()
		.then(
			function() {},
			function(error) {
				console.log("Failed to close the database: " + error.message)
			}
		)
	}
}

DB.prototype.countDocuments = function(coll) {

  // Returns a promise which resolves to the number of documents in the
  // specified collection.

  let self = this;

  return new Promise(function (resolve, reject) {

    // {strict:true} means that the count operation will fail if the collection
		// doesn't yet exist

    self.db.collection(coll, {strict:true}, function(error, collection) {
      if (error) {
        console.log("Could not access collection: " + error.message);
        reject(error.message);
      } else {
        collection.count()
        .then(
          function(count) {
            // Resolve the promise with the count.
            resolve(count);
          },
          function(err) {
            // Reject the promise with the error passed back by the count function.
            reject(err.message);
          }
        )
      }
    });
  });
}

DB.prototype.getDocuments = function(coll, numberDocs) {
  // Returns a promise which is either resolved with an array of
	// "numberDocs" from the "coll" collection or is rejected with the
	// error passed back from the database driver.

  let self = this;

  return new Promise(function (resolve, reject) {
    self.db.collection(coll, {strict:true}, function(error, collection) {
      if (error) {
        console.log("Could not access collection: " + error.message);
        reject(error.message);
      } else {
        // Create a cursor from the aggregation request

        let cursor = collection.aggregate([
          {
						$sample: {size: parseInt(numberDocs)}
					}],
					{ cursor: { batchSize: 10 } }
        )

        // Iterate over the cursor to access each document in the sample
				// result set. Could use cursor.each() if we wanted to work with
				// individual documents here.

        cursor.toArray(function(error, docArray) {
          if (error) {
            console.log("Error reading from cursor: " + error.message);
            reject(error.message);
          } else {
            resolve(docArray);
          }
        })
      }
    })
  });
}

DB.prototype.addDocument = function(coll, document) {

	// Return a promise that either resolves or is rejected with the error
	// received from the database.

	let self = this;

	return new Promise(function (resolve, reject) {
		self.db.collection(coll, {strict:false}, function(error, collection){
			if (error) {
				console.log("Could not access collection: " + error.message);
				reject(error.message);
			} else {

				collection.insert(document, {w: "majority"})
				.then(
					function(result) {
						resolve(document);
					},
					function(err) {
						console.log("Insert failed: " + err.message);
						reject(err.message);
					}
				)
			}
		});
	});
}

DB.prototype.removeDocument = function(coll, docID) {
  let self = this;

  return new Promise(function (resolve, reject) {
    self.db.collection(coll, {strict:false}, function(error, collection) {
      if (error) {
        console.log("Could not access collection: " + error.message);
        reject(error.message);
      } else {
        collection.deleteOne( {_id: new ObjectID(docID)} )
        .then(
          function(result) {
            resolve();
          },
          function(err) {
            console.log("Deletion failed: " + err.message);
            reject(err.message);
          }
        )
      }
    })
  });
}

DB.prototype.findDocument = function(coll, query) {
  let self = this;

  return new Promise(function (resolve, reject) {
    self.db.collection(coll, {strict: true}, function(error, collection) {
      if (error) {
        console.log("Could not access collection: " + error.message);
        reject(error.message);
      } else {
        collection.find(query).toArray(function(error, docArray) {
          if (error) {
            console.log("Error reading fron cursor: " + error.message);
          	reject(error.message);
          } else {
            resolve(docArray);
          }
        })
      }
    })
  });
}

// Make the module available for use in other files
module.exports = DB;
