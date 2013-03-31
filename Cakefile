
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
- Underscore.string             MIT License     http://epeli.github.com/underscore.string/
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
            'elements/NumberElement.coffee'
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
    console.log file_list
    sources = file_list.map (file) ->
        contents = readSourceFile(file)
        return contents
    return sources.join(separator)


# Minify but don't mangle - NamedView doesn't work.
# TODO: Make it possible to mangle the code.
minifyJS = (js_script_code) ->
    toplevel_ast = UglifyJS.parse(js_script_code)
    toplevel_ast.figure_out_scope()

    compressor = UglifyJS.Compressor()
    compressed_ast = toplevel_ast.transform(compressor)

    min_code = compressed_ast.print_to_string()
    return min_code



# task 'updatepages', 'Update the gh-pages branch', (options) ->



task 'build', 'Compile all the things', (options) ->

    if not fs.existsSync(LIB_PATH)
        fs.mkdirSync(LIB_PATH)

    # Build the minified versions
    [ style_name , style_code ] = compileViewerStyles(true)
    fs.writeFile path.join(LIB_PATH, style_name), style_code,
        encoding: 'utf-8'

    # Build the minified versions
    [ script_name , script_code ] = compileViewerScripts(true)
    fs.writeFile path.join(LIB_PATH, script_name), script_code,
        encoding: 'utf-8'

    # Unminified
    [ style_name , style_code ] = compileViewerStyles(false)
    fs.writeFile path.join(LIB_PATH, style_name), style_code,
        encoding: 'utf-8'

    # Unminified
    [ script_name , script_code ] = compileViewerScripts(false)
    fs.writeFile path.join(LIB_PATH, script_name), script_code,
        encoding: 'utf-8'

    [ markup_name , markup_code ] = compileViewerTemplate()
    fs.writeFile path.join(LIB_PATH, markup_name), markup_code,
        encoding: 'utf-8'

    [ command_name , command_code ] = compileCommand()
    fs.writeFile path.join(LIB_PATH, command_name), command_code,
        encoding: 'utf-8'

    input = path.join(SOURCE_PATH, 'sample.md')
    output = path.join(LIB_PATH, 'sample.md')
    fs.copy(input, output)




compileCommand = ->
    command_source_path = path.join(SOURCE_PATH, 'activemd.coffee')
    command_source = fs.readFileSync(command_source_path, 'utf-8').toString()
    command_js = CoffeeScript.compile(command_source)
    return ['activemd.js', command_js]


compileViewerStyles = (minify=false) ->
    css_style_code = concatenateFiles(viewer_files.lib_styles)
    styl_style_code = concatenateFiles(viewer_files.styles)
    # Not actually async, just bonkers.
    Stylus.render styl_style_code, (err, css) ->
        css_style_code += '\n' + css

    if minify
        css_full_length = css_style_code.length
        css_style_code = Sqwish.minify(css_style_code, true)
        css_min_length = css_style_code.length
        console.log 'css:', css_full_length, '->', css_min_length, css_min_length / css_full_length
        style_file_name     = 'activemarkdown-min.css'
    else
        
        style_file_name     = 'activemarkdown.css'

    css_style_code = viewer_files.style_header + css_style_code
    return [style_file_name, css_style_code]


compileViewerScripts = (minify=false) ->
    js_script_code = concatenateFiles(viewer_files.lib_scripts, ';\n')
    coffee_script_code = concatenateFiles(viewer_files.scripts)
    js_script_code += '\n' + CoffeeScript.compile(coffee_script_code,)

    if minify
        js_full_length = js_script_code.length
        js_script_code = minifyJS(js_script_code)
        js_min_length = js_script_code.length
        console.log 'js:', js_full_length, '->', js_min_length, js_min_length / js_full_length
        script_file_name    = 'activemarkdown-min.js'
    else
        script_file_name    = 'activemarkdown.js'

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


