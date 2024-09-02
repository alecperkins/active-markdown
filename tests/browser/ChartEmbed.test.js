
import { describe, expect, test } from "vitest";

import ChartEmbed from "../../lib-browser/ChartEmbed";


const valid_configs = [
  {
    raw: 'line=fn: ..100 by 10',
    conf: {
      name: 'fn',
      min: null,
      max: 100,
      step: 10,
      inclusive: true,
      type: 'line',
    },
  },
  {
    raw: 'line=fn: 0..',
    conf: {
      name: 'fn',
      min: 0,
      max: null,
      step: 1,
      inclusive: true,
      type: 'line',
    },
  },
  {
    raw: 'line=fn: .. by 10',
    conf: {
      name: 'fn',
      min: null,
      max: null,
      step: 10,
      inclusive: true,
      type: 'line',
    },
  },
  {
    raw: 'scatter=fn: ..',
    conf: {
      name: 'fn',
      min: null,
      max: null,
      step: 1,
      inclusive: true,
      type: 'scatter',
    },
  },
  // {
  //   raw: 'scatter=fn: minx..maxx by foo',
  //   conf: {
  //     name: 'fn',
  //     min: 'minx',
  //     max: 'maxx',
  //     step: 'foo',
  //     inclusive: true,
  //     type: 'scatter',
  //   },
  // },
  {
    raw: 'scatter=fn: ... by 10',
    conf: {
      name: 'fn',
      min: null,
      max: null,
      step: 10,
      inclusive: false,
      type: 'scatter',
    },
  },
  {
    raw: 'scatter=fn: 10..100 by 10',
    conf: {
      name: 'fn',
      min: 10,
      max: 100,
      step: 10,
      inclusive: true,
      type: 'scatter',
    },
  },
  {
    raw: 'scatter=fn_name: -10..10 by 1',
    conf: {
      name: 'fn_name',
      min: -10,
      max: 10,
      step: 1,
      inclusive: true,
      type: 'scatter',
    },
  },
  {
    raw: 'scatter=fn_name: -10..10',
    conf: {
      name: 'fn_name',
      min: -10,
      max: 10,
      step: 1,
      inclusive: true,
      type: 'scatter',
    },
  },
  {
    raw: 'scatter=fn_name: -10..10 by 0.1',
    conf: {
      name: 'fn_name',
      min: -10,
      max: 10,
      step: 0.1,
      inclusive: true,
      type: 'scatter',
    },
  },
  {
    raw: 'scatter=fnName: -10e..10ln2 by 0.1pi',
    conf: {
      name: 'fnName',
      min: -10 * Math.E,
      max: 10 * Math.LN2,
      step: 0.1 * Math.PI,
      inclusive: true,
      type: 'scatter',
    },
  },
  {
    raw: 'bar=fnName: -10e...10ln2 by 0.1pi',
    conf: {
      name: 'fnName',
      min: -10 * Math.E,
      max: 10 * Math.LN2,
      step: 0.1 * Math.PI,
      inclusive: false,
      type: 'bar',
    },
  },
];

const invalid_configs = [
  "var_name: true or false",
  "var_name: this or that",
  "var_name",
  "var_name: -10e...10ln2 by 0.1pi",
  "var_name: -10e...10ln2",
  "var_name: -10e...10ln2 by 0.1",
  "scINVALID=var_name: -10e...10ln2 by 0.1",
  "line=var_name: -10e...10ln2 by 0.1pINVALIDi",
  "line=var_name: -10e...10lnINVALID2 by 0.1pi",
  "line=var_name: -10INVALIDe...10ln2 by 0.1pi",
  "line=var_name -10e...10ln2 by 0.1pi",
  "line=var_name: -10e...10ln2 by pi0.1",
];

const valid_text_labels = [
  {
    raw: 'y vs x',
    labels: {
      y_label: ['y'],
      x_label: 'x',
    },
  },
  {
    raw: 'money vs time',
    labels: {
      y_label: ['money'],
      x_label: 'time',
    },
  },
  {
    raw: 'whimsical thoughts over time',
    labels: {
      y_label: ['whimsical thoughts'],
      x_label: 'time',
    },
  },
  {
    raw: 'whimsical thoughts per day dream',
    labels: {
      y_label: ['whimsical thoughts'],
      x_label: 'day dream',
    },
  },
  {
    raw: 'pirates by hour',
    labels: {
      y_label: ['pirates'],
      x_label: 'hour',
    },
  },
  {
    raw: 'multiple,series by unit',
    labels: {
      y_label: ['multiple', 'series'],
      x_label: 'unit',
    },
  },
  {
    raw: 'global temperature',
    labels: {
      y_label: null,
      x_label: null,
    },
  },
  {
    raw: 'global temperature by',
    labels: {
      y_label: null,
      x_label: null,
    },
  },
];


describe("ChartEmbed", () => {
  describe("_parseConfig", () => {

    describe("valid", () => {
      valid_configs.forEach((config) => {
        test('should match config ' + config.raw, () => {
          const parsed = ChartEmbed._parseConfig(config.raw);
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
          const parsed = ChartEmbed._parseConfig(raw);
          expect(parsed).toEqual(null);
        });
      });
    });

  });

  describe("_parseTextContent", () => {
    test("should parse inner text", () => {
      valid_text_labels.forEach((label) => {
        const result = ChartEmbed._parseTextContent({
          name: 'fn_name',
          min: -10,
          max: 10,
          step: 1,
          inclusive: true,
          type: 'scatter',
        }, label.raw);
        expect(result.x_label).toEqual(label.labels.x_label);
        expect(result.y_label).toEqual(label.labels.y_label);
      });
    });
  });

});

