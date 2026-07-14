import type { EvaluationContext } from './evaluation-context.js';
import { TypedValue } from '../typed-value.js';
import type { MethodResolver } from './method-resolver.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

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

    // 1. Try JS native method
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

    // 2. Special handling: primitive type Java-style methods
    if (typeof target === 'string') {
      const strResult = this.tryStringMethod(target, name, args);
      if (strResult !== null) return strResult;
    }

    if (typeof target === 'number') {
      const numResult = this.tryNumberMethod(target, name);
      if (numResult !== null) return numResult;
    }

    // Not found — return null so accessor chain or other resolvers can try
    return null;
  }

  private tryStringMethod(target: string, name: string, args: unknown[]): TypedValue | null {
    switch (name) {
      case 'length':
        return new TypedValue(target.length);
      case 'isEmpty':
        return new TypedValue(target.length === 0);
      case 'charAt': {
        const idx = args[0] as number;
        return new TypedValue(idx >= 0 && idx < target.length ? target.charAt(idx) : '');
      }
      case 'substring':
        if (args.length === 1) return new TypedValue(target.substring(args[0] as number));
        return new TypedValue(target.substring(args[0] as number, args[1] as number));
      case 'contains':
        return new TypedValue(target.includes(args[0] as string));
      case 'startsWith':
        return new TypedValue(target.startsWith(args[0] as string));
      case 'endsWith':
        return new TypedValue(target.endsWith(args[0] as string));
      case 'indexOf':
        return new TypedValue(target.indexOf(args[0] as string));
      case 'toLowerCase':
        return new TypedValue(target.toLowerCase());
      case 'toUpperCase':
        return new TypedValue(target.toUpperCase());
      case 'trim':
        return new TypedValue(target.trim());
      case 'split':
        return new TypedValue(target.split(args[0] as string));
      case 'replace':
        return new TypedValue(target.split(args[0] as string).join(args[1] as string));
      case 'concat':
        return new TypedValue(target + String(args[0]));
      default:
        return null;
    }
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
