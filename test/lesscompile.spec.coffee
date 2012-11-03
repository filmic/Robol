###
# LESS Compile test
###

Blob = require('gear').Blob
less = require('../lib/tasks/lesscompile').lesscompile

describe 'LESS task', ->

  ###
    Test nested rules
  ###
  it 'should compile nested rules', (done) ->
    
    input = new Blob """
      @w: 300px;

      #header {
        color: black;

        .navigation {
          font-size: 12px;
        }
        .logo {
          width: @w / 2;
          &:hover { text-decoration: none }
        }
      }
    """, name: ''
    
    output = """#header {
        color: black;
      }
      #header .navigation {
        font-size: 12px;
      }
      #header .logo {
        width: 150px;
      }
      #header .logo:hover {
        text-decoration: none;
      }

    """
    
    less {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test mixins with Pattern-matching
  ###
  it 'should compile mixins with Pattern-matching', (done) ->
    
    input = new Blob """
      .mixin (dark, @color) {
        color: darken(@color, 10%);
      }
      .mixin (light, @color) {
        color: lighten(@color, 10%);
      }
      .mixin (@_, @color) {
        display: block;
      }

      @switch: light;

      .class {
        .mixin(@switch, #888);
      }
    """, name: ''
    
    output = """.class {
        color: #a2a2a2;
        display: block;
      }

    """
    
    less {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test mixins with Guard expressions
  ###
  it 'should compile mixins with Guard expressions', (done) ->
    
    input = new Blob """
      .mixin (@a) when (lightness(@a) >= 50%) {
        background-color: black;
      }
      .mixin (@a) when (lightness(@a) < 50%) {
        background-color: white;
      }
      .mixin (@a) {
        color: @a;
      }

      .class1 { .mixin(#ddd) }
      .class2 { .mixin(#555) }
    """, name: ''
    
    output = """.class1 {
        background-color: black;
        color: #dddddd;
      }
      .class2 {
        background-color: white;
        color: #555555;
      }

    """
    
    less {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test & symbols
  ###
  it 'should compile & symbols', (done) ->
    
    input = new Blob """
      .child, .sibling {
        .parent & {
          color: black;
        }
        & + & {
          color: red;
        }
      }
    """, name: ''
    
    output = """.parent .child,
      .parent .sibling {
        color: black;
      }
      .child + .child,
      .child + .sibling,
      .sibling + .child,
      .sibling + .sibling {
        color: red;
      }

    """
    
    less {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test Selector Interpolation
  ###
  it 'should compile selector interpolation', (done) ->
    
    input = new Blob """
      @name: blocked;
      .@{name} {
        color: black;
      }
    """, name: ''
    
    output = """.blocked {
        color: black;
      }

    """
    
    less {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()