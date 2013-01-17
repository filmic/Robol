# Robol
Robol is a simple tool for building projects, created as a [Node.js](http://nodejs.org) module.

It allows to compile, concatenate, lint and minify JavaScript, CoffeeScript, CSS and LESS files, as well as copy and remove files and directories within the project.

Robol uses [Gear.js](http://gearjs.org/) build system.


#### Current version
*0.3.3*


---
#### Changelog
*0.3.4*
- Support for passing options to jsminify task (UglifyJS)

*0.3.3*
- Updated bundled LESS compiler to ver. 1.3.1
- Unit tests for LESS compile task


---
### Requirements

[Node.js](http://nodejs.org) installed.

Modul confirmed working on MacOS X 10.8 and Windows 8.

---
### Instalation
Install using npm with 'global' flag:

	npm install robol -g

Or clone this project from github:

	git clone https://github.com/filmic/Robol.git

and from the checked out repository folder run command in console:

	npm install . -g

---
### Usage

From the root of your project run command in console:

	robol

##### Options

	-c, --config   Path to the config file. [default: "./robol.config.json"]
	-w, --watch    Enables watch mode. Changes to the source files trigger automatically build.
	-v, --version  Displays version of the module.
	-h, --help     Displays help message.

Robol requires a config file with JSON data defining inputs and outputs of the building process. By default it looks for the _robol.config.json_ file but it can be overwritten by using `-c`option.
Wild cards in the filename, eg. *.js. are accepted.
Directories are copied / removed recursively.

In the watch mode any changes to the input files trigger tasks that are defined for them (building scripts, styles or copying).

For more information about UglifyJS options that can be defined in the config file ("scripts.minify_config"), see the [UglifyJS 1.x documentation](https://github.com/mishoo/UglifyJS#api).

##### Examples of the JSON config file:

```json
{
  "scripts": {
    "input_dir": "src/js",
    "input_files": [
      "test.coffee",
      "helloworld.js"
    ],
    "output_dir": "deploy/scripts",
    "output_file": "scripts.min.js",
    "minify": true,
    "minify_config": {
      "strict_semicolons": false,
      "mangle": false,
      "toplevel": false,
      "except": [],
      "defines": {}, 
      "squeeze": false, 
      "make_seqs": true,
      "dead_code": true
    },
    "lint": true,
    "lint_config": {}
  },
  "styles": {
    "input_dir": "src/css",
    "input_files": [
      "test.less",
      "test2.css"
    ],
    "output_dir": "deploy/styles",
    "output_file": "styles.min.css",
    "minify": true,
    "lint": true,
    "lint_config": {}
  },
  "copy_files": {
    "input_dir": "source",
    "input_files": [
      "*.html",
      "*.shtml"
    ],
    "output_dir": "deploy"
  },
  "copy_dir": {
    "input_dir": "source/assets",
    "output_dir": "deploy/assets"
  },
  "remove_files": {
    "input_dir": "deploy/temp",
    "input_files": [
      "*.html",
      "*.shtml"
    ]
  },
  "remove_dir": {
    "input_dir": "deploy/assets/images"
  }
}
```

The scripts JSLint options object (`lint_config`) can be used to overwrite the default values which are set to:

```json
{ "bitwise": true, "continue": true, "debug": true, "eqeq": true,
"es5": true, "forin": true, "newcap": true, "nomen": true,
"plusplus": true, "regexp": true, "undef": true, "unparam": true,
"sloppy": true, "stupid": false, "sub": true, "todo": true,
"vars": true, "white": true, "browser": true }
```

The scripts minification options object (`minify_config`) can be used to overwrite the default values which are set to:

```json
"minify_config": {
  "strict_semicolons": false, // the parser will throw an error when it expects a semicolon and it doesn’t find it
  "mangle": false, // mangles (compresses) variables and function names
  "toplevel": false, // mangle toplevel names
  "except": [], // an array of names to exclude from compression"
  "defines": {}, // an object with properties named after symbols to replace
  "squeeze": false, // employs further optimizations designed to reduce the size of the code
  "make_seqs": true, // makes consecutive statements in a block to be merged using the “sequence” (comma) operator
  "dead_code": true // removes unreachable code
}
```

You can also define multiple build configurations:

```json
{
  "scripts": [
    {
      "input_dir": "src/coffee",
      "input_files": [
        "tcp-server.coffee",
        "tcp-client.coffee"
      ],
      "output_dir": "deploy",
      "output_file": "tcp.js",
      "minify": false,
      "lint": true,
      "lint_config": {}
    },
    {
      "input_dir": "src",
      "input_files": [
        "js/helloworld.js"
      ],
      "output_dir": "deploy/scripts",
      "output_file": "scripts.min.js",
      "minify": true,
      "lint": true,
      "lint_config": {}
    }
  ],
  "styles": [
    {
      "input_dir": "src/css",
      "input_files": [
        "test.css",
        "test2.css"
      ],
      "output_dir": "deploy/styles",
      "output_file": "styles.min.css",
      "minify": true,
      "lint": true,
      "lint_config": {}
    },
    {
      "input_dir": "src/less",
      "input_files": [
        "test2.less"
      ],
      "output_dir": "deploy/styles",
      "output_file": "test.css",
      "minify": false,
      "lint": true,
      "lint_config": {}
    }
  ],
  "copy_files": [{
    "input_dir": "source",
    "input_files": [
      "index.html",
      "index.shtml"
    ],
    "output_dir": "deploy"
  },
  {
    "input_dir": "source/includes",
    "input_files": [
      "*.html"
    ],
    "output_dir": "deploy/includes"
  }]
}
```

---
### Updates
Robol can be updated using following command:

	npm update robol -g


---
### Bundled compilers/minifiers/linters
* CoffeeScript 1.3.3
* LESS 1.3.1
* UglifyJS 1.3.3
* JSLint 0.1.9
* CSSLint 0.9.8