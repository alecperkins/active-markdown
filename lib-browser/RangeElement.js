import BaseElement from "./BaseElement.js";
import Variable from "./Variable.js";
import parseInclusivity from "./parseInclusivity.js";
import parseNumber from "./parseNumber.js";
import parseStep from "./parseStep.js";

import { drag_manager } from "./state.js";

export default class RangeElement extends BaseElement {
  static config_pattern = new RegExp(`
    ^(                      # Variable
      [\\w\\d]+               # - name
    )

      :\\s                   # Delimiter

    (                       # Range min, if any:
      [+|-]?                        # - sign, if any
      (?:[\\d]*[\\.]?[\\d]+)?          # - coefficient, if any
      [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
    )

    (                       # Inclusivity
      [\\.]{2,3}             # - dots
    )

    (                       # Range max, if any:
      [+|-]?                        # - sign, if any
      (?:[\\d]*[\\.]?[\\d]+)?          # - coefficient, if any
      [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
    )

    (                       # Step, if any:
      \\sby\\s                # - by keyword

        (?:                 # - step value
          [+|-]?                        # - sign, if any
          (?:[\\d]*[\\.]?[\\d]+)?          # - coefficient, if any
          [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
        )

    )*$
  `.replace(/#.*\n/g,'').replace(/\s+/g,'')
  );

  /*
  [
      "calories: 10..100 by 10",
      "calories",
      "10",
      "..",
      "100",
      " by 10",
      index: 0,
      input: "calories: 10..100 by 10"
  ]
  */
  static _parseConfig (config_text) {
    const config_match = config_text.match(this.config_pattern);
    if (!config_match) { return null; }

    const [text, var_name, min_str, dots, max_str, step_str] = config_match;
    let min;
    let max;
    let initial_value;

    if (min_str) {
      min = parseNumber(min_str);
    } else {
    min = null;
    }

    if (max_str) {
      max = parseNumber(max_str)
    } else {
      max = null
    }

    if (min && max) {
      initial_value = (max - min) / 2
    } else {
      initial_value = 0
    }

    const config = {
      name        : var_name,
      min         : min,
      max         : max,
      inclusive   : parseInclusivity(dots),
      step        : parseStep(step_str),
      value       : initial_value,
    };
    return config;
  }

  /*
    Private: parse the text content of the element for default value, display
             precision, and additional text.

    text_content - the String text version of the element

    Return the default value for the variable.
  */
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
    const pattern = /([a-zA-Z=:$ ]*)([\-\d]+)(\.?)(\d*)([a-zA-Z=: ]*)/;
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
    const parsed_config = RangeElement._parseConfig(el.dataset.config);
    const parsed_text = RangeElement._parseTextContent(parsed_config, el.textContent);
    this._before_text = parsed_text.before_text;
    this._after_text = parsed_text.after_text;
    this._display_precision = parsed_text.display_precision;
    this._text_content = el.textContent;
    this.variable = new Variable(parsed_config.name, parsed_text.default_value);
    this.variable.onChange(() => this._renderUpdate());
    this._initial_value = parsed_text.default_value;
    this._config = parsed_config;
    this._renderInitial();
    this._last_click = 0;
    this._drag_manager = drag_manager;
  }

  _renderInitial () {
    this.el.innerHTML = `<ruby><span class="_Value"></span><rp>(</rp><rt class="_Name"></rt><rp>)</rp></ruby><span class="_Indicator" aria-role="hidden"></span>`;
    this.el.classList.add('RangeElement');
    this.el.setAttribute('aria-role', "slider");
    this.el.setAttribute('aria-valuemin', this._config.min);
    this.el.setAttribute('aria-valuemax', this._config.max);
    this.els.value = this.el.querySelector('._Value');
    this.els.name = this.el.querySelector('._Name');
    this.els.name.textContent = this.variable.getName();
    this.els.indicator = this.el.querySelector('._Indicator');
    this._renderUpdate();
    this._bindEvents();
  }

