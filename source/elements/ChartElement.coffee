BaseElement = require './BaseElement'

_s = require 'underscore.string'

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
        { x_label, y_label } = @_parseTextContent(parsed_config.text_content)
        @_x_label = x_label
        @_y_label = y_label

        delete parsed_config.text_content
        @model = executor.getOrCreateVariable(parsed_config)
        @model.on('change', @render)

    # TODO: This could be cleaned up across elements, particularly so it's
    # more testable.
    ###
    Private: parse the text content of the element for axes labels.

    text_content - the String text version of the element

    Returns an Object with the x and y labels.
    ###
    @_parseTextContent: (text_content) ->
        label_config =
            y_label: null
            x_label: null
        pattern = /([ \-_\w\d]+\s)(vs|over|per|by)(\s[ \-_\w\d]+)/
        matched = text_content.match(pattern)?[1..3]
        if matched
            label_config.y_label = _s.trim(matched[0])
            label_config.x_label = _s.trim(matched[2])
        return label_config

       


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