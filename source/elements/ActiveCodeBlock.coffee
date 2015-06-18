NamedView = require '../libraries/NamedView'
Ace = require 'brace'

require('brace/mode/coffee')
#require('brace/theme/monokai')

class ActiveCodeBlock extends NamedView
    @_name: 'ActiveCodeBlock'

    initialize: ({ source }) ->
        @_source = source
        window.ace_editors = {} if !window.ace_editors
        window.ace_editors[@el.id] = Ace.edit @el if !window.ace_editors[@el.id]
        @_editor = window.ace_editors[@el.id]
        @el.parentElement.insertBefore(@_editor.container, @el)
        @render()

    render: ->
        @_editor.$blockScrolling = Infinity
        @_editor.setValue(@_source)
        @_editor.clearSelection()
        #@_editor.setTheme('ace/theme/monokai')
        @_editor.getSession().setMode('ace/mode/coffee')
        @_editor.setOptions maxLines: Infinity
        @_editor.on('blur', @_update)

    _update: =>
        @trigger('change:source')

    getSource: (line_number_start) ->
        @_editor.setOption('firstLineNumber', line_number_start)
        return @_editor.getValue()



module.exports = ActiveCodeBlock