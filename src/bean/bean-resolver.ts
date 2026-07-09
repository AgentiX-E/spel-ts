/**
 * Bean 解析器接口，对标 Spring BeanResolver
 */
export interface BeanResolver {
  /**
   * 解析 @beanName 引用
   *
   * @param name Bean 名称
   * @param isFactoryBean 是否为 &@bean (工厂 Bean)
   * @returns Bean 实例
   * @throws SpelEvaluationException 如果 Bean 不存在
   */
  resolve(name: string, isFactoryBean?: boolean): unknown;

  /**
   * 注册 Bean
   */
  register(name: string, bean: unknown): void;

  /**
   * 检查 Bean 是否已注册
   */
  has(name: string): boolean;
}
