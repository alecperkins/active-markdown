NamedView = require './libraries/NamedView'

class Controls extends NamedView
    @_name: 'Controls'
    initialize: ({ collapsed_code }) ->
        @render()
        @_$body = $('body')
        if collapsed_code
            @_toggleCode()

    render: ->
        @$el.html """
                <a href="http://activemarkdown.org">?</a>
                <button class="code" title="Toggle active code visibility">{&hellip;}</button>
            """

    events:
        'click .code': '_toggleCode'

    _toggleCode: ->
        @_$body.toggleClass('collapsed-code')

module.exports = Controls