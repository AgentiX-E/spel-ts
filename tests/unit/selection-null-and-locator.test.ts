/**
 * Contract tests for two edge cases the whole-expression suites do not reach.
 *
 * The first is a selection over a null target. Spring returns an empty list rather than null
 * when the mode is "all", and that is deliberately different from the null-safe navigation
 * case, which yields null — the two lines sit next to each other and mean opposite things.
 *
 * The second is prefix normalisation in the type locator. A caller may pass `java.lang` or
 * `java.lang.` and both have to end up usable, and registering the same import twice must not
 * accumulate duplicate prefixes.
 */
import { describe, expect, it } from 'vitest';
import {
  SpelEvaluationException,
  SpelExpressionParser,
  StandardEvaluationContext,
} from '../../src/index.js';
import { StandardTypeLocator } from '../../src/type/standard-type-locator.js';

const parser = new SpelExpressionParser();

describe('selection over a null target', () => {
  it('returns an empty list for the "all" mode rather than null', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('missing', null);
    expect(parser.parseExpression('#missing.?[#this > 1]').getValueWithContext(ctx)).toEqual([]);
  });

  it('reports an absent variable rather than treating it as null', () => {
    // A variable that was never declared is a mistake, not an empty collection; only a variable
    // that is declared *and* null takes the empty-list path above.
    const ctx = new StandardEvaluationContext({});
    expect(() => parser.parseExpression('#absent.?[#this > 1]').getValueWithContext(ctx)).toThrow(
      SpelEvaluationException,
    );
  });

  it('still selects normally when the target is present', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('items', [1, 2, 3]);
    expect(parser.parseExpression('#items.?[#this > 1]').getValueWithContext(ctx)).toEqual([2, 3]);
  });
});

describe('StandardTypeLocator prefix normalisation', () => {
  it('accepts a prefix that already ends in a dot', () => {
    const locator = new StandardTypeLocator(['java.lang.']);
    expect(locator.findType('Math').name).toBe('java.lang.Math');
  });

  it('accepts a prefix with no trailing dot', () => {
    const locator = new StandardTypeLocator(['java.lang']);
    expect(locator.findType('Math').name).toBe('java.lang.Math');
  });

  it('registers an import with or without a trailing dot, only once', () => {
    const locator = new StandardTypeLocator();
    locator.register('com.example.Widget', class Widget {});
    locator.registerImport('com.example.');
    locator.registerImport('com.example');
    expect(locator.findType('Widget').name).toBe('com.example.Widget');
  });
});
