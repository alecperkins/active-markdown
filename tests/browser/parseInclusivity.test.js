
import { describe, expect, test } from "vitest";

import parseInclusivity from "../../lib-browser/parseInclusivity";

describe('parseInclusivity', () => {

  test('should detect inclusive', () => {
    expect(parseInclusivity('..')).toEqual(true);
  });

  test('should detect exclusive', () => {
    expect(parseInclusivity('...')).toEqual(false);
  });

});
