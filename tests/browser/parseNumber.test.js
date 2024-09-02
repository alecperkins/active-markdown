
import { describe, expect, test } from "vitest";

import parseNumber from "../../lib-browser/parseNumber";

describe("parseNumber", () => {

  test('should handle integers', () => {
    expect(parseNumber('1')).toEqual(1);
    expect(parseNumber('0')).toEqual(0);
    expect(parseNumber('-1')).toEqual(-1);
    expect(parseNumber('01')).toEqual(1);
    expect(parseNumber('10')).toEqual(10);
  });

  test('should handle floats', () => {
    expect(parseNumber('1.1')).toEqual(1.1);
    expect(parseNumber('1.0')).toEqual(1.0);
    expect(parseNumber('0.6')).toEqual(0.6);
    expect(parseNumber('0.0')).toEqual(0.0);
    expect(parseNumber('-0.6')).toEqual(-0.6);
    expect(parseNumber('-1.0')).toEqual(-1.0);
    expect(parseNumber('-1.1')).toEqual(-1.1);
    expect(parseNumber('1.1111')).toEqual(1.1111);
    expect(parseNumber('01.1111')).toEqual(1.1111);

  });

  test('should handle constants', () => {
    expect(parseNumber('1.1pi')).toEqual(1.1 * Math.PI);
    expect(parseNumber('+1.1pi')).toEqual(1.1 * Math.PI);
    expect(parseNumber('+pi')).toEqual(Math.PI);
    expect(parseNumber('pi')).toEqual(Math.PI);
    expect(parseNumber('0pi')).toEqual(0 * Math.PI);
    expect(parseNumber('-pi')).toEqual(-1 * Math.PI);
    expect(parseNumber('-5.2pi')).toEqual(-5.2 * Math.PI);

  });

});
