var less = require('less'),
    path = require('path');

/**
 * Minify CSS. Also compiles LESS stylesheets.
 *
 * @param options {Object} Ignored.
 * @param blob {Object} Incoming blob.
 * @param done {Function} Callback on task completion.
 */
exports.lesscompile = function(options, blob, done) {
    options = options || {};

    var parser = new less.Parser();
    var result = '';

    // Check if incoming blob is CoffeeScript file
    // If not just forward the blob's content
    if (blob.name && path.extname(blob.name) !== '.less') {
      result = blob.result;
      done(null, new blob.constructor(options.callback ? options.callback(result) : result, blob));
    } else {
        parser.parse(blob.result, function(err, tree) {
            if (err) {
                console.log("An error occured in: " + blob.name);
                console.log(err);
                done(err);
            } else {
                try {
                   result = tree.toCSS({compress: false});
                } catch (e) {
                   console.log("An error occured in: " + blob.name);
                   console.log(e);
                }
                done(null, new blob.constructor(options.callback ? options.callback(result) : result, blob));
            }
        });
    }
};          
