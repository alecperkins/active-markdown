NamedView = require './libraries/NamedView'

class Controls extends NamedView
    @_name: 'Controls'
    initialize: ({ collapsed_code }) ->
        @render()
        @_$body = $('body')
        if collapsed_code
            @_toggleCode()
        if window.location.hash is '#raw'
            @_toggleRaw()

    render: ->
        @$el.html """
                <a href="http://activemarkdown.org">?</a>
                <button class="code" title="Toggle active code visibility">{&hellip;}</button>
                <button class="raw" title="Show raw source">&lt;/&gt;</button>
            """

    events:
        'click .code'   : '_toggleCode'
        'click .raw'    : '_toggleRaw'

    _toggleCode: ->
        @_$body.toggleClass('collapsed-code')

    _toggleRaw: ->
        @_$body.toggleClass('display-raw')
        if @_$body.hasClass('display-raw')
            window.location.hash = 'raw'
        else
            window.location.hash = ''

module.exports = Controls