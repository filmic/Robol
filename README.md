# Robol
Robol is a simple tool for building projects, created as a [Node.js](http://nodejs.org) module.

It allows to compile, concatenate, lint and minify JavaScript, CoffeeScript, CSS and LESS files.

Robol uses [Gear.js](http://gearjs.org/) build system.

===
### Requirements

[Node.js](http://nodejs.org) and [Git](http://git-scm.com) installed.

Currently confirmed working on MacOS X only.
  
===
### Instalation

Clone this project on github:

	git clone https://github.com/filmic/Robol.git
	
From the checked out repository folder run command in console to install Robol as a *Node.js* module:

	sudo npm install . -g
	
===
### Usage

From the root of your project run command in console

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