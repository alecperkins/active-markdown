/*

Numbers in Active Markdown are ordinary `Number` values for the most part, but also MAY include various constants from `Math` as a multiplier. For example, `2pi` is equivalent to `2 * Math.PI`, while `0.5e` is equivalent to `0.5 * Math.E`. The constants may be specified without a digit, eg `pi` or `ln2`. Also, they may be specified in lowercase or uppercase, or some combination of the two, if you're into that.
*/
export default function parseNumber (val) {
  const constants = ['E', 'PI', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT1_2', 'SQRT2'];
  let parsed_val = null;

  // Check the value for each constant, allowing for just a constant
  // with no coefficient.
  for (const c of constants) {
    const r = RegExp(`([+-]?)([\\d\\.]*)${ c }`);
    const group = val.toUpperCase().match(r);

    // If the number matches a constant, generate the equivalent
    // expression and calculate the actual value of the number.
    if (group) {
      const sign = group[1] === '-' ? -1 : 1;
      const mult = group[2] ? (new Number(group[2])) : 1;
      parsed_val = sign * mult * Math[c];
      break
    }

  }

  // If the value is still null, the number didn't have any constants, so
  // just parse it as a regular Number.
  if (parsed_val == null) {
    parsed_val = parseFloat(val)
  }

  return parsed_val
}
