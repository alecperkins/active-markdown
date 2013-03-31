


# Switch the Underscore templating to a less nutty syntax (in this case `{{ interpolate }}` and `{% evaluate %}`).

_.templateSettings =
  interpolate : /\{\{(.+?)\}\}/g
  evaluate : /\{\%(.+?)\%\}/g




executor = new Executor()
drag_manager = new DragManager()

$('pre').each (i, el) ->
    $el = $(el)
    $code = $el.find('code')
    if not $code.attr('class')
        source = $code.text()
        $new_el = $('<div>')
        $el.replaceWith($new_el)
        executor.addCodeBlock new CodeBlock
            el: $new_el
            source: source

$('.AMDElement').each (i, el) ->
    $el = $(el)
    config_str = $el.data('config')

    element_classes = [
        SwitchElement
        NumberElement
        StringElement
    ]

    element_class = _.find element_classes, (cls) ->
        return cls.config_pattern.test(config_str)

    if element_class?
        element_class.make($el, config_str)
    else
        # TODO: inline error feedback
        console.error 'Unable to make element for', $el


