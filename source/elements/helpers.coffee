


# Numbers in Active Markdown are ordinary `floats` for the most part, but also MAY include various constants from `Math` as a multiplier. For example, `2pi` is equivalent to `2 * Math.PI`, while `0.5e` is equivalent to `0.5 * Math.E`. The constants may be specified without a digit, eg `pi` or `ln2`. Also, they may be specified in lowercase or uppercase, or some combination of the two, if you're into that.

parseNumber = (val) ->
    constants = ['E', 'PI', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT1_2', 'SQRT2']
    parsed_val = null

    # Check the value for each constant, allowing for just a constant
    # with no coefficient.
    for c in constants
        r = RegExp("([-\\d\\.]*)#{ c }")
        group = val.toUpperCase().match(r)

        # If the number matches a constant, generate the equivalent
        # expression and calculate the actual value of the number.
        if group
            mult = if group[1] then (new Number(group[1])) else 1
            parsed_val = mult * Math[c]
            break

    # If the value is still null, the number didn't have any constants, so
    # just parse it as a regular Number.
    if not parsed_val?
        parsed_val = new Number(val)

    return parsed_val


# The step of a range defaults to 1, but can be specified using the `by` keyword after the min/max. The step is an Active Markdown Number, and can include the constants described above.
# 
# A range described with `0..10` will have a step of `1`, while `0..10 by 0.1` will have a step of `0.1`, and `0..10 by pi` will have a step of `Math.PI`.

parseStep = (val) ->
    if val
        return parseNumber(_.string.lstrip(val, ' by '))
    return 1




# Ranges in Active Markdown work the same as in CoffeeScript; two dots describes an inclusive range, while three dots excludes the tail. (The check here is only if there are two dots or not since the element configuration parsing regex limits the match to `'..'` or `'...'`.)

parseInclusivity = (dots) ->
    return dots.length is 2



# Right now, just used for testing purposes.
if exports?
    exports.parseNumber         = parseNumber
    exports.parseStep           = parseStep
    exports.parseInclusivity    = parseInclusivity