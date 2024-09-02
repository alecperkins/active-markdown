// // index.ts
// import "prism-code-editor/prism/languages/markup"
// import "prism-code-editor/prism/languages/css-extras"
import "prism-code-editor/prism/languages/javascript"
import "prism-code-editor/prism/languages/json"
import "prism-code-editor/prism/languages/csv"

import { createEditor } from "prism-code-editor"
import { matchBrackets } from "prism-code-editor/match-brackets"
import { indentGuides } from "prism-code-editor/guides"

// // Importing styles
// import "prism-code-editor/layout.css"
// import "prism-code-editor/scrollbar.css"
// import "prism-code-editor/themes/github-dark.css"



// import('./extensions')

export default class CodeEditor {
  constructor (el, language="javascript") {
    this.el = el;
    this.el.classList.add('CodeEditor');
    // this.el.setAttribute('contenteditable', true);
    this._callbacks = [];
    const initial_value = this.el.textContent;
    this.el.textContent = '';
    this._editor = createEditor(
      this.el,
      {
        language,
        value: initial_value,
        lineNumbers: false,
        onUpdate: this._triggerChange.bind(this),
      },
      indentGuides(),
      matchBrackets(),
    );
  }
  onChange (callback) {
    this._callbacks.push(callback);
  }

  _triggerChange () {
    this._callbacks.forEach((fn) => {
      fn();
    });
  }

  getValue () {
    return this._editor.value;
  }
}
