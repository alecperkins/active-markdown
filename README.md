---
title: Active Markdown
---

# Active Markdown

[![latest npm version](https://img.shields.io/npm/v/active-markdown)](https://www.npmjs.com/package/active-markdown)
[![MIT license](https://img.shields.io/npm/l/active-markdown)](https://github.com/alecperkins/active-markdown/blob/main/LICENSE)

[Active Markdown](http://activemarkdown.org) is a tool for making reactive documents — in the vein of [Tangle](http://worrydream.com/Tangle) — using a plain text markdown source, with a special notation for adding interactive controls and variables. The logic is determined by the content of the javascript code blocks, which is executed on-the-fly to update the variables.

A sample raw Active Markdown file looks like this:

```markdown
## St Ives

An [old riddle](https://en.wikipedia.org/wiki/As_I_was_going_to_St_Ives).

> As [I]{solo: I or we} [was]{verb} going to **St Ives**,
> I met a man with [7 wives]{wives: 1..10},
> Every wife had [7 sacks]{sacks: 1..10},
> Every sack had [7 cats]{cats: 1..10},
> Every cat had [7 kits]{kits: 1..10}:
> Kits, cats, sacks, wives,
> How many were going to St Ives?

A _reasonable_ guess is [2752]{first_guess}, a sum of the beings the narrator met:

    const man   = 1;
    total_sacks = wives * sacks;
    total_cats  = total_sacks * cats;
    total_kits  = total_cats * kits;

    first_guess = man + wives + total_cats + total_kits;

And another guess might follow the second to last line more literally and sum [2401 kits]{total_kits}, [343 cats]{total_cats}, [49 sacks]{total_sacks}, and [7 wives]{wives} for an answer of [2800]{second_guess}:

    second_guess = total_kits + total_cats + total_sacks + wives;

…but the correct answer is [1]{answer}.

    if (solo) {
      travelers = 1;
      verb = 'was';
    } else {
      travelers = 2;
      verb = 'were';
    }

    answer = travelers;
```


([rendered form](https://activemarkdown.org/st-ives.html))

…where the `[7]{wives: 1..10}` gets replaced with a slider from `1` to `10`, defaulting at `7`. Whenever the value of one of the variables is changed, the code in the given code blocks is executed using the current state of all the variables. Then, the variables are updated with the new state.

The notation is similar to the syntax for images and links, but when combined with some UI code by the rendering command, creates a rich, interactive and reactive document. Inspired by [literate CoffeeScript](https://coffeescript.org/#literate) and [Tangle](https://worrydream.com/Tangle/), the goal is a lightweight format for specifying interaction without requiring the creation of a webapp. Also, the document exposes its logic directly, and allows for easy modification and
experimentation.

| Notation                            | Output                                      |
|-------------------------------------|---------------------------------------------|
| `[text value]{var_name}`            | interpolated, formatted variable (readonly) |
| `[5]{var_name: 1..10}`              | slider from 1 to 10, default 5              |
| `[this]{var_name: this or that}`    | toggle switch between `this` or `that`      |
| `![y vs x]{line=someFn 1..10 by 2}` | line chart driven by function `someFn`      |
| `![y vs x]{scatter=mydata ..}`      | scatter chart driven by dataset `mydata`    |
| <code>&grave;&grave;&grave;csv=mydata\ncol1,col2,col3\n1,2,3\n&grave;&grave;&grave;</code>      | CSV dataset                                 |

The code blocks have access to these variables in their scope, and modify the page state by assigning to those variables. Also, the code blocks are *editable*, and recompiled for every execution, allowing for additional interactivity. (Note: the code in the code blocks MUST be JavaScript.)



## 0–60 (getting started)

1.  Install:

        $ npm install -g active-markdown

2.  Compile an Active Markdown-formatted file:

        $ activemd file.md
        Compiled file.md -> file.html

    The command can generate a sample file for you to use and examine.

        $ activemd sample
        Sample saved to ./sample.md.

3.  Open the compiled file in your favorite browser:

        $ open file.html


## Usage

The basic usage is `activemd <file>`. This will compile a markdown file with the Active Markdown notation into an HTML file

    activemd [command] [options] <file>

Commands:

- `compile <file>`: compile the given file to HTML (also the default action if no command specified)
- `watch <file>`: recompile the given file on every change and trigger a reload in the open browser
- `sample`: generate a sample Active Markdown document

Options:

*   `    --title TITLE`
    Use the specified string as the title of the compiled HTML file.


## Notation

The notation for specifying elements is similar to the regular markdown syntax for links and images but with braces instead of parentheses, generally following this format:

`[text content]{variable_name: configuration}`

See [docs/reference.html](https://activemarkdown.org/reference.html) for a complete reference of the elements and their configuration. See [docs/examples.md](https://activemarkdown.org/examples.html) for a variety of examples showing different usage.


## Authors

* [Alec Perkins](https://alecperkins.net)

Thanks to [J Voight](https://github.com/joyrexus), [Alex Cabrera](https://alexcabrera.me/), [John Debs](https://johndebs.com/), and Supriyo Sinha for help with the notation.

The concept and controls are heavily influenced by [Bret Victor’s](https://worrydream.com) [Tangle](https://worrydream.com/Tangle) library for creating reactive documents.


## License

This package is licensed under the [MIT License](https://opensource.org/licenses/MIT).

See `./LICENSE` for more information.
