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

    var parser = new less.Parser(),
        result = '',
        logError = function(err) {
            console.log(("\nTASK ERROR: Less "+err.type.toLowerCase()+" error:").red);
            console.log(err.message + "\n");
            console.log((err.line-1)+": "+err.extract[0]);
            console.log((err.line)+": "+err.extract[1].red);
            console.log((err.line+1)+": "+err.extract[2]);
        };

    // Check if incoming blob is CoffeeScript file
    // If not just forward the blob's content
    if (blob.name && path.extname(blob.name) !== '.less') {
      result = blob.result;
      done(null, new blob.constructor(options.callback ? options.callback(result) : result, blob));
    } else {
        parser.parse(blob.result, function(err, tree) {
            if (err) {
                logError(err);
                done(err);
            } else {
                try {
                   result = tree.toCSS({compress: false});
                } catch (e) {
                   logError(e);
                   done(e);
                }
                done(null, new blob.constructor(options.callback ? options.callback(result) : result, blob));
            }
        });
    }
};