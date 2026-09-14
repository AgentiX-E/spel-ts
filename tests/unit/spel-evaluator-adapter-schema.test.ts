/**
 * Contract tests for the context schema the adapter derives from a live context.
 *
 * The adapter walks a root object and types every field, because the completion engine needs a
 * schema and most callers never build one by hand. The type ladder is a chain of ternaries with
 * a branch per JavaScript type — null, array, number, boolean, object — and the walk is
 * recursive, so it also has to survive an object that refers to itself.
 *
 * `typeof null === 'object'` is the trap here: without the explicit null check first, a null
 * field would be typed as an object and the walk would then descend into it.
 */
import { describe, expect, it } from 'vitest';
import { SpelEvaluatorAdapter, StandardEvaluationContext } from '../../src/index.js';

/** The shape a caller sees: a type name, and the children of a nested object. */
interface FieldView {
  type: string;
  fields?: Record<string, FieldView>;
}

/** Derive the schema for a root object and return its fields. */
function fieldsOf(root: unknown): Record<string, FieldView> {
  const schema = SpelEvaluatorAdapter.fromContext(
    new StandardEvaluationContext(root),
  ).getContextSchema();
  if (!schema?.root) {
    throw new Error('the adapter should describe a root object');
  }
  return schema.root.fields;
}

describe('SpelEvaluatorAdapter - root field typing', () => {
  it('types one field of every kind a JavaScript object can hold', () => {
    const fields = fieldsOf({
      amount: 10,
      paid: true,
      remark: 'ok',
      tags: ['a'],
      nested: { inner: 1 },
      missing: null,
    });
    expect(fields.amount.type).toBe('number');
    expect(fields.paid.type).toBe('boolean');
    expect(fields.remark.type).toBe('string');
    expect(fields.tags.type).toBe('array');
    expect(fields.nested.type).toBe('object');
    // A null field is a string with no value, not an object to descend into.
    expect(fields.missing.type).toBe('string');
  });

  it('recurses into a nested object and describes its fields too', () => {
    const fields = fieldsOf({ order: { quantity: 2, paid: false } });
    expect(fields.order.type).toBe('object');
    expect(fields.order.fields?.quantity.type).toBe('number');
    expect(fields.order.fields?.paid.type).toBe('boolean');
  });

  it('does not descend into an array element', () => {
    const fields = fieldsOf({ tags: ['a', 'b'] });
    expect(fields.tags.type).toBe('array');
    expect(fields.tags.fields).toBeUndefined();
  });
});

describe('SpelEvaluatorAdapter - circular root objects', () => {
  it('stops at a reference it has already visited', () => {
    // Without the visited set this walk never terminates. The assertion is that it returns at
    // all, and that the fields above the cycle are still described.
    const root: Record<string, unknown> = { name: 'x' };
    root.self = root;
    const fields = fieldsOf(root);
    expect(fields.name.type).toBe('string');
    expect(fields.self.type).toBe('object');
    // The cycle is cut where it closes: the inner object has no fields rather than another copy.
    expect(fields.self.fields ?? {}).not.toHaveProperty('self');
  });
});
