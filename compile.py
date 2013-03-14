import re, json, codecs
import markdown




style = u"""
        blockquote {
            border-left: 3px solid #ccc;
            font-style: italic;
            padding-left: 1em;
            margin-left: 0;
        }
        pre {
            color: #444;
            background: #fbfbfb;
            padding: 1em;
            border: 1px solid #ccc;
            max-height: 200px;
            overflow: scroll;
        }
        body {
            max-width: 660px;
            margin: 0 auto;
            padding: 2em 1em;
            font-family: Georgia;
            background: #fdfdfd;
            color: #0e0e0e;
        }
        p, blockquote {
            line-height: 1.5;
        }
        hr {
            border: 0;
            border-bottom: 1px solid #ccc;
            margin-top: 1.5em;
            margin-bottom: 1.5em;
        }
        .Variable {
            border: 1px solid rgba(0,0,255,0.8);
            padding: 0.1em;
            position: relative;
            border-radius: 3px;
        }
        .Variable .variable-label {
            font-size: 0.8em;
            background-color: yellow;
            border: 1px dotted #ccc;
            font-family: Menlo, Courier New, monospace;
        }
        .Variable .variable-label:before {
            content: "@";
        }
        .Variable.readonly {
            border-color: rgba(0,0,255,0.2);
        }
        .NumberVar .slider {
            width: 200px;
            position: absolute;
            bottom: 100%;
            left: -25px;
            display: none;
        }
        .NumberVar:hover .slider {
            display: block;
        }
        .BinaryVar label, .BinaryVar input {
            cursor: pointer;
        }
        .GraphView {
            margin: 1em 0;
        }
        .GraphView .graph-title {
            text-align: center;
            font-weight: bold;
        }
        .GraphView .graph-canvas {
            width: 100%;
        }

        #raw {
            font-family: Menlo;
            white-space: pre;
            border-bottom: 1px solid #ccc;
            max-height: 0;
            overflow: hidden;
            -webkit-transition-property: max-height;
            -webkit-transition-duration: 0.5s;
        }
        #raw.visible {
            max-height: 10000px;
        }
"""

template = u"""
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <style>
        {STYLE}
    </style>
</head>
<body>
    <div id="content">{CONTENT}</div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.10.0/jquery-ui.min.js"></script>
    <link href="http://code.jquery.com/ui/1.10.0/themes/base/jquery-ui.css" rel="stylesheet" type="text/css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.string/2.3.0/underscore.string.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.10/backbone-min.js"></script>
    <script src="https://raw.github.com/alecperkins/Backbone.NamedView/master/backbone.namedview.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.4.0/coffee-script.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/flot/0.7/jquery.flot.min.js"></script>
    <script src="script.js"></script>
</body>
</html>
"""

def doReplace(matchobj):
    graph_flag      = matchobj.group(1)
    text_content    = matchobj.group(2)
    script_config   = matchobj.group(3).split(' ')

    var_name = script_config.pop(0)

    print graph_flag, text_content, var_name, script_config 

    if graph_flag == '*':
        wrap_tag = 'em'
    else:
        if graph_flag == '!':
            graph_flag = 'data-graph="true"'
        else:
            graph_flag = ''
        wrap_tag = None

    result = """ <span class="live-text" {graph} data-name="{name}" data-config='{config}'>{text_content}</span>""".format(
            text_content    = text_content,
            name            = var_name,
            config          = json.dumps(script_config),
            graph           = graph_flag,
        )

    if wrap_tag:
        result = "<{wrap_tag}>{result}</{wrap_tag}>".format(
                result=result,
                wrap_tag=wrap_tag,
            )
    return result





PATTERN = '([!*]?[^`])\[([$%\.\w\d\s]*)]{([\w\d=\.,\[\] ]+)}([*]?)'


source = codecs.open('demo.amd','r','utf-8').read()

result = re.sub(PATTERN, doReplace, source)
result = markdown.markdown(result)

result = template.format(
        STYLE   = style,
        # RAW     = source,
        CONTENT = result,
    )

codecs.open('output.html', 'w', 'utf-8').write(result)