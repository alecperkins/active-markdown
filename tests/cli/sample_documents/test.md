---
title: Test
---
# Test document

This is a test document for Active Markdown, adapted from John Gruber’s [Markdown syntax specification](http://daringfireball.net/projects/markdown/syntax.text).



# An atx-style H1

## An atx-style H2

### An atx-style H3

#### An atx-style H4

##### An atx-style H5

###### An atx-style H6

# A closed atx H1 #

## A closed atx H2 ##

### A closed atx H3 ###

#### A closed atx H4 ####

##### A closed atx H5 #####

###### A closed atx H6 ######

A setext-style H1
=================

A setext-style H2
-----------------

This is an ordinary paragraph. It should be wrapped in `<p>` tags.

This is another paragraph that
uses the GFM-style line ending
behavior. It should still be
one paragraph.

Paragraphs can contain inline *emphasis*, **strong**, and `code` elements. The _alternate_ forms __work__, but are ugly. In-word underscores for things like variable_names are ignored, per GFM. URLs are specified using a simple [notation](http://example.com). Images use a similar notation, but with a bang: ![Cats](http://placekitten.com/300/200/).

However, ChartElements use a similar notation but do not become images. ![y vs x]{line=someFunction: 0..100 by 5}

> This is a blockquote. It should be wrapped in `<blockquote>` tags.
> It continues onto the next line but still the same block. It supports
> formatting like *emphasis* and **strong**.

Active content can be added into paragraphs: [1.0]{value1: 0..1 by 0.1}.

> And it can be added to blockquotes: [output value]{value2}.

    // This is a code block that will become active.
    someFunction = (x) => {
      return x * 2;
    }
    value2 = someFunction(value1);


```javascript
// This is a code block that will not become active.
someFunction = (x) => {
  return x * 2;
}
value2 = someFunction(value1);
```

```python
# This is another inactive code block.
def howManyArgs(*args):
    return len(args)

print howManyArgs(1,2,3,4,5,6)
```

```markdown
This is a code block with [active content]{value1: 1..10}
that is ignored because it’s in code.
```

Active Markdown in `[inline code]{inline: yes or no}` [is]{ignored: is or isnt} ignored by the parser. It would be difficult to talk about Active Markdown using itself, otherwise.

* unordered
* list
* items
    * can
    * be
        * nested
    * as
        * one
        * would
* expect

-----

+ other
+ symbols
    + work

-----

- because
    - why
- not

-----

1. ordered
2. lists
    1. have
    2. an
3. order

-----

* this
* list
* contains [active content]{value2: 1..10}

-----

Tables also work, because they are useful.

| Ones | Twos | Threes  |
|------|------|---------|
| 1    | 2    | 3       |
| 2    | 4    | 6       |
| 3    | 6    | 9       |
| 4    | 8    | 12      |




