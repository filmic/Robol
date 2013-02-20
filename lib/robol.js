/*
 * ROBOL
 *
 * Build tool for web projects using JavaScript, CSS,
 * CoffeeScript, LESS and other.
 *
 * Copyright (c) 2012, Filip Michalowski
 * Released under the MIT License
 *
 * @author Filip Michalowski (kanelbula@gmail.com)
 * @version 0.3.3
 */

var gear = require('gear'),
    gearlib = require('gear-lib'),
    fs = require('fs'),
    watchr = require('watchr'),
    path = require('path'),
    async = require('async'),
    colors = require('colors'),
    extend = require('whet.extend'),
    optimist = require('optimist');

// Default build config (reflects the JSON data from config file)
var config = {
  "scripts": {
    "input_dir": ".",
    "input_files": [],
    "output_dir": ".",
    "output_file": "scripts.min.js",
    "minify": true,
    "minify_config": {
      "strict_semicolons": false, // the parser will throw an error when it expects a semicolon and it doesn’t find it
      "mangle": false, // mangles (compresses) variables and function names
      "toplevel": false, // mangle toplevel names
      "except": [], // an array of names to exclude from compression"
      "defines": {}, // an object with properties named after symbols to replace
      "squeeze": false, // employs further optimizations designed to reduce the size of the code
      "make_seqs": true, // makes consecutive statements in a block to be merged using the “sequence” (comma) operator
      "dead_code": true // removes unreachable code
    },
    "lint": true,
    "lint_config": {
      bitwise: true, "continue": true, debug: true, eqeq: true,
      es5: true, forin: true, newcap: true, nomen: true,
      plusplus: true, regexp: true, undef: true, unparam: true,
      sloppy: true, stupid: false, sub: true, todo: true,
      vars: true, white: true, browser: true
    }
  },
  "styles": {
    "input_dir": ".",
    "input_files": [],
    "output_dir": ".",
    "output_file": "styles.min.js",
    "minify": true,
    "lint": true
  },
  "copy_files": {
    "input_dir": ".",
    "input_files": [],
    "output_dir": "."
  },
  "copy_dir": {
    "input_dir": "",
    "output_dir": ""
  },
  "remove_files": {
    "input_dir": ".",
    "input_files": []
  },
  "remove_dir": {
    "input_dir": ""
  },
  "copy_file": {
    "input_file": "",
    "output_file": ""
  }
};

// Valid file extensions
var validExt = {
  scripts: ['.js', '.coffee'],
  styles: ['.css', '.less']
};

// Creates new Gear Registry object and load tasks
// from gear-lib module and our library
var taskRegistry = new gear.Registry();
taskRegistry.load({dirname: path.join(path.dirname(fs.realpathSync(__filename)), '../node_modules/gear-lib/lib')});
taskRegistry.load({dirname: path.join(path.dirname(fs.realpathSync(__filename)), './tasks')});

/**
 * Load and parse build configuration
 * @param {String}   filename Name of the config file
 * @param {Function} callback Task complete callback
 */
var loadBuildConfig = function(filename, callback) {
  // load config file
  fs.readFile(filename, 'utf8', function(err, data) {
    if (err) {
      callback( new Error('Config file ' + filename + ' doesn\'t exist') );
      return;
    } else {
      try {
        // parse loaded file
        var parsedConfig = JSON.parse(data);

        // Support old notation
        if (parsedConfig.copyFiles) parsedConfig.copy_files = parsedConfig.copyFiles;
        if (parsedConfig.copyDir) parsedConfig.copy_dir = parsedConfig.copyDir;

        // extend default config with loaded one
        config = extend(true, config, parsedConfig);
      } catch (e) {
        callback( new Error('Invalid JSON in ' + filename + ' config file') );
        return;
      }

      // check if tasks configurations are single objects
      // then convert them into Arrays of objects
      if (!Array.isArray(config.scripts)) {
        config.scripts = [config.scripts];
      }
      if (!Array.isArray(config.styles)) {
        config.styles = [config.styles];
      }
      if (!Array.isArray(config.copy_files)) {
        config.copy_files = [config.copy_files];
      }
      if (!Array.isArray(config.copy_dir)) {
        config.copy_dir = [config.copy_dir];
      }
      if (!Array.isArray(config.remove_files)) {
        config.remove_files = [config.remove_files];
      }
      if (!Array.isArray(config.remove_dir)) {
        config.remove_dir = [config.remove_dir];
      }
      if (!Array.isArray(config.copy_file)) {
        config.copy_file = [config.copy_file];
      }

      // prepare and check input files
      var parseCheckFiles = function(configArray, validExt) {
        var success = true,
            fileMask,
            filePath,
            dirContent;

        configArray.forEach(function(cfg) {
          var files = [];

          // setup files' paths (join file's input directory path with name)
          // check for the wildcards
          cfg.input_files.forEach(function(f,i,array) {
            f = cfg.input_dir + "/" + f;
            fileMask = new RegExp(f.replace(/\*/g, '(.*)'));

            if (~f.indexOf('*')) {
              filePath = f.substr(0, f.lastIndexOf('/')+1);
              dirContent = fs.readdirSync(filePath);

              dirContent.forEach(function(ff) {
                var fp = filePath+ff;
                if (fileMask.test(fp)) {
                  files.push(fp);
                }
              });
            } else {
              files.push(f);
            }
          });

          // Set the input files array after parsing the wildcards
          cfg.input_files = files.concat();

          // check type of files (to reject unsupported scripts/styles)
          success = cfg.input_files.every(function(file) {
            if (validExt && validExt.indexOf(path.extname(file)) < 0) {
              callback(new Error('Cannot compile. Invalid type of file: ' + file));
              return false;
            } else {
              return true;
            }
          });
        });
        return success;
      };

      // If all input files are parsed and have
      // valid extensions call success callback
      if (parseCheckFiles(config.scripts, validExt.scripts) &&
        parseCheckFiles(config.styles, validExt.styles) &&
        parseCheckFiles(config.copy_files) &&
        parseCheckFiles(config.remove_files)) {
          callback();
      }
    }
  });
};

