{ View } = require 'backbone'

class ActiveCodeBlock extends View
    initialize: ({ @source }) ->
        @render()

    render: ->
        @_editor = CodeMirror @el,
            value           : @source
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