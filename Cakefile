fs              = require 'fs-extra'
path            = require 'path'
sys             = require 'sys'
walk            = require 'walk'

browserify      = require 'browserify'
CoffeeScript    = require 'coffee-script'
Jade            = require 'jade'
Sqwish          = require 'sqwish'
Stylus          = require 'stylus'
UglifyJS        = require 'uglify-js'



PROJECT_ROOT    = path.dirname(fs.realpathSync(__filename))
LIB_PATH        = path.join(PROJECT_ROOT, 'lib')
SOURCE_PATH     = path.join(PROJECT_ROOT, 'source')

{ VERSION }     = require './source/ActiveMarkdown'









if not fs.existsSync(LIB_PATH)
    fs.mkdirSync(LIB_PATH)


option '-m', '--minify', 'Minify output, if applicable'





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
        fs.removeSync(TEST_TMP_PATH)
        cb(args...)


task 'build:command', 'Compile command-line script', (options) ->

    LIB_MISC_PATH = path.join(LIB_PATH, 'misc')
    if not fs.existsSync(LIB_MISC_PATH)
        fs.mkdirSync(LIB_MISC_PATH)

    source_manifest = [
        'ActiveMarkdown'
        'parser'
        'helpers'
        'command'
        'misc/template'
    ]
    misc_manifest = [
        'am_sample.md'
    ]

    source_manifest.forEach (f) ->
        input_path = path.join(SOURCE_PATH, f + '.coffee')
        output_path = path.join(LIB_PATH, f + '.js')

        sys.puts 'Compiling: ' + f


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


task 'build:scripts', 'Compile viewer scripts', ({ minify }) ->

    BUILD_TMP_PATH = path.join(PROJECT_ROOT, 'build_tmp')
    if not fs.existsSync(BUILD_TMP_PATH)
        fs.mkdirSync(BUILD_TMP_PATH)
    if not fs.existsSync(path.join(BUILD_TMP_PATH, 'elements'))
        fs.mkdirSync(path.join(BUILD_TMP_PATH, 'elements'))
    if not fs.existsSync(path.join(BUILD_TMP_PATH, 'misc'))
        fs.mkdirSync(path.join(BUILD_TMP_PATH, 'misc'))

    script_sources = [
        'ActiveMarkdown'
        'browser'
        'DragManager'
        'Executor'
        'helpers'
        'parser'
        'elements/ActiveCodeBlock'
        'elements/BaseElement'
        'elements/RangeElement'
        'elements/StringElement'
        'elements/SwitchElement'
        'misc/template'
    ]

    script_sources.forEach (f) ->
        input_path = path.join(SOURCE_PATH, f + '.coffee')
        output_path = path.join(BUILD_TMP_PATH, f + '.js')

        sys.puts 'Compiling: ' + f

        coffee_input = fs.readFileSync(input_path, 'utf-8').toString()
        js_output = CoffeeScript.compile(coffee_input)

        fs.writeFileSync(output_path, js_output, 'utf-8')

    b = browserify(files=path.join(BUILD_TMP_PATH, 'browser.js'))

    b.bundle {}, (err, src) ->
        throw err if err

        # Pack additional scripts. These don't handle require + browserify well
        # or at all, so add them in using normal concatenation. Most will be
        # drawn from the devDependecies installations, but the coffee-script
        # module doesn't include the browser-ready version, so we have to
        # include that in our repo :(.

        additional_scripts = [
            'node_modules/zepto/src/zepto.js'
            'node_modules/zepto/src/ajax.js'
            'node_modules/zepto/src/data.js'
            'node_modules/zepto/src/detect.js'
            'node_modules/zepto/src/event.js'
            'node_modules/codemirror/lib/codemirror.js'

            # TODO: Pull this down externally?
            # https://raw.github.com/jashkenas/coffee-script/1.6.2/extras/coffee-script.js
            'source/libraries/coffeescript-1.6.2-min.js'
        ]

        pack = additional_scripts.map (f) ->
            sys.puts 'Packing additional: ' + f
            return fs.readFileSync(path.join(PROJECT_ROOT, f), 'utf-8')
        pack.push(src)

        pack_str = pack.join(';')

        if minify
            sys.puts 'Minifying...'
            orig_length = pack_str.length
            pack_str = minifyJS(pack_str)
            percent = (pack_str.length / orig_length * 100).toFixed(0)
            sys.puts "Minified: #{ orig_length } -> #{ pack_str.length } (#{ percent }%)"


        if minify
            pack_file_name = "activemarkdown-#{ VERSION }-min.js"
        else
            pack_file_name = "activemarkdown-#{ VERSION }.js"
        

        header = """/*
            Active Markdown, v#{ VERSION }, viewer script assets
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
            */\n
        """

        pack_str = header + pack_str

        fs.writeFileSync(path.join(LIB_PATH, pack_file_name), pack_str, 'utf-8')
        fs.removeSync(BUILD_TMP_PATH)
        sys.puts '>>> ' + LIB_PATH.replace(PROJECT_ROOT, '').substring(1) + '/' + pack_file_name

# Minify but don't mangle - NamedView doesn't work.
# TODO: Make it possible to mangle the code.
minifyJS = (js_script_code) ->
    toplevel_ast = UglifyJS.parse(js_script_code)
    toplevel_ast.figure_out_scope()

    compressor = UglifyJS.Compressor
        drop_debugger   : true
        warnings        : false
    compressed_ast = toplevel_ast.transform(compressor)
    compressed_ast.figure_out_scope()
    compressed_ast.mangle_names()

    min_code = compressed_ast.print_to_string()
    return min_code



task 'build:styles', 'Compile viewer styles', ({ minify }) ->

    header = """/*
        Active Markdown viewer style assets
        http://activemarkdown.org

        Includes:
        - CodeMirror                    MIT License     http://codemirror.net/
        - CodeMirror solarized theme    MIT License     http://ethanschoonover.com/solarized
        - Active Markdown               Unlicensed      http://activemarkdown.org
        */\n
    """


    lib_styles = [
            'node_modules/codemirror/lib/codemirror.css'
            'node_modules/codemirror/theme/solarized.css'
        ]

    pack = lib_styles.map (f) ->
        sys.puts 'Packing: ' + f
        return fs.readFileSync(path.join(PROJECT_ROOT, f), 'utf-8')

    sys.puts 'Compiling: misc/style.styl'
    styl_input = fs.readFileSync(path.join(SOURCE_PATH, 'misc', 'style.styl')).toString()

    # Not actually async, just bonkers.
    Stylus.render styl_input, (err, css) ->
        pack.push(css)

    pack_str = pack.join('')


    if minify
        sys.puts 'Minifying...'
        orig_length = pack_str.length
        pack_str = Sqwish.minify(pack_str)
        percent = (pack_str.length / orig_length * 100).toFixed(0)
        sys.puts "Minified: #{ orig_length } -> #{ pack_str.length } (#{ percent }%)"


    if minify
        pack_file_name = "activemarkdown-#{ VERSION }-min.css"
    else
        pack_file_name = "activemarkdown-#{ VERSION }.css"

    pack_str = header + pack_str

    fs.writeFileSync(path.join(LIB_PATH, pack_file_name), pack_str, 'utf-8')
    sys.puts '>>> ' + LIB_PATH.replace(PROJECT_ROOT, '').substring(1) + '/' + pack_file_name
