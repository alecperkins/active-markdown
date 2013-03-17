
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
    render: ->
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

        config_data = $el.data('config').match(@config_pattern)

        parsed_config = @_parseConfig(config_data)
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
    start: (view, e) ->


        console.log e
        { pageX } = e
        @_drag_start_x = pageX
        @_is_dragging = true
        dragging_control = this

drag_manager = new DragManager()

class NumberElement extends BaseElementView
    @config_pattern: /([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)/

    initialize: (parsed_config) ->
        parsed_config.value = parseInt(parsed_config.text_content)
        # TODO: parse before and after text
        delete parsed_config.text_content
        @model = new Backbone.Model(parsed_config)


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
        'mousemove'     : '_drag'
        'mouseup'       : 'stopDragging'

    _startDragging: (e) ->
        drag_manager.start(this, e)
        return
    
    onDrag: (e) ->
        if @_is_dragging
            { pageX } = e
            delta = @_drag_start_x - pageX
            @model.set
                value: @model.get('value') + delta / -5
            @ui.value.text(@model.get('value'))
            e.preventDefault()
        return

    stopDragging: (e) ->
        { pageX } = e
        @_is_dragging = false
        console.log @_drag_start_x - pageX, @_is_dragging
        return


class BooleanElement extends BaseElementView
    @config_pattern: /([\w\d]+) ([\w]+) or ([\w]+)/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_str) ->
        
        return {}



class ChoiceElement extends BaseElementView
    @config_pattern: /([\w\d]+) \[([\w,\d ]+)\]/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_str) ->
        
        return {}



class GraphElement extends BaseElementView
    @config_pattern: /([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_str) ->
        
        return {}



class VisualizationElement extends BaseElementView
    @config_pattern: /(viz=[\w\d_]+)/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_str) ->
        
        return {}



# possible configs:

# String
#     ([\w\d_]+)                                            var_name

# Number
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [10..100] by 10
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [10..100] by 0.1
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [0..]
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [..]

# Boolean
#     ([\w\d]+) ([\w]+) or ([\w]+)                          some_flag true or false
#     ([\w\d]+) ([\w]+) or ([\w]+)                          some_flag on or off

# Choice
#     ([\w\d]+) \[([\w,\d ]+)\]                             option_picked [alpha,bravo,charlie,delta,echo]

# Graph
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         graphFn x=[-10..10]
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         scatter=graphFn x=[-10..10]
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         scatter=graphFn x=[-10..10]
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         line=Math.sin x=[-2pi..2pi] by 0.25pi
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         bar=graphFn,line=otherFn x=[-10..10]

# Viz
#     (viz=[\w\d_=]+)                                           viz=hookToProcessing




$('.AMDElement').each(makeActive)
