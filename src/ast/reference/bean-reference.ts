import type { ExpressionState } from '../../expression-state.js';
import { TypedValue } from '../../typed-value.js';
import { SpelNodeImpl } from '../spel-node.js';
import { SpelEvaluationException } from '../../error/spel-evaluation-exception.js';
import { SpelMessage } from '../../error/spel-message.js';

/**
 * Bean 引用节点 — 对标 Spring BeanReference
 */
export class BeanReference extends SpelNodeImpl {
  private readonly beanName: string;
  private readonly isFactoryBean: boolean;

  constructor(startPos: number, endPos: number, beanName: string, isFactoryBean = false) {
    super(startPos, endPos);
    this.beanName = beanName;
    this.isFactoryBean = isFactoryBean;
  }

  public getValueInternal(state: ExpressionState): TypedValue {
    try {
      const bean = state.resolveBean(this.beanName, this.isFactoryBean);
      return new TypedValue(bean);
    } catch (e) {
      if (e instanceof SpelEvaluationException) {
        throw e;
      }
      throw new SpelEvaluationException(
        this.startPos, SpelMessage.BEAN_NOT_FOUND, this.beanName,
      );
    }
  }

  public toStringAST(): string {
    const prefix = this.isFactoryBean ? '&@' : '@';
    return `${prefix}${this.beanName}`;
  }
}
