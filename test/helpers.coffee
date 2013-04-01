require 'should'


describe 'parseNumber', ->
    { parseNumber } = require '../source/elements/helpers'
    it 'should handle ints', ->
        parseNumber('1').should.equal(1)
        parseNumber('0').should.equal(0)
        parseNumber('-1').should.equal(-1)
    it 'should handle floats', ->
    it 'should handle constants', ->
        # mixed case

describe 'parseStep', ->

describe 'parseInclusivity', ->
