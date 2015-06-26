###
Browser-specific functionality.
###

$   = require 'jquery'
_   = require 'underscore'
_s  = require 'underscore.string'

ActiveMarkdown  = require './ActiveMarkdown'
Controls        = require './Controls'
Executor        = require './Executor'

ActiveCodeBlock = require './elements/ActiveCodeBlock'
ChartElement    = require './elements/ChartElement'
RangeElement    = require './elements/RangeElement'
StringElement   = require './elements/StringElement'
SwitchElement   = require './elements/SwitchElement'
ActiveMarkdown.makeActive = (options) ->
    ActiveMarkdown.options = options

    controls = new Controls
        el              : $('#AMControls')
        collapsed_code  : options.collapsed_code
        filename        : options.filename

    window.executor._code_blocks = []

    list_of_unused_vars = []
    for v of window.executor._variables
        if window.executor._variables.hasOwnProperty v
            list_of_unused_vars.push v

    $('pre').each (i, el) ->
        $el = $(el)
        $code = $el.find('code')
        if not $code.attr('class')
            source = $code.text()
            $new_el = $('<div>')
            $new_el.attr('id', 'AMDEditorElement_' + i)
            $el.replaceWith($new_el)
            window.executor.addCodeBlock new ActiveCodeBlock
                el              : $new_el
                source          : source

    $('.AMElement').each (i, el) ->
        $el = $(el)
        config_str = $el.data('config')
        embed_flag = $el.data('embed')

        element_classes = [
            ChartElement
            SwitchElement
            RangeElement
            StringElement
        ]

        element_class = _.find element_classes, (cls) ->
            return cls.config_pattern.test(config_str) and cls.is_embed is embed_flag

        if element_class?
            element_class.make($el, config_str)
            var_name = config_str.match(/[^:]*/)[0]
            i = list_of_unused_vars.indexOf var_name
            if (i > -1)
                list_of_unused_vars.splice i, 1
        else
            #console.error 'Unable to make element for', $el
            #if options.debug
                $el.addClass('error')
                $el.append """
                        <span class="error-feedback">
                            Unable to make element:<br><span class="config-string">{#{ config_str }}</span>
                        </span>
                    """
        for v in list_of_unused_vars
            delete window.executor._variables[v]

    window.executor._deferredExecute()


# Add section links to each heading, updating the ids with a counter if
# necessary to ensure each one is unique.
# TODO make anchor id's and update href attr instead prepend
# ActiveMarkdown.makeHeadingSectionLinks = () ->
#     heading_counts = {}
#     $('h1, h2, h3, h4, h5, h6').each (i, el) ->
#         $el = $(el)
#         console.log $el
#         id = _s.slugify(_s.words(el.innerText).join('-'))
#         heading_counts[id] ?= 0
#         heading_counts[id] += 1

#         if heading_counts[id] > 1
#             id = "#{id}-#{heading_counts[id]}"

#         el.id = id
#         $el.prepend """
#             <a class="section-link" href="##{id}">#</a>
#         """

exportActiveMarkdown = () ->
    window.executor = new Executor()
    window.ActiveMarkdown = ActiveMarkdown

module.exports = exportActiveMarkdown
