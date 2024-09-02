
import { describe, expect, test } from "vitest";

import RangeElement from "../../lib-browser/RangeElement";


const valid_configs = [
  {
    raw: 'calories: ..100 by 10',
    conf: {
        name: 'calories',
        min: null,
        max: 100,
        step: 10,
        inclusive: true,
    },
  },
  {
    raw: 'calories: 0..',
    conf: {
        name: 'calories',
        min: 0,
        max: null,
        step: 1,
        inclusive: true,
    },
  },
  {
    raw: 'calories: .. by 10',
    conf: {
        name: 'calories',
        min: null,
        max: null,
        step: 10,
        inclusive: true,
    },
  },
  {
    raw: 'calories: ..',
    conf: {
        name: 'calories',
        min: null,
        max: null,
        step: 1,
        inclusive: true,
    },
  },
  {
    raw: 'calories: ... by 10',
    conf: {
        name: 'calories',
        min: null,
        max: null,
        step: 10,
        inclusive: false,
    },
  },
  {
    raw: 'calories: 10..100 by 10',
    conf: {
        name: 'calories',
        min: 10,
        max: 100,
        step: 10,
        inclusive: true,
    },
  },
  {
    raw: 'var_name: -10..10 by 1',
    conf: {
        name: 'var_name',
        min: -10,
        max: 10,
        step: 1,
        inclusive: true,
    },
  },
  {
    raw: 'var_name: -10..10',
    conf: {
        name: 'var_name',
        min: -10,
        max: 10,
        step: 1,
        inclusive: true,
    },
  },
  {
    raw: 'var_name: -10..10 by 0.1',
    conf: {
        name: 'var_name',
        min: -10,
        max: 10,
        step: 0.1,
        inclusive: true,
    },
  },
  {
    raw: 'var_name: -10e..10ln2 by 0.1pi',
    conf: {
        name: 'var_name',
        min: -10 * Math.E,
        max: 10 * Math.LN2,
        step: 0.1 * Math.PI,
        inclusive: true,
    },
  },
  {
    raw: 'var_name: -10e...10ln2 by 0.1pi',
    conf: {
        name: 'var_name',
        min: -10 * Math.E,
        max: 10 * Math.LN2,
        step: 0.1 * Math.PI,
        inclusive: false,
    },
  },
  {
    raw: 'period: 0.25..4 by 0.25',
    conf: {
        name: 'period',
        min: 0.25,
        max: 4,
        step: 0.25,
        inclusive: true,
    },
  },
];


const invalid_configs = [
  "var_name: true or false",
  "var_name: this or that",
  "line=var_name: 10..100",
  "var_name",
  "var_name: -10e...10ln2 by 0.1pINVALIDi",
  "var_name: -10e...10lnINVALID2 by 0.1pi",
  "var_name: -10INVALIDe...10ln2 by 0.1pi",
  "var_name -10e...10ln2 by 0.1pi",
  "var_name: -10e...10ln2 by pi0.1",
];


describe("RangeElement",  () => {

  describe('_parseConfig', () => {

    describe("valid", () => {
      valid_configs.forEach((config) => {
        test('should match config ' + config.raw, () => {
          const parsed = RangeElement._parseConfig(config.raw);
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
          const parsed = RangeElement._parseConfig(raw);
          expect(parsed).toEqual(null);
        });
      });
    });
  });
});


