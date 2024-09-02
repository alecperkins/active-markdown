// Ranges in Active Markdown work the same as in CoffeeScript; two dots describes an inclusive range, while three dots excludes the tail. (The check here is only if there are two dots or not since the element configuration parsing regex limits the match to `'..'` or `'...'`.)
export default function parseInclusivity (dots) {
  return dots.length === 2;
}

