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
            variable_model.on('change:value', @_deferredExecute)
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