# Active Markdown, v0.2.0

[Active Markdown](http://activemarkdown.org) is a tool for making reactive documents — in the vein of [Tangle](http://worrydream.com/Tangle) — using a plain text markdown source, with a special notation for adding interactive controls and variables. The logic is determined by the contents of the code blocks, which is actually executed on-the-fly to update the variables.

A sample raw Active Markdown file looks like this:

    # St Ives

    An old riddle.

    > As [I]{travelers: we or I} [was]{verb} going to *St Ives*  
    > I met a man with [7 wives]{wives: 1..10}  
    > Every wife had [7 sacks]{sacks: 1..10}  
    > Every sack had [7 cats]{cats: 1..10}  
    > Every cat had [7 kits]{kits: 1..10}  
    > Kits, cats, sacks, wives  
    > How many were going to St Ives?

        total_sacks = @wives * @sacks
        total_cats  = total_sacks * @cats
        total_kits  = total_cats * @kits
        man         = 1

        if @travelers
            narrator = 2
            @verb = 'were'
        else
            narrator = 1
            @verb = 'was'

    The first guess is often [2753]{first_guess}…

        @first_guess = man + @wives + total_cats + total_kits + narrator

    …but the correct answer is **[1]{answer}**.

        @answer = narrator


([rendered form &raquo;](http://activemarkdown.org/st-ives.html))

…where the `[7]{wives: 1..10}` gets replaced with a slider from `1` to `10`, defaulting at `7`. Whenever the value of one of the variables is changed, the code in the given code block is executed using the current state of all the variables. Then, the variables are updated with the new state.

The notation is similar to the syntax for images and links, but when combined with some UI code by the rendering command, creates a rich, interactive and reactive document. Inspired by [literate CoffeeScript](http://coffeescript.org/#literate) and [Tangle](http://worrydream.com/Tangle/), the goal is a lightweight format for specifying interaction without requiring the creation of a webapp. Also, the document exposes its logic directly, and allows for easy modification and experimentation.

    [text value]{var_name}                  - interpolated variable (readonly)
    [5]{var_name: 1..10}                    - slider from 1 to 10, default 5
    [this]{var_name: this or that}          - toggle switch between `this` or `that`

The code blocks have access to these variables under the top-level `this` object. Also, the code blocks are *editable*, and recompiled for every execution, allowing for additional interactivity. (Note: the code in the code blocks MUST be [CoffeeScript](http://coffeescript.org).)

This is still experimental, and very rough around the edges. For more information, see the [initial writeup](http://activemarkdown.org/an-experiment.html).

Active Markdown uses [Showdown](https://github.com/coreyti/showdown) for markdown–HTML conversion, with the `github` and `table` extensions enabled.



## 0–60 (getting started)

1.  Install:

        $ npm install -g active-markdown

2.  Compile an Active Markdown-formatted file:

        $ activemd file.md
        Compiled file.md -> file.html

    The command can generate a sample file for you to use and examine.

        $ activemd --sample
        Generating sample: am_sample.md

        $ activemd --sample > some_name.md
        Generating sample

3.  Open the compiled file in your favorite browser:

        $ open file.html



## Usage

The basic usage is `activemd FILE`. This will compile a markdown file with the Active Markdown notation into an HTML file

    activemd [options] FILE(S)

Options:

*   `-l  --local`
    Create local copies of the asset files, relative to the specified source
    file(s). By default, the assets used are remote, specifically:

        http://activemarkdown.org/viewer/activemarkdown-X.Y.Z-min.css
        http://activemarkdown.org/viewer/activemarkdown-X.Y.Z-min.js

*   `-i  --inline`
    Inline the asset files in the template. Similar to `--local`, but includes
    the content of the assets in the actual output file, creating a single,
    self-contained Active Markdown viewer file.

*   `    --title TITLE`
    Use the specified string as the title of the compiled HTML file.

*   `    --sample`
    Generate a sample file that contains all of the possible controls in
    various configurations.


## Notation

The notation for specifying elements is similar to the regular Markdown syntax for links and images, generally following this format:

`[text content]{variable_name: configuration}`

See [activemarkdown.org/reference.html](http://activemarkdown.org/reference.html) for a complete reference of the elements and their configuration.


## Authors

* [Alec Perkins](https://github.com/alecperkins) ([Droptype Inc](http://droptype.com))

Thanks to [J Voight](https://github.com/joyrexus), [Alex Cabrera](http://alexcabrera.me/), [John Debs](http://johndebs.com/), and [Supriyo Sinha](http://supriyosinha.com) for help with the notation.

The concept and controls are heavily influenced by [Bret Victor’s](http://worrydream.com) [Tangle](http://worrydream.com/Tangle) library for creating reactive documents.

* [You?](https://github.com/alecperkins/active-markdown/issues) - Active Markdown is still very experimental, and input on the notation, bugs, use cases, control elements, and anything else is very welcome.

## License

Unless otherwise noted, this software is Unlicensed, aka Public Domain. See [/UNLICENSE](https://github.com/alecperkins/active-markdown/blob/master/UNLICENSE) for more information.


