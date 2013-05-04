# Active Markdown Changelog



## 0.3.2

Sloppy.

### Bugfixes

* Fix lack of unescaping of raw version.



## 0.3.1

### Bugfixes

* Fix #23: Escaping of raw version
* Fix Cakefile updating `package.json` version



## 0.3.0

Major refactor and modularization, allowing for use in-browser. Also exposes an
API for programmatic parsing. Most viewer libraries are included as `npm`
packages, then bundled using `browserify`. Also, charts!

### Bugfixes

* RangeElement text content parsing
* Parsing of intervals with constants

### Features

* ActiveMarkdown module for server-side and in-browser usage
* Charts, using Vega/d3, with an image-like notation
* command: `--collapsed_code` for setting active code blocks as collapsed by default
* command: `--debug` option, with unminified libraries and error feedback
* viewer: In-page controls
    * Collapsable active code blocks
    * Highlight active elements
    * View/download raw version
* viewer: Style improvements, particularly active code blocks
* dev: Improved build process, with `--firstrun` flag and a task for releases
* docs: API reference



## 0.2.0

Tests and cleanup, with a better build process via `$ cake`.

### Bugfixes

* Parsing decimal numbers with constants
* Parsing negative numbers
* Code block cursor visibility
* Invoking command with no arguments
* Outputting to file when input is piped
* Referenced viewer library pinning

### Features

* Tests! (using Mocha)
* `--title` option for specifying output document title
* Notation reference
* Ignoring of language-specific code blocks
* Improved viewer styles
* Linking to section headings



## 0.1.0

New syntax, dropping the extra brackets in favor of a colon delimiter. Port
command to CoffeeScript.

### Bugfixes

* Avoid parsing Active Markdown notation inside code, so it's possible to talk
  about Active Markdown using Active Markdown 

### Features

* Bracket-less interval notation
* Generate sample using `activemd --sample`
* SwitchElement
* Parsing of NumberElement text content to create presentation "templates"
* CodeMirror for editing active code blocks
* Constants in numbers, eg `0.25pi`



## 0.0.0

Initial prototype command.

### Features

* Python-based `activemd` rendering command
* Graphs using Flot
* Number selectors, using jQuery UI sliders
* Active code blocks
* Demo content
