fs              = require 'fs-extra'
path            = require 'path'
sys             = require 'sys'
walk            = require 'walk'

CoffeeScript    = require 'coffee-script'
Jade            = require 'jade'
Sqwish          = require 'sqwish'
Stylus          = require 'stylus'
UglifyJS        = require 'uglify-js'



PROJECT_ROOT    = path.dirname(fs.realpathSync(__filename))
LIB_PATH        = path.join(PROJECT_ROOT, 'lib')
SOURCE_PATH     = path.join(PROJECT_ROOT, 'source')



viewer_files =
    script_header: """/*
Active Markdown viewer script assets
http://activemarkdown.org

Includes:
- Zepto                         MIT License     http://zeptojs.com/
- Underscore                    MIT License     http://underscorejs.org/
- Underscore.string             MIT License     http://epeli.github.io/underscore.string/
- Backbone                      MIT License     http://backbonejs.org/
- Backbone.NamedView            Unlicensed      https://github.com/alecperkins/backbone.namedview
- CodeMirror                    MIT License     http://codemirror.net/
- CodeMirror CoffeeScript mode  MIT License     https://github.com/pickhardt/coffeescript-codemirror-mode
- CoffeeScript                  MIT License     http://coffeescript.org
- Active Markdown               Unlicensed      http://activemarkdown.org
*/\n"""

    style_header: """/*
Active Markdown viewer style assets
http://activemarkdown.org

Includes:
- CodeMirror                    MIT License     http://codemirror.net/
- CodeMirror solarized theme    MIT License     http://ethanschoonover.com/solarized
- Active Markdown               Unlicensed      http://activemarkdown.org
*/\n"""

    lib_scripts: [
            'libraries/zepto-1.0.js'
            'libraries/underscore-1.4.4.js'
            'libraries/underscore.string-2.3.0.js'
            'libraries/backbone-1.0.0.js'
            'libraries/backbone.namedview.js'
            'libraries/codemirror-2.36.0/codemirror.js'
            'libraries/codemirror-2.36.0/coffeescript.js'
            'libraries/coffeescript-1.6.2.js'
        ]

    lib_styles: [
            'libraries/codemirror-2.36.0/codemirror.css'
            'libraries/codemirror-2.36.0/solarized.css'
        ]

    scripts: [
            'elements/BaseElement.coffee'
            'elements/CodeBlock.coffee'
            'elements/DragManager.coffee'
            'elements/helpers.coffee'
            'elements/RangeElement.coffee'
            'elements/StringElement.coffee'
            'elements/SwitchElement.coffee'
            'Executor.coffee'
            'App.coffee'
        ]

    styles: [
            'style.styl'
        ]



readSourceFile = (name) ->
    return fs.readFileSync(path.join(SOURCE_PATH, name), 'utf-8').toString()


concatenateFiles = (file_list, separator='\n') ->
    sources = file_list.map (file) ->
        contents = readSourceFile(file)
        return contents
    return sources.join(separator)


# Minify but don't mangle - NamedView doesn't work.
# TODO: Make it possible to mangle the code.
minifyJS = (js_script_code) ->
    toplevel_ast = UglifyJS.parse(js_script_code)
    toplevel_ast.figure_out_scope()

    compressor = UglifyJS.Compressor
        drop_debugger   : true
        warnings        : false
    compressed_ast = toplevel_ast.transform(compressor)

    min_code = compressed_ast.print_to_string()
    return min_code



# task 'updatepages', 'Update the gh-pages branch', (options) ->


if not fs.existsSync(LIB_PATH)
    fs.mkdirSync(LIB_PATH)


option '-m', '--minify', 'Minify output, if applicable'
option '-v', '--verbose', 'Verbose operation'

task 'build', 'Run tests and compile all the things', (options) ->

    sys.puts 'Running tests'
    runTests (failures) ->
        if failures isnt 0
            process.exit(failures)

        sys.puts 'Compiling unminified'
        options.minify = false
        invoke 'build:style'
        invoke 'build:script'


        sys.puts 'Compiling minified'
        options.minify = true
        invoke 'build:style'
        invoke 'build:script'

        sys.puts 'Compiling others'
        invoke 'build:markup'
        invoke 'build:command'
        invoke 'build:sample'

task 'build:style', 'Compile viewer styles', (options) ->
    [ style_name , style_code ] = compileViewerStyles(options.minify)
    fs.writeFile path.join(LIB_PATH, style_name), style_code,
        encoding: 'utf-8'
    , (err) ->
        throw err if err?
        sys.puts("Compiled: #{ style_name }")

task 'build:script', 'Compile viewer scripts', (options) ->
    [ script_name , script_code ] = compileViewerScripts(options.minify)
    fs.writeFile path.join(LIB_PATH, script_name), script_code,
        encoding: 'utf-8'
    , (err) ->
        throw err if err?
        sys.puts("Compiled: #{ script_name }")

