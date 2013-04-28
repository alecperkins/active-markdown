require 'should'

fs = require 'fs'


describe 'parseMarkdown', ->
    parseMarkdown = require '../source/parser'

    it 'should parse Active Markdown into html', ->
        
        source = fs.readFileSync('test/sample_documents/test.md', 'utf-8').toString()
        target = fs.readFileSync('test/sample_documents/test.html', 'utf-8').toString()
        parseMarkdown(source).should.equal(target)