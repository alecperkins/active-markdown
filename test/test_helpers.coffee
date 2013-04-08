require 'should'


testValueMap = (fn, value_map) ->
    for k, v of value_map
        fn(k).should.equal(v)



describe 'parseNumber', ->
    { parseNumber } = require '../source/elements/helpers'

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
            'pi'        : Math.PI
            '0pi'       : 0 * Math.PI
            '-5.2pi'    : -5.2 * Math.PI


