#!/usr/bin/env coffee
###
Command-specific functionality.

###

fs      = require 'fs'
path    = require 'path'
sys     = require 'sys'
AM      = require './ActiveMarkdown'

# Figure out where we are, for reading in the templates and style files.
CWD         = process.cwd()
LIB_PATH    = path.dirname(fs.realpathSync(__filename))




_generateSample = ->
    SAMPLE_FILE_NAME = 'am_sample.md'
    sample_content = fs.readFileSync(path.join(LIB_PATH, 'misc','am_sample.md'))
    return {
        name        : SAMPLE_FILE_NAME
        content     : sample_content
        forceful    : false
    }

_compileFile = (options, input_file_name, input_content) ->

    path_components = input_file_name.split('.')
    path_components.pop()
    if path_components.length is 0
        path_components.push('output')
    path_components.push('html')
    output_file_path = path_components.join('.')
    file_name = input_file_name.split('/').pop()


    if options.inline
        libraries = 'inline'
    else if options.local
        libraries = 'relative'
    else
        libraries = 'reference'

    markup = AM.parse input_content,
        wrap            : true
        input_file_name : file_name
        title           : options.title
        debug           : options.debug
        libraries       : libraries

    return {
        name        : output_file_path
        content     : markup
        forceful    : true
    }



_getInput = (args, cb) ->

    if process.stdin.isTTY
        input_file_name = args[args.length - 1]
        if not input_file_name?
            sys.puts 'A filename must be specified: activmd FILE'
            process.exit(1)

        source_file = path.join(CWD, input_file_name)
        fs.readFile source_file, 'utf-8', (err, markdown_source) ->
            throw err if err?
            cb(input_file_name, markdown_source.toString())
    else
        process.stdin.resume()
        process.stdin.setEncoding('utf8')

        markdown_source = ''
        process.stdin.on 'data', (chunk) ->
            markdown_source += chunk

        process.stdin.on 'end', ->
            cb('stdin', markdown_source)

_emitOutput = ({ name, content, forceful }) ->
    if process.stdout.isTTY
        output_file_path = path.join(CWD, name)
        if not forceful and fs.existsSync(output_file_path)
            sys.puts("#{ name } already exists")
            process.exit(1)
        sys.puts("Writing #{ name }...")
        fs.writeFile output_file_path, content, 'utf-8', (err) ->
            throw err if err?
    else
        process.stdout.write(content)


_copyLibFilesTo = (target_directory) ->
            #         if cmd_options.local
            # output_folder   = path.dirname(output_file_path)
            # style_source    = path.join(LIB_PATH, STYLE_FILE_NAME)
            # script_source   = path.join(LIB_PATH, SCRIPT_FILE_NAME)
            # style_output    = path.join(output_folder, STYLE_FILE_NAME)
            # script_output   = path.join(output_folder, SCRIPT_FILE_NAME)
            # if style_source isnt style_output
            #     fs.copy style_source, style_output, (err) ->
            #         console.log err
            # if script_source isnt script_output
            #     fs.copy script_source, script_output, (err) ->
            #         console.log err

 
cli  = require 'cli'
 
cli.parse
    local   : ['l', 'Create local copies of the asset files']
    debug   : ['',  'Debug mode (unminified files, etc)']
    inline  : ['i', 'Inline asset files into output HTML']
    sample  : ['',  'Generate a sample Active Markdown file']
    title   : ['',  'Specify a title for the page(s)', 'string']

 
cli.main (args, options) ->

    if options.sample
        output_obj = _generateSample()
        _emitOutput(output_obj)
    else
        _getInput args, (input_file_name, input_content) ->
            output_obj = _compileFile(options, input_file_name, input_content)
            _emitOutput(output_obj)

            if options.local
                _copyLibFilesTo(CWD)


