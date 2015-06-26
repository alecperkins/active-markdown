_ = require 'underscore'
BaseElement = require './BaseElement'



class StringElement extends BaseElement
    @_name: 'StringElement'

    @config_pattern: ///
            (^
                [\w\d]+
            $)
        ///

    readonly: true

    _template: """
        <span class="value">{{ value }}</span>
        <span class="name">{{ name }}</span>
    """

    initialize: (parsed_config) ->
        @model = executor.getOrCreateVariable
            name: parsed_config.name
            value: parsed_config.text_content
        @model.on('change', @render)
        @_fadeChange = _.debounce(@_doFade, 1000)


    @_parseConfig: (config_match) ->
        return {
            name: config_match[1]
        }

    _getContext: ->
        value = @model.get('value')
        if not value?
            value = @_text_content
        return {
            name: @model.get('name')
            value: value
        }

    _onRender: ->
        @_pingChange()
        @_fadeChange()

    _pingChange: ->
        @$el.addClass('changed no-transition')

    _doFade: =>
        @$el.removeClass('no-transition')
        @$el.removeClass('changed')


module.exports = StringElement