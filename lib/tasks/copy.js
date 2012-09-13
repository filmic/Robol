var fs = require('fs.extra'),
    path = require('path');

/**
 * Copy files
 *
 * @param options {Object} Concat options.
 * @param options.callback {Function} Callback on each blob.
 * @param blob {Blob} Incoming blob.
 * @param done {Function} Callback on task completion.
 */
exports.copy = function(options, blob, done) {
    options = options || {};

    var to = path.join(options.output, path.basename(blob.name));

    // check if output file exists and then remove it
    fs.exists(to, function(exists) {
      if (exists) {
        fs.unlink(to, function() {
          doCopy();
        });
      } else {
        doCopy();
      }
    });

    /**
     * Copies a file
     *
     */
    var doCopy = function() {
      fs.copy(blob.name, to, function (err) {
        if (err) {
          console.log(err);
          done(err);
        } else {
          done(null, blob);
        }
      });
    };
};