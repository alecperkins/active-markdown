NamedView = require '../libraries/NamedView'
CodeMirror = require 'codemirror'

class ActiveCodeBlock extends NamedView
    @_name: 'ActiveCodeBlock'

    initialize: ({ source }) ->
        @_source = source
        @render()

    render: ->
        @_editor = CodeMirror @el,
            value           : @_source
            mode            : 'coffeescript'
            lineNumbers     : true
            viewportMargin  : Infinity
            theme           : 'solarized'

        @_editor.on('blur', @_update)

    _update: =>
        @trigger('change:source')

    getSource: (line_number_start) ->
        @_editor.setOption('firstLineNumber', line_number_start)
        return @_editor.getValue()



module.exports = ActiveCodeBlock