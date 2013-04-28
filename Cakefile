fs              = require 'fs-extra'
path            = require 'path'
sys             = require 'sys'

browserify      = require 'browserify'
CoffeeScript    = require 'coffee-script'
Sqwish          = require 'sqwish'
Stylus          = require 'stylus'
UglifyJS        = require 'uglify-js'



PROJECT_ROOT    = path.dirname(fs.realpathSync(__filename))
LIB_PATH        = path.join(PROJECT_ROOT, 'lib')
SOURCE_PATH     = path.join(PROJECT_ROOT, 'source')
BUILD_TMP_PATH  = path.join(PROJECT_ROOT, 'build_tmp')

{ VERSION }     = require './source/ActiveMarkdown'




if not fs.existsSync(LIB_PATH)
    fs.mkdirSync(LIB_PATH)



buildAll = (options, run_tests=true, cb=->) ->
    _doBuild = ->
        buildCommand(options, false)
        buildScripts options, false, ->
            buildStyles(options, false)
            # Toggle minify (instead of just set true or false, in case build
            # is being run repeatedly.)
            options.minify = not options.minify
            buildScripts options, false, ->
                buildStyles(options, false)
                cb()

    if options.firstrun
        options.firstrun = false
        # Need to prime the asset packs so the tests can run.
        buildAll options, false, ->
            buildAll(options, true)
    else if run_tests
        runTests (failures) ->
            if failures isnt 0
                process.exit(failures)
            _doBuild()
    else
        _doBuild()



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


buildCommand = (options, verbose=true) ->
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

        sys.puts('Compiling: ' + f) if verbose


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



