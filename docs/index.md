---
title: Active Markdown
---

# Active Markdown

<a href="https://www.npmjs.com/package/active-markdown">
  <img src="https://img.shields.io/npm/v/active-markdown" alt="latest npm version">
</a> <a href="https://github.com/alecperkins/active-markdown/blob/main/LICENSE">
  <img src="https://img.shields.io/npm/l/active-markdown" alt="MIT license">
</a>

Active Markdown is a tool for making reactive HTML documents using a plain text markdown source, with a special notation for adding interactive controls and variables. The logic is determined by the contents of the javascript code blocks, which are executed on-the-fly to update the variables. Think Literate CoffeeScript meets Tangle.

Click and drag on “500 miles”: I would walk [500]{walk_distance: 100..1000 by 10} miles and I would walk [500]{second_walk} more…

And edit this JavaScript to say `walk_distance * 3`:

    second_walk = walk_distance * 1

That was generated from this markdown:

```markdown
I would walk [500]{walk_distance: 100..1000 by 10} miles and I would walk [500]{second_walk} more…

    second_walk = walk_distance * 3

```

## Getting started

Documents are compiled using the `activemd` command. It runs using [Node.js](http://nodejs.org/), and can be installed using npm:

- Install using npm: `$ npm install -g active-markdown`
- Download this [sample document](./sample.md) or generate it using `$ activemd sample`
- Compile the sample file into html: `$ activemd compile sample.md`
- View the compiled html in your favorite browser: `$ open sample.html`

View the source and hack away, file issues, and suggest notation improvements on [GitHub](https://github.com/alecperkins/active-markdown).


## Reference

See the [reference](./reference.html) for a thorough breakdown of the possible elements and their configurations. ([Raw markdown source](./reference.md), naturally.)

## Examples

See a “kitchen sink” set of [examples](./examples.html) that include different combinations of elements, charts, datasets, and HTML form elements.

- - -

By [Alec Perkins](https://alecperkins.net)
