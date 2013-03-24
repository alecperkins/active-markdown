
class CodeBlock extends Backbone.NamedView
    initialize: ({ @source }) ->
        @render()

    render: ->
        @_editor = CodeMirror @el,
            value: @source
            mode:  'coffeescript'
            onBlur: @_update
            lineNumbers: true
            viewportMargin: Infinity
            theme: 'solarized'
        console.log @_editor
        # @_editor, 'blur', @_update)

    _update: =>
        @trigger('change:source')

    getSource: (line_number_start) ->
        @_editor.setOption('firstLineNumber', line_number_start)
        return @_editor.getValue()