buildScripts = ({ minify }, verbose=true, cb=->) ->

    fs.removeSync(BUILD_TMP_PATH)
    fs.mkdirSync(BUILD_TMP_PATH)
    fs.mkdirSync(path.join(BUILD_TMP_PATH, 'elements'))
    fs.mkdirSync(path.join(BUILD_TMP_PATH, 'libraries'))
    fs.mkdirSync(path.join(BUILD_TMP_PATH, 'misc'))

    script_sources = [
        'ActiveMarkdown'
        'browser'
        'Controls'
        'DragManager'
        'Executor'
        'helpers'
        'parser'
        'elements/ActiveCodeBlock'
        'elements/BaseElement'
        'elements/ChartElement'
        'elements/RangeElement'
        'elements/StringElement'
        'elements/SwitchElement'
        'libraries/NamedView'
        'misc/template'
    ]

    script_sources.forEach (f) ->
        input_path = path.join(SOURCE_PATH, f + '.coffee')
        output_path = path.join(BUILD_TMP_PATH, f + '.js')

        sys.puts('Compiling: ' + f) if verbose

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
            'node_modules/codemirror/mode/coffeescript/coffeescript.js'
            'node_modules/d3/d3.js'

            # TODO: Pull this down externally?
            # https://raw.github.com/jashkenas/coffee-script/1.6.2/extras/coffee-script.js
            'source/libraries/coffeescript-1.6.2-min.js'
            'source/libraries/vega-1.2.0-min.js'
        ]

        pack = additional_scripts.map (f) ->
            sys.puts('Packing additional: ' + f) if verbose
            return fs.readFileSync(path.join(PROJECT_ROOT, f), 'utf-8')
        pack.push(src)

        pack_str = pack.join(';')

        if minify
            sys.puts('Minifying...') if verbose
            orig_length = pack_str.length
            pack_str = _minifyJS(pack_str)
            percent = (pack_str.length / orig_length * 100).toFixed(0)
            sys.puts("Minified: #{ orig_length } -> #{ pack_str.length } (#{ percent }%)") if verbose


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
            - D3                            MIT License     http://d3js.org/
            - Vega                          MIT License     http://trifacta.github.io/vega/
            - Active Markdown               Unlicensed      http://activemarkdown.org
            */\n
        """

        pack_str = header + pack_str

        fs.writeFileSync(path.join(LIB_PATH, pack_file_name), pack_str, 'utf-8')
        fs.removeSync(BUILD_TMP_PATH)
        sys.puts '>>> ' + LIB_PATH.replace(PROJECT_ROOT, '').substring(1) + '/' + pack_file_name

        cb()



_minifyJS = (js_script_code) ->
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



buildStyles = ({ minify }, verbose=true) ->
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
            'source/libraries/solarized.css'
        ]

    pack = lib_styles.map (f) ->
        sys.puts('Packing: ' + f) if verbose
        return fs.readFileSync(path.join(PROJECT_ROOT, f), 'utf-8')

    sys.puts('Compiling: misc/style.styl') if verbose
    styl_input = fs.readFileSync(path.join(SOURCE_PATH, 'misc', 'style.styl')).toString()

    # Not actually async, just bonkers.
    Stylus.render styl_input, (err, css) ->
        pack.push(css)

    pack_str = pack.join('')


    if minify
        sys.puts('Minifying...') if verbose
        orig_length = pack_str.length
        pack_str = Sqwish.minify(pack_str)
        percent = (pack_str.length / orig_length * 100).toFixed(0)
        sys.puts("Minified: #{ orig_length } -> #{ pack_str.length } (#{ percent }%)") if verbose


    if minify
        pack_file_name = "activemarkdown-#{ VERSION }-min.css"
    else
        pack_file_name = "activemarkdown-#{ VERSION }.css"

    pack_str = header + pack_str

    fs.writeFileSync(path.join(LIB_PATH, pack_file_name), pack_str, 'utf-8')
    sys.puts '>>> ' + LIB_PATH.replace(PROJECT_ROOT, '').substring(1) + '/' + pack_file_name



_renderReadme = (version) ->
    _ = require 'underscore'
    _.templateSettings =
      interpolate : /\{\{(.+?)\}\}/g
      evaluate : /\{\%(.+?)\%\}/g

    readme_source = fs.readFileSync('source/misc/README.md._', 'utf-8').toString()

    now = new Date()
    readme_content = _.template readme_source,
        now: "#{ now.getFullYear() }-#{ now.getMonth() + 1 }-#{ now.getDate() }"
        VERSION: version
    fs.writeFileSync('README.md', readme_content, 'utf-8')



cutRelease = (options) ->
    AM = require './source/ActiveMarkdown'
    package_json = JSON.parse(fs.readFileSync('package.json', 'utf-8'))
    if AM.VERSION is package_json.version
        sys.puts('!!! Module and package.json version match. Update the version in ActiveMarkdown.coffee appropriately. !!!')
        process.exit(1)

    sys.puts 'Building everything from orbit, just to be sure...'

    fs.removeSync(LIB_PATH)
    fs.removeSync(BUILD_TMP_PATH)
    fs.mkdirSync(LIB_PATH)

    # Run buildAll twice, once without tests to ensure the lib files necessary
    # for the test are generated, then again with the pre-build tests.
    sys.puts '\nBuilding once...'
    buildAll options, false, ->
        sys.puts '\nBuilding twice (but with tests)...'
        buildAll options, true, ->
            sys.puts "\nPreparing ActiveMarkdown package v#{ AM.VERSION }..."
            sys.puts "   * Updating package.json version from #{ package_json.version } to #{ AM.VERSION } "
            package_json.version = AM.VERSION

            # save package.json

            sys.puts "   * Rendering README.md"
            _renderReadme(AM.VERSION)

            sys.puts "\n\nv#{ AM.VERSION } ready for liftoff.\n\n  $ npm publish\n\n"



option '-m', '--minify', 'Minify output, if applicable'
option '', '--firstrun', 'Build without tests (prime asset packs), then build normally'
task 'build', 'Run tests and build everything', buildAll
task 'build:command', 'Compile command-line script', buildCommand
task 'build:scripts', 'Compile viewer scripts', buildScripts
task 'build:styles', 'Compile viewer styles', buildStyles
task 'cutrelease', 'Do necessary updates for a release', cutRelease
