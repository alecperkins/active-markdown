
_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g


makeActive = (i, el) ->
    $el = $(el)
    config_str = $el.data('config')
    console.log ''
    console.log config_str

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

    console.log element_class
    element_class.make($el, config_str)


# Public: the base View for all of the active elements in the page. It handles
#         most of the boilerplate
class BaseElementView extends Backbone.NamedView
    render: ->
        if @_template?
            @$el.html(@_template(@model.toJSON()))
        @_onRender()
        return @el

    _template: ->

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

    _template: _.template """
        <span class="value">{{ value }}</span>
        <span class="help">{{ name }}</span>
    """

    initialize: (parsed_config) ->
        console.log parsed_config
        @model = new Backbone.Model
            value: parsed_config.text_content
            name: parsed_config.name

    @_parseConfig: (config_match) ->
        console.log config_match
        return {
            name: config_match[0]
        }



class NumberElement extends BaseElementView
    @config_pattern: /([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)/

    initialize: (parsed_config) ->
        @model = new Backbone.Model()

    @_parseConfig: (config_str) ->
        
        return {}



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
