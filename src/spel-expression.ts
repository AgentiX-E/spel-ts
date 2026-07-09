import type { SpelNodeImpl } from './ast/spel-node.js';
import { ExpressionState } from './expression-state.js';
import type { EvaluationContext } from './evaluation-context/evaluation-context.js';
import { StandardEvaluationContext } from './standard-evaluation-context.js';
import type { TypedValue } from './typed-value.js';

/**
 * 对标 Spring SpelExpression
 *
 * 编译后的 SpEL 表达式，持有 AST 根节点。
 */
export class SpelExpression {
  public readonly expressionString: string;
  private readonly ast: SpelNodeImpl;

  constructor(expressionString: string, ast: SpelNodeImpl) {
    this.expressionString = expressionString;
    this.ast = ast;
  }

  /**
   * 在给定 EvaluationContext 中求值
   */
  public getValueWithContext(context: EvaluationContext): unknown {
    const state = new ExpressionState(context);
    const result = this.ast.getValue(state);
    return result.getValue();
  }

  /**
   * 以给定 root 对象求值（创建默认 context）
   */
  public getValue(rootObject?: unknown): unknown {
    const context = new StandardEvaluationContext(rootObject);
    return this.getValueWithContext(context);
  }

  /**
   * 获取 TypedValue（含类型信息）
   */
  public getTypedValue(context: EvaluationContext): TypedValue {
    const state = new ExpressionState(context);
    return this.ast.getValue(state);
  }

  /**
   * 获取值类型
   */
  public getValueType(context: EvaluationContext): unknown {
    const state = new ExpressionState(context);
    return this.ast.getValueType(state);
  }

  /**
   * 是否可写
   */
  public isWritable(context: EvaluationContext): boolean {
    const state = new ExpressionState(context);
    return this.ast.isWritable(state);
  }

  /**
   * 设置值
   */
  public setValue(context: EvaluationContext, newValue: unknown): void {
    const state = new ExpressionState(context);
    this.ast.setValue(state, newValue);
  }

  /**
   * 获取表达式字符串
   */
  public getExpressionString(): string {
    return this.expressionString;
  }

  /**
   * 获取 AST 调试表示
   */
  public toStringAST(): string {
    return this.ast.toStringAST();
  }
}
