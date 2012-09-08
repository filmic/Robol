/*
 * ROBOL
 *
 * Entry script for ROBOL build tool
 * executed from console via 'robol' command
 *
 * Copyright (c) 2012, Filip Michalowski
 * Released under the MIT License
 *
 * @author Filip Michalowski (kanelbula@gmail.com)
 * @version 0.0.1
 */

var optimist = require('optimist')
    .options('c', {
        'alias' : 'config',
        'default' : './robol.config.json',
        'description' : 'Path to the config file.'
    })
    .options('w', {
        'alias' : 'watch',
        'description' : 'Enables watch mode.'
    })
    .options('v', {
        'alias' : 'version',
        'description' : 'Displays version of the module.'
    })
    .options('h', {
        'alias' : 'help',
        'description' : 'Displays help message.'
    });

var robol = require('./robol');

/**
 * Parses the command line options
 * and executes Robol actions
 */
exports.run = function() {
  if (optimist.argv.h) {
    optimist.showHelp();
  }
  else if (optimist.argv.v) {
    robol.version(function(data){
      console.log(data);
    });
  }
  else {
    robol.run(optimist.argv);
  }
};