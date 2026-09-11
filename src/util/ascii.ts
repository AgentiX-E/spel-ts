/**
 * ASCII-only case folding.
 *
 * Spring folds textual operator names with `toUpperCase(Locale.ROOT)`. We
 * deliberately implement an ASCII-only equivalent instead of calling
 * `String#toUpperCase`, for two reasons:
 *
 *  1. `toUpperCase` is locale-sensitive — under the Turkish locale `i` folds to
 *     `İ`, so `div` would stop matching. Spring pins `Locale.ROOT` for exactly
 *     this reason; folding ASCII ourselves removes the dependency entirely.
 *  2. `toUpperCase` can change string length (`ß` becomes `SS`), which would
 *     make a length-sensitive keyword lookup unreliable.
 *
 * Restricting the fold to ASCII also yields a useful property: non-ASCII input
 * short-circuits and can never be mistaken for a keyword. That is what lets
 * identifiers such as `年龄` or `café` coexist with the keyword table.
 */

const LOWER_A = 0x61;
const LOWER_Z = 0x7a;
const ASCII_MAX = 0x7f;
const CASE_DELTA = 32;

/**
 * Fold a string to upper case over ASCII letters only.
 *
 * Returns the input unchanged when it contains any non-ASCII character, since
 * such a string can never equal an ASCII keyword.
 */
export function foldAsciiUpper(text: string): string {
  let hasLowerAscii = false;
  let hasNonAscii = false;

  for (const character of text) {
    const code = character.charCodeAt(0);
    if (code > ASCII_MAX) {
      hasNonAscii = true;
      break;
    }
    if (code >= LOWER_A && code <= LOWER_Z) {
      hasLowerAscii = true;
    }
  }

  if (hasNonAscii || !hasLowerAscii) {
    return text;
  }

  let folded = '';
  for (const character of text) {
    const code = character.charCodeAt(0);
    folded +=
      code >= LOWER_A && code <= LOWER_Z ? String.fromCharCode(code - CASE_DELTA) : character;
  }
  return folded;
}

/** Case-insensitive equality over ASCII letters, matching Spring's fold. */
export function equalsIgnoreCaseAscii(left: string, right: string): boolean {
  return foldAsciiUpper(left) === foldAsciiUpper(right);
}

/** True when the string is composed entirely of ASCII characters. */
export function isAscii(text: string): boolean {
  for (const character of text) {
    if (character.charCodeAt(0) > ASCII_MAX) {
      return false;
    }
  }
  return true;
}
