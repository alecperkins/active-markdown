should = require 'should'

fs = require 'fs'

sys = require 'sys'
describe 'ActiveMarkdown', ->

    AM = require '../source/ActiveMarkdown'

    SOURCE = fs.readFileSync('test/sample_documents/test.md', 'utf-8').toString()
    TARGET = fs.readFileSync('test/sample_documents/test.html', 'utf-8').toString()


    describe '.parse', ->
        it 'should wrap output by default', ->
            AM.parse(SOURCE).indexOf(TARGET).should.be.above(0)

        it 'should return unwrapped output', ->
            AM.parse(SOURCE, wrap: false).should.equal(TARGET)

        it 'should wrap output as specified', ->
            before = '<body>'
            after = '</body>'
            target = "#{ before }#{ TARGET }#{ after }"
            AM.parse(SOURCE, wrap: [before, after]).should.equal(target)
            AM.parse(SOURCE, wrap: { before: before, after: after }).should.equal(target)


        SCRIPTS_URL_MIN     = "src='http://activemarkdown.org/viewer/activemarkdown-#{ AM.VERSION }-min.js'"
        STYLES_URL_MIN      = "href='http://activemarkdown.org/viewer/activemarkdown-#{ AM.VERSION }-min.css'"
        SCRIPTS_URL         = "src='http://activemarkdown.org/viewer/activemarkdown-#{ AM.VERSION }.js'"
        STYLES_URL          = "href='http://activemarkdown.org/viewer/activemarkdown-#{ AM.VERSION }.css'"
        REL_SCRIPTS_URL_MIN = "src='activemarkdown-#{ AM.VERSION }-min.js'"
        REL_STYLES_URL_MIN  = "href='activemarkdown-#{ AM.VERSION }-min.css'"
        REL_SCRIPTS_URL     = "src='activemarkdown-#{ AM.VERSION }.js'"
        REL_STYLES_URL      = "href='activemarkdown-#{ AM.VERSION }.css'"

        it 'should use minified referenced libraries by default', ->
            output = AM.parse(SOURCE)

            # Include:
            output.indexOf(SCRIPTS_URL_MIN).should.be.above(-1)
            output.indexOf(STYLES_URL_MIN).should.be.above(-1)

            # Don't include:
            output.indexOf(SCRIPTS_URL).should.equal(-1)
            output.indexOf(STYLES_URL).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(REL_STYLES_URL_MIN).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL).should.equal(-1)
            output.indexOf(REL_STYLES_URL).should.equal(-1)

            # Options only:
            should.not.exist(output.match(/\<style\>/))
            output.match(/\<\/script\>/g).should.have.length(2)

        it 'should use unminified libraries in debug mode', ->
            output = AM.parse(SOURCE, debug: true)
            # Include:
            output.indexOf(SCRIPTS_URL).should.be.above(-1)
            output.indexOf(STYLES_URL).should.be.above(-1)

            # Don't include:
            output.indexOf(SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(STYLES_URL_MIN).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(REL_STYLES_URL_MIN).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL).should.equal(-1)
            output.indexOf(REL_STYLES_URL).should.equal(-1)

            # Options only:
            should.not.exist(output.match(/\<style\>/))
            output.match(/\<\/script\>/g).should.have.length(2)

        it 'should use inline libraries', ->
            output = AM.parse(SOURCE, libraries: 'inline')

            # Don't include:
            output.indexOf(SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(STYLES_URL_MIN).should.equal(-1)
            output.indexOf(SCRIPTS_URL).should.equal(-1)
            output.indexOf(STYLES_URL).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(REL_STYLES_URL_MIN).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL).should.equal(-1)
            output.indexOf(REL_STYLES_URL).should.equal(-1)

            # Inlined libraries and options:
            output.match(/\<style\>/g).should.have.length(2) # once for the actual page and once for the code
            output.match(/\<\/script\>/g).should.have.length(2)

        it 'should use relative minified libraries', ->
            output = AM.parse(SOURCE, libraries: 'relative')

            # Include:
            output.indexOf(REL_SCRIPTS_URL_MIN).should.be.above(-1)
            output.indexOf(REL_STYLES_URL_MIN).should.be.above(-1)

            # Don't include:
            output.indexOf(SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(STYLES_URL_MIN).should.equal(-1)
            output.indexOf(SCRIPTS_URL).should.equal(-1)
            output.indexOf(STYLES_URL).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL).should.equal(-1)
            output.indexOf(REL_STYLES_URL).should.equal(-1)

            # Inlined libraries and options:
            should.not.exist(output.match(/\<style\>/))
            output.match(/\<\/script\>/g).should.have.length(2)

        it 'should use relative debug libraries', ->
            output = AM.parse(SOURCE, libraries: 'relative', debug: true)

            # Include:
            output.indexOf(REL_SCRIPTS_URL).should.be.above(-1)
            output.indexOf(REL_STYLES_URL).should.be.above(-1)

            # Don't include:
            output.indexOf(SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(STYLES_URL_MIN).should.equal(-1)
            output.indexOf(SCRIPTS_URL).should.equal(-1)
            output.indexOf(STYLES_URL).should.equal(-1)
            output.indexOf(REL_SCRIPTS_URL_MIN).should.equal(-1)
            output.indexOf(REL_STYLES_URL_MIN).should.equal(-1)

            # Inlined libraries and options:
            should.not.exist(output.match(/\<style\>/))
            output.match(/\<\/script\>/g).should.have.length(2)

        it 'should set the title', ->
            output = AM.parse(SOURCE, title: 'A Title')
            output.indexOf('<title>A Title</title>').should.be.above(-1)

        _checkOption = (in_markup, option_name, option_value) ->
            pattern = /ActiveMarkdown\.makeActive\(([\{\}\s\S]*)\)/
            option_match = in_markup.match(pattern)
            should.exist(option_match)
            option_data = JSON.parse(option_match[1])
            option_data[option_name].should.equal(option_value)

        it 'should set the collapsed_code option', ->

            output = AM.parse(SOURCE)
            _checkOption(output, 'collapsed_code', false)

            output = AM.parse(SOURCE, collapsed_code: true)
            _checkOption(output, 'collapsed_code', true)

        it 'should set the debug option', ->

            output = AM.parse(SOURCE)
            _checkOption(output, 'debug', false)

            output = AM.parse(SOURCE, debug: true)
            _checkOption(output, 'debug', true)
