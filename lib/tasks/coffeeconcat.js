/**
 * Concatenates blobs with CoffeeScript.
 *
 * @param options {Object} Concat options.
 * @param options.callback {Function} Callback on each blob.
 * @param blobs {Array} Incoming blobs.
 * @param done {Function} Callback on task completion.
 */
exports.coffeeconcat = function(options, prev, blob, done) {
    options = options || {};

    // Add blank line at the end of Coffee Scriptfile 
    // to avoid compiling errors
    var result = prev.result + '\r\n';
    prev = new blob.constructor(result, prev);

    done(null, new blob.constructor([prev, options.callback ? options.callback(blob) : blob]));
};