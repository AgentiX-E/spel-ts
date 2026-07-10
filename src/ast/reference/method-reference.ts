import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';

export class MethodReference extends SpelNodeImpl {
  private readonly methodName: string;

  constructor(startPos: number, endPos: number, methodName: string, ...args: SpelNodeImpl[]) {
    super(startPos, endPos, ...args);
    this.methodName = methodName;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    const target = state.getThis().getValue();
    const argValues = this.children.map(c => c.getValue(state).getValue());

    if (target === null || target === undefined) {
      throw new SpelEvaluationException(this.startPos, SpelMessage.METHOD_NOT_FOUND, this.methodName, 'null');
    }

    const context = state.getEvaluationContext();
    for (const resolver of context.getMethodResolvers()) {
      const result = resolver.resolve(context, target, this.methodName, argValues);
      if (result !== null) {
        return result;
      }
    }

    // Fallback: try property accessor chain (e.g., TypeDescriptor.staticMethods)
    for (const accessor of context.getPropertyAccessors()) {
      if (accessor.canRead(context, target, this.methodName)) {
        const propValue = accessor.read(context, target, this.methodName).getValue();
        if (typeof propValue === 'function') {
          try {
            return new TypedValue((propValue as (...a: unknown[]) => unknown)(...argValues));
          } catch (e) {
            throw new SpelEvaluationException(this.startPos,
              SpelMessage.EXCEPTION_DURING_METHOD_INVOCATION,
              this.methodName, (e as Error).message);
          }
        }
        break;
      }
    }

    // Also try function registry
    try {
      const fn = state.lookupFunction(this.methodName);
      return new TypedValue(fn(...argValues));
    } catch {
      // not found in functions
    }

    throw new SpelEvaluationException(this.startPos, SpelMessage.METHOD_NOT_FOUND, this.methodName, typeof target);
  }

  public toStringAST(): string {
    return `${this.methodName}(${this.children.map(c => c.toStringAST()).join(', ')})`;
  }
}
