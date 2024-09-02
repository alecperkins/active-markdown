
import { describe, expect, test } from "vitest";

import parseStep from "../../lib-browser/parseStep";

describe('parseStep', () => {

  test('should default to 1', () => {
    expect(parseStep('')).toEqual(1);
  });

  test('should handle ints', () => {
    expect(parseStep(' by 1')).toEqual(1);
    expect(parseStep(' by 0')).toEqual(0);
    expect(parseStep(' by -1')).toEqual(-1);
    expect(parseStep(' by -01')).toEqual(-1);
    expect(parseStep(' by -10')).toEqual(-10);
  });

  test('should handle floats', () => {
    expect(parseStep(' by 1.1')).toEqual(1.1);
    expect(parseStep(' by 1.0')).toEqual(1.0);
    expect(parseStep(' by 0.6')).toEqual(0.6);
    expect(parseStep(' by 0.0')).toEqual(0.0);
    expect(parseStep(' by -0.6')).toEqual( -0.6);
    expect(parseStep(' by -1.0')).toEqual( -1.0);
    expect(parseStep(' by -1.1')).toEqual( -1.1);
  });

  test('should handle constants', () => {
    expect(parseStep(' by 1.1pi')).toEqual(1.1 * Math.PI);
    expect(parseStep(' by pi' )).toEqual(Math.PI);
    expect(parseStep(' by 0pi' )).toEqual(0 * Math.PI);
    expect(parseStep(' by -5.2pi')).toEqual(-5.2 * Math.PI);
  });

});