/**
 * Filters array of files to get files with
 * specific extension
 *
 * @param  {Array}  array     Array of file names
 * @param  {String} extension File extension
 * @return {Array}            Filtered array
 */
var filterInput = function(array, extension) {
  return array.filter(function(el){
    return path.extname(el) === extension;
  });
};

/**
 * Formats output for the log function
 * @param  {String} prefix Prefix
 * @param  {Array|String}  obj  Array of file names or String
 */
var formatLog = function(prefix, obj) {
  return '\n'+prefix.cyan+'\n - '+
    (Array.isArray(obj) ? obj.join('\n - ') : obj.toString());
};

// ****************************************************
// Main compile tasks
// ****************************************************

/**
 * Loads, compiles, concatenates and minifies script files
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var buildScripts = function(cfg, callback) {
  // Filter all CoffeeScript files
  var coffeeFiles = filterInput(cfg.input_files, '.coffee');

  // Filter all JavaScript files
  var jsFiles = filterInput(cfg.input_files, '.js');

  // Output file path
  var outputPath = path.join(cfg.output_dir, cfg.output_file);

  // JavaScript code from compiled CoffeScript files
  var coffeeCompiledCode = '';

  // Callback for CoffeScript compilation completed
  var onCoffeeCompileComplete = function(result) {
    coffeeCompiledCode = result;
  };

  // Callback for script concatenation task
  var concatWithCoffeeCompiledCode = function(result) {
    return result + coffeeCompiledCode;
  };

  // Callback for lint task
  var onJSLinted = function(blob) {
    if (blob.jslint && blob.jslint.length) {
      console.log('\nJSLint reports issues in: '.red + blob.name);
      blob.jslint.forEach(function(i){
        if (i) {
          console.log(' Line ' + i.line + ', Col ' + i.character + ': ' + i.reason);
        }
      });
    }
  };

  // Build Scripts
  if (jsFiles.length + coffeeFiles.length > 0) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Building scripts:', jsFiles.concat(coffeeFiles)))
    .tasks({
      readcf:       {task: ['read', coffeeFiles]},
      combinecf:    {requires: 'readcf', task: 'safeconcat'},
      coffeetojs:   {requires: 'combinecf', task: ['coffeecompile', {callback: onCoffeeCompileComplete}]},
      readjs:       {requires: 'coffeetojs', task: ['read', jsFiles]},
      lint:         {requires: 'readjs', task: cfg.lint ? ['jslint', {config: cfg.lint_config, callback: onJSLinted}] : 'noop'},
      combinejs:    {requires: 'lint', task: 'concat'},
      combineall:   {requires: 'combinejs', task: ['concat', {callback: concatWithCoffeeCompiledCode}]},
      minify:       {requires: 'combineall', task: cfg.minify ? ['jsminify', {config: cfg.minify_config}] : 'noop'},
      write:        {requires: 'minify', task: ['write', outputPath]}
    })
    .log(formatLog('Saved scripts to:', outputPath))
    .run(callback);
  } else {
    callback();
  }
};

/**
 * Loads, compiles, concatenates and minifies style files
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var buildStyles = function(cfg, callback) {
  var lessCompiledCode = "";

  // Filter all Less files
  var lessFiles = filterInput(cfg.input_files, '.less');

  // Filter all Css files
  var cssFiles = filterInput(cfg.input_files, '.css');

  // Output file path
  var outputPath = path.join(cfg.output_dir, cfg.output_file);

  // Callback for Less compilation completed
  var onLessCompileComplete = function(result) {
    lessCompiledCode = result;
  };

  // Callback for style concatenation task
  var concatWithCssCompiledCode = function(result) {
    return result + lessCompiledCode;
  };

  // Callback for lint task
  var onCSSLinted = function(blob) {
    if (blob.csslint && blob.csslint.length && blob.csslint[0].line !== undefined) {
      console.log('\nCSSLint reports issues in: '.red + blob.name);
      blob.csslint.forEach(function(i){
        if (i) {
          console.log(' Line ' + i.line + ', Col ' + i.col + ': ' + i.message);
        }
      });
    }
  };

  // Build Styles
  if (cssFiles.length+lessFiles.length > 0) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Building styles:', cssFiles.concat(lessFiles)))
    .tasks({
      readless:     {task: ['read', lessFiles]},
      combineless:  {requires: 'readless', task: 'safeconcat'},
      lesstocss:    {requires: 'combineless', task: ['lesscompile', {callback: onLessCompileComplete}]},
      readcss:      {requires: 'lesstocss', task: ['read', cssFiles]},
      lint:         {requires: 'readcss', task: cfg.lint ? ['csslint', {config: cfg.lint_config, callback: onCSSLinted}] : 'noop'},
      combinecss:   {requires: 'lint', task: 'concat'},
      combineall:   {requires: 'combinecss', task: ['concat', {callback: concatWithCssCompiledCode}]},
      minify:       {requires: 'combineall', task: cfg.minify ? 'cssminify' : 'noop'},
      write:        {requires: 'minify', task: ['write', outputPath]}
    })
    .log(formatLog('Saved styles to: ', outputPath))
    .run(callback);
  } else {
    callback();
  }
};

/**
 * Copies files
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var copyFiles = function(cfg, callback) {
  // Input files
  var files = cfg.input_files;

  // Output dir
  var outputPath = cfg.output_dir;

  if (files.length > 0) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Copying files:', files))
    .copyFiles({input: files, output: outputPath}, callback)
    .log(formatLog('Copied files to: ', outputPath))
    .run(callback);
  } else {
    callback();
  }
};

/**
 * Copy file
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var copyFile = function(cfg, callback) {
  // Input files
  var inputPath = path.normalize(cfg.input_file);

  // Output dir
  var outputPath = path.normalize(cfg.output_file);

  if (cfg.input_file && cfg.output_file) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Copying file:', inputPath))
    .copyFile({input: inputPath, output: outputPath}, callback)
    .log(formatLog('Copied file to: ', outputPath))
    .run(callback);
  } else {
    callback();
  }
};

/**
 * Copies single directory
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var copyDir = function(cfg, callback) {
  // Input dir
  var inputPath = cfg.input_dir;

  // Output dir
  var outputPath = cfg.output_dir;

  if (inputPath && outputPath) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Copying directory:', inputPath))
    .copyDir({input: inputPath, output: outputPath}, callback)
    .log(formatLog('Copied directory to: ', outputPath))
    .run(callback);
  } else {
    callback();
  }
};


/**
 * Removes files
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var removeFiles = function(cfg, callback) {
  // Input files
  var files = cfg.input_files;

  if (files.length > 0) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Removing files:', files))
    .removeFiles({input: files}, callback)
    .run(callback);
  } else {
    callback();
  }
};

/**
 * Removes single directory
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var removeDir = function(cfg, callback) {
  // Input dir
  var inputPath = cfg.input_dir;

  if (inputPath) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log(formatLog('Removing directory:', inputPath))
    .removeDir({input: inputPath}, callback)
    .run(callback);
  } else {
    callback();
  }
};


/**
 * Setup watching of changes in the input files
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var setupWatch = function(cfg, callback) {
  var paths = cfg.input_files || cfg.input_file || cfg.input_dir;
  if (!Array.isArray(paths)) {
    paths = [paths];
  }
  
  watchr.watch({
    paths: paths,
    listener: function(eventName,filePath,fileCurrentStat,filePreviousStat){
      console.log(formatLog('File changed:', filePath));
      
      var singleFileCfg,
          outputDir,
          logTaskError = function(msg) {
            console.log('\n'+msg.red);
          };

      // Detect what build configuration the file belongs to
      if (config.scripts.indexOf(cfg) !== -1) {
        // rebuild scripts
        buildScripts(cfg, function(err){
          if (err) {
            logTaskError('Scripts not saved!');
          }
        });
      } else if (config.styles.indexOf(cfg) !== -1) {
        // rebuild styles
        buildStyles(cfg, function(err){
          if (err) {
            logTaskError('Styles not saved!');
          }
        });
      } else if (config.copy_files.indexOf(cfg) !== -1) {
        // copy files
        singleFileCfg = {input_files: [filePath], output_dir: cfg.output_dir};
        copyFiles(singleFileCfg, function(err){
          if (err) {
            logTaskError('File not copied!');
          }
        });
      } else if (config.copy_file.indexOf(cfg) !== -1) {
        // copy/rename single file
        singleFileCfg = {input_file: filePath, output_file: cfg.output_file};
        copyFile(singleFileCfg, function(err){
          if (err) {
            logTaskError('File not copied!');
          }
        });
      } else if (config.copy_dir.indexOf(cfg) !== -1) {
        // copy single directory
        outputDir = path.dirname(filePath).replace(cfg.input_dir, cfg.output_dir);
        singleFileCfg = {input_files: [filePath], output_dir: outputDir};
        copyFiles(singleFileCfg, function(err){
          if (err) {
            logTaskError('Directory not copied!');
          }
        });
      }
    },
    next: function(err,watcher){
      if (err) {
        callback(err);
      } else {
        callback();
      }
    }
  });
};

/**
 * Runs the build process
 *
 * @param  {Object}   options   Options object (parsed from command line)
 * @param  {String}   options.c Path to the config file
 * @param  {Boolean}  options.w Watch mode flag
 */
