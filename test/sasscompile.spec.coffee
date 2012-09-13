# SASS Compile test

Blob = require('gear').Blob
sass = require('../lib/tasks/sasscompile').sasscompile

describe 'Sass task', ->
  it 'should compile variables', (done) ->
    
    input = new Blob """
      $color: #FF0;
      div { color: $color; }
    """, name: ''
    
    output = """
      div {\n  color: yellow; }\n
    """
    
    sass {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()