
export default function debounce (fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    setTimeout(() => fn(...args), delay);
  }
}
