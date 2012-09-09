# Robol
Robol is a simple tool for building projects, created as a [Node.js](http://nodejs.org) module.

It allows to compile, concatenate, lint and minify JavaScript, CoffeeScript, CSS and LESS files.

Robol uses [Gear.js](http://gearjs.org/) build system.

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
	-w, --watch    Enables watch mode.            
	-v, --version  Displays version of the module.
	-h, --help     Displays help message.
  	
Robol requires a config file with JSON data defining inputs and outputs of the building process. By default it looks for the _robol.config.json_ file but it can be overwritten by using `-c`option.

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
    "lint": true
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
    "lint": true
  }
}
```

You can also define multiple build configurations for scripts and styles:

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
      "lint": true
    },
    {
      "input_dir": "src",
      "input_files": [
        "js/helloworld.js"
      ],
      "output_dir": "deploy/scripts",
      "output_file": "scripts.min.js",
      "minify": true,
      "lint": true
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
      "lint": true
    },
    {
      "input_dir": "src/less",
      "input_files": [
        "test2.less"
      ],
      "output_dir": "deploy/styles",
      "output_file": "test.css",
      "minify": false,
      "lint": true
    }
  ]
}
```

---
### Bundled compilers/minifiers/linters
* CoffeeScript 1.3.3
* LESS 1.3.0
* UglifyJS 1.3.3
* JSLint 0.1.9
* 