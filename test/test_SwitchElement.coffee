should = require 'should'

fs = require 'fs'



valid_configs = [
    {
        raw: 'var_name: true or false'
        conf:
            name: 'var_name'
            true_label: 'true'
            false_label: 'false'
    }
    {
        raw: 'var_name: on or off'
        conf:
            name: 'var_name'
            true_label: 'on'
            false_label: 'off'
    }
    {
        raw: 'var_name: bah or humbug'
        conf:
            name: 'var_name'
            true_label: 'bah'
            false_label: 'humbug'
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
    'line=var_name: 10..100'
]


describe 'SwitchElement', ->
    { SwitchElement } = require '../source/elements/SwitchElement'

    describe '.parseConfig', ->

        describe 'valid', ->
            valid_configs.forEach (config) ->
                it 'should match config ' + config.raw, ->
                    parsed = SwitchElement.matchConfig(config.raw)
                    for k, v of config.conf
                        if v?
                            v.should.eql(parsed[k])
                        else
                            should.not.exist(parsed[k])

        describe 'invalid', ->
            invalid_configs.forEach (config_str) ->
                it 'should not match config ' + config_str, ->
                    parsed = SwitchElement.matchConfig(config_str)
                    should.not.exist(parsed)



