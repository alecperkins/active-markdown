
import { beforeAll, beforeEach, afterAll, describe, expect, test } from "vitest";
import { Window } from "happy-dom";

import StringElement from "../../lib-browser/StringElement";
import { doc_variables } from "../../lib-browser/state";


const valid_configs = [
  {
    raw: 'calories',
    conf: {
      name: 'calories',
    },
  },
  {
    raw: 'calories2',
    conf: {
      name: 'calories2',
    },
  },
  {
    raw: 'calories_asdf',
    conf: {
      name: 'calories_asdf',
    },
  },
  {
    raw: 'calories_2',
    conf: {
      name: 'calories_2'
    },
  },
];


const invalid_configs = [
    "calories-",
    "calories-asdf",
    "calories asdf",
    "calories.",
    "calories.a",
    "calories: 0..",
    "calories: ..",
    "calories: ... by 10",
    "calories: 10..100 by 10",
    "var_name: -10..10 by 1",
    "var_name: -10..10",
    "var_name: true or false",
    "var_name: this or that",
    "line=var_name: 10..100",
];


describe("StringElement",  () => {

  describe('_parseConfig', () => {

    describe("valid", () => {
      valid_configs.forEach((config) => {
        test('should match config ' + config.raw, () => {
          const parsed = StringElement._parseConfig(config.raw);
          for (const [k, v] of Object.entries(config.conf)) {
            if (v != null) {
              expect(parsed[k]).toEqual(v);
            } else {
              expect(parsed[k]).toEqual(null);
            }
          }
        });
      });
    });

    describe("invalid", () => {
      invalid_configs.forEach((raw) => {
        test('should not match config ' + raw, () => {
          const parsed = StringElement._parseConfig(raw);
          expect(parsed).toEqual(null);
        });
      });
    });
  });

  describe("_renderUpdate", () => {
    let window;
    let el;

    beforeAll(() => {
      window = new Window();
    });

    beforeEach(() => {
      el = document.createElement("span");
    });

    afterAll(() => {
      window.close();
    });

    test("formats with display precision", () => {
      el.dataset.config = "stringvar";
      el.textContent = "2.1"
      new StringElement(el);
      doc_variables["stringvar"].setValue(3.999999);
      expect(el.querySelector('._Value').textContent).toEqual("4.0");
    });

    test("joins array values", () => {
      el.dataset.config = "stringvar2";
      el.textContent = "abc"
      new StringElement(el);
      doc_variables["stringvar2"].setValue(["apples", "bananas"]);
      expect(el.querySelector('._Value').textContent).toEqual("apples, bananas");
    });

    test("handles empty array values", () => {
      el.dataset.config = "stringvar2b";
      el.textContent = "abc"
      new StringElement(el);
      doc_variables["stringvar2b"].setValue([]);
      expect(el.querySelector('._Value').textContent).toEqual("abc");
    });

    test("converts percentages", () => {
      el.dataset.config = "stringvar3";
      el.textContent = "2.1%"
      new StringElement(el);
      doc_variables["stringvar3"].setValue(0.7534);
      expect(el.querySelector('._Value').textContent).toEqual("75.3%");
    });

    test("formats numbers", () => {
      el.dataset.config = "stringvar4";
      el.textContent = "1,234"
      new StringElement(el);
      doc_variables["stringvar4"].setValue(5_678.12);
      expect(el.querySelector('._Value').textContent).toEqual("5,678.12");
    });
  })
});


