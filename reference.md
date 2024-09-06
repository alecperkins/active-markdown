# Active Markdown Reference

## Notation

The notation for specifying elements is similar to the regular Markdown syntax for links and images, generally following this format:

`[text content]{variable_name: configuration}`

The text representation of the element, like the link text or image alt text, goes between the brackets, `[ ]`. The brackets are followed by braces, `{ }`, which contain the variable name, and any configuration. The variable name MUST be followed by a colon, `:`, if there is any configuration present. The configuration is what determines the kind of element, and specifies its behavior. For example, a *RangeElement* can be constrained to a minimum and maximum, and a *SwitchElement* can be given different labels for `true` and `false`.


### StringElement

`[<text>]{<var_name>}`

A read-only output of the current value of the specified variable `<var_name>`. The text is the default value, and used whenever the value of the variable is `undefined`.


#### Examples

##### String, basic

[5]{egg_count} - `[many eggs]{egg_count}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `egg_count`                       |
| value                 | [5]{egg_count}                    |

    egg_count = Math.floor(Math.random() * 10);

##### String, number formatting

[3.14 ish]{pi_approx} - `[3.14 ish]{pi_approx}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `pi_approx`                       |
| value                 | [3.1428571429]{pi_approx}         |

    pi_approx = 22/7;

##### String, undefined

[text]{novar} - `[text]{novar}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `novar`                           |
| value                 | `undefined`                       |

    novar = undefined;


### RangeElement

`[<before> <number>.<decimal> <after>]{<var_name>: <bound>..<exclusive><bound> by <step>}`

A number adjustable through a range of values by dragging or arrow press. The number MAY have a display precision specified. The slider MAY be constrained to a minimum and/or maximum, and MAY have a step value. The text is parsed, and the first number in the text becomes the output value. The remaining text is added to the template, allowing for units and other descriptive text to be included in the control.

A range MUST be specified, but MAY be infinite in both directions. The range’s interval is specified using the [CoffeeScript-style range dots](https://coffeescript.org/#slices), where `..` is inclusive and `...` excludes the end. ie, `1..4` covers the interval `1 <= n <= 4`, while `1...4` covers `1 <= n < 4`. The range MUST be ascending (to preserve consistency in the UI — drag left for negative, drag right for positive). The range’s step is specified using the `by` keyword and a number. The step MAY be omitted (defaulting to `1`), but if specified MUST be positive.

The text content MAY include a number to use as the default value. Any surrounding text will be used as a template, allowing units or qualifiers to be included in the element’s presentation.

Specifying a display precision MAY be done using the default number value in the text. `200.` formats to `0` decimal places. `200.000` formats to `3` decimals. If not specified, the value is unformatted.

Numbers MAY use the constants in [`Math`](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math) and combine them with a coefficient, eg `2pi` or `0.5pi`, which is treated as `n * Math.PI`. This can be done in the range min or max, or in the step. The constants MUST be one of `e`, `pi`, `ln2`, `ln10`, `log2e`, `log10e`, `sqrt1_2`, `sqrt2`, (uppercase or lowercase).

When the element has focus, the user can press Left/Down and Right/Up arrows to decrement or increment the value by the step. Doing so while holding shift multiplies each press by 10x.

Double-click on a range element to reset to its initial value.

#### Examples

##### Specifying step

[20. calories]{calories: 10..100 by 10} - `[20. calories]{calories: 10..100 by 10}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `calories`                        |
| value                 | []{calories}                      |
| interval              | `[10,100]`                        |
| step                  | `10`                              |
| default               | `20`                              |
| display precision     | `1`                               |
| display format        | `"${value.toFixed(0)} calories"`  |

##### Fractional step, precision

[20.0 calories]{calories_2: 10..100 by 0.1} - `[20.0 calories]{calories_2: 10..100 by 0.1}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `calories_2`                      |
| value                 | []{calories_2}                    |
| interval              | `[10,100]`                        |
| step                  | `0.1`                             |
| default               | `20.0`                            |
| display precision     | `0.1`                             |
| display format        | `"${value.toFixed(1)} calories"`  |

##### With constants

[period 0.00]{period: 0..2pi by 0.25pi} - `[period 0.00]{period: 0..2pi by 0.25pi}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `period`                          |
| value                 | []{period}                        |
| interval              | `[0,2pi]`                         |
| step                  | `0.25pi`                          |
| default               | `0`                               |
| display precision     | `0.01`                            |
| display format        | `"${value.toFixed(2)} period"`    |

##### Unbounded

[20 calories]{calories_3: ..} - `[20 calories]{calories_3: ..}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `calories_3`                      |
| value                 | []{calories_3}                    |
| interval              | `(−∞,∞)`                          |
| step                  | `1`                               |
| default               | `20`                              |
| display precision     | `undefined`                       |
| display format        | `"${value} calories"`             |

##### Unbounded right, before text

[over 200 calories]{calories_4: 190.. by 2} - `[over 200 calories]{calories_4: 190.. by 2}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `calories_4`                      |
| value                 | []{calories_4}                    |
| interval              | `[190,∞)`                         |
| step                  | `2`                               |
| default               | `200`                             |
| display precision     | `undefined`                       |
| display format        | `"over ${value} calories"`        |