task 'build:markup', 'Compile viewer template to template.js', (options) ->
    [ markup_name , markup_code ] = compileViewerTemplate()
    fs.writeFile path.join(LIB_PATH, markup_name), markup_code,
        encoding: 'utf-8'
    , (err) ->
        throw err if err?
        sys.puts("Compiled: #{ markup_name }")

task 'build:command', 'Compile command-line script', (options) ->
    compileCommand(options)

task 'build:sample', 'Copy sample file', (options) ->
    input = path.join(SOURCE_PATH, 'sample.md')
    output = path.join(LIB_PATH, 'sample.md')
    fs.copy input, output, (err) ->
        throw err if err?
        sys.puts("Copied: sample.md")


task 'test', 'Run tests', (options) ->
    runTests (failures) ->
        process.exit(failures)

runTests = (cb) ->
    Mocha = require('mocha')
    mocha = new Mocha()

    TEST_TMP_PATH = path.join(PROJECT_ROOT, 'test_tmp')
    TEST_SRC_PATH = path.join(PROJECT_ROOT, 'test')

    if not fs.existsSync(TEST_TMP_PATH)
        fs.mkdirSync(TEST_TMP_PATH)

    test_sources = fs.readdirSync(path.join(PROJECT_ROOT, 'test'))
    for f in test_sources
        in_path = path.join(TEST_SRC_PATH, f)
        if not fs.statSync(in_path).isDirectory()
            compiled_js = CoffeeScript.compile(fs.readFileSync(in_path, 'utf-8').toString())
            out_path = path.join(TEST_TMP_PATH, f + '.js')
            fs.writeFileSync(out_path, compiled_js)
            mocha.addFile(out_path)

    mocha.run (args...) ->
        fs.removeSync(TEST_TMP_PATH) # fs.remove isn't working?
        cb(args...)


compileCommand = (options) ->

    if not fs.existsSync(LIB_PATH)
        fs.mkdirSync(LIB_PATH)
    LIB_MISC_PATH = path.join(LIB_PATH, 'misc')
    if not fs.existsSync(LIB_MISC_PATH)
        fs.mkdirSync(LIB_MISC_PATH)

    source_manifest = [
        'ActiveMarkdown'
        'parser'
        'helpers'
        'command'
    ]
    misc_manifest = [
        'am_sample.md'
        'template.html._'
    ]

    source_manifest.forEach (f) ->
        input_path = path.join(SOURCE_PATH, f + '.coffee')
        output_path = path.join(LIB_PATH, f + '.js')

        sys.puts('Compiling ' + f) if options.verbose


        coffee_input = fs.readFileSync(input_path, 'utf-8').toString()
        js_output = CoffeeScript.compile(coffee_input)

        if f is 'command'
            js_output = '#!/usr/bin/env node\n\n' + js_output

        fs.writeFileSync(output_path, js_output, 'utf-8')

        if f is 'command'
            fs.chmodSync(output_path, '755')

    misc_manifest.forEach (f) ->
        input_path = path.join(SOURCE_PATH, 'misc', f)
        output_path = path.join(LIB_MISC_PATH, f)
        fs.copy(input_path, output_path)


compileViewerStyles = (minify=false) ->
    css_style_code = concatenateFiles(viewer_files.lib_styles)
    styl_style_code = concatenateFiles(viewer_files.styles)
    # Not actually async, just bonkers.
    Stylus.render styl_style_code, (err, css) ->
        css_style_code += '\n' + css

    if minify
        css_style_code = Sqwish.minify(css_style_code)
        style_file_name = 'activemarkdown-min.css'
    else
        
        style_file_name = 'activemarkdown.css'

    css_style_code = viewer_files.style_header + css_style_code
    return [style_file_name, css_style_code]


compileViewerScripts = (minify=false) ->
    js_script_code = concatenateFiles(viewer_files.lib_scripts, ';\n')
    coffee_script_code = concatenateFiles(viewer_files.scripts)
    js_script_code += '\n' + CoffeeScript.compile(coffee_script_code,)

    if minify
        js_script_code = minifyJS(js_script_code)
        script_file_name = 'activemarkdown-min.js'
    else
        script_file_name = 'activemarkdown.js'

    js_script_code = viewer_files.script_header + js_script_code
    return [script_file_name, js_script_code]


compileViewerTemplate = ->
    compiled_template = readSourceFile('libraries/jaderuntime.js')
    template_source = readSourceFile('template.jade')
    compiled_template += ';' + Jade.compile template_source,
        debug   : false
        client  : true
    compiled_template += ';return anonymous(this);'
    return ['template.js', compiled_template]


