should = require 'should'

fs = require 'fs'

'var_name'

valid_configs = [
    {
        raw: 'calories'
        conf:
            name: 'calories'
    }
    {
        raw: 'calories2'
        conf:
            name: 'calories2'
    }
    {
        raw: 'calories_asdf'
        conf:
            name: 'calories_asdf'
    }
    {
        raw: 'calories_2'
        conf:
            name: 'calories_2'
    }
]


invalid_configs = [
    'calories-'
    'calories-asdf'
    'calories asdf'
    'calories.'
    'calories.a'
    'calories: 0..'
    'calories: ..'
    'calories: ... by 10'
    'calories: 10..100 by 10'
    'var_name: -10..10 by 1'
    'var_name: -10..10'
    'var_name: true or false'
    'var_name: this or that'
    'line=var_name: 10..100'
]


describe 'StringElement', ->
    { StringElement } = require '../source/elements/StringElement'

    describe '.parseConfig', ->

        describe 'valid', ->
            valid_configs.forEach (config) ->
                it 'should match config ' + config.raw, ->
                    parsed = StringElement.matchConfig(config.raw)
                    for k, v of config.conf
                        if v?
                            v.should.eql(parsed[k])
                        else
                            should.not.exist(parsed[k])

        describe 'invalid', ->
            invalid_configs.forEach (config_str) ->
                it 'should not match config ' + config_str, ->
                    parsed = StringElement.matchConfig(config_str)
                    should.not.exist(parsed)



