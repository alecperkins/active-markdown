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
                <a href="http://activemarkdown.org">?</a>
                <button class="code" title="Toggle active code visibility">{&hellip;}</button>
                <button class="highlight" title="Toggle highlighting of interactive elements">◀|▶</button>
                <hr>
                <button class="raw" title="Show raw source">&lt;/&gt;</button>
                <a class="download" href="#" title="Download raw source" download="">↓</a>
            """

    events:
        'click .code'       : '_toggleCode'
        'click .highlight'  : '_toggleHighlight'
        'click .raw'        : '_toggleRaw'
        'click .download'   : '_downloadSource'

    _toggleHighlight: ->
        @_$body.toggleClass('highlighted-elements')

    _toggleCode: ->
        @_$body.toggleClass('collapsed-code')

    _toggleRaw: ->
        @_$body.toggleClass('display-raw')
        if @_$body.hasClass('display-raw')
            window.location.hash = 'raw'
        else
            window.location.hash = ''

    _downloadSource: ->
        $link = @$el.find('a.download')
        if $link.attr('href') is '#'
            raw_source = $('#AMRaw').text()

            file = new Blob [raw_source],
                type:'text/markdown'

            $link.attr
                href: URL.createObjectURL(file)
                download: @_filename



module.exports = Controls