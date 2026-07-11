/**
 * Bean resolver interface, parallels Spring BeanResolver
 */
export interface BeanResolver {
  /**
   * Resolve @beanName reference
   *
   * @param name Bean name
   * @param isFactoryBean whether this is &@bean (factory Bean)
   * @returns Bean instance
   * @throws SpelEvaluationException if Bean does not exist
   */
  resolve(name: string, isFactoryBean?: boolean): unknown;

  /**
   * Register Bean
   */
  register(name: string, bean: unknown): void;

  /**
   * Check if Bean is registered
   */
  has(name: string): boolean;
}
