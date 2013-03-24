# build
# build -m --minify
# build -w --watch
# build -p --pages

###
Compile style to:

    activemarkdown.org/viewer/activemarkdown-0.1.0-min.css

and script to:

    activemarkdown.org/viewer/activemarkdown-0.1.0-min.js

write activemarkdown.org to ./CNAME
###


fs              = require 'fs'
sys             = require 'sys'
walk            = require 'walk'

CoffeeScript    = require 'coffee-script'
Jade            = require 'jade'
Sqwish          = require 'sqwish'
Stylus          = require 'stylus'
UglifyJS        = require 'uglify-js'

# compileScriptFile = (from, to) ->
#     sys.puts("Compiling script: #{ from }")
#     script_source = fs.readFileSync(from)
#     compiled = CoffeeScript.compile(script_source.toString())
#     fs.writeFileSync(to.replace('.coffee', '.js'), compiled)









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
            'libs/zepto-1.0.js'
            'libs/underscore-1.4.4.js'
            'libs/underscore.string-2.3.0.js'
            'libs/backbone-1.0.0.js'
            'libs/backbone.namedview.js'
            'libs/codemirror-2.36.0/codemirror.js'
            'libs/codemirror-2.36.0/coffeescript.js'
            'libs/coffeescript-1.6.2.js'
        ]

    lib_styles: [
            'libs/codemirror-2.36.0/codemirror.css'
            'libs/codemirror-2.36.0/solarized.css'
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



concatenateFiles = (file_list, separator='\n') ->
    console.log file_list
    sources = file_list.map (file) ->
        contents = fs.readFileSync('viewer_src/' + file, 'utf-8').toString()
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



option '-m', '--minify', 'Minify JavaScript and CSS'

task 'build', 'Compile all the things', (options) ->
    js_script_code = concatenateFiles(viewer_files.lib_scripts, ';\n')
    coffee_script_code = concatenateFiles(viewer_files.scripts)
    js_script_code += '\n' + CoffeeScript.compile(coffee_script_code,)

    css_style_code = concatenateFiles(viewer_files.lib_styles)
    styl_style_code = concatenateFiles(viewer_files.styles)
    # Not actually async, just bonkers.
    Stylus.render styl_style_code, (err, css) ->
        css_style_code += '\n' + css

    if options.minify

        css_full_length = css_style_code.length
        css_style_code = Sqwish.minify(css_style_code, true)
        css_min_length = css_style_code.length
        console.log 'css:', css_full_length, '->', css_min_length, css_min_length / css_full_length

        js_full_length = js_script_code.length
        js_script_code = minifyJS(js_script_code)
        js_min_length = js_script_code.length
        console.log 'js:', js_full_length, '->', js_min_length, js_min_length / js_full_length

        script_file_name    = 'viewer/activemarkdown-min.js'
        style_file_name     = 'viewer/activemarkdown-min.css'

    js_script_code = viewer_files.script_header + js_script_code
    css_style_code = viewer_files.style_header + css_style_code

    fs.writeFileSync('viewer/style.css', css_style_code, 'utf-8')
    fs.writeFileSync('viewer/script.js', js_script_code, 'utf-8')



