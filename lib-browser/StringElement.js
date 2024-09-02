import Variable from "./Variable.js";
import BaseElement from "./BaseElement.js";

export default class StringElement extends BaseElement {
  readonly = true;
  static config_pattern = /(^[\w\d]+$)/;

  static _parseConfig (config_text) {
    const config_match = config_text.match(this.config_pattern);
    if (!config_match) { return null; }
    return {
      name: config_match[1],
    };
  }

  static _parseTextContent (parsed_config, text_content) {
    let default_value     = parsed_config.value;
    let before_text       = '';
    let after_text        = '';
    let display_precision = null;

    /*
        [
          '$200.0 per day',
          '$',
          '200',
          '.',
          '0',
          ' per day',
          index: 0,
          input: '$200.0 per day'
        ]
    */
    const pattern = /([a-zA-Z=:$ ]*)([\-\d]+)(\.?)(\d*)([%a-zA-Z=: ]*)/;
    const match_group = text_content.match(pattern);
    if (match_group) {
      const [
        _text,
        before_text_str,
        value_str,
        point_str,
        decimal_str,
        after_text_str,
      ] = match_group;
      before_text = before_text_str;
      after_text = after_text_str;
      default_value = parseFloat([value_str, point_str, decimal_str].join(''));
      if (point_str) {
        display_precision = decimal_str.length;
      }
    }
    return {
      default_value,
      before_text,
      after_text,
      display_precision,
    };
  }

  constructor (el) {
    super(el);
    this.els = {};
    const parsed_config = StringElement._parseConfig(el.dataset.config);
    const parsed_text = StringElement._parseTextContent(parsed_config, el.textContent);
    this._before_text = parsed_text.before_text;
    this._after_text = parsed_text.after_text;
    this._display_precision = parsed_text.display_precision;
    this._text_content = el.textContent;
    this.variable = Variable.getOrCreate(parsed_config.name);
    this.variable.onChange(() => this._renderUpdate());
    this._renderInitial();
  }

  _renderInitial () {
    this.el.innerHTML = `<ruby><span class="_Value"></span><rp>(</rp><rt class="_Name"></rt><rp>)</rp></ruby>`;
    this.el.classList.add('StringElement');
    this.els.value = this.el.querySelector('._Value');
    this.els.name = this.el.querySelector('._Name');
    this.els.name.textContent = this.variable.getName();
    this._renderUpdate();
  }

  _renderUpdate () {
    let value = this.variable.getValue();
    let display_value;
    if (value === undefined) {
      display_value = this._text_content;
    } else {
      // Automatically format percents
      if (typeof value === "number") {
        if (this._after_text === "%") {
          value = value * 100;
        }
        if (this._display_precision !== null) {
          display_value = value.toFixed(this._display_precision);
        } else {
          const fmt = new Intl.NumberFormat({
            // minimumFractionDigits: this._display_precision || undefined,
            // maximumFractionDigits: this._display_precision || undefined,
          });
          display_value = fmt.format(value);
        }
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          display_value = value.join(", ");
        } else {
          display_value = this._text_content;
        }
      } else {
        display_value = value.toString();
      }
    }
    display_value = `${ this._before_text || '' }${ display_value }${ this._after_text || '' }`;
    if (this.els.value.textContent !== display_value) {
      this.els.value.textContent = display_value;
      this._pingChanged();
    }
  }
}
