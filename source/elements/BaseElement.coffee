_ = require 'underscore'
{ View } = require 'backbone'



###
Backbone.NamedView

by Alec Perkins, http://alecperkins.net
Repo: https://github.com/alecperkins/Backbone.NamedView

A Backbone View that automagically adds CSS classes based on its CoffeeScript
class names.
###

class NamedView extends View
    @_name: 'NamedView'
    constructor: (args...) ->

        # Let the regular Backbone.View constructor do its thing.
        super(args...)

        # Use the @solo_name property of only this constructor to allow for
        # overriding it in descendent classes.
        solo_name = @constructor.solo_name


        if window.NamedView_solo_default and not solo_name?
            solo_name = window.NamedView_solo_default

        # Recursively add the classes, going up the inheritence chain.
        addParent = (parent_ctor) =>

            # Use a name specified by a _name override.
            name_to_add = if parent_ctor._name? then parent_ctor._name else parent_ctor.name

            # Stop if no parent or back at NamedView.
            if parent_ctor? and name_to_add isnt 'NamedView'
                # Recurse all the way up the chain before adding the classes
                # so that they are added in order, not that it really
                # matters at all. (More of an OCD thing.)
                if not solo_name
                    addParent(parent_ctor.__super__?.constructor)
                if not parent_ctor.mute_name
                    @$el.addClass(name_to_add)

        # Start the recursion using this class's constructor.
        addParent(@constructor)



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