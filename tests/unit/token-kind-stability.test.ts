/**
 * Contract tests for the published ordinals of `TokenKind`.
 *
 * `TokenKind` is a numeric enum, so TypeScript emits it as a runtime object holding
 * both `name -> ordinal` and `ordinal -> name`. The enum is part of the package's
 * public API, which makes those ordinals observable: a consumer may persist one, or
 * read the reverse map. They are therefore a compatibility surface, and the table
 * below is a ratchet over it.
 *
 * The ratchet is not decorative. Between the published 1.2.2 and the 2.0.0 candidate,
 * `DIV` was inserted among the operators of an auto-incrementing enum, which moved
 * `MOD` from 14 to 15 and `EOF` from 53 to 54 without a single line of source noticing.
 * With every member explicitly assigned and every value pinned here, an insertion that
 * is not paired with an explicit new value now fails this file instead of silently
 * renumbering the enum.
 *
 * Adding a member is expected to touch this table. Reordering an existing one is not:
 * numbered members are append-only, and a member removed from the enum must be removed
 * from the table in the same commit, which deliberately leaves the hole behind rather
 * than closing it.
 */
import { describe, expect, it } from 'vitest';
import { TokenKind } from '../../src/tokenizer/token-kind.js';

/** Every member of `TokenKind` with the ordinal it is published under. */
const PINNED: Array<[string, number]> = [
  ['LITERAL_INT', 0],
  ['LITERAL_LONG', 1],
  ['LITERAL_FLOAT', 2],
  ['LITERAL_DOUBLE', 3],
  ['LITERAL_HEX', 4],
  ['LITERAL_STRING', 5],
  ['LITERAL_BOOLEAN', 6],
  ['LITERAL_NULL', 7],
  ['IDENTIFIER', 8],
  ['PLUS', 9],
  ['MINUS', 10],
  ['STAR', 11],
  ['SLASH', 12],
  ['PERCENT', 13],
  ['DIV', 14],
  ['MOD', 15],
  ['POWER', 16],
  ['INC', 17],
  ['DEC', 18],
  ['EQ', 19],
  ['NE', 20],
  ['LT', 21],
  ['LE', 22],
  ['GT', 23],
  ['GE', 24],
  ['AND', 25],
  ['OR', 26],
  ['NOT', 27],
  ['ASSIGN', 28],
  ['MATCHES', 29],
  ['BETWEEN', 30],
  ['INSTANCEOF', 31],
  ['LPAREN', 32],
  ['RPAREN', 33],
  ['LBRACKET', 34],
  ['RBRACKET', 35],
  ['LBRACE', 36],
  ['RBRACE', 37],
  ['COMMA', 38],
  ['COLON', 39],
  ['DOT', 40],
  ['SAFE_NAV', 41],
  ['QMARK', 42],
  ['ELVIS', 43],
  ['HASH', 44],
  ['AT', 45],
  ['AMP_AT', 46],
  ['PROJECTION', 47],
  ['SELECTION', 48],
  ['SELECT_FIRST', 49],
  ['SELECT_LAST', 50],
  ['TYPE_START', 51],
  ['NEW', 52],
  ['DOTDOT', 53],
  ['EOF', 54],
];

/** The `name -> ordinal` half of the enum's runtime object. */
function forwardMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const [key, value] of Object.entries(TokenKind)) {
    if (typeof value === 'number') {
      map[key] = value;
    }
  }
  return map;
}

describe('TokenKind ordinals', () => {
  it('publishes exactly the pinned names and ordinals', () => {
    expect(forwardMap()).toEqual(Object.fromEntries(PINNED));
  });

  it('reverses every ordinal back to the member that owns it', () => {
    for (const [name, ordinal] of PINNED) {
      expect(TokenKind[ordinal]).toBe(name);
    }
  });

  it('assigns a distinct ordinal to every member', () => {
    const ordinals = PINNED.map(([, ordinal]) => ordinal);
    expect(new Set(ordinals).size).toBe(ordinals.length);
  });

  it('leaves no gap in the ordinal sequence', () => {
    expect(PINNED.map(([, ordinal]) => ordinal)).toEqual(PINNED.map((_, index) => index));
  });

  it('keeps DIV and MOD adjacent, in that order', () => {
    expect(TokenKind.DIV + 1).toBe(TokenKind.MOD);
  });
});