exports.run = function(options) {
  // Do build and watch
  console.log('ROBOL BUILDER IN ACTION!'.rainbow);

  var msg,
      taskErrors = [],
      logTaskError = function(msg) {
        taskErrors.push(msg);
        console.log('\n'+msg.red);
      };

  // Setup task queue (execute tasks in series)
  async.series({
    load_config: function(callback) {
      loadBuildConfig(options.c, callback);
    },
    build_scripts: function(callback) {
      async.forEachSeries(config.scripts, buildScripts, function(err){
        if (err) {
          logTaskError('Scripts not saved!');
        }
        callback();
      });
    },
    build_styles: function(callback) {
      async.forEachSeries(config.styles, buildStyles, function(err){
        if (err) {
          logTaskError('Styles not saved!');
        }
        callback();
      });
    },
    copy_files: function(callback) {
      if (config.copy_files) {
        async.forEachSeries(config.copy_files, copyFiles, function(err){
          if (err) {
            logTaskError('File not copied!');
          }
          callback();
        });
      } else {
        callback();
      }
    },
    copy_file: function(callback) {
      if (config.copy_file) {
        async.forEachSeries(config.copy_file, copyFile, function(err){
          if (err) {
            logTaskError('File not copied!');
          }
          callback();
        });
      } else {
        callback();
      }
    },
    copy_dir: function(callback) {
      if (config.copy_dir) {
        async.forEachSeries(config.copy_dir, copyDir, function(err){
          if (err) {
            logTaskError('Directory not copied!');
          }
          callback();
        });
      } else {
        callback();
      }
    },
    remove_files: function(callback) {
      if (config.remove_files) {
        async.forEachSeries(config.remove_files, removeFiles, function(err){
          if (err) {
            logTaskError('File not removed!');
          }
          callback();
        });
      } else {
        callback();
      }
    },
    remove_dir: function(callback) {
      if (config.remove_dir) {
        async.forEachSeries(config.remove_dir, removeDir, function(err){
          if (err) {
            logTaskError('Directory not removed!');
          }
          callback();
        });
      } else {
        callback();
      }
    },
    setup_watch: function(callback){
      if (options.w) {
        var filesToWatch = [].concat(config.scripts, config.styles, config.copy_files, config.copy_dir, config.copy_file);
        async.forEachSeries(filesToWatch, setupWatch, function(err){
          if (err) {
            logTaskError('Watch mode failed!');
          } else {
            console.log('\nWatch mode successfully enabled.'.green);
          }
          callback();
        });
      } else {
        callback();
      }
    }
  }, function(err, data) {
    if (err) {
      console.log('\nBUILD STATUS: FAILED\n'.red);
      console.dir(err);
    } else {
      if (taskErrors.length>0) {
        console.log('\nBUILD STATUS: FAILED'.red);
        console.log(taskErrors.join('\n').red);
      } else {
        console.log('\nBUILD STATUS: OK\n'.green);
      }
    }
  });
};

/**
 * Reads module version from package.json file
 *
 * @param {Function} callback Task complete callback
 */
exports.version = function(callback) {
  var file = path.join(path.dirname(fs.realpathSync(__filename)), '../package.json');
  fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
      throw new Error('Error loading package.json file');
    } else {
      callback(JSON.parse(data).version);
    }
  });
};