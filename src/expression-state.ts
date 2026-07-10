import type { EvaluationContext } from './evaluation-context/evaluation-context.js';
import { TypedValue } from './typed-value.js';
import { SpelEvaluationException } from './error/spel-evaluation-exception.js';
import { SpelMessage } from './error/spel-message.js';
import type { TypeDescriptor } from './type/type-descriptor.js';

/**
 * 对标 Spring ExpressionState
 *
 * 管理表达式求值过程中的所有状态：
 * - scopeStack: 当前变量上下文的栈 (用于 #var 查找)
 * - headIndexStack: #this 引用栈 (用于 collection selection/projection)
 * - EvaluationContext: 委托的全局上下文
 */
export class ExpressionState {
  private readonly context: EvaluationContext;

  /**
   * scopeStack: 栈顶为当前活动作用域
   * 每个作用域是 Map<string, TypedValue>
   */
  private readonly scopeStack: Map<string, TypedValue>[] = [];

  /**
   * headIndexStack: 跟踪嵌套的迭代上下文中的 #this 引用
   */
  private readonly headIndexStack: TypedValue[] = [];

  constructor(context: EvaluationContext) {
    this.context = context;
  }

  // ===== scopeStack 管理 =====

  public pushScope(scope: Map<string, TypedValue>): void {
    this.scopeStack.push(scope);
  }

  public popScope(): Map<string, TypedValue> {
    if (this.scopeStack.length === 0) {
      throw new SpelEvaluationException(
        -1, SpelMessage.CANNOT_POP_SCOPE,
      );
    }
    return this.scopeStack.pop()!;
  }

  public peekScope(): Map<string, TypedValue> | undefined {
    return this.scopeStack[this.scopeStack.length - 1];
  }

  // ===== headIndexStack 管理 =====

  public pushHeadIndex(value: TypedValue): void {
    this.headIndexStack.push(value);
  }

  public popHeadIndex(): TypedValue {
    if (this.headIndexStack.length === 0) {
      throw new SpelEvaluationException(
        -1, SpelMessage.CANNOT_POP_HEAD_INDEX,
      );
    }
    return this.headIndexStack.pop()!;
  }

  /**
   * 获取当前 #this 值
   * headIndexStack 栈顶为当前最内层 #this
   */
  public getThis(): TypedValue {
    if (this.headIndexStack.length > 0) {
      return this.headIndexStack[this.headIndexStack.length - 1]!;
    }
    return this.context.getRootObject();
  }

  // ===== #root 解析 =====

  public getRoot(): TypedValue {
    return this.context.getRootObject();
  }

  // ===== 变量查找 =====

  /**
   * 查找变量 #varName
   * 从 scopeStack 栈顶向下搜索，然后委托给 context
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

    // 从栈顶向下搜索
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i]!;
      if (scope.has(name)) {
        return scope.get(name)!;
      }
    }
    // 委托给 context
    const result = this.context.lookupVariable(name);
    if (result != null) {
      return result;
    }
    throw new SpelEvaluationException(
      -1, SpelMessage.VARIABLE_NOT_FOUND, name,
    );
  }

  /**
   * 设置变量 #varName = value
   */
  public setVariable(name: string, value: unknown): void {
    // 从栈顶向下搜索
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i]!;
      if (scope.has(name)) {
        scope.set(name, new TypedValue(value));
        return;
      }
    }
    // 设置在 context
    this.context.setVariable(name, value);
  }

  // ===== 函数查找 =====

  public lookupFunction(name: string): (...args: unknown[]) => unknown {
    const fn = this.context.lookupFunction(name);
    if (fn != null) {
      return fn;
    }
    throw new SpelEvaluationException(
      -1, SpelMessage.FUNCTION_NOT_FOUND, name,
    );
  }

  // ===== 类型查找 (委派给 TypeLocator) =====

  public findType(typeName: string): TypeDescriptor {
    return this.context.getTypeLocator().findType(typeName);
  }

  // ===== Bean 查找 (委派给 BeanResolver) =====

  public resolveBean(beanName: string, isFactoryBean = false): unknown {
    return this.context.getBeanResolver().resolve(beanName, isFactoryBean);
  }

  // ===== 创建子状态 =====

  /**
   * 创建一个以给定 rootObject 为根上下文的子状态
   * 用于 CompoundExpression 中的属性链导航
   */
  public createChildState(rootObject: unknown): ExpressionState {
    const child = new ExpressionState(
      this.context.createChildContext(rootObject),
    );
    // 继承 scopeStack
    for (const scope of this.scopeStack) {
      child.scopeStack.push(scope);
    }
    return child;
  }

  // ===== 上下文访问 =====

  public getEvaluationContext(): EvaluationContext {
    return this.context;
  }
}
