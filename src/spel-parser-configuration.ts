/**
 * Parallels Spring SpelParserConfiguration
 *
 * SpEL parser configuration options.
 */
export class SpelParserConfiguration {
  /**
   * Auto-convert null references to NullLiteral
   */
  public readonly autoGrowNullReferences: boolean;

  /**
   * Auto-grow collections (expand when index does not exist)
   */
  public readonly autoGrowCollections: boolean;

  /**
   * Maximum auto-grow size
   */
  public readonly maximumAutoGrowSize: number;

  /**
   * Treat integers as long
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
