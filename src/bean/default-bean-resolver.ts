import type { BeanResolver } from './bean-resolver.js';
import { SpelEvaluationException } from '../error/spel-evaluation-exception.js';
import { SpelMessage } from '../error/spel-message.js';

export class DefaultBeanResolver implements BeanResolver {
  private readonly beans = new Map<string, unknown>();
  private readonly factoryBeans = new Map<string, () => unknown>();

  public resolve(name: string, isFactoryBean = false): unknown {
    if (isFactoryBean) {
      const factory = this.factoryBeans.get(name);
      if (factory) {
        return factory();
      }
      throw new SpelEvaluationException(-1, SpelMessage.BEAN_NOT_FOUND, `&${name}`);
    }

    const bean = this.beans.get(name);
    if (bean !== undefined) {
      return bean;
    }
    // Also check factory beans as regular resolution
    const factory = this.factoryBeans.get(name);
    if (factory) {
      return factory();
    }
    throw new SpelEvaluationException(-1, SpelMessage.BEAN_NOT_FOUND, name);
  }

  public register(name: string, bean: unknown): void {
    this.beans.set(name, bean);
  }

  public registerFactory(name: string, factory: () => unknown): void {
    this.factoryBeans.set(name, factory);
  }

  public has(name: string): boolean {
    return this.beans.has(name) || this.factoryBeans.has(name);
  }
}
