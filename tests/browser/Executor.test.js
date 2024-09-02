import { describe, expect, test } from "vitest";
import { Window } from "happy-dom";

import Executor from "../../lib-browser/Executor";
import Variable from "../../lib-browser/Variable";

describe("Executor", () => {

  test("runs code with input and returns output", () => {
    const window = new Window();
    const el1 = window.document.createElement('div');
    el1.textContent = `
      var2 = var1 * 2;
    `;
    const el2 = window.document.createElement('div');
    el2.textContent = `
      p = (arg) => { return var2 * var1 + arg; }
    `;

    const var1 = new Variable("var1", 4);
    const var2 = new Variable("var2");
    const p = new Variable("p");
    const executor = new Executor({});

    executor.addBlock({ el: el1 });
    executor.addBlock({ el: el2 });

    var1.setValue(5);

    expect(var1.getValue()).toEqual(5);
    expect(var2.getValue()).toEqual(10);
    expect(p.getValue()(2)).toEqual(52);

    window.close();
  });
});

// "tolerates compilation errors"
// "tolerates execution errors"
// "tolerates no code"
// "tolerates no variables"

