NamedView = require '../libraries/NamedView'

class ActiveCodeBlock extends NamedView
    @_name: 'ActiveCodeBlock'

    initialize: ({ source }) ->
        @_source = source
        @render()

    render: ->
        @_editor = CodeMirror @el,
            value           : @_source
            mode            : 'coffeescript'
            onBlur          : @_update
            lineNumbers     : true
            viewportMargin  : Infinity
            theme           : 'solarized'

    _update: =>
        @trigger('change:source')

    getSource: (line_number_start) ->
        @_editor.setOption('firstLineNumber', line_number_start)
        return @_editor.getValue()



module.exports = ActiveCodeBlock