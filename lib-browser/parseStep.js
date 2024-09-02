
import parseNumber from "./parseNumber.js";

// The step of a range defaults to 1, but can be specified using the `by` keyword after the min/max. The step is an Active Markdown Number, and can include the constants described above.
//
// A range described with `0..10` will have a step of `1`, while `0..10 by 0.1` will have a step of `0.1`, and `0..10 by pi` will have a step of `Math.PI`.
export default function parseStep (val) {
  if (val) {
    const as_str = val.replace(' by ','');
    const as_number = parseNumber(as_str);
    // if (Number.isNaN(as_number)) {
    //   return as_str;
    // }
    return as_number;
  }
  return 1;
}
