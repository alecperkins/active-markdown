import { describe, expect, test } from "vitest";
import Variable from "../../lib-browser/Variable";
import { doc_variables } from "../../lib-browser/state";

describe("Variable", () => {
  describe("constructor", () => {
    test("should throw if names are repeated", () => {
      const foo = new Variable("foo");
      const bar = new Variable("bar");
      expect(() => new Variable("foo")).toThrow();
      expect(doc_variables.foo).toStrictEqual(foo);
      expect(doc_variables.bar).toStrictEqual(bar);
    });
  });

  describe("getOrCreate", () => {
    test("should reuse variable instances", () => {
      const baz = new Variable("baz");
      const maybebaz = Variable.getOrCreate("baz");
      expect(baz).toStrictEqual(maybebaz);
    });
  });
});
