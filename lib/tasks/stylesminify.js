var less = require('less');

/**
 * Minify CSS. Also compiles LESS stylesheets.
 *
 * @param options {Object} Ignored.
 * @param blob {Object} Incoming blob.
 * @param done {Function} Callback on task completion.
 */
exports.stylesminify = exports.less = function(options, blob, done) {
    options = options || {};

    var parser = new less.Parser(),
        compress = options.minify === true,
        yuicompress = options.yuicompress === true;

    parser.parse(blob.result, function(err, tree) {
        if (err) {
            done(err);
        } else {
            done(null, new blob.constructor(tree.toCSS({compress: compress, yuicompress: yuicompress}), blob));
        }
    });
};