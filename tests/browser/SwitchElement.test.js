import { describe, expect, test } from "vitest";
import SwitchElement from "../../lib-browser/SwitchElement";

const valid_configs = [
  {
    raw: 'var_name: true or false',
    conf: {
      name: 'var_name',
      true_label: 'true',
      false_label: 'false',
    },
  },
  {
    raw: 'var_name: on or off',
    conf: {
      name: 'var_name',
      true_label: 'on',
      false_label: 'off',
    },
  },
  {
    raw: 'var_name: bah or humbug',
    conf: {
      name: 'var_name',
      true_label: 'bah',
      false_label: 'humbug',
    },
  },
]

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
  "line=var_name: 10..100",
];


describe("SwitchElement",  () => {

  describe('_parseConfig', () => {

    describe("valid", () => {
      valid_configs.forEach((config) => {
        test('should match config ' + config.raw, () => {
          const parsed = SwitchElement._parseConfig(config.raw);
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
          const parsed = SwitchElement._parseConfig(raw);
          expect(parsed).toEqual(null);
        });
      });
    });
  });
});
