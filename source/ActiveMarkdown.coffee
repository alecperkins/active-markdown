_                   = require 'underscore'
fs                  = require 'fs'
path                = require 'path'

{ parseMarkdown } = require './parser'



VERSION = '0.2.0'
exports.VERSION = VERSION



CWD         = process.cwd()
LIB_PATH    = path.dirname(fs.realpathSync(__filename))



_prepareScripts = (options) ->
    script_file_name = "activemarkdown-#{ VERSION }-min.js"
    if options.debug
        script_file_name = script_file_name.replace('-min', '')
    switch options.libraries
        when 'relative'
            scripts_html = ''
        when 'inline'
            scripts_html = ''
        else
            scripts_html = ''
    return ''

_prepareStyles = (options) ->
    return ''

_prepareOptions = (options) ->
    { editable_code, collapsed_code, debug } = options
    return JSON.stringify
        editable_code   : editable_code
        collapsed_code  : collapsed_code
        debug           : debug

_wrapOutput = (markup, options) ->
    if options.wrap is true
        template = fs.readFileSync(path.join(LIB_PATH, 'misc', 'template.html._')).toString()

        document_options    = _prepareOptions(options)
        scripts             = _prepareScripts(options)
        styles              = _prepareStyles(options)

        html_output = _.template template,
            title   : options.title or ''
            scripts : scripts
            styles  : styles
            markup  : markup
            options : document_options
    else
        before = options.wrap[0] or options.wrap['before']
        after = options.wrap[1] or options.wrap['after']

        html_output = "#{ before }#{ markup }#{ after }"

    return html_output



exports.parse = (markdown_source, kwargs={}) ->
    defaults =
        wrap                : true
        libraries           : 'reference'
        editable_code       : true
        collapsed_code      : false
        title               : undefined
        debug               : false

    options = _.extend({}, defaults, kwargs)

    html_output = parseMarkdown(markdown_source)

    if options.wrap
        html_output = _wrapOutput(html_output, options)

    return html_output



exports.makeActive = (elements...) ->

