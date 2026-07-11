/**
 * Phase 3: Property-based Tests — Arithmetic/Comparison/Logical Algebraic Property Verification
 *
 * Uses fast-check to generate random inputs, verifying SpEL evaluation satisfies mathematical properties.
 * Parallels Spring SpEL semantics.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { SpelExpressionParser } from '../src/spel-expression-parser.js';

describe('Property-based: Arithmetic', () => {
  const parser = new SpelExpressionParser();

  // IEEE 754 safe integer range
  const safeInt = fc.integer({ min: -1000000, max: 1000000 });
  // Filter out -0 which causes IEEE 754 identity issues with toBe
  const nonNegZero = fc.float({ noNaN: true, noDefaultInfinity: true })
    .filter(x => !Object.is(x, -0));

  // ===== Addition Properties =====
  describe('addition properties', () => {
    it('commutativity: a + b = b + a', () => {
      fc.assert(fc.property(safeInt, safeInt, (a, b) => {
        const left = parser.parseExpression(`${a} + ${b}`).getValue();
        const right = parser.parseExpression(`${b} + ${a}`).getValue();
        expect(left).toBe(right);
      }));
    });

    it('associativity: (a + b) + c = a + (b + c)', () => {
      fc.assert(fc.property(safeInt, safeInt, safeInt, (a, b, c) => {
        const left = parser.parseExpression(`(${a} + ${b}) + ${c}`).getValue();
        const right = parser.parseExpression(`${a} + (${b} + ${c})`).getValue();
        expect(left).toBe(right);
      }));
    });

    it('identity: a + 0 = a', () => {
      fc.assert(fc.property(safeInt, (a) => {
        expect(parser.parseExpression(`${a} + 0`).getValue()).toBe(a);
      }));
    });

    it('identity with float: a + 0.0 = a', () => {
      fc.assert(fc.property(nonNegZero, (a) => {
        const result = parser.parseExpression(`${a} + 0.0`).getValue();
        expect(result).toBe(a);
      }));
    });
  });

  // ===== Subtraction Properties =====
  describe('subtraction properties', () => {
    it('self-inverse: a - a = 0', () => {
      fc.assert(fc.property(safeInt, (a) => {
        expect(parser.parseExpression(`${a} - ${a}`).getValue()).toBe(0);
      }));
    });

    it('identity: a - 0 = a', () => {
      fc.assert(fc.property(safeInt, (a) => {
        expect(parser.parseExpression(`${a} - 0`).getValue()).toBe(a);
      }));
    });

    it('negation consistency: a - b = a + (-b) for non-negative b', () => {
      // Avoid -- tokenizer ambiguity: only test with b >= 0
      fc.assert(fc.property(safeInt, fc.integer({ min: 0, max: 1000000 }), (a, b) => {
        const sub = parser.parseExpression(`${a} - ${b}`).getValue();
        const addNeg = parser.parseExpression(`${a} + -${b}`).getValue();
        expect(sub).toBe(addNeg);
      }));
    });
  });

  // ===== Multiplication Properties =====
  describe('multiplication properties', () => {
    it('commutativity: a * b = b * a', () => {
      fc.assert(fc.property(safeInt, safeInt, (a, b) => {
        const left = parser.parseExpression(`${a} * ${b}`).getValue();
        const right = parser.parseExpression(`${b} * ${a}`).getValue();
        expect(left).toBe(right);
      }));
    });

    it('associativity: (a * b) * c = a * (b * c)', () => {
      fc.assert(fc.property(fc.integer({ min: -100, max: 100 }), fc.integer({ min: -100, max: 100 }), fc.integer({ min: -100, max: 100 }), (a, b, c) => {
        const left = parser.parseExpression(`(${a} * ${b}) * ${c}`).getValue();
        const right = parser.parseExpression(`${a} * (${b} * ${c})`).getValue();
        expect(left).toBe(right);
      }));
    });

    it('identity: a * 1 = a', () => {
      fc.assert(fc.property(safeInt, (a) => {
        expect(parser.parseExpression(`${a} * 1`).getValue()).toBe(a);
      }));
    });

    it('zero: a * 0 = 0 (non-negative to avoid -0)', () => {
      fc.assert(fc.property(fc.integer({ min: 0, max: 1000000 }), (a) => {
        expect(parser.parseExpression(`${a} * 0`).getValue()).toBe(0);
      }));
    });

    it('distributivity: a * (b + c) = a * b + a * c (a,b,c positive)', () => {
      fc.assert(fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (a, b, c) => {
          const left = parser.parseExpression(`${a} * (${b} + ${c})`).getValue();
          const right = parser.parseExpression(`${a} * ${b} + ${a} * ${c}`).getValue();
          expect(left).toBe(right);
        },
      ));
    });
  });

  // ===== Division Properties =====
  describe('division properties', () => {
    it('identity: a / 1 = a', () => {
      fc.assert(fc.property(safeInt, (a) => {
        expect(parser.parseExpression(`${a} / 1`).getValue()).toBe(a);
      }));
    });

    it('self: a / a = 1 (a != 0)', () => {
      fc.assert(fc.property(
        fc.oneof(fc.integer({ min: -1000, max: -1 }), fc.integer({ min: 1, max: 1000 })),
        (a) => {
          const result = parser.parseExpression(`${a} / ${a}`).getValue();
          expect(result).toBe(1);
        },
      ));
    });

    it('division by zero throws', () => {
      fc.assert(fc.property(safeInt, () => {
        expect(() => parser.parseExpression('1 / 0').getValue()).toThrow();
      }));
    });
  });

  // ===== Modulo Properties =====
  describe('modulo properties', () => {
    it('a % n < |n| for |a| < 1000, n > 0', () => {
      fc.assert(fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: 1, max: 100 }),
        (a, n) => {
          const result = parser.parseExpression(`${a} % ${n}`).getValue() as number;
          expect(Math.abs(result)).toBeLessThan(Math.abs(n));
        },
      ));
    });

    it('a % n has same sign as dividend', () => {
      fc.assert(fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        (a, n) => {
          const result = parser.parseExpression(`${a} % ${n}`).getValue() as number;
          // JS % preserves dividend sign
          expect(Math.sign(result) * Math.sign(a) >= 0).toBe(true);
        },
      ));
    });
  });
});

describe('Property-based: Comparison', () => {
  const parser = new SpelExpressionParser();

  describe('equality properties', () => {
    it('reflexivity: a == a always true', () => {
      fc.assert(fc.property(fc.integer(), (a) => {
        expect(parser.parseExpression(`${a} == ${a}`).getValue()).toBe(true);
      }));
    });

    it('symmetry: a == b ⇔ b == a', () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
        const l = parser.parseExpression(`${a} == ${b}`).getValue();
        const r = parser.parseExpression(`${b} == ${a}`).getValue();
        expect(l).toBe(r);
      }));
    });

    it('< and > are opposites for distinct integers', () => {
      fc.assert(fc.property(
        fc.integer(),
        fc.integer(),
        (a, b) => {
          if (a === b) {
            expect(parser.parseExpression(`${a} < ${b}`).getValue()).toBe(false);
            expect(parser.parseExpression(`${a} > ${b}`).getValue()).toBe(false);
          } else {
            const ab = parser.parseExpression(`${a} < ${b}`).getValue() as boolean;
            const ba = parser.parseExpression(`${a} > ${b}`).getValue() as boolean;
            // Exactly one should be true
            expect(ab !== ba).toBe(true);
          }
        },
      ));
    });

    it('transitivity: a < b ∧ b < c ⇒ a < c', () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (base, offset) => {
        const a = base;
        const b = base + Math.abs(offset) + 1;
        const c = b + Math.abs(offset % 100) + 1;
        expect(parser.parseExpression(`${a} < ${b}`).getValue()).toBe(true);
        expect(parser.parseExpression(`${b} < ${c}`).getValue()).toBe(true);
        expect(parser.parseExpression(`${a} < ${c}`).getValue()).toBe(true);
      }));
    });

    it('total order: for any a,b, either a<=b or b<=a', () => {
      fc.assert(fc.property(fc.integer(), fc.integer(), (a, b) => {
        const ale = parser.parseExpression(`${a} <= ${b}`).getValue() as boolean;
        const ble = parser.parseExpression(`${b} <= ${a}`).getValue() as boolean;
        expect(ale || ble).toBe(true);
      }));
    });
  });
});

describe('Property-based: Logical', () => {
  const parser = new SpelExpressionParser();

  describe('AND properties', () => {
    it('idempotence: p && p = p', () => {
      fc.assert(fc.property(fc.boolean(), (p) => {
        const result = parser.parseExpression(`${String(p)} && ${String(p)}`).getValue();
        expect(result).toBe(p);
      }));
    });

    it('domination: false && p = false', () => {
      fc.assert(fc.property(fc.boolean(), (p) => {
        expect(parser.parseExpression(`false && ${String(p)}`).getValue()).toBe(false);
      }));
    });

    it('identity: true && p = p', () => {
      fc.assert(fc.property(fc.boolean(), (p) => {
        expect(parser.parseExpression(`true && ${String(p)}`).getValue()).toBe(p);
      }));
    });
  });

  describe('OR properties', () => {
    it('domination: true || p = true', () => {
      fc.assert(fc.property(fc.boolean(), (p) => {
        expect(parser.parseExpression(`true || ${String(p)}`).getValue()).toBe(true);
      }));
    });

    it('identity: false || p = p', () => {
      fc.assert(fc.property(fc.boolean(), (p) => {
        expect(parser.parseExpression(`false || ${String(p)}`).getValue()).toBe(p);
      }));
    });
  });

  describe('De Morgan laws', () => {
    it('!(p && q) = !p || !q', () => {
      fc.assert(fc.property(fc.boolean(), fc.boolean(), (p, q) => {
        const left = parser.parseExpression(`!(${String(p)} && ${String(q)})`).getValue();
        const right = parser.parseExpression(`!${String(p)} || !${String(q)}`).getValue();
        expect(left).toBe(right);
      }));
    });

    it('!(p || q) = !p && !q', () => {
      fc.assert(fc.property(fc.boolean(), fc.boolean(), (p, q) => {
        const left = parser.parseExpression(`!(${String(p)} || ${String(q)})`).getValue();
        const right = parser.parseExpression(`!${String(p)} && !${String(q)}`).getValue();
        expect(left).toBe(right);
      }));
    });
  });

  describe('double negation', () => {
    it('!!p = p', () => {
      fc.assert(fc.property(fc.boolean(), (p) => {
        expect(parser.parseExpression(`!!${String(p)}`).getValue()).toBe(p);
      }));
    });
  });
});

describe('Property-based: Precedence', () => {
  const parser = new SpelExpressionParser();

  it('multiplication binds tighter than addition', () => {
    fc.assert(fc.property(
      fc.integer({ min: -100, max: 100 }),
      fc.integer({ min: -100, max: 100 }),
      fc.integer({ min: -100, max: 100 }),
      (a, b, c) => {
        const left = parser.parseExpression(`${a} + ${b} * ${c}`).getValue();
        const right = parser.parseExpression(`${a} + (${b} * ${c})`).getValue();
        expect(left).toBe(right);
      },
    ));
  });

  it('AND binds tighter than OR', () => {
    fc.assert(fc.property(fc.boolean(), fc.boolean(), fc.boolean(), (p, q, r) => {
      const left = parser.parseExpression(`${String(p)} || ${String(q)} && ${String(r)}`).getValue();
      const right = parser.parseExpression(`${String(p)} || (${String(q)} && ${String(r)})`).getValue();
      expect(left).toBe(right);
    }));
  });
});
