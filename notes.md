
http://worrydream.com/Tangle/
http://www.wolfram.com/cdf/uses-examples/
http://dry.ly/2011/02/21/coffeescript--processingjs--crazy-delicious/

https://help.github.com/articles/github-flavored-markdown
https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet#wiki-tables
https://github.com/dcurtis/markdown-mark

in code, functions are run within their own scope
use @ to access the context


livemd --include-libs   Pack libs into output file, so no external files are required.


code editors: auto suggest/complete variable names
code mirror?


[5]{some_number [0...10]}                           = <input type="range">
[5]{some_number [0...inf]}                          = <input type="range">          ? - flexible, auto updates min/max

[lorem]{text_value}                                 = <input type="text">

[foo]{test_result foo or bar}                       = <input type="radio">

[3]{users_choice [1,2,3,4,5]}                       = <select>

[beta]{users_choice [alpha,beta,gamma,delta,4,2]}   = <select>

![title of graph]{graphFn x=[-10...10]}             = <canvas>


Lists:
- [ ]{var_name} Foo bar                             = <li><input type="checkbox"></li>
- [x]{var_name} Foo bar



| [Tables]{col1}| [Are]{col2}   | [Cool]{col3}|
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |


[Table title]{matrix_variable}
| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

@matrix_variable = [
    [col_0, col_1, col_2]       # row 0
    [col_0, col_1, col_2]       # row 1
    [col_0, col_1, col_2]       # row 2
]

-- or just define datasets in code blocks? and embed table like a graph ![Table title]{matrix_variable cols=Column,Headers}
-- max-height on codeblocks to prevent dataset from overwhelming page


helper functions for formatting currency, time, percents, etc
hooks into processing.js, d3.js, flot.js

gear icon for changing configuration of variables inline
but why would I do that when there's this little window into the code right here?

live md logo - 
"active md"?

activemd.org
activemarkdown.org
.amd extension