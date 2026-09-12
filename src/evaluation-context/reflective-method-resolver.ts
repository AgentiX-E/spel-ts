import type { EvaluationContext } from './evaluation-context.js';
import { TypedValue } from '../typed-value.js';
import type { MethodResolver } from './method-resolver.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';
import { invokeStringMethod } from './java-string-methods.js';
import { isTypeDescriptor } from '../type/type-descriptor.js';
import { invokeNumberMethod } from './java-number-methods.js';

export class ReflectiveMethodResolver implements MethodResolver {
  public resolve(
    _context: EvaluationContext,
    target: unknown,
    name: string,
    args: unknown[],
  ): TypedValue | null {
    if (target === null || target === undefined) {
      return null;
    }

    // A string is resolved against java.lang.String only. JavaScript's string
    // methods are deliberately not consulted, because several share a name with
    // a Java method but not its semantics: `replaceAll` takes a regular
    // expression in Java and a literal in JavaScript, so the JavaScript
    // implementation silently returned the input unchanged.
    if (typeof target === 'string') {
      return invokeStringMethod(target, name, args);
    }

    // A resolved type handle resolves only against its own static members. Its
    // JavaScript prototype members must not win the lookup: `valueOf` exists on
    // Object.prototype, so `T(String).valueOf(42)` would otherwise return the
    // handle itself instead of calling String.valueOf. This is the same shadowing
    // problem the string branch above addresses, in a third place.
    if (isTypeDescriptor(target)) {
      return new TypedValue(target.callStaticMethod(name, ...args));
    }

    // A number is resolved against the Java wrapper classes only, for the same
    // reason a string is resolved against java.lang.String only: JavaScript's
    // Number offers a different set under different names, and `toFixed` and
    // `toExponential` were callable purely because JavaScript provides them while
    // no Java type does.
    if (typeof target === 'number' || typeof target === 'bigint') {
      return invokeNumberMethod(target, name, args);
    }

    // Objects, arrays and maps fall back to their own methods.
    const targetObj = target as Record<string, unknown>;
    const fn = targetObj[name];
    if (typeof fn === 'function') {
      try {
        const result = (fn as (...args: unknown[]) => unknown).apply(target, args);
        return new TypedValue(result);
      } catch (e) {
        throw new SpelEvaluationException(
          -1,
          SpelMessage.EXCEPTION_DURING_METHOD_INVOCATION,
          name,
          (e as Error).message,
        );
      }
    }

    // Not found — return null so the accessor chain or another resolver can try.
    return null;
  }
}
