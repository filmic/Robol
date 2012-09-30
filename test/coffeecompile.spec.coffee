###
# CoffeeScript Compile test
###

Blob = require('gear').Blob
coffee = require('../lib/tasks/coffeecompile').coffeecompile

describe 'CoffeeScript task', ->

  ###
    Test functions
  ###
  it 'should compile functions', (done) ->
    
    input = new Blob """
      square = (x) -> x * x
      cube = (x) -> square(x) * x
    """, name: ''
    
    output = """(function() {
      var cube, square;

      square = function(x) {
        return x * x;
      };

      cube = function(x) {
        return square(x) * x;
      };

    }).call(this);

    """
    
    coffee {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test comprehensions
  ###
  it 'should compile comprehensions', (done) ->
    
    input = new Blob """
      countdown = (num for num in [10..1])
    """, name: ''
    
    output = """(function() {
      var countdown, num;

      countdown = (function() {
        var _i, _results;
        _results = [];
        for (num = _i = 10; _i >= 1; num = --_i) {
          _results.push(num);
        }
        return _results;
      })();

    }).call(this);

    """
    
    coffee {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test loops
  ###
  it 'should compile loops', (done) ->
    
    input = new Blob """
      for filename in list
        do (filename) ->
          fs.readFile filename, (err, contents) ->
            compile filename, contents.toString()
    """, name: ''
    
    output = """(function() {
      var filename, _fn, _i, _len;

      _fn = function(filename) {
        return fs.readFile(filename, function(err, contents) {
          return compile(filename, contents.toString());
        });
      };
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        filename = list[_i];
        _fn(filename);
      }

    }).call(this);

    """
    
    coffee {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test splats
  ###
  it 'should compile splats', (done) ->
    
    input = new Blob """
      gold = silver = rest = "unknown"

      awardMedals = (first, second, others...) ->
        gold   = first
        silver = second
        rest   = others
    """, name: ''
    
    output = """(function() {
      var awardMedals, gold, rest, silver,
        __slice = [].slice;

      gold = silver = rest = "unknown";

      awardMedals = function() {
        var first, others, second;
        first = arguments[0], second = arguments[1], others = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        gold = first;
        silver = second;
        return rest = others;
      };

    }).call(this);

    """
    
    coffee {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test Existential Operator
  ###
  it 'should compile existential operators', (done) ->
    
    input = new Blob """
      solipsism = true if mind? and not world?
    """, name: ''
    
    output = """(function() {
      var solipsism;

      if ((typeof mind !== "undefined" && mind !== null) && !(typeof world !== "undefined" && world !== null)) {
        solipsism = true;
      }

    }).call(this);

    """
    
    coffee {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test classes
  ###
  it 'should compile classes', (done) ->
    
    input = new Blob """
      class Animal
        constructor: (@name) ->

        move: (meters) ->
          alert @name + ' moved ' + meters + 'm.'

      class Snake extends Animal
        move: ->
          alert "Slithering..."
          super 5

      class Horse extends Animal
        move: ->
          alert "Galloping..."
          super 45
    """, name: ''
    
    output = """(function() {
      var Animal, Horse, Snake,
        __hasProp = {}.hasOwnProperty,
        __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

      Animal = (function() {

        function Animal(name) {
          this.name = name;
        }

        Animal.prototype.move = function(meters) {
          return alert(this.name + ' moved ' + meters + 'm.');
        };

        return Animal;

      })();

      Snake = (function(_super) {

        __extends(Snake, _super);

        function Snake() {
          return Snake.__super__.constructor.apply(this, arguments);
        }

        Snake.prototype.move = function() {
          alert("Slithering...");
          return Snake.__super__.move.call(this, 5);
        };

        return Snake;

      })(Animal);

      Horse = (function(_super) {

        __extends(Horse, _super);

        function Horse() {
          return Horse.__super__.constructor.apply(this, arguments);
        }

        Horse.prototype.move = function() {
          alert("Galloping...");
          return Horse.__super__.move.call(this, 45);
        };

        return Horse;

      })(Animal);

    }).call(this);

    """
    
    coffee {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()



















