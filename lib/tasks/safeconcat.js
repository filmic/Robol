/**
 * Concatenates blobs with new line at the end.
 *
 * @param options {Object} Concat options.
 * @param options.callback {Function} Callback on each blob.
 * @param blobs {Array} Incoming blobs.
 * @param done {Function} Callback on task completion.
 *
 * Copyright (c) 2012, Filip Michalowski
 * Released under the MIT License
 *
 * @author Filip Michalowski (kanelbula@gmail.com)
 * @version 0.2.0
 */
exports.safeconcat = function(options, prev, blob, done) {
    options = options || {};

    // Add blank line at the end of file
    // to avoid compiling errors
    var result = prev.result + '\n';
    prev = new blob.constructor(result, prev);

    done(null, new blob.constructor([prev, options.callback ? options.callback(blob) : blob]));
};