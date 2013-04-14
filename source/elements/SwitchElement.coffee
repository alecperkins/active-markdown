BaseElement = require './BaseElement'


class SwitchElement extends BaseElement
    @config_pattern: ///
            ^(                      # Variable
              [\w\d]+               # - name
            )

            :\s                   # Delimiter

            (                       # true_label
                [\w]+
            )

            \sor\s                  # or keyword

            (                       # false_label
                [\w]+
            )
        ///

    initialize: (parsed_config) ->
        parsed_config.value = @_parseTextContent(parsed_config)
        delete parsed_config.text_content
        @model = executor.getOrCreateVariable(parsed_config)

    @_parseConfig: (config_match) ->
        ###
            [
                "some_flag: on or off",
                "some_flag",
                "on",
                "off",
                index: 0,
                input: "some_flag: on or off"
            ]
        ###

        [
            name
            true_label
            false_label
        ] = config_match[1..3]

        return {
            name        : name
            true_label  : true_label
            false_label : false_label
        }

    _parseTextContent: (parsed_config) ->
        { text_content, true_label, false_label } = parsed_config

        matchLabel = (label) ->
            pattern = RegExp("(.*)#{ label }(.*)")
            group = text_content.match(pattern)
            return group

        default_value = undefined
        @_before_text = ''
        @_after_text = ''
        @_text_content = text_content

        true_group = matchLabel(true_label)
        if true_group
            default_value = true
            @_before_text = true_group[1]
            @_after_text = true_group[2]
        else
            false_group = matchLabel(false_label)
            if false_group
                default_value = false
                @_before_text = false_group[1]
                @_after_text = false_group[2]

        return default_value

    _template: """
        <span class="value">
            {{ before_text }}
            <span class="switch">•</span>
            <span class="undefined-label">{{ text_content }}</span>
            <span class="true-label">
                {{ true_label }}
            </span>
            <span class="false-label">
                {{ false_label }}
            </span>
            {{ after_text }}
        <span class="name">{{ name }}</span>
    """

    events:
        'click': '_toggleValue'

    _toggleValue: (e) ->
        @model.set
            value: not @model.get('value')
        @_onRender()
        e.preventDefault()

    _onRender: ->
        @$el.attr
            value: String(@model.get('value'))

    _getContext: ->
        return _.extend @model.toJSON(),
            before_text: @_before_text
            after_text: @_after_text
            text_content: @_text_content


module.exports = SwitchElement