Showdown    = require 'showdown'

github_ext = require 'showdown/src/extensions/github'
table_ext = require 'showdown/src/extensions/table'

parseMarkdown = (markdown_source) ->
    AMD_PATTERN = /(`?)(!?)\[([$%-\.\w\d\s]*)]{([-\w\d=\.\:,\[\] ]+)}/g
    pure_markdown = markdown_source.replace AMD_PATTERN, (args...) ->
        [
            code_flag
            graph_flag
            text_content
            script_config
        ] = args[1..4]

        if code_flag
            return "`#{ graph_flag }[#{ text_content }]{#{ script_config }}"

        if graph_flag is '!'
            graph_flag = 'data-graph="true"'
        else
            graph_flag = ''

        span = """ <span class="AMElement" #{graph_flag} data-config="#{script_config}">#{text_content}</span>"""

        return span

    converter = new Showdown.converter
        extensions: [github_ext, table_ext]
    markup = converter.makeHtml(pure_markdown)
    return markup


module.exports = parseMarkdown