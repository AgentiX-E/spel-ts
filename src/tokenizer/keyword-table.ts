import { TokenKind } from './token-kind.js';

/**
 * Textual operator names recognised by the tokenizer.
 *
 * This mirrors Spring's `Tokenizer#ALTERNATIVE_OPERATOR_NAMES`, which is
 * matched after folding the scanned identifier to upper case, so `div`, `Div`
 * and `DIV` are all accepted.
 *
 * Two categories of word are deliberately absent:
 *
 *  - `and`, `or`, `matches`, `between`, `instanceof`, `new`: Spring leaves these
 *    as IDENTIFIER tokens and resolves them in `InternalSpelExpressionParser`
 *    with `equalsIgnoreCase`. Keeping them as identifiers here is what allows
 *    them to double as ordinary property and method names, so `'abc'.matches(…)`
 *    and a field literally named `and` both continue to work.
 *  - `true`, `false`, `null`: likewise resolved by the parser.
 *
 * Keys are ASCII upper case; callers fold the identifier before lookup.
 */
export const OPERATOR_KEYWORDS: ReadonlyMap<string, TokenKind> = new Map<string, TokenKind>([
  ['DIV', TokenKind.DIV],
  ['MOD', TokenKind.MOD],
  ['EQ', TokenKind.EQ],
  ['NE', TokenKind.NE],
  ['LT', TokenKind.LT],
  ['LE', TokenKind.LE],
  ['GT', TokenKind.GT],
  ['GE', TokenKind.GE],
  ['NOT', TokenKind.NOT],
]);
