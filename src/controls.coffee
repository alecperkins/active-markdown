_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g

parseNumber = (val) ->
    constants = ['e', 'pi', 'ln2', 'ln10', 'log2e', 'log10e', 'sqrt1_2', 'sqrt2']
    old_val = val
    parsed_val = null

    for c in constants
        r = RegExp("(\\d)*#{ c }")
        group = val.match(r)
        if group
            mult = if group[1] then parseFloat(group[1]) else 1
            parsed_val = mult * Math[c.toUpperCase()]
            break
    if not parsed_val?
        parsed_val = parseFloat(val)
    console.log old_val, parsed_val
    return parsed_val

parseStep = (val) ->
    if val
        return parseNumber(_.string.lstrip(val, ' by '))
    return 1

parseInclusivity = (val) ->
    return val.length is 2


###
Handles drag operations- done globally to enable sliding action that starts on an element but continues across the window
###
class DragManager
    constructor: ->
        @_reset()
        @_$window = $(window)
        @_$body = $('body')

    ###
    Private: reset the drag manager and related document styles (cursor).

    Returns nothing.
    ###
    _reset: ->
        if @_direction?
            @_$body.removeClass("dragging-#{ @_direction }")
        @_dragging_target = null
        @_drag_start_x = null
        @_drag_start_y = null
        @_direction = null
        return

    ###
    Private: prepare the mouse position information for the handlers.

    cur_x - the integer current x position of the cursor
    cur_y - the integer current y position of the cursor

    Returns an object with the initial coordinates, and the change in position.
    ###
    _assembleUI: (cur_x, cur_y) ->
        return {
            x_start : @_drag_start_x
            y_start : @_drag_start_y
            x_delta : cur_x - @_drag_start_x
            y_delta : cur_y - @_drag_start_y
        }

    ###
    Public: initiate a drag operation for a given view.

    e           - the jQuery.Event from the initial mousedown event
    view        - the BaseElementView of the element starting the drag
    direction   - the String direction of the drag: 'x', 'y', or 'both'

    Returns nothing.
    ###
    start: (e, view, direction) ->
        { pageX, pageY } = e
        console.log 'start at', pageX, pageY
        @_direction = direction
        @_drag_start_x = pageX
        @_drag_start_y = pageY
        @_dragging_target = view
        @_$window.on('mousemove', @drag)
        @_$window.on('mouseup', @stop)
        @_$body.addClass("dragging-#{ @_direction }")

    drag: (e) =>
        { pageX, pageY } = e
        ui = @_assembleUI(pageX, pageY)
        @_dragging_target.onDrag?(ui)

    stop: (e) =>
        @_$window.off('mousemove', @drag)
        @_$window.off('mouseup', @stop)
        if @_dragging_target?
            { pageX, pageY } = e
            ui = @_assembleUI(pageX, pageY)
            @_dragging_target.stopDragging?(ui)
            @_reset()

# Public: the base View for all of the active elements in the page. It handles
#         most of the boilerplate
class BaseElementView extends Backbone.NamedView
    ui: {}
    render: =>
        if @readonly
            @$el.addClass('readonly')
        if @_template?
            @$el.html(_.template(@_template)(@_getContext()))
            @ui = {}
            for name, selector of @_ui_map
                @ui[name] = @$el.find(selector)
        @_onRender()
        return @el


    _ui_map: {}
    _template: ''

    _onRender: ->

    _getContext: -> @model.toJSON()

    @make: ($el) ->
        console.log 'Making', @name

        config_match = $el.data('config').match(@config_pattern)

        parsed_config = @_parseConfig(config_match)
        parsed_config.text_content = $el.text()

        view = new @(parsed_config)

        $el.replaceWith(view.render())

    @_parseConfig: ->




# Actual elements

class StringElement extends BaseElementView
    @config_pattern: /(^[\w\d_]+$)/

    readonly: true

    _template: """
        <span class="value">{{ value }}</span>
        <span class="name">{{ name }}</span>
    """

    initialize: (parsed_config) ->
        @model = new Backbone.Model
            value: parsed_config.text_content
            name: parsed_config.name

    @_parseConfig: (config_match) ->
        return {
            name: config_match[1]
        }




