BaseElement = require './BaseElement'

{
    parseNumber
    parseStep
    parseInclusivity
} = require '../helpers'

class RangeElement extends BaseElement
    @_name: 'RangeElement'

    @config_pattern: ///
            ^(                      # Variable
              [\w\d]+               # - name
            )

              :\s                   # Delimiter

            (                       # Range min, if any:
              [+|-]?                # - sign, if any
              (?:[\d]*[\.]?[\d])?   # - coefficient, if any
              [\w]*                 # - constant, if any
            )

            (                       # Inclusivity
              [\.]{2,3}             # - dots
            )

            (                       # Range max, if any:
              [+|-]?                # - sign, if any
              (?:[\d]*[\.]?[\d])?   # - coefficient, if any
              [\w]*                 # - constant, if any
            )

            (                       # Step, if any:
              \sby\s                # - by keyword
              [\w\d\.-]+            # - step value
            )*
        ///

    initialize: (parsed_config) ->
        parsed_config.value = @_parseTextContent(parsed_config)
        delete parsed_config.text_content
        @model = executor.getOrCreateVariable(parsed_config)
        @model.on('change', @render)

    ###
    Private: parse the text content of the element for default value, display
             precision, and additional text.

    text_content - the String text version of the element

    Return the default value for the variable.
    ###
    _parseTextContent: (parsed_config) ->
        { text_content } = parsed_config
        @_default_value     = parsed_config.value
        @_before_text       = ''
        @_after_text        = ''
        @_display_precision = null

        ###
            [
              '$200.0 per day',
              '$',
              '200',
              '.',
              '0',
              ' per day',
              index: 0,
              input: '$200.0 per day'
            ]
        ###
        pattern = /([a-zA-Z$ ]*)([\-\d]+)(\.?)(\d*)([a-zA-Z ]*)/
        match_group = text_content.match(pattern)
        if match_group
            [
                @_before_text
                value
                point
                decimal
                @_after_text
            ] = match_group[1..5]

            @_default_value = parseFloat([value, point, decimal].join(''))
            if point
                @_display_precision = decimal.length
        return @_default_value


    @_parseConfig: (config_match) ->
        ###
        [
            "calories: 10..100 by 10",
            "calories",
            "10",
            "..",
            "100",
            " by 10",
            index: 0,
            input: "calories: 10..100 by 10"
        ]
        ###

        [var_name, min, dots, max, step] = config_match[1..5]
        
        if min
            min = parseNumber(min)
        else
            min = null

        if max
            max = parseNumber(max)
        else
            max = null

        if min and max
            val = (max - min) / 2
        else
            val = 0

        config = {
            name        : var_name
            min         : min
            max         : max
            inclusive   : parseInclusivity(dots)
            step        : parseStep(step)
            value       : val
        }
        return config

    _ui_map:
        'value': '.value'

    _template: """
        <span class="value">{{ value }}</span>
        <span class="name">{{ name }}</span>
    """

    _getContext: ->
        display_val = @model.get('value')
        if @_display_precision?
            display_val = display_val.toFixed(@_display_precision)
        return {
            value: "#{@_before_text}#{display_val}#{@_after_text}"
            name: @model.get('name')
        }


    events:
        'click'     : '_reset'
        'mousedown' : '_startDragging'

    _reset: ->
        now = new Date()
        if now - @_last_click < 500
            console.log 'resetting', @_default_value
            @model.set('value', @_default_value)
        @_last_click = now
        return


    _startDragging: (e) ->
        drag_manager.start(e, this, 'x')
        @_original_value = @model.get('value')
        @$el.addClass('active')
        e.preventDefault()
        return
    
    onDrag: ({ x_start, y_start, x_delta, y_delta }) ->
        new_val = @_original_value + Math.floor(x_delta / 5) * @model.get('step')
        max = @model.get('max')
        min = @model.get('min')
        if max?
            inclusive = @model.get('inclusive')
            if (inclusive and new_val > max) or (not inclusive and new_val >= max)
                new_val = max
                if not inclusive
                    new_val -= @model.get('step')
        if min? and new_val < min
            new_val = min
        @model.set
            value: new_val
        return

    stopDragging: ->
        @$el.removeClass('active')


module.exports = RangeElement