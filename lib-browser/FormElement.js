import BaseElement from "./BaseElement";
import Variable from "./Variable";

export default class FormElement extends BaseElement {
  constructor (el) {
    super(el);
    this.el.classList.add('FormElement');
    const name = this.el.getAttribute('name');
    this._variable = new Variable(name);
    this.el.addEventListener('change', this._triggerUpdate.bind(this));
    this._triggerUpdate({ target: this.el }); // Get the initial value from the markup
  }

  _triggerUpdate (e) {
    if (this.el.options && this.el.multiple) {
      const value = [];
      for (const option of this.el.options) {
        if (option.selected) {
          value.push(option.value);
        }
      }
      this._variable.setValue(value);
    } else {
      this._variable.setValue(e.target.value);
    }

  }
}
