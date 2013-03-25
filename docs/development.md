

*   Get the code and prepare the environment:

        $ git clone git://github.com/alecperkins/active-markdown.git
        $ cd active-markdown
        $ npm install --dev .


*   Run the build command:

    This will compile the viewer template and assets into the folder
    `viewer/`. The `-m` flag will minify the JavaScript and CSS assets.

        $ cake build
        $ cake -m build

    The command takes the precompiled template, compiles the source markdown,
    and calls the template with the markup, styles, and script.


*   Update the GitHub pages branch:

        $ cake updatepages


When working on the command, `cake build && ./bin/activemd lib/sample.md` is helpful.