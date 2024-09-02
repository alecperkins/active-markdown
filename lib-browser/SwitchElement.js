import BaseElement from "./BaseElement.js";
import Variable from "./Variable.js";

export default class SwitchElement extends BaseElement {
  static config_pattern = new RegExp(`
    ^(                      # Variable
      [\\w\\d]+               # - name
    )

    :\\s                   # Delimiter

    (                       # true_label
        [\\w]+
    )

    \\sor\\s                  # or keyword

    (                       # false_label
        [\\w]+
    )$
  `.replace(/#.*\n/g,'').replace(/\s+/g,''));

  static _parseConfig (config_text) {
    const config_match = config_text.match(this.config_pattern);
    if (!config_match) { return null; }
    /*
        [
            "some_flag: on or off",
            "some_flag",
            "on",
            "off",
            index: 0,
            input: "some_flag: on or off"
        ]
    */

    const [
      _text,
      name,
      true_label,
      false_label,
    ] = config_match;

    return {
      name,
      true_label,
      false_label,
    };
  }

  static _parseTextContent (parsed_config, text_content) {
    const { true_label, false_label } = parsed_config

    function matchLabel (label) {
      const pattern = RegExp(`(.*)${ label }(.*)`);
      const group = text_content.match(pattern);
      return group;
    }

    let default_value = undefined;
    let before_text = '';
    let after_text = '';

    const true_group = matchLabel(true_label);
    if (true_group) {
      default_value = true;
      before_text = true_group[1];
      after_text = true_group[2];
    } else {
      const false_group = matchLabel(false_label)
      if (false_group) {
        default_value = false;
        before_text = false_group[1];
        after_text = false_group[2];
      }
    }
    return {
      default_value,
      before_text,
      after_text,
    };
  }

  constructor (el) {
    super(el);
    this.els = {};
    const parsed_config = SwitchElement._parseConfig(el.dataset.config);
    const parsed_text = SwitchElement._parseTextContent(parsed_config, el.textContent);
    this._true_label = parsed_config.true_label;
    this._false_label = parsed_config.false_label;
    this._before_text = parsed_text.before_text;
    this._after_text = parsed_text.after_text;
    this._text_content = el.textContent;
    this._name = parsed_config.name;
    this.variable = new Variable(parsed_config.name, parsed_text.default_value);
    this.variable.onChange(() => this._renderUpdate());
    this._renderInitial();
  }

  _renderInitial () {
    this.el.innerHTML = `<span class="_Indicator" aria-hidden="true">•</span><ruby><span class="_Value"></span><rp>(</rp><rt class="_Name"></rt><rp>)</rp></ruby>`;
    this.el.classList.add('SwitchElement');
    this.el.setAttribute('aria-role', "button");
    this.els.value = this.el.querySelector("._Value");
    this.els.name = this.el.querySelector("._Name");
    this.els.indicator = this.el.querySelector("._Indicator");
    this.els.name.textContent = this._name;
    this._renderUpdate();
    this._bindEvents();
  }

  _renderUpdate () {
    const value = this.variable.getValue();
    let display_val;
    if (value === true) {
      display_val = this._true_label;
      this.el.setAttribute('aria-pressed', true);
    } else if (value === false) {
      display_val = this._false_label;
      this.el.setAttribute('aria-pressed', false);
    } else {
      display_val = this._text_content;
      this.el.setAttribute('aria-pressed', 'mixed');
    }
    display_val = `${this._before_text || ''}${ display_val }${ this._after_text || '' }`;
    this.els.value.textContent = display_val;
  }

  _bindEvents () {
    this.el.addEventListener('click', this._toggleValue.bind(this));
    this.el.addEventListener('keydown', this._handleKeydown.bind(this));
  }

  _handleKeydown (e) {
    if (
      e.which === 32 // Space
      || e.which === 13 // Enter
    ) {
      e.preventDefault();
      this._toggleValue();
    }
  }

  _toggleValue (e) {
    const current = this.variable.getValue();
    if (current === true) {
      this.variable.setValue(false);
    } else {
      this.variable.setValue(true);
    }
  }
}
