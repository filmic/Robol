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

// Default build config
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
  var success = true;
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

      // setup paths
      config.scripts.input_files.forEach(function(el,i,array) {
        array[i] = path.join(config.scripts.input_dir, el);
      });
      config.styles.input_files.forEach(function(el,i,array) {
        array[i] = path.join(config.styles.input_dir, el);
      });

      // check existance of files
      var files = config.scripts.input_files.concat(config.styles.input_files);
      var check = files.every(function(el) {
        if (!fs.existsSync(el)) {
          callback( new Error('Missing file: ' + el) );
          return false;
        } else {
          return true;
        }
      });

      if (check) {
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
 * @param {Function} callback Task complete callback
 */
var buildScripts = function(callback) {
  // Filter all CoffeeScript files
  var coffeeFiles = filterInput(config.scripts.input_files, '.coffee');

  // Filter all JavaScript files
  var jsFiles = filterInput(config.scripts.input_files, '.js');

  // Output file path
  var outputPath = path.join(config.scripts.output_dir, config.scripts.output_file);

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
  .log('Building scripts...'.cyan)
  .tasks({
    readcf:       {task: ['read', coffeeFiles]},
    combinecf:    {requires: 'readcf', task: 'coffeeconcat'},
    coffeetojs:   {requires: 'combinecf', task: ['coffeecompile', {callback: onCoffeeCompileComplete}]},
    readjs:       {requires: 'coffeetojs', task: ['read', jsFiles]},
    combinejs:    {requires: 'readjs', task: 'concat'},
    combineall:   {requires: 'combinejs', task: ['concat', {callback: concatWithCoffeeCompiledCode}]},
    lint:         {requires: 'combineall', task: config.scripts.lint ? 'jslint' : 'noop'},
    minify:       {requires: 'lint', task: config.scripts.minify ? 'jsminify' : 'noop'},
    write:        {requires: 'minify', task: ['write', outputPath]}
  })
  .log('Saved scripts to: '.cyan + outputPath.magenta)
  .run(callback);
};

/**
 * Loads, compiles, concatenates and minifies style files
 *
 * @param {Function} callback Task complete callback
 */
var buildStyles = function(callback) {
  // Input files
  var styleFiles = config.styles.input_files;


  // Output file path
  var outputPath = path.join(config.styles.output_dir, config.styles.output_file);

  new gear.Queue({registry: taskRegistry}) // register tasks
  .log('Building styles...'.yellow)
  .tasks({
    read:         {task: ['read', styleFiles]},
    lesstocss:    {requires: 'read', task: ['cssminify', {compress: false}]},
    combine:      {requires: 'lesstocss', task: 'concat'},
    lint:         {requires: 'combine', task: config.styles.lint ? 'csslint' : 'noop'},
    minify:       {requires: 'lint', task: config.styles.minify ? 'cssminify' : 'noop'},
    write:        {requires: 'minify', task: ['write', outputPath]}
  })
  .log('Saved styles to: '.yellow + outputPath.magenta)
  .run(callback);
};

/**
 * Setup watching of changes in the input files
 *
 * @param {Function} callback Task complete callback
 */
var setupWatch = function(callback) {

  // Input files
  var scriptFiles = config.scripts.input_files,
      styleFiles = config.styles.input_files,
      filesToWatch = [].concat(scriptFiles, styleFiles);

  watchr.watch({
      paths: filesToWatch,
      listener: function(eventName,filePath,fileCurrentStat,filePreviousStat){
          console.log('File changed:'.red, filePath.magenta);
          buildScripts();
          buildStyles();
      },
      next: function(err,watcher){
          if (err) {
            callback(err);
          } else {
            console.log('Watching setup successfully for files: '.green + filesToWatch.join(', ').magenta);
            callback();
          }
      }
  });
};

/**
 * Runs the build process
 * @param  {Object} options Options
 * @param  {Object} options.c Path to the config file
 * @param  {Object} options.w Watch mode flag
 */
exports.run = function(options) {
  // Do build and watch
  console.log('ROBOL BUILDER IN ACTION!'.rainbow);

  async.auto({
    load_config: function(callback) {
      loadBuildConfig(options.c, callback);
    },
    build_scripts: ['load_config', function(callback) {
      buildScripts(callback);
    }],
    build_styles: ['load_config', function(callback) {
      buildStyles(callback);
    }],
    setup_watch: ['build_scripts', 'build_styles', function(callback){
      if (options.w) {
        setupWatch(callback);
      }
    }]
  }, function(err, data) {
    if (err) {
      console.log(err.toString().red);
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