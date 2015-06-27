marked = require 'marked'

parseMarkdown = (markdown_source) ->
    AMD_PATTERN = /(`?)(!?)\[(.*?)]{([-\w\d=\.\:,\[\] ]+)}/g
    pure_markdown = markdown_source.replace AMD_PATTERN, (args...) ->
        [
            code_flag
            embed_flag
            text_content
            script_config
        ] = args[1..4]

        if code_flag
            return "`#{ embed_flag }[#{ text_content }]{#{ script_config }}"

        embed_flag = (embed_flag is '!')

        span = """ <span class="AMElement" data-embed="#{embed_flag}" data-config="#{script_config}">#{text_content}</span>"""

        return span

    return marked(pure_markdown)

module.exports = parseMarkdown