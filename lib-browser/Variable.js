import { doc_variables } from "./state.js";

export default class Variable {

  static getOrCreate (name, initial_value) {
    if (doc_variables[name]) {
      return doc_variables[name];
    }
    return new Variable(name, initial_value);
  }

  constructor (name, initial_value=undefined, options={}) {
    this.is_dataset = options.is_dataset || false;
    this._element_callbacks = [];
    this._code_block_callbacks = [];
    this._name = name;
    this._value = initial_value;

    if (doc_variables[name]) {
      throw new Error(`Variable name repeated: ${ name }`);
    }

    doc_variables[name] = this;
  }
  onChange (callback, is_code_block=false) {
    if (is_code_block) {
      this._code_block_callbacks.push(callback);
    } else {
      this._element_callbacks.push(callback);
    }
  }
  getName () {
    return this._name;
  }
  getValue () {
    return this._value;
  }
  setValue (value, trigger_elements_only=false) {
    this._value = value;
    this._triggerOnChange(trigger_elements_only);
  }

  _triggerOnChange (trigger_elements_only=false) {
    this._element_callbacks.forEach((callback) => {
      callback(this._value, this._name);
    });
    if (!trigger_elements_only) {
      this._code_block_callbacks.forEach((callback) => {
        callback(this._value, this._name);
      });
    }
  }
}
