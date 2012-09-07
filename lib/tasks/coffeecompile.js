var coffee = require('coffee-script'),
    path = require('path');

/**
 * CoffeeScript to JavaScript.
 *
 * @param options {Object} Task options.
 * @param options.config {Object} CoffeeScript compiler options.
 * @param blob {Object} Incoming blob.
 * @param done {Function} Callback on task completion.
 */
exports.coffeecompile = function(options, blob, done) {
    options = options || {};

    var result = '';

    // Check if incoming blob is CoffeeScript file
    // If not just forward the blob's content
    if (path.extname(blob.name) !== '.coffee') {
      result = blob.result;
    }
    else {
      // Try to compile the CoffeeScript code into JavaScript
      try {
        result = coffee.compile(blob.result, options.config || null); // Cast buffer to string
      }
      catch (err) {
        console.log('Error compiling CoffeeScript. ' + err.message);
      }
    }
    
    done(null, new blob.constructor(options.callback ? options.callback(result) : result, blob));
};