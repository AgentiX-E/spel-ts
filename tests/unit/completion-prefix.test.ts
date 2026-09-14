/**
 * Contract tests for completion prefix extraction.
 *
 * `getPrefixAt` reads everything before the cursor, which is the caller's whole expression. It
 * used to find the prefix with `/(#|@|T\()?[\w.]*$/`, and that pattern is quadratic when the text
 * ends in a long run of name characters the end anchor then rejects: it measured 615 ms for
 * 32 000 characters, four times the work for twice the input, and the input is a document.
 *
 * These tests pin the prefixes it must produce and the size it has to absorb. A label is asserted
 * in the form it is inserted in — `#order`, not `order` — because that is what the engine offers,
 * which also means a prefix without its introducer matches nothing.
 */
import { describe, expect, it } from 'vitest';
import { SpelCompletionEngine } from '../../src/index.js';
import type { ContextSchema } from '../../src/index.js';

const schema = {
  root: null,
  variables: { order: { type: 'object' } },
  beans: { discountService: { type: 'object' } },
  types: {},
  functions: {},
} as unknown as ContextSchema;

/** Labels offered at `position`, defaulting to the end of the expression. */
const labels = (expression: string, position: number = expression.length): string[] =>
  SpelCompletionEngine.getCompletions(expression, position, schema).map((item) => item.label);

describe('completion prefix at the cursor', () => {
  it('narrows the list to what the typed name matches', () => {
    // One label rather than two, so the prefix after the introducer was read and applied.
    expect(labels('#ord')).toEqual(['#order']);
  });

  it('offers every variable from the introducer alone', () => {
    expect(labels('#')).toContain('#order');
    expect(labels('#')).toContain('#this');
  });

  it('offers a bean from its own introducer', () => {
    expect(labels('@')).toEqual(['@discountService']);
  });

  it('reads the prefix at the cursor rather than the end of the expression', () => {
    // The cursor sits after `#ord`, with more text following it.
    expect(labels('#ord and more', 4)).toEqual(['#order']);
  });

  it('matches nothing when the introducer is missing', () => {
    // A label carries its introducer, so `ord` is not a prefix of `#order`. This is the case that
    // shows the prefix is the whole token and not just its tail — reading from the cursor back to
    // the operator would have produced the same empty list, so it is the `#ord` case above that
    // pins the start, and this one pins the end.
    expect(labels('#order.amount > ord')).toEqual([]);
  });
});

describe('a long name before the cursor', () => {
  it('is read in one pass rather than retried from every offset', { timeout: 2000 }, () => {
    // The old pattern needed seconds at this size and the scan needs about a millisecond, so the
    // timeout is the assertion: this fails if the quadratic shape comes back.
    const expression = `${'a'.repeat(100_000)}!`;
    expect(
      SpelCompletionEngine.getCompletions(expression, expression.length, schema),
    ).toBeDefined();
  });
});
