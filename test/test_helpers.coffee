require 'should'


testValueMap = (fn, value_map) ->
    for k, v of value_map
        fn(k).should.equal(v)



describe 'parseNumber', ->
    { parseNumber } = require '../source/helpers'

    it 'should handle ints', ->
        testValueMap parseNumber,
            '1'     : 1
            '0'     : 0
            '-1'    : -1

    it 'should handle floats', ->
        testValueMap parseNumber,
            '1.1'   : 1.1
            '1.0'   : 1.0
            '0.6'   : 0.6
            '0.0'   : 0.0
            '-0.6'  : -0.6
            '-1.0'  : -1.0
            '-1.1'  : -1.1

    it 'should handle constants', ->
        testValueMap parseNumber,
            '1.1pi'     : 1.1 * Math.PI
            '+1.1pi'    : 1.1 * Math.PI
            '+pi'       : Math.PI
            'pi'        : Math.PI
            '0pi'       : 0 * Math.PI
            '-pi'       : -1 * Math.PI
            '-5.2pi'    : -5.2 * Math.PI


describe 'parseStep', ->
    { parseStep } = require '../source/helpers'

    it 'should default to 1', ->
        parseStep('').should.equal(1)

    it 'should handle ints', ->
        testValueMap parseStep,
            ' by 1'     : 1
            ' by 0'     : 0
            ' by -1'    : -1

    it 'should handle floats', ->
        testValueMap parseStep,
            ' by 1.1'   : 1.1
            ' by 1.0'   : 1.0
            ' by 0.6'   : 0.6
            ' by 0.0'   : 0.0
            ' by -0.6'  : -0.6
            ' by -1.0'  : -1.0
            ' by -1.1'  : -1.1

    it 'should handle constants', ->
        testValueMap parseStep,
            ' by 1.1pi'     : 1.1 * Math.PI
            ' by pi'        : Math.PI
            ' by 0pi'       : 0 * Math.PI
            ' by -5.2pi'    : -5.2 * Math.PI

describe 'parseInclusivity', ->
    { parseInclusivity } = require '../source/helpers'

    it 'should detect inclusive', ->
        parseInclusivity('..').should.be.true

    it 'should detect exclusive', ->
        parseInclusivity('...').should.be.false
    