
### String

A read-only output of the current value of the specified variable
`<var_name>`. The text is the default value, though it will be
replaced when the HTML version loads.

`[<default text>]{<var_name>}`

* String

    `[text content]{var_name}`

    [text content]{var_name}



### Numbers

A number adjustable by slider. The number MAY have a display precision
specified. The slider can be set to a minimum and/or maximum, and have a step
value. The text is parsed, and the first number in the text becomes the output
value. The remaining text is added to the template, allowing for units and
other descriptive text to be included in the control.

A range MUST be specified, but MAY be infinite in both directions. The range
is specified using the CoffeeScript-style dots, where `..` is inclusive and
`...` excludes the end. ie, `1..4` is the range `1 <= n <= 4`, while
`1...4` is `1 <= n < 4`. Infinite is expressed by omitting the number, so
`1...` is from 1 to infinity, and `...` is from -infinity to infinity.

Specifying a display precision MAY be done using the default number value in
the text. `200.` formats to `0` decimal places. `200.000` formats to `3`
decimals. If not specified, the value is unformatted.

Numbers MAY use the constants in `Math` and combine them with a coefficient,
eg `2pi` or `0.5pi`, which is treated as `n * Math.PI`. This can be done in
the range min or max, or in the step. The constants MUST be one of `e`, `pi`,
`ln2`, `ln10`, `log2e`, `log10e`, `sqrt1_2`, `sqrt2`, (uppercase or lowercase).

`[* <number>.<decimal*> *]{<var_name>: <min>..<exclusive><max> by <step>}`

The default value MAY contradict any min or max set by the range. However,
upon first interaction, the value will be brought within the range.

* Number, precision of 1, slider step by 10, "#{value.toFixed(0)} calories"

    `[200. calories]{calories: 10..100 by 10}`

    [200. calories]{calories: 10..100 by 10}

* Number, precision of 0.1, slider step by 0.1, not inclusive, "#{value.toFixed(1)} calories"

    `[80.0 calories]{calories: 10...100 by 0.1}`

    [80.0 calories]{calories: 10...100 by 0.1}

* Number, no precision, slider step by 1, no slider max, "#{value} calories"

    `[50 calories]{calories: 0..}`

    [50 calories]{calories: 0..}

* Number, precision of 0.0001, slider step by 0.01, "#{value.toFixed(4)}"

    `[4.0000]{num: pi..2pi by 0.01}`

    [4.0000]{num: pi..2pi by 0.01}

* Number, precision of 0.01, slider step by 1, no min/max, "over $#{value.toFixed(2)} per day"

    `[over $200.00 per day]{payment: ..}`

    [over $200.00 per day]{payment: ..}



### Boolean

A boolean flag that has a value of `true`, `false`, or `undefined`. The true
and false values can be labeled. If the label is present in the text, that
value becomes the default value. Otherwise, the value is `undefined`. and
the text becomes a *control label*.

`[* <true_label or false_label or *> *]{<var_name> <true_label> or <false_label>}`

* Boolean,"#{value}", default = undefined

    `[pick one]{some_flag: true or false}`

    [pick one]{some_flag: true or false}

* Boolean,"before #{value}", default = true

    `[before true]{some_flag: true or false}`

    [before true]{some_flag: true or false}

* Boolean, true label = "on", false label = "off", "#{label} deck"

    `[on deck]{some_flag: on or off}`

    [on deck]{some_flag: on or off}



### Choice

A choice between an arbitrary list of values. The options are specified in a
comma-separated list (in-value spaces permitted). If one of the choices is
found in the text, it is treated as the default value, and the remaining text
becomes a template. Otherwise, the default value is `undefined` and the entire
text becomes a *control label*.

`[* choice *]{<var_name>: <choice 1>,<choice 2>,<choice 3>,...}`

* String select field, "before #{value} after"

    `[before alpha after]{option_picked: alpha,bravo,charlie,delta,echo}`

    [before alpha after]{option_picked: alpha,bravo,charlie,delta,echo}

* String select field, "before #{value} after"

    `[first option]{option_picked: "first option",second,third,"fourth ,-separated option"}`

    [first option]{option_picked: "first option",second,third,"fourth ,-separated option"}


### Graph

Graphs specify one or more functions that are given an `x` value and MUST
return a `y` value. Each function creates a separate series. The graph type
defaults to `scatter`, and is specified after the functions. It MUST be one
of `scatter`, `line`, `bar`. The `x` range MUST be finite.

`![<graph alt text>]{<graph_type>=<graph_function1>,<graph_type>=<graph_function2>,... <x_range>}`

The graph alt text is parsed for a `x vs y` pattern, extracting the labels
for the `x` and `y` axes if present.


* Scatter graph labeled "Graph alt" of graphFn(x) from -10 to 10.
  (scatter is default, but MAY be specified.)

    `![Graph alt]{graphFn: x=-10..10}`

    `![Graph alt]{scatter=graphFn: x=-10..10}`

    ![Graph alt]{scatter=graphFn: x=-10..10}

* Line graph with the x label "x" and the y label "sin(x)" of Math.sin(x) from -2pi to 2pi.

    `![sin(x) vs x]{line=Math.sin: x=-2pi..2i] by 0.25pi}`

    ![sin(x) vs x]{line=Math.sin: x=-2pi..2i] by 0.25pi}

* Scatter graph labeled "Graph alt text" of graphFn(x) and otherFn(x) from -10 to 10.
  Multiple series (each series as a function in a comma-separated list).

    `![Graph Title]{bar=graphFn,line=otherFn: x=-10..10}`

    ![Graph alt text]{bar=graphFn,line=otherFn: x=-10..10}

### Visualization

* Create a blank `<canvas>` and give it to a function for drawing. This requires
  the in-page code to do more work, but allows for free-form vizualizations
  using helpers for things like `processing.js`.

    `![Visualization title]{viz=hookToProcessing}`

    ![Visualization title]{viz=hookToProcessing}



## Code

### Active CoffeeScript

By default, code blocks are assumed to be CoffeeScript that is to be executed
when the page is rendered. The code MUST be CoffeeScript. Variable values are
accessible via the top-level `this` scope, or using the `getVar` and `setVar`
helpers.

Inline code, and code that has a language specified, is treated as regular
code and not considered part of the executable code, even if it is valid
CoffeeScript. Likewise, inline code around Active Markdown notation is
rendered as raw code, instead of AMD controls.

```coffeescript

    # This code is just treated as a static code block, and not executed
    # as Active Markdown logic.
    someFn = ->
        return false

```

### Async helpers

The state is updated after the immediate execution of the code in the active
code blocks. However, anything that is asynchronous, like an AJAX request,
will happen *after* the outputs have been updated. This means regular 
assignment will not be reflected in the output variables. These helpers allow
for setting and updating the output via async code.

* `refresh()` - tell all variables to rerender using the latest values
  (does not recompile or execute the code).

* `setValue('var_name', value)` - set a variable explicitly, equivalent to

    ```coffeescript
    @var_name = value
    refresh()
    ```

    (assuming `this` is the top-level scope). `setVar` also allows for avoiding
    keeping track of `this` or using `=>` to bind everything.

* `getValue('var_name')` - get a variable value explicitly.


