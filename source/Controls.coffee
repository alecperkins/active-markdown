NamedView = require './libraries/NamedView'
$ = require 'jquery'

class Controls extends NamedView
    @_name: 'Controls'
    initialize: ({ collapsed_code, filename }) ->
        @render()
        @_$body = $('body')
        @_filename = filename
        if collapsed_code
            @_toggleCode()
        if window.location.hash is '#raw'
            @_toggleRaw()

    render: ->
        @$el.html """
                <button class="code" title="Toggle active code visibility">{&hellip;}</button>
                <button class="highlight" title="Toggle highlighting of interactive elements">◀|▶</button>
            """

    events:
        'click .code'       : '_toggleCode'
        'click .highlight'  : '_toggleHighlight'

    _toggleHighlight: ->
        @_$body.toggleClass('highlighted-elements')

    _toggleCode: ->
        @_$body.toggleClass('collapsed-code')


module.exports = Controls