### SwitchElement

A boolean flag that has a value of `true`, `false`, or `undefined`. The true and false values can be labeled. If the label is present in the text, that value becomes the default value. Otherwise, the value is `undefined`.

`[<before> <true_label or false_label or *> <after>]{<var_name>: <true_label> or <false_label>}`

Once the value is set, it can only be toggled, not unset.

#### Examples

##### Switch, basic

[pick one]{some_flag_1: true or false} - `[pick one]{some_flag_1: true or false}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `some_flag_1`                     |
| value                 | []{some_flag_1}                   |
| default               | `undefined`                       |
| true label            | `true`                            |
| false label           | `false`                           |
| display format        | `"#{label}"`                      |

##### Switch, with default

[true]{some_flag_2: true or false} - `[true]{some_flag_3: true or false}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `some_flag_2`                     |
| value                 | []{some_flag_2}                   |
| default               | `true`                            |
| true label            | `true`                            |
| false label           | `false`                           |
| display format        | `"#{label}"`                      |

##### Switch, default, labeled, before/after text

[on deck]{some_flag_3: on or off} - `[on deck]{some_flag_3: on or off}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `some_flag_3`                     |
| value                 | []{some_flag_3}                   |
| default               | `true`                            |
| true label            | `on`                              |
| false label           | `off`                             |
| display format        | `"#{label} deck"`                 |



### Active Code Blocks

Active Code Blocks are written using regular javascript in indented markdown code blocks. To execute the code, every block is concatenated into a single function body and called given the document variables. The code blocks are editable and changes trigger a refresh of the entire document.

<pre><code class="language-markdown">
This is some regular markdown text.

    // This is code that will be executed at page load,
    // and whenever a variable changes.

    // This is a local variable that references a document variable.
    // It cannot be referenced by the document or subsequent code
    // block executions.
    const intermediate = 1 + varname;

    // Variables can be assigned a function for use by a ChartEmbed.
    chartFn = function (x) {
      return x * varname;
    }

This is more text in between two code blocks.

    // This is more of the function body.

    // This is a local function usable by the rest
    // of the code body.
    function localFn (arg) {
      return Math.random() * arg > 5;
    }

    // This is assignment to a variable from the document.
    // It is already declared and does not need a declaration
    // keyword (const/let/var).
    if (localFn(intermediate)) {
      docvar = Math.max(100, intermediate);
    } else {
      docvar = Math.max(5, intermediate);
    }

And some final text.
</code></pre>

The code MUST be standard javascript supported by the browser. The functions MUST be synchronous. `await` statements will throw a syntax error. Async functions can be defined and invoked, but changes to variables after the initial execution pass will not be returned to the document. State is not shared between block executions and each execution is an entirely new function definition. Any local variables are not available to the next call.

The blocks all execute within the same scope, in order. Standard [hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting) behaviors apply within the code, but note that the variables can be used in active elements before or after the code block in the document.


#### Libraries

Additional libraries or other scripts can be included for use by the code blocks using inline HTML either as local or external script tags. However, the executor does not currently provide a way to manage script loading and execution order.


### DatasetEmbed

Datasets can be embedded into the document, using fenced code blocks. They can be either CSV or JSON, and are available to the code blocks as the specified variable name. JSON is passed through as-is. CSVs are parsed into an Array of Objects keyed using the headers. (Note that CSVs MUST provide a header row.) The datasets are made editable in the rendered page and will trigger a refresh of the code blocks and reactive elements if changed.

<pre><code class="language-markdown">
```[csv|json]=&lt;varname&gt;
&lt;…data…&gt;
```
</code></pre>

### Data, JSON

```json=dataset1
[
  "first",
  "second",
  "third"
]
```

<pre><code class="language-text">
```json=dataset1
[
  "first",
  "second",
  "third"
]
```
</code></pre>

This will be available in the code blocks as:

```javascript
dataset1 = ['first', 'second', 'third'];
```


### Data, CSV

```csv=dataset2
a,b,c
1,2,3
1,3,5
2,4,8
```

<pre><code class="language-text">
```csv=dataset2
a,b,c
1,2,3
1,3,5
2,4,8
```
</code></pre>

This will be available in the code blocks as:

```javascript
dataset2 = [
  {
    a: 1,
    b: 2,
    c: 3,
  },
  {
    a: 1,
    b: 3,
    c: 5,
  },
  {
    a: 2,
    b: 4,
    c: 8,
  },
];
```



### ChartEmbed

An embedded chart, of type scatter, line, or bar. The chart is driven by the specified function over the specified range, or the given dataset. The *ChartEmbed* notation is similar to the *RangeElement*, but with the addition of the `type`, and the leading `!` (like a markdown image). Also, the chart interval MUST be finite if driven by a function. The variable name MUST be assigned to a function in an *ActiveCodeBlock*, or match a *DatasetEmbed* name.

For datasets, and functions that produce objects instead of a number, the range and series labels are used to select the attributes in the record for that point. Multiple series-labels MAY be specified, separated by commas.

`![<series_labels,…> <delimiter> <range_label>]{<type>=<varname>: <bound>..<exclusive><bound> by <step>}`

#### Function-driven

Functions used for charts MUST be assigned in a code block to the variable name expected by the chart. They MAY be defined before or after the chart in the document. The functions are called for each item produced by the defined range, and MUST return a result. The result MUST be a `number`, or an `Object` with properties that match the range label and series labels of the chart definition.

```javascript
varname = (x) => {
  // …calculate result…
  return result
}
```

#### Data-driven

Datasets used for charts MUST be named with the variable in the chart definition. Either format of Dataset can be used.

<pre><code class="language-text">
```csv=varname
range,series1,series2
1,44,55
2,45,9
3,46,35
```
</code></pre>


#### Examples

##### Scatter, basic

`![y vs x]{scatter=scatterFn: -10..10}`

[Mult: 0.]{scatter_mult: 0..100}

    scatterFn = function (x) {
      return x + Math.random() * scatter_mult
    }

`![y vs x]{scatter=scatterFn: -10..10}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `scatterFn`                       |
| type                  | `scatter`                         |
| x label               | `"x"`                             |
| y label               | `"y"`                             |
| interval              | `[-10,10]`                        |
| step                  | `1`                               |


