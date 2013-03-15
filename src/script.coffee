
_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g


class Executor

    constructor: ->
        @_variables = {}
        $('pre code').on('blur', @_deferredExecute)

    getOrCreateVariable: (attrs) ->
        {name} = attrs
        if @_variables[name]
            variable_model = @_variables[name]
            delete attrs.value
        else
            variable_model = new Backbone.Model(name)
            @_variables[name] = variable_model
            variable_model.on('change', @_deferredExecute)
        variable_model.set(attrs)
        return variable_model

    _prepareState: ->
        state = {}
        _.each @_variables, (v) ->
            state[v.get('name')] = v.get('value')
        return state

    _compileCode: ->
        coffee_code_str = ''
        # Concatenate all of the code blocks into one source string. This way,
        # the CoffeeScript compiler will include them in a single closure.
        $('pre code').each (i, el) ->
            coffee_code_str += $(el).text()
        js_code_str = CoffeeScript.compile(coffee_code_str)
        return js_code_str

    _deferredExecute: =>
        if not @_is_executing
            @_is_executing = true
            _.defer =>
                state = @_prepareState()
                js_code_str = @_compileCode()

                # Turn the code string into an actual function, and call it
                # using the `state` as `this`. The function will modify the
                # `state` in place.
                fn = Function(js_code_str)
                fn.call(state, js_code_str)

                # Reassign the values of the variables using their maybe new
                # values from the `state`.
                @_updateVariablesFrom(state)
                @_is_executing = false


    _updateVariablesFrom: (state) ->
        for k, v of state
            @_variables[k]?.set
                value: v
        


executor = new Executor()

makeLive = (i, el) ->
    $tag            = $(el)
    name            = $tag.data('name')
    config          = $tag.data('config')
    text_content    = $tag.html()

    if $tag.data('graph')
        live_element = buildGraph(text_content, name, config)
    else if config.length is 3 and config[1] is 'or'
        live_element = buildBinaryVar(text_content, name, config)
    else if /[[\d]+[\.]{2,3}[\d]+]/.test(config[0])
        live_element = buildNumberVar(text_content, name, config)
    else
        live_element = buildStringVar(text_content, name, config)

    $tag.replaceWith(live_element.render())



class Variable extends Backbone.NamedView
    tagName: 'span'
    initialize: ->
        @listenTo(@model, 'change', @render)
        @_ui_map = _.extend {}, @ui

    render: =>
        @ui = {}
        if @readonly
            @$el.addClass('readonly')
        _.defer =>
            @$el.html(_.template(@template)(@model.toJSON()))
            for name, selector of @ui_map
                @ui[name] = @$el.find(selector) 
            @onRender()
        return @el

    onRender: ->





class NumberVar extends Variable
    ui_map:
        slider: 'span.slider'
        output: 'span.output'

    _update: (e, ui) =>
        @model.set
            value: parseInt(ui.value)

    template: """
            <span class="variable-label">{{ name }}</span>
            <span class="slider"></span>
            <span class="output">{{ value }}</span>
        """

    onRender: ->
        @ui.slider.slider
            min: @model.get('min')
            max: @model.get('max')
            value: @model.get('value')
            change: @_update
            slide: (e, ui) =>
                @ui.output.text(ui.value)


buildNumberVar = (text_content, name, config) ->
    config = _.string.strip(config[0],'][').split('.')
    min = _.first(config)
    max = _.last(config)

    text_content = _.string.strip(text_content, '$%')

    number_model = executor.getOrCreateVariable
        name: name
        min: parseInt(min)
        max: parseInt(max)
        value: parseInt(text_content)

    variable_view = new NumberVar
        model: number_model

    return variable_view




class BinaryVar extends Variable
    template: """
        <span class="variable-label">{{ name }}</span>
        <label><input class="option-a" name="{{ name }}" type="radio" value="{{ a }}">{{ a }}</label>
        <label><input class="option-b" name="{{ name }}" type="radio" value="{{ b }}">{{ b }}</label>
    """
    onRender: ->
        { value, a, b } = @model.toJSON()
        if value is a
            @$el.find('.option-a').attr('checked', true)
        else if value is b
            @$el.find('.option-b').attr('checked', true)

    events:
        'change input': '_update'

    ui_map:
        'a': '.option-a'
        'b': '.option-b'

    _update: ->
        if @ui.a.is(':checked')
            @model.set('value', @ui.a.val())
        else if @ui.b.is(':checked')
            @model.set('value', @ui.b.val())



buildBinaryVar = (text_content, name, config) ->

    var_model = executor.getOrCreateVariable
        name: name
        value: text_content
        a: config[0]
        b: config[2]

    variable_view = new BinaryVar
        model: var_model

    return variable_view



class StringVar extends Variable
    readonly: true
    template: """
            <span class="variable-label">{{ name }}</span>
            {% if(value.toFixed) { %}
                {{ value.toFixed(1) }}
            {% } else { %}
                {{ value }}
            {% } %}
        """

buildStringVar = (text_content, name, config) ->
    
    var_model = executor.getOrCreateVariable
        name: name
        value: text_content
    variable_view = new StringVar
        model: var_model

    return variable_view




class GraphView extends Variable
    readonly: true
    tagName: 'div'
    template: """
        <div class="graph-title">{{ title }}</div>
        <div class="graph-canvas"></div>
    """
    ui_map:
        'canvas': '.graph-canvas'
    onRender: ->
        @ui.canvas.css
            height: @ui.canvas.width() / 2
        @_generateGraph()

    _generateGraph: ->
        config = @model.get('config')
        x_range = config[0].split('=')[1]
        x_range = _.string.strip(x_range,'[]').split('.')
        start = parseInt(_.first(x_range))
        end = parseInt(_.last(x_range))
        series = []

        graphFn = @model.get('value')

        for x in [start...end] by 0.1
            series.push [x, graphFn(x)]

        $.plot(@ui.canvas, [series])



buildGraph = (text_content, name, config) ->
    var_model = executor.getOrCreateVariable
        name: name
        title: text_content
        config: config
    graph_view = new GraphView
        model: var_model
    return graph_view




$('.live-text').each(makeLive)

$('pre code').each (i, code) ->
    $(code).attr('contenteditable', true)


