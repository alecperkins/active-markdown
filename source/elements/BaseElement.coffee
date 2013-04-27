_ = require 'underscore'
NamedView = require '../libraries/NamedView'



# Public: the base View for all of the active elements in the page. It handles
#         most of the boilerplate
class BaseElement extends NamedView
    @_name: 'BaseElement'

    ui: {}
    render: =>
        if @readonly
            @$el.addClass('readonly')
        else
            @$el.addClass('editable')
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

    @matchConfig: (config_str) ->
        matched = config_str.match(@config_pattern)
        if matched
            return @_parseConfig(matched)
        return null

    @make: ($el) ->
        console.log 'Making', @_name

        config_match = $el.data('config').match(@config_pattern)

        parsed_config = @_parseConfig(config_match)
        parsed_config.text_content = $el.text()

        view = new @(parsed_config)

        $el.replaceWith(view.render())

    @_parseConfig: ->

module.exports = BaseElement