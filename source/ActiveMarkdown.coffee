_                   = require 'underscore'
fs                  = require 'fs'
path                = require 'path'

{ parseMarkdown }   = require './parser'



VERSION = '0.2.0'
exports.VERSION = VERSION


# Figure out where we are, for reading in the templates and style files.
CWD         = process.cwd()
LIB_PATH    = path.dirname(fs.realpathSync(__filename))



# Switch the Underscore templating to a less nutty syntax (in this case `{{ interpolate }}` and `{% evaluate %}`).

_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g



###
Private: generate the script libraries to be included, either by reference or
         inline.

options - an Object with the parsing session options

Returns a String of HTML.
###
_prepareScripts = (options) ->
    scripts_file_name = "activemarkdown-#{ VERSION }-min.js"
    if options.debug
        scripts_file_name = scripts_file_name.replace('-min', '')
    switch options.libraries
        when 'relative'
            scripts_html = "<script src='#{ scripts_file_name }'></script>"
        when 'inline'
            scripts_html = ''
        else
            scripts_html = "<script src='http://activemarkdown.org/viewer/#{ scripts_file_name }'></script>"
    return scripts_html



###
Private: generate the style libraries to be included, either by reference or
         inline.

options - an Object with the parsing session options

Returns a String of HTML.
###
_prepareStyles = (options) ->
    styles_file_name = "activemarkdown-#{ VERSION }-min.css"
    if options.debug
        styles_file_name = styles_file_name.replace('-min', '')
    switch options.libraries
        when 'relative'
            styles_html = "<link rel='stylesheet' href='#{ styles_file_name }'>"
        when 'inline'
            styles_html = ''
        else
            styles_html = "<link rel='stylesheet' href='http://activemarkdown.org/viewer/#{ styles_file_name }'>"
    return styles_html



###
Private: generate the JSON string representation of the document options to
         be set in the rendered output.

options - an Object with the parsing session options

Returns a String of JSON.
###
_prepareOptions = (options) ->
    { editable_code, collapsed_code, debug } = options
    return JSON.stringify
        editable_code   : editable_code
        collapsed_code  : collapsed_code
        debug           : debug



###
Private: wrap the specified markup according to the options.

markup  - a String of HTML to be wrapped
options - an Object with the parsing session options

Returns the String wrapped result.
###
_wrapOutput = (markup, options) ->
    if options.wrap is true
        template = fs.readFileSync(
                path.join(LIB_PATH,'misc','template.html._')
            ).toString()

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



###
Public: parse the given Active Markdown to HTML, using the specified options.

markdown_source - the String of Markdown to be processed
kwargs          - (={}) an Object with default overrides
    wrap            - (=true) A Boolean, Object, or Array specifying how to
                      wrap the given markup. Possible values are:
                        * true
                        * false
                        * ["<before>", "<after>"]
                        * { before: "<before>", after: "<after>" }
    libraries       - (='reference') A String indicating how to include the
                      script and style libraries in the output. One of:
                        * 'reference'   - reference to hosted libs
                        * 'relative'    - reference to relative libs
                        * 'inline'      - inlined into output
    editable_code   - (=true) A Boolean flag indicating if active code blocks
                      are editable by the reader.
    collapsed_code  - (=false) A Boolean flag indicating if active code blocks
                      are in their collapsed state by default.
    title           - (=undefined) A String to use as the title of the document.
    debug           - (=false) A Boolean flag indicating if debug mode should be
                      set. If true, unminified libraries are referenced/inlined.

Returns a String of HTML.
###
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


