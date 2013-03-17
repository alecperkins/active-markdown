# Active Markdown

Active Markdown is an extension of the Markdown format with a notation for easy interactivity in the rendered HTML output. It uses the document’s own code blocks to provide the logic and define the relationships between the variables. A sample file looks like…


    # St Ives

    An old riddle.

    > As [I]{travelers I or we} [was]{verb} going to **St Ives**  
    > I met a man with [7]{wives [1...10]} wives  
    > Every wife had [7]{sacks [1...10]} sacks  
    > Every sack had [7]{cats [1...10]} cats  
    > Every cat had [7]{kits [1...10]} kits  
    > Kits, cats, sacks, wives  

        total_sacks     = @wives * @sacks
        total_cats      = total_sacks * @cats
        total_kits      = total_cats * @kits
        narrator        = 1
        man             = 1
        @first_guess = man + @wives + total_cats + total_kits + narrator

    > How many were going to St Ives?

        if @travelers is 'I'
            @answer = 1
            @verb = 'was'
        else
            @answer = 2
            @verb = 'were'

    - - -

    The first guess is often [2753]{first_guess}, but the answer is [1]{answer}


([rendered form &raquo;](http://show-em.net/e8ea079ab0fe444a8c83/st-ives.html))

…where the `[7]{wives [1...10]}` gets replaced with a slider from `1` to `10`, defaulting at `7`. Whenever the value of one of the variables is changed, the code in the given code block is executed using the current state of all the variables. Then, the variables are updated with the new state.

The notation is similar to the syntax for images and links, but when combined with some UI code by the rendering command, creates a rich, interactive document. Inspired by [literate CoffeeScript](http://coffeescript.org/#literate) and [Tangle](http://worrydream.com/Tangle/), the goal is a lightweight format for specifying interaction without requiring the creation of a webapp. Also, the document exposes its logic directly, and allows for easy modification and experimentation.

    [text value]{var_name}                  - interpolated variable (readonly)
    [5]{var_name [1...10]}                  - slider from 1 to 10, default 5
    [this]{var_name this or that}           - radio buttons between `this` or `that`
    ![Graph title]{graphFn x=[-10...10]}    - graph called 'Graph title' of the function
                                              `graphFn` of `x` from `-10` to `10`

The code blocks have access to these variables under the top-level `this` object. Also, the code blocks are *editable*, and recompiled for every execution, allowing for additional interactivity. (Note: the code in the code blocks MUST be [CoffeeScript](http://coffeescript.org).)

This is still experimental, and very rough around the edges. For more information, see the [initial writeup](http://show-em.net/e8ea079ab0fe444a8c83/).


## 0–60

1. Clone the repo and install the requirements

        $ git clone git://github.com/alecperkins/active-markdown.git
        Cloning into 'active-markdown'...
        $ cd active-markdown
        $ easy_install -r requirements.txt

2. Make the command executable

        $ chmod +x activemd

    For easier use, place it on your `PATH`.

3. Compile a file

        $ ./activemd <filename>.md
        Compiling <filename>.md --> <filename>.html

    This will generate an HTML file of the same name, but with the `.html` extension. The source file can have any extension, so long as it's plain text, but `.md` is recommended. Try it on `sample_amd_files/st-ives.md` or `docs/an-experiment/index.md`.

4. View the output

        open <filename>.html

    The generated HTML file can be viewed in any modern browser. It uses (for now) [jQuery UI](http://jqueryui.com/) and [Flot](http://www.flotcharts.org/) for the controls and graphs. The libraries needed are CDN-based, and everything else is contained in the file, so you don't need to worry about keeping track of additional files.


## Future

The most important todo is make a proper package and command. Also, features like file watching & recompiling, and refinements of the controls and code editing are important. The likely approach for refining the controls is to actually use Tangle as the interface library.

Feel free to open an [issue](https://github.com/alecperkins/active-markdown/issues) or fork and submit a pull request if you think of something that should be added. The biggest question is still the notation. The goal is to keep it as simple and easy to read as possible, in the spirit of Markdown, while still being useful and functional. Suggestions and concerns regarding the notation are very welcome.


## Authors

* [Alec Perkins](https://github.com/alecperkins) ([Droptype Inc](http://droptype.com))


## License

Unlicensed aka Public Domain. See [/UNLICENSE](https://github.com/alecperkins/active-markdown/blob/master/UNLICENSE) for more information.