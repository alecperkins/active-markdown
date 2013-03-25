
class StringElement extends BaseElement
    @config_pattern: /(^[\w\d_]+$)/

    readonly: true

    _template: """
        <span class="value">{{ value }}</span>
        <span class="name">{{ name }}</span>
    """

    initialize: (parsed_config) ->
        @model = executor.getOrCreateVariable
            value: undefined
            name: parsed_config.name
        @model.on('change:value', @render)
        @_fadeChange = _.debounce(@_doFade, 1000)


    @_parseConfig: (config_match) ->
        return {
            name: config_match[1]
        }

    _onRender: ->
        @_pingChange()
        @_fadeChange()

    _pingChange: ->
        @$el.addClass('changed no-transition')

    _doFade: =>
        @$el.removeClass('no-transition')
        @$el.removeClass('changed')