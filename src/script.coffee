
_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g


makeActive = (i, el) ->
    $el = $(el)
    config_str = $el.data('config')
    console.log ''
    console.log config_str

    matchers =
        string  : /(^[\w\d_]+$)/
        number  : /([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)/
        boolean : /([\w\d]+) ([\w]+) or ([\w]+)/
        choice  : /([\w\d]+) \[([\w,\d ]+)\]/
        graph   : /([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)/
        viz     : /(viz=[\w\d_]+)/

    for type, expr of matchers
        console.log type, expr.test(config_str)


# possible configs:

# String
#     ([\w\d_]+)                                            var_name

# Number
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [10..100] by 10
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [10..100] by 0.1
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [0..]
#     ([\w\d]+) \[([\w\d]*)([\.]*)([\w\d]*)\]([\w \d\.]*)   calories [..]

# Boolean
#     ([\w\d]+) ([\w]+) or ([\w]+)                          some_flag true or false
#     ([\w\d]+) ([\w]+) or ([\w]+)                          some_flag on or off

# Choice
#     ([\w\d]+) \[([\w,\d ]+)\]                             option_picked [alpha,bravo,charlie,delta,echo]

# Graph
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         graphFn x=[-10..10]
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         scatter=graphFn x=[-10..10]
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         scatter=graphFn x=[-10..10]
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         line=Math.sin x=[-2pi..2pi] by 0.25pi
#     ([=\.\,\w\d]+) x=\[([-\d\.\w]+)\]([\w \d\.]*)         bar=graphFn,line=otherFn x=[-10..10]

# Viz
#     (viz=[\w\d_=]+)                                           viz=hookToProcessing




$('.AMDElement').each(makeActive)
