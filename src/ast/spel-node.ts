import type { ExpressionState } from '../expression-state.js';
import type { TypedValue } from '../typed-value.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

export abstract class SpelNodeImpl {
  protected children: SpelNodeImpl[];

  constructor(
    startPos: number,
    endPos: number,
    ...children: SpelNodeImpl[]
  ) {
    this.startPos = startPos;
    this.endPos = endPos;
    this.children = children;
  }

  public readonly startPos: number;
  public readonly endPos: number;

  public getValue(state: ExpressionState): TypedValue {
    try {
      return this.getValueInternal(state);
    } catch (e) {
      if (e instanceof SpelEvaluationException) {
        if (e.position < 0) {
          e.position = this.startPos;
        }
        throw e;
      }
      throw new SpelEvaluationException(
        this.startPos,
        SpelMessage.EXCEPTION_DURING_PROPERTY_READ,
        this.toStringAST(),
        (e as Error).message,
      );
    }
  }

  public abstract getValueInternal(state: ExpressionState): TypedValue;

  public isWritable(_state: ExpressionState): boolean {
    return false;
  }

  public setValue(_state: ExpressionState, _newValue: unknown): void {
    throw new SpelEvaluationException(
      this.startPos,
      SpelMessage.NOT_ASSIGNABLE,
      this.toStringAST(),
    );
  }

  public getValueType(state: ExpressionState): unknown {
    return this.getValue(state).getTypeDescriptor();
  }

  public getChild(index: number): SpelNodeImpl {
    return this.children[index]!;
  }

  public setChild(index: number, child: SpelNodeImpl): void {
    this.children[index] = child;
  }

  public getChildCount(): number {
    return this.children.length;
  }

  public abstract toStringAST(): string;
}

export abstract class Literal extends SpelNodeImpl {
  constructor(startPos: number, endPos: number, protected readonly literalValue: string) {
    super(startPos, endPos);
  }

  public abstract override getValueInternal(state: ExpressionState): TypedValue;
  public abstract override toStringAST(): string;
}

export abstract class Operator extends SpelNodeImpl {
  protected readonly operatorName: string;

  constructor(operatorName: string, startPos: number, endPos: number, ...operands: SpelNodeImpl[]) {
    super(startPos, endPos, ...operands);
    this.operatorName = operatorName;
  }

  public toStringAST(): string {
    return `(${this.children[0]?.toStringAST() ?? ''} ${this.operatorName} ${this.children[1]?.toStringAST() ?? ''})`;
  }

  public abstract override getValueInternal(state: ExpressionState): TypedValue;
}
