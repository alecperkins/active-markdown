# ActiveMarkdown API

The `ActiveMarkdown` module contains the function for parsing Active Markdown to
HTML markup. It can be accessed in Node using `require 'active-markdown'`.
Also, the `activemarkdown-x.y.z.js` viewer asset includes the module, providing
parsing capability in the browser.


## `.parse(source, options={})`

The `source` is a string of Markdown to be parsed. The options are given as an
Object, and describe the configuration for that document.


### Basic usage

Compile the raw markdown string to HTML.

    output_html = ActiveMarkdown.parse(md_source)


### Options

The defaults are

```coffeescript
wrap                : true
collapsed_code      : false
title               : undefined
debug               : false
input_file_name     : undefined
libraries           : 'reference'
```

If not using the default template, all of the options besides `wrap` will have
no effect. Also, `libraries` has no effect in-browser.


#### Option: `wrap`

Wrap the compiled Markdown in the default template, or using the specified
markup. Possible values are `true` (default), `false`, `['before', 'after']`,
`{ before: 'before', after: 'after' }`.

* Use the default markup wrapping, which includes the script and style libraries
  for the active markdown elements.

  ```coffeescript
  output_html = ActiveMarkdown.parse(md_source, wrap: true)
  ```

* Provide alternate markup to wrap the output in.

  ```coffeescript
  output_html = ActiveMarkdown.parse(md_source, wrap: [before, after])
  ```

  ```coffeescript
  output_html = ActiveMarkdown.parse md_source,
      wrap:
          before: before
          after: after
  ```

#### Option: `collapsed_code`

Set the *Active Code Blocks* to be collapsed by default. Possible values are
`true`, `false` (default).


#### Option: `title`

Specify the title for the document, if using the default template. If not
specified (default), the `input_file_name` is used as the document title.


#### Option: `debug`

Enable debug mode, if using the default template. Possible values are
`true`, `false` (default).

Debug mode uses unminified libraries, and provides error feedback when invalid
configurations are encountered.


#### Option: `input_file_name`

Specify the name of the source file, if using the default template. Inserted in
an info comment at the beginning of the document. Also used as the title, if
none is specified.


#### Option: `libraries`

Set the mode for including the viewer script and style libraries. Possible
values are:

* `'reference'` (default) - scripts and styles are included as script and link
  tags that point to the assets hosted on `activemarkdown.org`, specifically

  `http://activemarkdown.org/viewer/activemarkdown-X.Y.Z-min.js` 
  `http://activemarkdown.org/viewer/activemarkdown-X.Y.Z-min.css`

  or in debug mode

  `http://activemarkdown.org/viewer/activemarkdown-X.Y.Z.js`
  `http://activemarkdown.org/viewer/activemarkdown-X.Y.Z.css`

* `'relative'` - reference scripts and styles, but using relative URLs to a
  a local copy of the asset files.

* `'inline'` - include the scripts and styles directly in the page, as
  script and style tags.

Note: when used in-browser, libraries are always included by reference.

