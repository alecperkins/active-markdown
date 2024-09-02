import { registerElement } from "./state";

export default class BaseElement {
  constructor (el) {
    this.el = el;
    this.el.classList.add("BaseElement");
    this.el.setAttribute("tabindex", 0);
    this._active_ping_timeout = null;
    registerElement(this);
  }
  _pingChanged () {
    clearTimeout(this._active_ping_timeout);
    this.el.dataset.is_active = true;
    this._active_ping_timeout = setTimeout(() => {
      this.el.dataset.is_active = false;
    }, 2000);
  }
}
