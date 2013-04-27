should = require 'should'

fs = require 'fs'



valid_configs = [
    {
        raw: 'calories: ..100 by 10'
        conf:
            name: 'calories'
            min: null
            max: 100
            step: 10
            inclusive: true
    }
    {
        raw: 'calories: 0..'
        conf:
            name: 'calories'
            min: 0
            max: null
            step: 1
            inclusive: true
    }
    {
        raw: 'calories: .. by 10'
        conf:
            name: 'calories'
            min: null
            max: null
            step: 10
            inclusive: true
    }
    {
        raw: 'calories: ..'
        conf:
            name: 'calories'
            min: null
            max: null
            step: 1
            inclusive: true
    }
    {
        raw: 'calories: ... by 10'
        conf:
            name: 'calories'
            min: null
            max: null
            step: 10
            inclusive: false
    }
    {
        raw: 'calories: 10..100 by 10'
        conf:
            name: 'calories'
            min: 10
            max: 100
            step: 10
            inclusive: true
    }
    {
        raw: 'var_name: -10..10 by 1'
        conf:
            name: 'var_name'
            min: -10
            max: 10
            step: 1
            inclusive: true
    }
    {
        raw: 'var_name: -10..10'
        conf:
            name: 'var_name'
            min: -10
            max: 10
            step: 1
            inclusive: true
    }
    {
        raw: 'var_name: -10..10 by 0.1'
        conf:
            name: 'var_name'
            min: -10
            max: 10
            step: 0.1
            inclusive: true
    }
    {
        raw: 'var_name: -10e..10ln2 by 0.1pi'
        conf:
            name: 'var_name'
            min: -10 * Math.E
            max: 10 * Math.LN2
            step: 0.1 * Math.PI
            inclusive: true
    }
    {
        raw: 'var_name: -10e...10ln2 by 0.1pi'
        conf:
            name: 'var_name'
            min: -10 * Math.E
            max: 10 * Math.LN2
            step: 0.1 * Math.PI
            inclusive: false
    }
]

invalid_configs = [
    'var_name: true or false'
    'var_name: this or that'
    'line=var_name: 10..100'
    'var_name'
    'var_name: -10e...10ln2 by 0.1pINVALIDi'
    'var_name: -10e...10lnINVALID2 by 0.1pi'
    'var_name: -10INVALIDe...10ln2 by 0.1pi'
    'var_name -10e...10ln2 by 0.1pi'
    'var_name: -10e...10ln2 by pi0.1'
]


describe 'RangeElement', ->
    RangeElement = require '../source/elements/RangeElement'

    describe '.parseConfig', ->

        describe 'valid', ->
            valid_configs.forEach (config) ->
                it 'should match config ' + config.raw, ->
                    parsed = RangeElement.matchConfig(config.raw)
                    for k, v of config.conf
                        if v?
                            v.should.eql(parsed[k])
                        else
                            should.not.exist(parsed[k])

        describe 'invalid', ->
            invalid_configs.forEach (config_str) ->
                it 'should not match config ' + config_str, ->
                    parsed = RangeElement.matchConfig(config_str)
                    should.not.exist(parsed)



