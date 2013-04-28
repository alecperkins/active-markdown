BaseElement = require './BaseElement'

{
    parseNumber
    parseStep
    parseInclusivity
} = require '../helpers'

class ChartElement extends BaseElement
    @_name: 'ChartElement'
    @is_embed: true

    @config_pattern: ///
            ^
            (                      # Chart
              [line|scatter]+        # - type
            )

              =

            (                      # Variable
              [\w\d]+               # - name
            )

              :\s                   # Delimiter

            (                       # Range min, if any:
              [+|-]?                        # - sign, if any
              (?:[\d]*[\.]?[\d]+)?          # - coefficient, if any
              [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
            )

            (                       # Inclusivity
              [\.]{2,3}             # - dots
            )

            (                       # Range max, if any:
              [+|-]?                        # - sign, if any
              (?:[\d]*[\.]?[\d]+)?          # - coefficient, if any
              [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
            )

            (                       # Step, if any:
              \sby\s                # - by keyword

                (?:                 # - step value
                  [+|-]?                        # - sign, if any
                  (?:[\d]*[\.]?[\d]+)?          # - coefficient, if any
                  [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
                )

            )*$
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

        [type, var_name, min, dots, max, step] = config_match[1..6]
        
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
            type        : type
        }
        return config

    _ui_map:
        'value': '.value'

    _template: """
        <div class="canvas"></div>
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



module.exports = ChartElement