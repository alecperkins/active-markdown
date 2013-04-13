
{ parseMarkdown } = require './parser'

exports.VERSION = '1.2.0'

exports.activate_on_ready = true

exports.parse = (markdown_source, kwargs={}) ->
    html_output = parseMarkdown(markdown_source)
    return html_output



exports.makeActive = (elements...) ->

