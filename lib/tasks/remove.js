var fse = require('fs-extra'),
    async = require('async');

/**
 * Remove files
 *
 * @param options {Object} Concat options.
 * @param blob {Blob} Blobs in the queue.
 * @param done {Function} Callback on task completion.
 */
exports.removeFiles = function(options, blobs, done) {
    options = options || {};

    var files = options.input;

    // loop through the files array and remove
    async.forEachSeries(files,
      // iterator
      function(file, callback){
        // check if file exists and then remove it
        if (fse.existsSync(file)) {
          fse.removeSync(file);
        }
        callback();
      },
      // callback
      function(err) {
        if (err) {
          done(err, blobs);
        } else {
          done(null, blobs);
        }
      });
};
exports.removeFiles.type="collect";

/**
 * Remove dir
 *
 * @param options {Object} Concat options.
 * @param blob {Blob} Blobs in the queue.
 * @param done {Function} Callback on task completion.
 */
exports.removeDir = function(options, blobs, done) {
    options = options || {};

    var dir = options.input;

    // check if dir exists and then remove it
    if (fse.existsSync(dir)) {
      fse.removeSync(dir);
    }

    done(null, blobs);
};
exports.removeDir.type="collect";