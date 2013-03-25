fs          = require 'fs-extra'
path        = require 'path'
Showdown    = require 'showdown'
sys         = require 'sys'


CWD = process.cwd()
LIB_PATH = path.dirname(fs.realpathSync(__filename))

STYLE_FILE_NAME = 'activemarkdown-min.css'
SCRIPT_FILE_NAME = 'activemarkdown-min.js'

assembleViewer = (opts) ->
    { input_file_name, inline, markup, local} = opts



    if inline
        styles  = readLibFile(STYLE_FILE_NAME)
        scripts = readLibFile(SCRIPT_FILE_NAME)
        styles  = "<style>#{ styles }</style>"
        scripts = "<script>#{ scripts }</script>"
    else
        prefix = if local then '' else 'http://activemarkdown.org/viewer/'
        styles  = "<link rel='stylesheet' href='#{ prefix + STYLE_FILE_NAME }'>"
        scripts = "<script src='#{ prefix + SCRIPT_FILE_NAME }'></script>"

    compiled_template = readLibFile('template.js')
    template_fn = Function(compiled_template)

    now = (new Date()).toISOString()

    markup_output = """<!--
            This file was generated by Active Markdown - http://activemarkdown.org

            #{input_file_name} - #{now}
            -->\n
        """

    markup_output += template_fn.call
        page_title  : input_file_name
        styles      : styles
        script      : scripts
        markup      : markup

    return markup_output



readLibFile = (name) ->
    return fs.readFileSync(path.join(LIB_PATH, name), 'utf-8').toString()



outputCompiledFile = (input_file_name, markup, cmd_options) ->

    html_output = assembleViewer
        input_file_name     : input_file_name
        inline              : cmd_options.inline
        local               : cmd_options.local
        markup              : markup

    if process.stdout.isTTY
        path_components = input_file_name.split('.')
        path_components.pop()
        path_components.push('html')
        output_file_path = path_components.join('.')
        output_file_path = path.join(CWD, output_file_path)
        fs.writeFile(output_file_path, html_output, 'utf-8')
        if cmd_options.local
            output_folder   = path.dirname(output_file_path)
            style_source    = path.join(LIB_PATH, STYLE_FILE_NAME)
            script_source   = path.join(LIB_PATH, SCRIPT_FILE_NAME)
            style_output    = path.join(output_folder, STYLE_FILE_NAME)
            script_output   = path.join(output_folder, SCRIPT_FILE_NAME)
            if style_source isnt style_output
                fs.copy style_source, style_output, (err) ->
                    console.log err
            if script_source isnt script_output
                fs.copy script_source, script_output, (err) ->
                    console.log err

    else
        process.stdout.write(html_output)



processMarkdown = (markdown_source) ->
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

        span = """ <span class="AMDElement" #{graph_flag} data-config="#{script_config}">#{text_content}</span>"""

        return span

    converter = new Showdown.converter()
    markup = converter.makeHtml(pure_markdown)
    return markup



doCompileFile = (options, args) ->

    if process.stdin.isTTY
        input_file_name = args[0]
        source_file = path.join(CWD, input_file_name)
        markdown_source = fs.readFileSync(source_file, 'utf-8')
        markup = processMarkdown(markdown_source)
        outputCompiledFile(input_file_name, markup, options)
    else
        process.stdin.resume()
        process.stdin.setEncoding('utf8')

        markdown_source = ''
        process.stdin.on 'data', (chunk) ->
            markdown_source += chunk

        process.stdin.on 'end', ->
            markup = processMarkdown(markdown_source)
            outputCompiledFile('stdin', markup, options)



doGenerateSample = ->
    sample_content = readLibFile('sample.md')

    if process.stdout.isTTY
        output_file_path = path.join(CWD, 'sample.md')
        if fs.existsSync(output_file_path)
            sys.puts('sample.md already exists')
            process.exit(1)
        sys.puts('Generating sample.md')
        fs.writeFile(output_file_path, sample_content, 'utf-8')
    else
        process.stdout.write(sample_content)



exports.run = (args, options) ->
    if options.sample
        doGenerateSample()
    else
        doCompileFile(options, args)


