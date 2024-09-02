import CodeEditor from "./CodeEditor";
import Variable from "./Variable";
import { parse } from "csv-parse/browser/esm/sync";
import { registerEmbed } from "./state";

export default class DatasetEmbed {

  static bindToCodeBlocks () {
    const maybe_csv_blocks = document.querySelectorAll('pre > code[class^=language-csv]');
    const maybe_json_blocks = document.querySelectorAll('pre > code[class^=language-json]');
    [...maybe_csv_blocks, ...maybe_json_blocks].forEach((maybe_block) => {
      const [format, name] = maybe_block.className.replace('language-','').split('=');
      if (['csv','json'].includes(format) && name) {
        new DatasetEmbed(maybe_block, format, name);
      }
    });
  }

  constructor (el, format, name) {
    this.el = el;
    const raw = el.textContent;
    let value;
    if (format === "csv") {
      value = parseCSV(raw);
    } else if (format === "json") {
      value = JSON.parse(raw);
    }
    this.variable = new Variable(name, value, { is_dataset: true });

    this._format = format;
    this._name = name;
    this.els = {};
    this._renderInitial();
    registerEmbed(this);
  }

  _renderInitial () {
    const old_el = this.el;
    const raw_initial = this.el.textContent;
    this.el = document.createElement('div');
    this.el.classList.add('DatasetEmbed');
    old_el.parentNode.parentNode.insertBefore(this.el, old_el.parentNode);
    old_el.parentNode.remove();
    this.els.data = document.createElement('div');
    this.els.data.classList.add('_Data');
    this.els.data.textContent = raw_initial;
    this.el.appendChild(this.els.data);
    this.els.config = document.createElement('div');
    this.els.config.classList.add('_Config');
    this.els.config.textContent = `[${this._format}] ${ this._name }`;
    this.el.appendChild(this.els.config);
    this._editor = new CodeEditor(this.els.data, this._format);
    this._editor.onChange(this._handleChange.bind(this));
  }

  _handleChange () {
    const val = this._editor.getValue();
    if (this._format === "json") {
      this.variable.setValue(JSON.parse(val));
    } else if (this._format === "csv") {
      this.variable.setValue(parseCSV(val));
    }
  }

}

function parseCSV (raw) {
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    cast_date: true,
    cast: (value, context) => {
      const as_num = Number(value);
      if (!Number.isNaN(as_num)) {
        return as_num;
      }
      return value;
    },
  });
}
