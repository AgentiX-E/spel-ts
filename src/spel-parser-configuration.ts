/**
 * 对标 Spring SpelParserConfiguration
 *
 * SpEL 解析器的配置选项。
 */
export class SpelParserConfiguration {
  /**
   * 是否自动转换 null 引用为 NullLiteral
   */
  public readonly autoGrowNullReferences: boolean;

  /**
   * 是否自动增长集合（索引不存在时自动扩展）
   */
  public readonly autoGrowCollections: boolean;

  /**
   * 最大自动增长大小
   */
  public readonly maximumAutoGrowSize: number;

  /**
   * 整数是否作为长整型处理
   */
  public readonly treatIntegersAsLong: boolean;

  constructor(
    autoGrowNullReferences = false,
    autoGrowCollections = false,
    maximumAutoGrowSize = 10_000,
    treatIntegersAsLong = false,
  ) {
    this.autoGrowNullReferences = autoGrowNullReferences;
    this.autoGrowCollections = autoGrowCollections;
    this.maximumAutoGrowSize = maximumAutoGrowSize;
    this.treatIntegersAsLong = treatIntegersAsLong;
  }

  public static readonly DEFAULT = new SpelParserConfiguration();
}
