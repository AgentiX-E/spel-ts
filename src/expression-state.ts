import type { EvaluationContext } from './evaluation-context/evaluation-context.js';
import { TypedValue } from './typed-value.js';
import { SpelEvaluationException } from './error/spel-evaluation-exception.js';
import { SpelMessage } from './error/spel-message.js';
import type { TypeDescriptor } from './type/type-descriptor.js';

/**
 * Parallels Spring ExpressionState
 *
 * Manages all state during expression evaluation：
 * - scopeStack: stack of current variable contexts (for #var lookup)
 * - headIndexStack: #this reference stack (for collection selection/projection)
 * - EvaluationContext: delegated global context
 */
export class ExpressionState {
  private readonly context: EvaluationContext;

  /**
   * scopeStack: Top of stack is current active scope
   * Each scope is a Map<string, TypedValue>
   */
  private readonly scopeStack: Map<string, TypedValue>[] = [];

  /**
   * headIndexStack: Track #this references in nested iteration contexts
   */
  private readonly headIndexStack: TypedValue[] = [];

  /**
   * The root object the whole expression started from. A compound expression
   * rebinds a child state's context root to the receiver, so this is kept
   * separately in order to answer {@link getArgumentScope}.
   */
  private originalRoot: TypedValue;

  constructor(context: EvaluationContext) {
    this.context = context;
    this.originalRoot = context.getRootObject();
  }

  // ===== scopeStack Management =====

  public pushScope(scope: Map<string, TypedValue>): void {
    this.scopeStack.push(scope);
  }

  public popScope(): Map<string, TypedValue> {
    if (this.scopeStack.length === 0) {
      throw new SpelEvaluationException(-1, SpelMessage.CANNOT_POP_SCOPE);
    }
    return this.scopeStack.pop()!;
  }

  public peekScope(): Map<string, TypedValue> | undefined {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  // ===== headIndexStack Management =====

  public pushHeadIndex(value: TypedValue): void {
    this.headIndexStack.push(value);
  }

  public popHeadIndex(): TypedValue {
    if (this.headIndexStack.length === 0) {
      throw new SpelEvaluationException(-1, SpelMessage.CANNOT_POP_HEAD_INDEX);
    }
    return this.headIndexStack.pop()!;
  }

  /**
   * Get current #this value
   * headIndexStack top is current innermost #this
   */
  public getThis(): TypedValue {
    if (this.headIndexStack.length > 0) {
      return this.headIndexStack[this.headIndexStack.length - 1]!;
    }
    return this.context.getRootObject();
  }

  // ===== #root Resolution =====

  public getRoot(): TypedValue {
    return this.context.getRootObject();
  }

  // ===== Variable Lookup =====

  /**
   * Lookup variable #varName
   * Search from scopeStack top-down, then delegate to context
   */
  public lookupVariable(name: string): TypedValue {
    // #this is always the current iteration element
    if (name === 'this' && this.headIndexStack.length > 0) {
      return this.headIndexStack[this.headIndexStack.length - 1]!;
    }

    // #root is always the root context object
    if (name === 'root') {
      return this.context.getRootObject();
    }

    // Search from stack top downward
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i]!;
      if (scope.has(name)) {
        return scope.get(name)!;
      }
    }
    // Delegate to context
    const result = this.context.lookupVariable(name);
    if (result != null) {
      return result;
    }
    throw new SpelEvaluationException(-1, SpelMessage.VARIABLE_NOT_FOUND, name);
  }

  /**
   * Set variable #varName = value
   */
  public setVariable(name: string, value: unknown): void {
    // Search from stack top downward
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i]!;
      if (scope.has(name)) {
        scope.set(name, new TypedValue(value));
        return;
      }
    }
    // Set in context
    this.context.setVariable(name, value);
  }

  // ===== Function Lookup =====

  public lookupFunction(name: string): (...args: unknown[]) => unknown {
    const fn = this.context.lookupFunction(name);
    if (fn != null) {
      return fn;
    }
    throw new SpelEvaluationException(-1, SpelMessage.FUNCTION_NOT_FOUND, name);
  }

  // ===== Type Lookup (Delegate to TypeLocator) =====

  public findType(typeName: string): TypeDescriptor {
    return this.context.getTypeLocator().findType(typeName);
  }

  // ===== Bean Lookup (Delegate to BeanResolver) =====

  public resolveBean(beanName: string, isFactoryBean = false): unknown {
    return this.context.getBeanResolver().resolve(beanName, isFactoryBean);
  }

  // ===== Create Child State =====

  /**
   * Create a child state with given rootObject as root context
   * Used for property chain navigation in CompoundExpression
   */
  public createChildState(rootObject: unknown): ExpressionState {
    const child = new ExpressionState(this.context.createChildContext(rootObject));
    child.originalRoot = this.originalRoot;
    // Inherit scopeStack
    for (const scope of this.scopeStack) {
      child.scopeStack.push(scope);
    }
    return child;
  }

  /**
   * The scope a method's arguments are evaluated in.
   *
   * A compound expression rebinds the receiver as the root of the child state it
   * hands to the following node, so evaluating an argument in the current state
   * would read a bare name as a member of the receiver: `s.substring(i)` looked
   * up `i` on the string instead of on the object the expression started from.
   *
   * Arguments therefore resolve at the expression's root scope, which is also
   * where a top-level bare name resolves. A receiver still resolves in the
   * current scope, so `items.?[price > 20]` continues to read `price` from the
   * element.
   */
  public getArgumentScope(): ExpressionState {
    const state = new ExpressionState(
      this.context.createChildContext(this.originalRoot.getValue()),
    );
    for (const scope of this.scopeStack) {
      state.scopeStack.push(scope);
    }
    return state;
  }

  // ===== Context access =====

  public getEvaluationContext(): EvaluationContext {
    return this.context;
  }
}