  _bindEvents () {
    this.el.addEventListener('mousedown', this._startDragging.bind(this));
    this.el.addEventListener('touchstart', this._startDragging.bind(this));
    this.el.addEventListener('click', this._reset.bind(this));
    this.el.addEventListener('keydown', this._handleKeydown.bind(this));
  }

  _handleKeydown (e) {
    if (
      e.which === 37 // Left Arrow
      || e.which === 40 // Down Arrow
    ) {
      e.preventDefault();
      this._decrement(e.shiftKey ? this._config.step * 10 : this._config.step);
    } else if (
      e.which === 39 // Right Arrow
      || e.which === 38 // Up Arrow
    ) {
      e.preventDefault();
      this._increment(e.shiftKey ? this._config.step * 10 : this._config.step);
    } else if (
      e.which === 13 // Enter
    ) {
      e.preventDefault();
      this._reset();
    }
  }

  _increment (magnitude) {
    if (!magnitude) {
      magnitude = this._config.step;
    }
    const current_value = this.variable.getValue();
    let new_value = current_value + magnitude;
    if (this._config.max != null) {
      if (this._config.inclusive) {
        if (new_value > this._config.max) {
          new_value = this._config.max;
        }
      } else {
        if (new_value > this._config.max - this._config.step) {
          new_value = this._config.max - this._config.step;
        }
      }
    }
    this.variable.setValue(new_value);
  }

  _decrement (magnitude) {
    if (!magnitude) {
      magnitude = this._config.step;
    }
    const current_value = this.variable.getValue();
    let new_value = current_value - magnitude;
    if (this._config.min != null) {
      if (new_value < this._config.min) {
        new_value = this._config.min;
      }
    }
    this.variable.setValue(new_value);
  }

  _startDragging (e) {
    e.preventDefault();
    this._drag_start_value = this.variable.getValue();
    this._drag_manager.start(e, this, 'x');
    this.el.dataset.is_active = true;
  }

  onDrag ({ x_start, y_start, x_delta, y_delta }) {
    const max = this._config.max;
    const min = this._config.min;
    const step = this._config.step;
    let px_per_step;
    if (max != null && min != null) {
      px_per_step = Math.min((window.innerWidth / (max - min / step)), 25); // Keep the step size close to a comfortable touch target
    } else {
      px_per_step = 25;
    }
    const value_delta = Math.floor(x_delta / px_per_step) * step;
    let new_val = this._drag_start_value + value_delta;

    if (max != null) {
      const inclusive = this._config.inclusive;
      if (
        (inclusive && new_val > max)
        || (!inclusive && new_val >= max)
      ) {
        new_val = max;
        if (!inclusive) {
          new_val -= this._config.step;
        }
      }
    }
    if (min != null && new_val < min) {
      new_val = min
    }
    if (this.variable.getValue() !== new_val) {
      this.variable.setValue(new_val);
    }
  }

  stopDragging (ui) {
    this.el.dataset.is_active = false;
    this._drag_start_value = null;
  }

  _reset () {
    const now = Date.now();
    if (now - this._last_click < 500) {
      this.variable.setValue(this._initial_value);
    }
    this._last_click = now;
  }

  _renderUpdate () {
    const value = this.variable.getValue();

    if (value === undefined) {
      this.el.setAttribute('aria-valuetext', this._text_content);
      this.els.value.textContent = this._text_content;
      return;
    }

    let display_val;
    if (this._display_precision != null) {
      display_val = value.toFixed(this._display_precision);
    } else {
      display_val = value;
    }
    display_val = `${this._before_text || ''}${ display_val }${ this._after_text || '' }`;
    this.el.setAttribute('aria-valuetext', display_val);
    this.el.setAttribute('aria-valuenow', value);
    this.els.value.textContent = display_val;
    if (this._config.max != null && this._config.min != null) {
      const max = this._config.inclusive ? this._config.max : this._config.max - this._config.step;
      const min = this._config.min;
      const progress = (value - min) / (max - min);
      this.els.indicator.style.width = `${ progress * 100 }%`;
    }
  }

}
