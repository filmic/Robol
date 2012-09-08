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
 * @version 0.0.1
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
  }
};

// Valid file extensions
var validExt = {
  scripts: ['.js', '.coffee'],
  styles: ['.css', '.less']
};

// Creates new Gear Registry object and load tasks
// from gear-lib module and our library
var taskRegistry = new gear.Registry({
  module: 'gear-lib',
  dirname: path.join(path.dirname(fs.realpathSync(__filename)), './tasks')
});

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

      // prepare and check files
      var parseCheckFiles = function(configArray, validExt) {
        var success = true;
        configArray.forEach(function(cfg) {
          // setup files' paths (join file's input directory path with name)
          cfg.input_files.forEach(function(file,i,array) {
            array[i] = path.join(cfg.input_dir, file);
          });
          // check existance of files
          success = cfg.input_files.every(function(file) {
            if (!fs.existsSync(file)) {
              callback( new Error('Missing file: ' + file) );
              return false;
            } else if (validExt.indexOf(path.extname(file)) < 0) {
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
      if (parseCheckFiles(config.scripts, validExt.scripts) && parseCheckFiles(config.styles, validExt.styles)) {
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
};

/**
 * Loads, compiles, concatenates and minifies style files
 *
 * @param {Object} cfg Build configuration
 * @param {Function} callback Task complete callback
 */
var buildStyles = function(cfg, callback) {
  // Input files
  var styleFiles = cfg.input_files;

  // Output file path
  var outputPath = path.join(cfg.output_dir, cfg.output_file);

  // Build Styles
  new gear.Queue({registry: taskRegistry}) // register tasks
  .log('Building styles: '.yellow + cfg.input_files.join(', ').magenta)
  .tasks({
    read:         {task: ['read', styleFiles]},
    lesstocss:    {requires: 'read', task: ['cssminify', {compress: false}]},
    combine:      {requires: 'lesstocss', task: 'concat'},
    lint:         {requires: 'combine', task: cfg.lint ? 'csslint' : 'noop'},
    minify:       {requires: 'lint', task: cfg.minify ? 'cssminify' : 'noop'},
    write:        {requires: 'minify', task: ['write', outputPath]}
  })
  .log('Saved styles to: '.yellow + outputPath.magenta)
  .run(callback);
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
    setup_watch: ['build_scripts', 'build_styles', function(callback){
      if (options.w) {
        async.forEachSeries([].concat(config.scripts, config.styles), setupWatch, function(err){
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
  fs.readFile('package.json', 'utf8', function(err, data) {
    if (err) {
      throw new Error('Error loading package.json file');
    } else {
      callback(JSON.parse(data).version);
    }
  });
};