###
# Styles minify test
###

Blob = require('gear').Blob
stylesminify = require('../lib/tasks/stylesminify').stylesminify

describe 'Styles minify task', ->

  ###
    Test styles if no minify option defined in the config
  ###
  it 'should not minify styles by default', (done) ->

    input = new Blob """
      body {
        font-size: 100%;
        color: blue;
        border: none;
        padding: 0 0 0 0;
      }

      html {
        color: #000000;
      }
    """

    output = """
      body {
        font-size: 100%;
        color: blue;
        border: none;
        padding: 0 0 0 0;
      }
      html {
        color: #000000;
      }

    """

    stylesminify {}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test minify styles if option defined in the config
  ###
  it 'should minify styles if option set', (done) ->

    input = new Blob """
      body {
        font-size: 100%;
        color: blue;
        border: none;
        padding: 0 0 0 0;
      }

      html {
        color: #000000;
      }
    """

    output = """
      body{font-size:100%;color:blue;border:none;padding:0 0 0 0;}
      html{color:#000000;}

    """

    stylesminify {minify: true}, input, (error, response) ->
      expect(response.result).toEqual output
      done()


  ###
    Test minify and compress styles if options defined in the config
  ###
  it 'should minify and compress styles if options set', (done) ->

    input = new Blob """
      body {
        font-size: 100%;
        color: blue;
        border: none;
        padding: 0 0 0 0;
      }

      html {
        color: #000000;
      }
    """

    output = """
      body{font-size:100%;color:blue;border:0;padding:0}html{color:#000}
    """

    stylesminify {minify: true, yuicompress: true}, input, (error, response) ->
      expect(response.result).toEqual output
      done()