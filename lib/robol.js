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
 * @version 0.2.0
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
    "lint": true
  },
  "styles": {
    "input_dir": ".",
    "input_files": [],
    "output_dir": ".",
    "output_file": "styles.min.js",
    "minify": true,
    "lint": true
  },
  "copyFiles": {
    "input_dir": ".",
    "input_files": [],
    "output_dir": "."
  }
};

// Valid file extensions
var validExt = {
  scripts: ['.js', '.coffee'],
  styles: ['.css', '.less', '.sass', '.scss']
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
        config = extend(config, JSON.parse(data));
      } catch (e) {
        callback( new Error('Invalid JSON in ' + filename + ' config file') );
        return;
      }

      // check if scripts and styles configurations are single objects
      // then convert them into Arrays
      if (!Array.isArray(config.scripts)) {
        config.scripts = [config.scripts];
      }
      if (!Array.isArray(config.styles)) {
        config.styles = [config.styles];
      }
      if (!Array.isArray(config.copyFiles)) {
        config.copyFiles = [config.copyFiles];
      }

      // prepare and check files
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

          // check existance of files
          var existsSync = fs.existsSync || path.existsSync;
          success = cfg.input_files.every(function(file) {
            if (!existsSync(file)) {
              callback( new Error('Missing file: ' + file) );
              return false;
            } else if (validExt && validExt.indexOf(path.extname(file)) < 0) {
              callback( new Error('Invalid type of file: ' + file) );
              return false;
            } else {
              return true;
            }
          });
        });
        return success;
      };

      // If all input files exist call success callback
      if (parseCheckFiles(config.scripts, validExt.scripts) &&
        parseCheckFiles(config.styles, validExt.styles) &&
        parseCheckFiles(config.copyFiles)) {
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

  // Build Scripts
  if (jsFiles.length + coffeeFiles.length > 0) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log('Building scripts: '.cyan + cfg.input_files.join(', ').magenta)
    .tasks({
      readcf:       {task: ['read', coffeeFiles]},
      combinecf:    {requires: 'readcf', task: 'coffeeconcat'},
      coffeetojs:   {requires: 'combinecf', task: ['coffeecompile', {callback: onCoffeeCompileComplete}]},
      readjs:       {requires: 'coffeetojs', task: ['read', jsFiles]},
      combinejs:    {requires: 'readjs', task: 'concat'},
      combineall:   {requires: 'combinejs', task: ['concat', {callback: concatWithCoffeeCompiledCode}]},
      lint:         {requires: 'combineall', task: cfg.lint ? 'jslint' : 'noop'},
      minify:       {requires: 'lint', task: cfg.minify ? 'jsminify' : 'noop'},
      write:        {requires: 'minify', task: ['write', outputPath]}
    })
    .log('Saved scripts to: '.cyan + outputPath.magenta)
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
  var lessCompiledCode = "", scssCompiledCode = "", sassCompiledCode = "";

  // Filter all Less files
  var lessFiles = filterInput(cfg.input_files, '.less');

  // Filter all Scss files
  var scssFiles = filterInput(cfg.input_files, '.scss');

  // Filter all Sass files
  var sassFiles = filterInput(cfg.input_files, '.sass');

  // Filter all Css files
  var cssFiles = filterInput(cfg.input_files, '.css');

  // Output file path
  var outputPath = path.join(cfg.output_dir, cfg.output_file);

  // Callback for Less compilation completed
  var onLessCompileComplete = function(result) {
    lessCompiledCode = result;
  };
  // Callback for Scss compilation completed
  var onScssCompileComplete = function(result) {
    scssCompiledCode = result;
  };

  // Callback for style concatenation task
  var concatWithCssCompiledCode = function(result) {
    return result + lessCompiledCode + scssCompiledCode;
  };

  // Build Styles
  if (cssFiles.length+lessFiles.length+scssFiles.length+sassFiles.length > 0) {
    new gear.Queue({registry: taskRegistry}) // register tasks
    .log('Building styles: '.cyan + cfg.input_files.join(', ').magenta)
    .tasks({
      readless:     {task: ['read', lessFiles]},
      combineless:  {requires: 'readless', task: 'concat'},
      lesstocss:    {requires: 'combineless', task: ['lesscompile', {callback: onLessCompileComplete}]},
      readscss:     {requires: 'lesstocss', task: ['read', scssFiles]},
      combinescss:  {requires: 'readscss', task: 'concat'},
      scsstocss:    {requires: 'combinescss', task: ['sasscompile', {callback: onScssCompileComplete}]},
      readcss:      {requires: 'scsstocss', task: ['read', cssFiles]},
      combinecss:   {requires: 'readcss', task: 'concat'},
      combineall:   {requires: 'combinecss', task: ['concat', {callback: concatWithCssCompiledCode}]},
      lint:         {requires: 'combineall', task: cfg.lint ? 'csslint' : 'noop'},
      minify:       {requires: 'lint', task: cfg.minify ? 'cssminify' : 'noop'},
      write:        {requires: 'minify', task: ['write', outputPath]}
    })
    .log('Saved styles to: '.cyan + outputPath.magenta)
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
    .log('Copying files: '.cyan + files.join(', ').magenta)
    .tasks({
      read:  {task: ['read', files]},
      copy:  {requires: 'read', task: ['copy', {output: outputPath}]}
    })
    .log('Saved files to: '.cyan + outputPath.magenta)
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
  watchr.watch({
    paths: cfg.input_files,
    listener: function(eventName,filePath,fileCurrentStat,filePreviousStat){
      console.log('File changed:'.green, filePath.magenta);
      // Check type of modified file
      if (validExt.scripts.indexOf(path.extname(filePath)) >= 0) {
        buildScripts(cfg);
      } else if (validExt.styles.indexOf(path.extname(filePath)) >= 0) {
        buildStyles(cfg);
      }
    },
    next: function(err,watcher){
      if (err) {
        callback(err);
      } else {
        console.log('Watching setup successfully for files: '.green + cfg.input_files.join(', ').magenta);
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

  // Setup task queue
  async.auto({
    load_config: function(callback) {
      loadBuildConfig(options.c, callback);
    },
    build_scripts: ['load_config', function(callback) {
      async.forEachSeries(config.scripts, buildScripts, function(err){
        callback(err);
      });
    }],
    build_styles: ['load_config', 'build_scripts', function(callback) {
      async.forEachSeries(config.styles, buildStyles, function(err){
        callback(err);
      });
    }],
    copy_files: ['build_styles', 'build_scripts', function(callback) {
      if (config.copyFiles) {
        async.forEachSeries(config.copyFiles, copyFiles, function(err){
          callback(err);
        });
      } else {
        callback();
      }
    }],
    setup_watch: ['build_scripts', 'build_styles', function(callback){
      if (options.w) {
        var filesToWatch = [].concat(config.scripts, config.styles);
        async.forEachSeries(filesToWatch, setupWatch, function(err){
          callback(err);
        });
      }
    }]
  }, function(err, data) {
    if (err) {
      console.log('BUILD ERROR'.red);
      console.dir(err);
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