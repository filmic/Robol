var fse = require('fs-extra'),
    fs = require('fs'),
    path = require('path');

/**
 * Copy files
 *
 * @param options {Object} Concat options.
 * @param options.callback {Function} Callback on each blob.
 * @param blob {Blob} Incoming blob.
 * @param done {Function} Callback on task completion.
 */
exports.copyFiles = function(options, blob, done) {
    options = options || {};

    var to = path.join(options.output, path.basename(blob.name));

    // first attempt to create output dir
    fse.mkdir(options.output, function(err) {
      if (err) {
        console.log("Error creating dir: " + options.output);
      }
    });

    // check if output file exists and then remove it
    fs.exists(to, function(exists) {
      if (exists) {
        fs.unlink(to, function() {
          doCopy(blob.name, to, function(err){
            done(err, blob);
          });
        });
      } else {
        doCopy(blob.name, to, function(err){
            done(err, blob);
          });
      }
    });
};

/**
 * Copy dir
 *
 * @param options {Object} Concat options.
 * @param blob {Blob} Incoming blob.
 * @param done {Function} Callback on task completion.
 */
exports.copyDir = function(options, blob, done) {
    options = options || {};

    doCopy(options.input, options.output, function(err){
            done(err, blob);
          });
};
exports.copyDir.type="collect";

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
      console.log(err);
      callback(err);
    } else {
      callback(null);
    }
  });
};