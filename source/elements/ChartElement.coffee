BaseElement = require './BaseElement'

_   = require 'underscore'
_s  = require 'underscore.string'

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
              [line|scatter|bar]+   # - type
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
        { x_label, y_label } = @constructor._parseTextContent(parsed_config.text_content)
        @_x_label = x_label
        @_y_label = y_label

        delete parsed_config.text_content
        @model = executor.getOrCreateVariable(parsed_config)
        @model.on('change', @render)
        throttled_render = _.debounce =>
            @_onRender(true)
        , 250
        $(window).on('resize', throttled_render)

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

    render: ->
        if not @_chart?
            return super()
        @_onRender()
        return @el

    _onRender: (force=false) ->
        if not @_chart? or force
            @$el.css
                height: @$el.width()
        fn = @model.get('value')
        if _.isFunction(fn)
            range = (x for x in [@model.get('min')..@model.get('max')] by @model.get('step'))
            points = _.map range, (x) ->
                return {
                    x: x
                    y: fn(x)
                }

            # TODO: add axes titles when Vega hits 1.3.0
            spec = generateChartSpec(@$el.width(), @$el.height(), @model.get('type'), points)
            vg.parse.spec spec, (chart) =>
                @_chart = chart(el: @el)
                @_chart.update()
        return



# TODO: DRY this up
generateChartSpec = (width, height, type, points) ->
    switch type
        when 'line'
            return {
              "width": width - 100,
              "height": height - 100,
              "padding": {"top":50, "left":50, "bottom":50, "right":50},
              "data": [
                {
                  "name": "points",
                  "values": points
                }
              ],
              "scales": [
                {
                  "name": "x",
                  "nice": true,
                  "range": "width",
                  "domain": {"data": "points", "field": "data.x"}
                },
                {
                  "name": "y",
                  "nice": true,
                  "range": "height",
                  "domain": {"data": "points", "field": "data.y"}
                }
              ],
              "axes": [
                   {
                     "type": "x",
                     "scale": "x",
                     "properties": {
                       "ticks": {
                         "stroke": {"value": "steelblue"}
                       },
                       "majorTicks": {
                         "strokeWidth": {"value": 2}
                       },
                       "labels": {
                         "fill": {"value": "steelblue"},
                         "angle": {"value": 50},
                         "fontSize": {"value": 14},
                         "align": {"value": "left"},
                         "baseline": {"value": "middle"},
                         "dx": {"value": 3}
                       },
                       "axis": {
                         "stroke": {"value": "#333"},
                         "strokeWidth": {"value": 1.5}
                       }
                     }
                   },
                {
                    "type": "y",
                    "scale": "y",
                    "properties": {
                        "labels": {
                             "fill": {"value": "steelblue"},
                             "angle": {"value": 50},
                             "fontSize": {"value": 14},
                             "align": {"value": "left"},
                             "baseline": {"value": "middle"},
                             "dx": {"value": 3}
                        }
                    }
                }, 
              ],
              "marks": [
                {
                  "type": "line",
                  "from": {"data": "points"},
                  "properties": {
                    "enter": {
                      "x": {"scale": "x", "field": "data.x"},
                      "y": {"scale": "y", "field": "data.y"},
                      "stroke": {"value": "steelblue"},
                      "fillOpacity": {"value": 0.5}
                    },
                    "update": {
                      "fill": {"value": "transparent"},
                      "size": {"value": 100}
                    },
                    "hover": {
                      "fill": {"value": "pink"},
                      "size": {"value": 300}
                    }
                  }
                }
              ]
            }

        when 'bar'
            return {
              "width": width - 40,
              "height": height - 40,
              "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},
              "data": [
                {
                  "name": "table",
                  "values": points
                }
              ],
              "scales": [
                {
                  "name": "x",
                  "type": "ordinal",
                  "range": "width",
                  "domain": {"data": "table", "field": "data.x"}
                },
                {
                  "name": "y",
                  "range": "height",
                  "nice": true,
                  "domain": {"data": "table", "field": "data.y"}
                }
              ],
              "axes": [
                {"type": "x", "scale": "x"},
                {"type": "y", "scale": "y"}
              ],
              "marks": [
                {
                  "type": "rect",
                  "from": {"data": "table"},
                  "properties": {
                    "enter": {
                      "x": {"scale": "x", "field": "data.x"},
                      "width": {"scale": "x", "band": true, "offset": -1},
                      "y": {"scale": "y", "field": "data.y"},
                      "y2": {"scale": "y", "value": 0}
                    },
                    "update": {
                      "fill": {"value": "steelblue"}
                    },
                    "hover": {
                      "fill": {"value": "red"}
                    }
                  }
                }
              ]
            }


        else # scatter
            return {
              "width": width - 100,
              "height": height - 100,
              "padding": {"top":50, "left":50, "bottom":50, "right":50},
              "data": [
                {
                  "name": "points",
                  "values": points
                }
              ],
              "scales": [
                {
                  "name": "x",
                  "nice": true,
                  "range": "width",
                  "domain": {"data": "points", "field": "data.x"}
                },
                {
                  "name": "y",
                  "nice": true,
                  "range": "height",
                  "domain": {"data": "points", "field": "data.y"}
                }
              ],
              "axes": [
                {
                    "type": "x",
                    "scale": "x",
                    "properties": {
                        "labels": {
                             "fill": {"value": "steelblue"},
                             "angle": {"value": 50},
                             "fontSize": {"value": 14},
                             "align": {"value": "left"},
                             "baseline": {"value": "middle"},
                             "dx": {"value": 3}
                        }
                    }
                },
                {
                    "type": "y",
                    "scale": "y",
                    "properties": {
                        "labels": {
                             "fill": {"value": "steelblue"},
                             "angle": {"value": 50},
                             "fontSize": {"value": 14},
                             "align": {"value": "left"},
                             "baseline": {"value": "middle"},
                             "dx": {"value": 3}
                        }
                    }
                },              ],
              "marks": [
                {
                  "type": "symbol",
                  "from": {"data": "points"},
                  "properties": {
                    "enter": {
                      "x": {"scale": "x", "field": "data.x"},
                      "y": {"scale": "y", "field": "data.y"},
                      "stroke": {"value": "steelblue"},
                      "fillOpacity": {"value": 0.5}
                    },
                    "update": {
                      "fill": {"value": "transparent"},
                      "size": {"value": 100}
                    },
                    "hover": {
                      "fill": {"value": "pink"},
                      "size": {"value": 300}
                    }
                  }
                }
              ]
            }






module.exports = ChartElement