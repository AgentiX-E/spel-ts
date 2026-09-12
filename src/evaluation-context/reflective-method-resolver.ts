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

    // Objects, arrays, maps and numbers fall back to their own methods. For a
    // number that means JavaScript's, so `toFixed` and `toExponential` resolve
    // even though java.lang.Integer and java.lang.Double have no such methods.
    // Unlike the string case there is no semantic collision to cause a wrong
    // answer, so this permissiveness is left as is and recorded as D39.
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
