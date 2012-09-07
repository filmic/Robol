# Robol
Robol is a simple tool for building projects, created as a Node.js module.

It allows to compile, concatenate, lint and minify JavaScript, CoffeeScript, CSS and LESS files.


### Requirements
---
[Node.js](http://nodejs.org) and [Git](http://git-scm.com) installed.

Currently tested only on MacOS X.


### Instalation
---
Clone this project on github:

	git clone https://github.com/filmic/Robol.git
	
From the checked out repository folder run command in console to install Robol as a *Node.js* module:

	sudo npm install . -g
	
### Usage
---
From the root of your project run command in console

	robol

##### Options

	-c, --config   Path to the config file. [default: "./robol.config.json"]
	-w, --watch    Enables watch mode.            
	-v, --version  Displays version of the module.
  	
Robol requires a config file with JSON data defining inputs and outputs of the building process. By default it looks for the _robol.config.json_ file but it can be overwritten by using `-c`option.

##### Example of the JSON config file

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
    "minify": false,
    "lint": true
  },
  "styles": {
    "input_dir": "src/css",
    "input_files": [
      "test.less",
      "test2.css"
    ],
    "output_dir": "deploy/styles",
    "output_file": "styles.min.js",
    "minify": false,
    "lint": true
  }
}
```