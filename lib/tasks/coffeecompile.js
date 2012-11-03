var coffee = require('coffee-script'),
    path = require('path'),
    colors = require('colors');

/**
 * CoffeeScript to JavaScript.
 *
 * @param options {Object} Task options.
 * @param options.config {Object} CoffeeScript compiler options.
 * @param blob {Object} Incoming blob.
 * @param done {Function} Callback on task completion.
 *
 * Copyright (c) 2012, Filip Michalowski
 * Released under the MIT License
 *
 * @author Filip Michalowski (kanelbula@gmail.com)
 * @version 0.2.0
 */
exports.coffeecompile = function(options, blob, done) {
    options = options || {};

    var result = '';

    // Check if incoming blob is CoffeeScript file
    // If not just forward the blob's content
    if (blob.name && path.extname(blob.name) !== '.coffee') {
      result = blob.result;
    }
    else {
      // Try to compile the CoffeeScript code into JavaScript
      try {
        result = coffee.compile(blob.result, options.config || null); // Cast buffer to string
      }
      catch (e) {
        var errorLine = parseInt(e.message.split(' on line ')[1], 10) - 1;
        var lines = blob.result.split('\n');

        if (errorLine) {
          console.log("\nTASK ERROR: CoffeeScript parse error:".red);
          console.log(e.message + "\n");
          console.log((errorLine)+": "+lines[errorLine-1]);
          console.log((errorLine+1)+": "+lines[errorLine].red);
          console.log((errorLine+2)+": "+lines[errorLine+1]);
        } else {
          console.log("\nTASK ERROR: CoffeeScript compile error:".red);
          console.log(e.message);
        }
        done(e);
        return;
      }
    }
    
    done(null, new blob.constructor(options.callback ? options.callback(result) : result, blob));
};