class NumberElement extends BaseElementView
    @config_pattern: /([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*/

    initialize: (parsed_config) ->
        parsed_config.value = @_parseTextContent(parsed_config)
        delete parsed_config.text_content
        @model = new Backbone.Model(parsed_config)
        @model.on('change', @render)

    ###
    Private: parse the text content of the element for default value, display
             precision, and additional text.

    text_content - the String text version of the element

    Return the default value for the variable.
    ###
    _parseTextContent: (parsed_config) ->
        { text_content } = parsed_config
        default_value     = undefined
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
        match_group = text_content.match(pattern)[1..5]
        if match_group
            [
                @_before_text
                value
                point
                decimal
                @_after_text
            ] = match_group

            default_value = parseFloat([value, point, decimal].join(''))
            if point
                @_display_precision = decimal.length
        return default_value


    @_parseConfig: (config_match) ->
        console.log config_match
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
        
        if min and max
            val = (max - min) / 2
        else
            val = 0

        return {
            name        : var_name
            min         : parseNumber(min)
            max         : parseNumber(max)
            inclusive   : parseInclusivity(dots)
            step        : parseStep(step)
            value       : val
        }

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
        'mousedown'     : '_startDragging'

    _startDragging: (e) ->
        drag_manager.start(e, this, 'x')
        @_original_value = @model.get('value')
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




class BooleanElement extends BaseElementView
    @config_pattern: /([\w\d]+): ([\w]+) or ([\w]+)/

    initialize: (parsed_config) ->
        parsed_config.value = @_parseTextContent(parsed_config)
        delete parsed_config.text_content
        console.log parsed_config
        @model = new Backbone.Model(parsed_config)

    @_parseConfig: (config_match) ->
        console.log 'BooleanElement', config_match
        ###
            [
                "some_flag: on or off",
                "some_flag",
                "on",
                "off",
                index: 0,
                input: "some_flag: on or off"
            ]
        ###

        [
            name
            true_label
            false_label
        ] = config_match[1..3]

        return {
            name        : name
            true_label  : true_label
            false_label : false_label
        }

    _parseTextContent: (parsed_config) ->
        { text_content, true_label, false_label } = parsed_config

        matchLabel = (label) ->
            pattern = RegExp("(.*)#{ label }(.*)")
            group = text_content.match(pattern)
            return group

        default_value = undefined
        @_before_text = ''
        @_after_text = ''
        @_text_content = text_content

        true_group = matchLabel(true_label)
        if true_group
            default_value = true
            @_before_text = true_group[1]
            @_after_text = true_group[2]
        else
            false_group = matchLabel(false_label)
            if false_group
                default_value = false
                @_before_text = true_group[1]
                @_after_text = true_group[2]

        return default_value

    _template: """
        <span class="value">
            {{ before_text }}
            <span class="switch">•</span>
            <span class="undefined-label">{{ text_content }}</span>
            <span class="true-label">
                {{ true_label }}
            </span>
            <span class="false-label">
                {{ false_label }}
            </span>
            {{ after_text }}
        <span class="name">{{ name }}</span>
    """

    events:
        'click': '_toggleValue'

    _toggleValue: (e) ->
        @model.set
            value: not @model.get('value')
        @_onRender()
        e.preventDefault()

    _onRender: ->
        @$el.attr
            value: String(@model.get('value'))

    _getContext: ->
        return _.extend @model.toJSON(),
            before_text: @_before_text
            after_text: @_after_text
            text_content: @_text_content










class GraphElement extends BaseElementView
    @config_pattern: /([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*/

    initialize: (parsed_config) ->
        @_parseTextContent(parsed_config)
        delete parsed_config.text_content
        @model = new Backbone.Model(parsed_config)

    _parseTextContent: (parsed_config) ->
        { @text_content } = parsed_config
        if false# match x vs y pattern
            ''
        else
            parsed_config.x_label = 'x'
            parsed_config.y_label = 'y'

    @_parseConfig: (config_match) ->
        console.log 'GraphElement', config_match
        [
            name
            min
            dots
            max
            step
        ] = config_match[1..4]
        return {
            name        : name
            min         : parseNumber(min)
            max         : parseNumber(max)
            inclusive   : parseInclusivity(dots)
            step        : parseStep(step)
        }

    _template: """
        <div class="graph-canvas"></div>
        <div class="name">{{ name }}</div>
    """

    _onRender: ->
        @$el.attr
            title: @text_content
        @_plotGraph()

    _plotGraph: ->
        console.log 'plotting graph for', @model.get('name')


###
possible configs:

String
    (^[\w\d_]+$)                                            var_name

Number
    ([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*    calories: 10..100 by -10
    ([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*    calories: 10..100 by 0.1pi
    ([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*    calories: 0..
    ([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*    calories: ..

Boolean
    ([\w\d]+): ([\w]+) or ([\w]+)                           some_flag: true or false
    ([\w\d]+): ([\w]+) or ([\w]+)                           some_flag: on or off

Choice
    ([\w\d]+): ([\d\w\"-_ ]+)(,\s*[-_\w\" \d]+)+                option_picked: alpha,bravo,charlie,delta,echo
    ([\w\d]+): ([\d\w\"-_ ]+)(,\s*[-_\w\" \d]+)+                option_picked: "opt with spaces",otheropt,"opt with -_"

Graph
    ([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*              graphFn: x=-10..10
    ([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*              scatter=graphFn: x=-10..10
    ([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*              scatter=graphFn: x=-10..10
    ([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*              line=Math.sin: x=-2pi..2pi by 0.25pi
    ([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*              bar=graphFn,line=otherFn: x=-10..10

Viz
    (viz=[\w\d_=]+)                                         viz=hookToProcessing

###

$('pre code').each (i, code) ->
    $(code).attr('contenteditable', true)

executor = new Executor()
drag_manager = new DragManager()

$('.AMDElement').each (i, el) ->
    $el = $(el)
    config_str = $el.data('config')

    element_classes = [
        StringElement
        NumberElement
        BooleanElement
        GraphElement
    ]

    element_class = _.find element_classes, (cls) ->
        return cls.config_pattern.test(config_str)

    if element_class?
        element_class.make($el, config_str)
    else
        console.error 'unable to make element for', $el

