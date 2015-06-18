NamedView = require '../libraries/NamedView'
Ace = require 'brace'

require('brace/mode/coffee')
#require('brace/theme/monokai')

class ActiveCodeBlock extends NamedView
    @_name: 'ActiveCodeBlock'

    initialize: ({ source }) ->
        @_source = source
        @render()

    render: ->
        @_editor = Ace.edit @el
        @_editor.setValue(@_source)
        @_editor.clearSelection()
        #@_editor.setTheme('ace/theme/monokai')
        @_editor.getSession().setMode('ace/mode/coffee')
        #TODO doesn't remove warning...@_editor.$blockScrolling = Infinity
        @_editor.setOptions maxLines: Infinity
        @_editor.on('blur', @_update)

    _update: =>
        @trigger('change:source')

    getSource: (line_number_start) ->
        @_editor.setOption('firstLineNumber', line_number_start)
        return @_editor.getValue()



module.exports = ActiveCodeBlock