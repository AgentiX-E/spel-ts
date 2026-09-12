import type { EvaluationContext } from './evaluation-context.js';
import { TypedValue } from '../typed-value.js';
import type { MethodResolver } from './method-resolver.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';
import { invokeStringMethod } from './java-string-methods.js';

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

    if (typeof target === 'number') {
      const numResult = this.tryNumberMethod(target, name);
      if (numResult !== null) return numResult;
    }

    // Not found — return null so the accessor chain or another resolver can try.
    return null;
  }

  private tryNumberMethod(target: number, name: string): TypedValue | null {
    switch (name) {
      case 'toString':
        return new TypedValue(target.toString());
      case 'toFixed':
        return new TypedValue(target.toFixed());
      case 'toExponential':
        return new TypedValue(target.toExponential());
      default:
        return null;
    }
  }
}
