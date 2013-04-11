
## Notation

The notation for specifying elements is similar to the regular Markdown syntax for links and images, generally following this format:

`[text content]{variable_name: configuration}`

The text representation of the element, like the link text or image alt text, goes between the brackets, `[]`. The brackets are followed by braces, `{}`, which contain the variable name, and any configuration. The variable name MUST be followed by a colon, `:`, if there is any configuration present. The configuration is what determines the kind of element, and specifies its behavior. For example, a *RangeElement* can be constrained to a minimum and maximum, and a *SwitchElement* can be given different labels for `true` and `false`.



### StringElement

A read-only output of the current value of the specified variable `<var_name>`. The text is the default value, and used whenever the value of the variable is `undefined`.

`[<text>]{<var_name>}`


#### Examples

##### String, basic

[many eggs]{egg_count} - `[many eggs]{egg_count}`

| property              | value                             |
|=======================|===================================|
| name                  | `egg_count`                       |
| value                 | [many eggs]{egg_count}            |



### RangeElement

A number adjustable by dragging. The number MAY have a display precision specified. The slider MAY be constrained to a minimum and/or maximum, and MAY have a step value. The text is parsed, and the first number in the text becomes the output value. The remaining text is added to the template, allowing for units and other descriptive text to be included in the control.

A range MUST be specified, but MAY be infinite in both directions. The range’s interval is specified using the [CoffeeScript-style range dots](http://coffeescript.org/#loops), where `..` is inclusive and `...` excludes the end. ie, `1..4` covers the interval `1 <= n <= 4`, while `1...4` covers `1 <= n < 4`. The range MUST be ascending (to preserve consistency in the UI — drag left for negative, drag right for positive). The range’s step is specified using the `by` keyword and a number. The step MAY be omitted (defaulting to `1`), but if specified MUST be positive.

The text content MAY include a number to use as the default value. Any surrounding text will be used as a template, allowing units or qualifiers to be included in the element’s presentation.

Specifying a display precision MAY be done using the default number value in the text. `200.` formats to `0` decimal places. `200.000` formats to `3` decimals. If not specified, the value is unformatted.

Numbers MAY use the constants in [`Math`](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math) and combine them with a coefficient, eg `2pi` or `0.5pi`, which is treated as `n * Math.PI`. This can be done in the range min or max, or in the step. The constants MUST be one of `e`, `pi`, `ln2`, `ln10`, `log2e`, `log10e`, `sqrt1_2`, `sqrt2`, (uppercase or lowercase).

`[<before> <number>.<decimal> <after>]{<var_name>: <bound>..<exclusive><bound> by <step>}`

#### Examples

##### Specifying step

[20. calories]{calories: 10..100 by 10} - `[20. calories]{calories: 10..100 by 10}`

| property              | value                             |
|=======================|===================================|
| name                  | `calories`                        |
| value                 | []{calories}                      |
| interval              | `[10,100]`                        |
| step                  | `10`                              |
| default               | `20`                              |
| display precision     | `1`                               |
| display format        | `"#{value.toFixed(0)} calories"`  |

##### Fractional step, precision

[20.0 calories]{calories_2: 10..100 by 0.1} - `[20.0 calories]{calories_2: 10..100 by 0.1}`

| property              | value                             |
|=======================|===================================|
| name                  | `calories_2`                      |
| value                 | []{calories_2}                    |
| interval              | `[10,100]`                        |
| step                  | `0.1`                             |
| default               | `20.0`                            |
| display precision     | `0.1`                             |
| display format        | `"#{value.toFixed(1)} calories"`  |

##### With constants

[period 0.00]{period: 0..2pi by 0.25pi} - `[period 0.00]{period: 0..2pi by 0.25pi}`

| property              | value                             |
|=======================|===================================|
| name                  | `period`                          |
| value                 | []{period}                        |
| interval              | `[0,2pi]`                         |
| step                  | `0.25pi`                          |
| default               | `0`                               |
| display precision     | `0.01`                            |
| display format        | `"#{value.toFixed(2)} period"`    |

##### Unbounded

[20 calories]{calories_3: ..} - `[20 calories]{calories_3: ..}`

| property              | value                             |
|=======================|===================================|
| name                  | `calories_3`                      |
| value                 | []{calories_3}                    |
| interval              | `(−∞,∞)`                          |
| step                  | `1`                               |
| default               | `20`                              |
| display precision     | `undefined`                       |
| display format        | `"#{value} calories"`             |

##### Unbounded right, before text

[over 200 calories]{calories_4: 1..} - `[over 200 calories]{calories_4: 1.. by 2}`

| property              | value                             |
|=======================|===================================|
| name                  | `calories_4`                      |
| value                 | []{calories_4}                    |
| interval              | `[1,∞)`                           |
| step                  | `2`                               |
| default               | `200`                             |
| display precision     | `undefined`                       |
| display format        | `"over #{value} calories"`        |



### SwitchElement

A boolean flag that has a value of `true`, `false`, or `undefined`. The true and false values can be labeled. If the label is present in the text, that value becomes the default value. Otherwise, the value is `undefined`. 

`[<before> <true_label or false_label or *> <after>]{<var_name>: <true_label> or <false_label>}`

#### Examples

##### Switch, basic

[pick one]{some_flag_1: true or false} - `[pick one]{some_flag_1: true or false}`

| property              | value                             |
|=======================|===================================|
| name                  | `some_flag_1`                     |
| value                 | []{some_flag_1}                   |
| default               | `undefined`                       |
| true label            | `true`                            |
| false label           | `false`                           |
| display format        | `"#{label}"`                      |

##### Switch, with default

[true]{some_flag_2: true or false} - `[true]{some_flag_3: true or false}`

| property              | value                             |
|=======================|===================================|
| name                  | `some_flag_2`                     |
| value                 | []{some_flag_2}                   |
| default               | `true`                            |
| true label            | `true`                            |
| false label           | `false`                           |
| display format        | `"#{label}"`                      |

##### Switch, default, labeled, before/after text

[on deck]{some_flag_3: on or off} - `[on deck]{some_flag_3: on or off}`

| property              | value                             |
|=======================|===================================|
| name                  | `some_flag_3`                     |
| value                 | []{some_flag_3}                   |
| default               | `true`                            |
| true label            | `on`                              |
| false label           | `off`                             |
| display format        | `"#{label} deck"`                 |


