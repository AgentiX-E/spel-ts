import type { SpelNodeImpl } from './ast/spel-node.js';
import { ExpressionState } from './expression-state.js';
import type { EvaluationContext } from './evaluation-context/evaluation-context.js';
import { StandardEvaluationContext } from './standard-evaluation-context.js';
import type { TypedValue } from './typed-value.js';

/**
 * Parallels Spring SpelExpression
 *
 * Compiled SpEL expression, holds the AST root node.
 */
export class SpelExpression {
  public readonly expressionString: string;
  private readonly ast: SpelNodeImpl;

  constructor(expressionString: string, ast: SpelNodeImpl) {
    this.expressionString = expressionString;
    this.ast = ast;
  }

  /**
   * Evaluate in the given EvaluationContext
   */
  public getValueWithContext(context: EvaluationContext): unknown {
    const state = new ExpressionState(context);
    const result = this.ast.getValue(state);
    return result.getValue();
  }

  /**
   * Evaluate with given root object (creates default context)
   */
  public getValue(rootObject?: unknown): unknown {
    const context = new StandardEvaluationContext(rootObject);
    return this.getValueWithContext(context);
  }

  /**
   * Get TypedValue (includes type information)
   */
  public getTypedValue(context: EvaluationContext): TypedValue {
    const state = new ExpressionState(context);
    return this.ast.getValue(state);
  }

  /**
   * Get value type
   */
  public getValueType(context: EvaluationContext): unknown {
    const state = new ExpressionState(context);
    return this.ast.getValueType(state);
  }

  /**
   * Whether is writable
   */
  public isWritable(context: EvaluationContext): boolean {
    const state = new ExpressionState(context);
    return this.ast.isWritable(state);
  }

  /**
   * Set value
   */
  public setValue(context: EvaluationContext, newValue: unknown): void {
    const state = new ExpressionState(context);
    this.ast.setValue(state, newValue);
  }

  /**
   * Get expression string
   */
  public getExpressionString(): string {
    return this.expressionString;
  }

  /**
   * Get AST debug representation
   */
  public toStringAST(): string {
    return this.ast.toStringAST();
  }
}
