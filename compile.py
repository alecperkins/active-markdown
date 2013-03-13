import re, markdown, json






head = """
    <style>
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
        }
        body {
            max-width: 660px;
            margin: 0 auto;
            padding: 1em;
        }
        p, blockquote {
            line-height: 1.5;
        }
        .Variable {
            border: 3px solid blue;
            padding: 0.1em;
        }
        .Variable .variable-label {
            font-size: 0.8em;
            background-color: yellow;
            border: 1px dotted #ccc;
            font-family: Menlo;
        }
        .Variable.readonly {
            border-color: rgba(0,0,255,0.4);
        }
        .NumberVar input {
            cursor: pointer;
        }
        .BinaryVar label, .BinaryVar input {
            cursor: pointer;
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
    </style>
    <button id="toggle-raw">raw</button>
    <div id="raw">%s</div>
"""

tail = """
    <script src="https://cdnjs.cloudflare.com/ajax/libs/zepto/1.0/zepto.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.string/2.3.0/underscore.string.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.10/backbone-min.js"></script>
    <script src="https://raw.github.com/alecperkins/Backbone.NamedView/master/backbone.namedview.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/coffee-script/1.4.0/coffee-script.min.js"></script>
    <script src="script.js"></script>
"""

def doReplace(matchobj):
    graph_flag      = matchobj.group(1)
    text_content    = matchobj.group(2)
    script_config   = matchobj.group(3).split(' ')

    var_name = script_config.pop(0)

    print graph_flag, text_content, var_name, script_config 

    if graph_flag == '`':
        wrap_tag = 'code'
    elif graph_flag == '*':
        wrap_tag = 'em'
    else:
        if graph_flag == '!':
            graph_flag = 'data-graph="true"'
        else:
            graph_flag = ''
        wrap_tag = None

    result = """<span class="live-text" {graph} data-name="{name}" data-config='{config}'>{text_content}</span>""".format(
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





PATTERN = '([!`*]?)\[([\w\d\s]*)]{(.*)}([`*]?)'


source = file('source2.livemd').read()

result = re.sub(PATTERN, doReplace, source)

file('intermediary.md', 'w').write(result)

result = markdown.markdown(result)

result = head % (source,) + result + tail

file('output.html','w').write(result)