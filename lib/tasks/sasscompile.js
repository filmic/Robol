var sass = require('node-sass'),
    path = require('path');

/**
 * Compiles SASS/SCSS stylesheets.
 *
 * @param options {Object} Task options.
 * @param blob {Object} Incoming blob.
 * @param done {Function} Callback on task completion.
 *
 * Copyright (c) 2012, Filip Michalowski
 * Released under the MIT License
 *
 * @author Filip Michalowski (kanelbula@gmail.com)
 * @version 0.2.0
 */
exports.sasscompile = function(options, blob, done) {
    options = options || {};

    // Check if incoming blob is Sass/Scss file
    // If not just forward the blob's content
    if (blob.name &&
      (path.extname(blob.name) !== '.sass' && path.extname(blob.name) !== '.scss')) {
      done(null, new blob.constructor(
        options.callback ? options.callback(blob.result) : blob.result,
        blob));
    }
    else {
      sass.render(blob.result, function(err, css){
        if (err) {
          done(err);
        } else {
          done(null, new blob.constructor(options.callback ? options.callback(css) : css, blob));
        }
      });
    }
};