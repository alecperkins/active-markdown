import { LineChart, BarChart, AutoScaleAxis, FixedScaleAxis } from "chartist";
import debounce from "./debounce.js";
import parseNumber from "./parseNumber.js";
import parseStep from "./parseStep.js";
import parseInclusivity from "./parseInclusivity.js";
import Variable from "./Variable.js";
import { registerEmbed } from "./state.js";

export default class ChartEmbed {
  static config_pattern = new RegExp(`
    ^
      (                      # Chart
        [line|scatter|bar]+   # - type
      )

        =

      (                      # Variable
        [\\w\\d]+               # - name
      )

        :\\s                   # Delimiter

      (                       # Range min, if any:
        (?:
        [+|-]?                        # - sign, if any
        (?:[\\d]*[\\.]?[\\d]+)?          # - coefficient, if any
        [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
        ) # TODO: | (?:[a-z0-9_]+)? # Variable-driven
      )

      (                       # Inclusivity
        [\\.]{2,3}             # - dots
      )

      (                       # Range max, if any:
        (?:
        [+|-]?                        # - sign, if any
        (?:[\\d]*[\\.]?[\\d]+)?          # - coefficient, if any
        [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
        ) # TODO: | (?:[a-z0-9_]+)? # Variable-driven
      )

      (                       # Step, if any:
        \\sby\\s                # - by keyword

          (?:(?:                 # - step value
            [+|-]?                        # - sign, if any
            (?:[\\d]*[\\.]?[\\d]+)?          # - coefficient, if any
            [102EGILONQPSRT_egilonqpsrt]* # - constant, if any
          ) # TODO: | (?:[a-z0-9_]+)? # Variable-driven
          )

      )*$
  `.replace(/#.*\n/g,'').replace(/\s+/g,''));

  static _parseConfig (config_text) {
    const config_match = config_text.match(this.config_pattern);
    if (!config_match) { return null; }
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

    const [_text, type, var_name, min_str, dots, max_str, step_str] = config_match;

    let min;
    if (min_str) {
      min = parseNumber(min_str);
      // if (Number.isNaN(min)) {
      //   min = min_str;
      // }
    } else {
      min = null;
    }

    let max;
    if (max_str) {
      max = parseNumber(max_str);
      // if (Number.isNaN(max)) {
      //   max = max_str;
      // }
    } else {
      max = null;
    }

    let val;
    if (min && max) {
      // TODO: align this to the step
      val = (max - min) / 2;
    } else {
      val = 0;
    }

    const step = parseStep(step_str);

    return {
      name        : var_name,
      min         : min,
      max         : max,
      inclusive   : parseInclusivity(dots),
      step        : step,
      value       : val,
      type        : type,
    }
  }

  /*
  # TODO: This could be cleaned up across elements, particularly so it's
  # more testable.
  ###
  Private: parse the text content of the element for axes labels.

  text_content - the String text version of the element

  Returns an Object with the x and y labels.
  */
  static _parseTextContent (parsed_config, text_content) {
    const label_config = {
      y_label: null,
      x_label: null,
    };
    const pattern = /([ \-_\w\d,]+\s)(vs|over|per|by)(\s[ \-_\w\d]+)/
    const matched = text_content.match(pattern)?.slice(1,4);
    label_config.y_label = matched?.[0].trim().split(',') || null;
    label_config.x_label = matched?.[2].trim() || null;
    return label_config;
  }


  constructor (el) {
    this.el = el;
    const parsed_config = ChartEmbed._parseConfig(el.dataset.config)
    const parsed_text = ChartEmbed._parseTextContent(parsed_config, el.textContent);
    this._x_label = parsed_text.x_label || '';
    this._y_label = parsed_text.y_label;
    this._config = parsed_config;

    const boundRender = () => window.requestAnimationFrame(this._renderUpdate.bind(this));

    window.addEventListener('resize', debounce(boundRender, 250));
    window.requestAnimationFrame(this._renderInitial.bind(this));

    this.variable = Variable.getOrCreate(parsed_config.name);
    this.variable.onChange(boundRender);

    // TODO: support variable driven ranges
    // this._min_var = null;
    // if (typeof this._config.min === "string") {
    //   this._min_var = Variable.getOrCreate(this._config.min);
    //   this._min_var.onChange(boundRender);
    // }
    // this._max_var = null;
    // if (typeof this._config.max === "string") {
    //   this._max_var = Variable.getOrCreate(this._config.max);
    //   this._max_var.onChange(boundRender);
    // }
    // this._step_var = null;
    // if (typeof this._config.step === "string") {
    //   this._step_var = Variable.getOrCreate(this._config.step);
    //   this._step_var.onChange(boundRender);
    // }
    registerEmbed(this);
  }

  _renderInitial () {
    this.el.classList.add('ChartEmbed');
    this.el.innerHTML = '';
    this.els = {};
    this.els.canvas = document.createElement('div');
    this.els.canvas.classList.add('_Canvas');
    this.el.appendChild(this.els.canvas);
    this.els.config = document.createElement('div');
    this.els.config.classList.add('_Config');
    this.el.appendChild(this.els.config);
    this.els.config.textContent = this.el.dataset.config;
    switch (this._config.type) {
      case "line":
      case "scatter": {
        this._chart = new LineChart(this.els.canvas);
        break;
      }
      case "bar": {
        this._chart = new BarChart(this.els.canvas);
        break;
      }
    }
    this._renderUpdate();
  }

  _renderUpdate () {
    if (!this._chart) { return; }
    const value = this.variable.getValue();
    if (!value) { return; }

    const points = [];
    const x_name = this._x_label || 'x';
    const y_names = this._y_label || ['y'];

    if (typeof value === "function") {
      let step = 1;
      if (this._step_var) {
        step = this._step_var.getValue();
      } else if (this._config.step != null) {
        step = this._config.step;
      }

      let min_x = 0;
      if (this._min_var) {
        min_x = this._min_var.getValue();
      } else if (this._config.min != null) {
        min_x = this._config.min;
      }

      let max_x = 100;
      if (this._max_var) {
        max_x = this._max_var.getValue();
      } else if (this._config.max != null) {
        max_x = this._config.max;
      }
      if (!this._config.inclusive) {
        max_x -= step;
      }

      for (let _x = min_x; _x <= max_x; _x += step) {
        const result = value(_x);
        if (result == null) { continue; }
        if (typeof result === "object") {
          points.push(result);
        } else {
          points.push({ [x_name]: _x, [y_names[0]]: result });
        }
      }
    } else if (this.variable.is_dataset) {
      points.push(...value.filter(point => {
        let min;
        const _min = this._min_var ? this._min_var.getValue() : this._config.min;
        if (_min != null) {
          min = _min;
        }
        let max;
        const _max = this._max_var ? this._max_var.getValue() : this._config.max;
        if (_max != null) {
          max = _max;
          if (this._config.inclusive) {
            max += this._config.step;
          }
        }
        if (min == null && max == null) {
          return true;
        }
        return (
          (point[x_name] >= min)
          && (point[x_name] < max)
          // TODO filter y by @ rules
        );
      }));
    }
    let data = {};
    const options = {};
    const labels = [];
    const series_by_name = {};
    const seen_labels = new Set();
    points.forEach(point => {
      if (!seen_labels.has(point[x_name])) {
        labels.push(point[x_name]);
        seen_labels.add(point[x_name]);
      }
      y_names.forEach(y_name => {
        if (point[y_name] != null) { // Allow functions to omit certain attributes
          series_by_name[y_name] ??= [];
          series_by_name[y_name].push(point[y_name]);
        }
      });
    });

    if (this._config !== "bar") {
      if (typeof labels[0] === "string") {
        // options.axisX = {
        //   type: FixedScaleAxis,
        //   divisor: 5,
        // };
      } else {
        options.axisX = {
          type: AutoScaleAxis,
          onlyInteger: this._config.max && (this._config.max % 1 === 0),
        };
      }
      // TODO: use the @ 2..3 by 3 config to set this
      // axisY: {
      //   type: Chartist.FixedScaleAxis,
      //   ticks: [0, 50, 75, 87.5, 100],
      //   low: 0
      // },
      const series = Object.values(series_by_name);
      if (series.length === 1 && typeof labels[0] === "number") {
        data = {
          labels,
          series: [series[0].map((y,i) => ({ x: labels[i], y }))],
        };
      } else {
        data = {
          labels,
          series,
        };
      }
      options.showPoint = this._config.type === "scatter";
      options.showLine = this._config.type === "line";
    } else {
      data = {
        labels,
        series: Object.values(series_by_name),
      };
    }

    this._chart.update(data, options);
  }

}