##### Line, basic

`![sin(x)]{line=lineFn: 0..2pi by 0.001}`

[Frequency 1.00]{frequency: 0.25..4 by 0.25}

    const b = Math.PI * frequency;
    lineFn = function (x) {
      return Math.sin(b * x)
    }

![sin(x)]{line=lineFn: 0..2pi by 0.001}

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `lineFn`                          |
| type                  | `line`                            |
| x label               | `null`                            |
| y label               | `null`                            |
| interval              | `[0,2pi]`                         |
| step                  | `0.001`                           |


##### Bar, basic

`![money by year]{bar=barFn: 1983..2013}`

[Threshold: 5.]{threshold: 1..20}

    barFn = function (x) {
      return x % threshold;
    }

`![money by year]{bar=barFn: 1983..2013}`

| property              | value                             |
|-----------------------|-----------------------------------|
| name                  | `barFn`                           |
| type                  | `bar`                             |
| x label               | `"year"`                          |
| y label               | `"money"`                         |
| interval              | `[1983,2013]`                     |
| step                  | `1`                               |


- - -

## Markdown

The `activemd` command follows [GitHub-flavored Markdown](https://github.github.com/gfm/) which includes some additions to traditional Markdown, such as tables and line breaks in paragraphs. It also supports front-matter metadata.

### Front matter

Metadata can be defined in the document using YAML-based [front matter](https://jekyllrb.com/docs/front-matter/). Only the `title` is used by Active Markdown for now, as the document title. The entirety of the metadata is available to code blocks as `meta`.

```yaml
---
title: Document title
somedate: 2024-09-01
---
```

### Deep links

Headers 1–6 are given ids with slugified versions of their content, and the rendered form will produce an `<a>` tag next to each header for easy deep linking.

### Example

This content below is just for a complete demonstration of the styling:

- foo
- bar
- baz

> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
> eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
> enim ad minim veniam, quis nostrud exercitation ullamco laboris
> nisi ut aliquip ex ea commodo consequat.

1. first
2. second
    a. Aleph
    b. Bet
3. third

| column 1 | column 2 | column 3 |
|----------|----------|----------|
| row1 a   | row1 b   | row1 c   |
| row2 a   | row2 b   | row2 c   |
| row3 a   | row3 b   | row3 c   |
| row4 a   | row4 b   | row4 c   |

![Blue Marble photo from Apollo 17 of the Earth from space](data:image/jpeg;base64,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);


## `activemd` Command

The `activemd` command is used to compile Active Markdown content into an interactive HTML file to be viewed in a browser. It will render the regular markdown content, create the active elements, and inject scripts and styles needed for interactivity. By default everything is inlined into the page so no external library links are needed. It also includes the original markdown source, viewable from the rendered page. This inlining ensures maximum portability and durability of the rendered version.

### Compile

`activemd compile <filename.md>` or `activemd <filename.md>` will compile the given file into `<filename>.html`. Note that it will overwrite any existing content at the output filename without warning.

Optionally specify a title to use in the document head with `--title="Page title"`. This will override any front matter-specified title.

### Watch

`activemd watch <filename.md>` will compile the given file, then watch for changes and recompile. It also injects a simple live reload script that will reload the browser after recompilation, for quick feedback while editing. It does not provide a server so you have to open the compiled file directly.

Use `CTRL+C` to quit the watcher.

### Sample

`activemd sample` will generate a [`sample.md` file]('./sample.md) in the current working directory.


- - -


## Advanced

The Active Code Blocks automatically get access to the variables when executed. But if poking around in the console, you can access the document variables using the `window.ActiveMarkdown` object. Each variable has a `getValue()` method to retrieve the current value. The elements and embeds are also indexed there.

**Note: this is not part of the public API and could change at any time.** It’s provided for the sake of experimentation, learning, and debugging.

- - -
