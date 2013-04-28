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

module.exports = NamedView