
_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g


makeActive = (i, el) ->
    $el = $(el)
    config_str = $el.data('config')

    element_classes = [
        StringElement
        NumberElement
        BooleanElement
        ChoiceElement
        GraphElement
        VisualizationElement
    ]

    element_class = _.find element_classes, (cls) ->
        return cls.config_pattern.test(config_str)

    element_class.make($el, config_str)


# Public: the base View for all of the active elements in the page. It handles
#         most of the boilerplate
class BaseElementView extends Backbone.NamedView
    ui: {}
    render: =>
        if @readonly
            @$el.addClass('readonly')
        if @_template?
            @$el.html(_.template(@_template)(@model.toJSON()))
            @ui = {}
            for name, selector of @_ui_map
                @ui[name] = @$el.find(selector)
        @_onRender()
        return @el


    _ui_map: {}
    _template: ''

    _onRender: ->

    @make: ($el) ->
        console.log 'Making', @name

        config_match = $el.data('config').match(@config_pattern)

        parsed_config = @_parseConfig(config_match)
        parsed_config.text_content = $el.text()

        view = new @(parsed_config)

        $el.replaceWith(view.render())

    @_parseConfig: ->



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


parseNumber = (val) ->
    # TODO: handle constants
    return parseFloat(val)

parseStep = (val) ->
    return 1

parseInclusivity = (val) ->
    return val.length is 2


class DragManager
    constructor: ->
        @_reset()
        @_$window = $(window)
        @_$body = $('body')

    _reset: ->
        if @_direction?
            @_$body.removeClass("dragging-#{ @_direction }")
        @_dragging_target = null
        @_drag_start_x = null
        @_drag_start_y = null
        @_direction = null

    _assembleUI: (cur_x, cur_y) ->
        return {
            x_start: @_drag_start_x
            y_start: @_drag_start_y
            x_delta: cur_x - @_drag_start_x
            y_delta: cur_y - @_drag_start_y
            x_stop: null
            y_stop: null
        }

    start: (e, view, @_direction) ->
        { pageX, pageY } = e
        console.log 'start at', pageX, pageY
        @_drag_start_x = pageX
        @_drag_start_y = pageY
        @_dragging_target = view
        @_$window.on('mousemove', @drag)
        @_$window.on('mouseup', @stop)
        @_$body.addClass("dragging-#{ @_direction }")

    drag: (e) =>
        { pageX, pageY } = e
        ui = @_assembleUI(pageX, pageY)
        @_dragging_target.onDrag(ui)

    stop: (e) =>
        @_$window.off('mousemove', @drag)
        @_$window.off('mouseup', @stop)
        if @_dragging_target?
            { pageX, pageY } = e
            ui = @_assembleUI(pageX, pageY)
            @_dragging_target.stopDragging(ui)
            @_reset()


drag_manager = new DragManager()

class NumberElement extends BaseElementView
    @config_pattern: /([\w\d]+): ([\w\d-]*)([\.]{2,3})([\w\d-]*)( by [\w\d\.-]+)*/

    initialize: (parsed_config) ->
        parsed_config.value = parseInt(parsed_config.text_content)
        # TODO: parse before and after text
        delete parsed_config.text_content
        @model = new Backbone.Model(parsed_config)
        @model.on('change', @render)


    @_parseConfig: (config_match) ->
        console.log config_match
        ###
        [
            "calories [10..100] by 10",
            "calories",
            "10",
            "..",
            "100",
            " by 10",
            index: 0,
            input: "calories [10..100] by 10"
        ]
        ###

        [var_name, min, dots, max, step] = config_match[1..5]
        
        return {
            name        : var_name
            min         : parseNumber(min)
            max         : parseNumber(max)
            inclusive   : parseInclusivity(dots)
            step        : parseStep(step)
        }

    _ui_map:
        'value': '.value'

    _template: """
        <span class="value">{{ value }}</span>
        <span class="name">{{ name }}</span>
    """

    events:
        'mousedown'     : '_startDragging'

    _startDragging: (e) ->
        drag_manager.start(e, this, 'horizontal')
        @_original_value = @model.get('value')
        e.preventDefault()
        return
    
    onDrag: ({ x_start, x_stop, y_start, y_stop, x_delta, y_delta }) ->
        @model.set
            value: @_original_value + x_delta / 5
        return

    stopDragging: ({ x_start, x_stop, y_start, y_stop, x_delta, y_delta }) ->
        console.log 'STOPPED!', x_delta, y_delta
        return


class BooleanElement extends BaseElementView
    @config_pattern: /([\w\d]+): ([\w]+) or ([\w]+)/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_match) ->
        console.log 'BooleanElement', config_match
        return {}



class ChoiceElement extends BaseElementView
    @config_pattern: /([\w\d]+): ([\d\w\"-_ ]+)(,\s*[-_\w\" \d]+)+/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_match) ->
        console.log 'ChoiceElement', config_match
        return {}



class GraphElement extends BaseElementView
    @config_pattern: /([=\.\,\w\d]+): x=([-]?[\d\w]+)(\.{2,3})([-]?[\d\w]+)( by [\w\d\.-]+)*/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_match) ->
        console.log 'GraphElement', config_match
        return {}



class VisualizationElement extends BaseElementView
    @config_pattern: /(viz=[\w\d_]+)/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_match) ->
        console.log 'VisualizationElement', config_match
        return {}


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


$('.AMDElement').each(makeActive)
