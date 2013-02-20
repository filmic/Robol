###
# Copy file test
###

fs = require('fs')
Blob = require('gear').Blob
copyFile = require('../lib/tasks/copy').copyFile
files =
  input: 'test/files/input/test1.js'
  output: 'test/files/output/test1.js'

remove = (filename) ->
    if (fs.existsSync filename)
      fs.unlinkSync filename

describe 'Copy task', ->

  ###
    Test copy file
  ###
  it 'should copy & rename file', (done) ->

    copyFile files, {}, (error, response) ->
      i = fs.readFileSync files.input, 'utf8'
      o = fs.readFileSync files.output, 'utf8'
      expect(i).toEqual o
      done()