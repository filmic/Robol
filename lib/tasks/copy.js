var fse = require('fs-extra'),
    path = require('path'),
    async = require('async');

/**
 * Copy files
 *
 * @param options {Object} Concat options.
 * @param blob {Blob} Blobs in the queue.
 * @param done {Function} Callback on task completion.
 */
exports.copyFiles = function(options, blobs, done) {
    options = options || {};

    var to,
        files = options.input;

    // first attempt to create output dir
    fse.mkdirSync(options.output);

    // loop through the files array and copy
    async.forEachSeries(files,
      // iterator
      function(file, callback){
        to = path.join(options.output, path.basename(file));

        // check if output file exists and then remove it
        if (fse.existsSync(to)) {
          fse.removeSync(to);
        }

        doCopy(file, to, callback);
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
exports.copyFiles.type="collect";

/**
 * Copy dir
 *
 * @param options {Object} Concat options.
 * @param blob {Blob} Blobs in the queue.
 * @param done {Function} Callback on task completion.
 */
exports.copyDir = function(options, blobs, done) {
    options = options || {};

    var to = options.output,
        dir = options.input;

    // check if output dir exists and then remove it
    if (fse.existsSync(to)) {
      fse.removeSync(to);
    }

    doCopy(dir, to, function(err){
      done(err, blobs);
    });
};
exports.copyDir.type="collect";

/**
 * Copy file
 *
 * @param options {Object} Concat options.
 * @param blob {Blob} Blobs in the queue.
 * @param done {Function} Callback on task completion.
 */
exports.copyFile = function(options, blobs, done) {
    options = options || {};

    var to = options.output,
        from = options.input;

    if (path.resolve(to) === path.resolve(from)) {
      done(null, blobs);
      return;
    }

    // first attempt to create output dir
    fse.mkdirSync(path.dirname(options.output));

    // check if output file exists and then remove it
    if (fse.existsSync(to)) {
      fse.removeSync(to);
    }

    doCopy(from, to, function(err){
      done(err, blobs);
    });
};
exports.copyFile.type="collect";

/**
 * Copies a file/dir
 *
 * @param {String} from From path
 * @param {String} to To path
 * @param {Function} callback Callback
 *
 */
var doCopy = function(from, to, callback) {
  fse.copy(from, to, function (err) {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
};