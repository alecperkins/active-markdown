import CodeEditor from "./CodeEditor.js";
import { doc_variables } from "./state.js";

export default class Executor {

  constructor (amd_meta) {
    this._amd_meta = amd_meta;
    this._code_blocks = [];
    Object.entries(doc_variables).forEach(([name, variable]) => {
      variable.onChange(this.run.bind(this), true);
    });
  }

  addBlock (block) {
    block.el.classList.add('ActiveCodeBlock');
    block.editor = new CodeEditor(block.el);
    block.editor.onChange(this.run.bind(this));
    this._code_blocks.push(block);
  }

  run () {
    this._execute();
  }

  _execute () {
    if (this._code_blocks.length === 0) {
      return;
    }
    const user_source = this._code_blocks.map(b => b.editor.getValue()).join(';\n'); // ; to guard against poorly placed )s
    const input = {};
    Object.entries(doc_variables).forEach(([name, variable]) => {
      input[name] = variable.getValue();
    });
    const var_list = Object.keys(doc_variables);
    const var_name_spread = var_list.length > 0 ? `{${var_list.join(',')}}` : '{__empty_var_list}';
    const full_source = `
let ${ var_name_spread } = __amd_input;
let meta = __amd_meta;
${user_source}
;return ${var_name_spread};
`;
    let output;
    let fn;
    try {
      fn = Function("__amd_input", "__amd_meta", full_source);
    } catch (error) {
      // Compilation errors are fine since they will happen while editing the code.
      console.debug(error);
      output = {...input};
    }

    if (fn) {
      try {
        output = fn.call(null, {...input}, this._amd_meta);
      } catch (error) {
        console.error(error);
        output = {...input};
      }
    }
    Object.keys(input).forEach((name) => {
      if (doc_variables[name]) {
        const value = output[name];
        doc_variables[name].setValue(value, true);
      } else {
        throw new Error(`Attempted assignment to unknown Document variable: ${name}`);
      }
    });
  }

}
