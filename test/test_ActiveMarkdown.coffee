should = require 'should'

fs = require 'fs'

sys = require 'sys'
describe 'ActiveMarkdown', ->

    ActiveMarkdown = require '../source/ActiveMarkdown'

    SOURCE = fs.readFileSync('test/sample_documents/test.md', 'utf-8').toString()
    TARGET = fs.readFileSync('test/sample_documents/test.html', 'utf-8').toString()


    describe '.parse', ->
        it 'should wrap output by default', ->
            ActiveMarkdown.parse(SOURCE).indexOf(TARGET).should.be.above(0)

        it 'should return unwrapped output', ->
            ActiveMarkdown.parse(SOURCE, wrap: false).should.equal(TARGET)

        it 'should wrap output as specified', ->
            before = '<body>'
            after = '</body>'
            target = "#{ before }#{ TARGET }#{ after }"
            ActiveMarkdown.parse(SOURCE, wrap: [before, after]).should.equal(target)

        it 'should use referenced libraries by default', ->
            output = ActiveMarkdown.parse(SOURCE)
            lib_references = output.match(/http:\/\/activemarkdown.org\/viewer\/activemarkdown\-/g)
            should.exist(lib_references)
            lib_references.should.have.length(2)

        it 'should use inline libraries', ->
            output = ActiveMarkdown.parse(SOURCE, inline_libraries: true)
            lib_references = output.match(/http:\/\/activemarkdown.org\/viewer\/activemarkdown\-/g)
            should.not.exist(lib_references)
            output.match(/\<style\>/).should.have.length(1)
            output.match(/\<script\>/).should.have.length(2)


        _checkOption = (in_markup, option_name, option_value) ->
            pattern = /ActiveMarkdown\.setOptions\(([\{\}\s\S]*)\)/
            option_match = in_markup.match(pattern)
            should.exist(option_match)
            option_data = JSON.parse(option_match[1])
            option_data[option_name].should.equal(option_value)

        it 'should set the editable_code option', ->

            output = ActiveMarkdown.parse(SOURCE)
            _checkOption(output, 'editable_code', true)

            output = ActiveMarkdown.parse(SOURCE, editable_code: false)
            _checkOption(output, 'editable_code', false)

        it 'should set the collapsed_code option', ->

            output = ActiveMarkdown.parse(SOURCE)
            _checkOption(output, 'collapsed_code', false)

            output = ActiveMarkdown.parse(SOURCE, collapsed_code: true)
            _checkOption(output, 'collapsed_code', true)

