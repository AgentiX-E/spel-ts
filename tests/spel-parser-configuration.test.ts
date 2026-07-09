import { describe, it, expect } from 'vitest';
import { SpelParserConfiguration } from '../src/spel-parser-configuration.js';

describe('SpelParserConfiguration', () => {
  describe('default configuration', () => {
    it('should have autoGrowNullReferences = false', () => {
      expect(SpelParserConfiguration.DEFAULT.autoGrowNullReferences).toBe(false);
    });

    it('should have autoGrowCollections = false', () => {
      expect(SpelParserConfiguration.DEFAULT.autoGrowCollections).toBe(false);
    });

    it('should have maximumAutoGrowSize = 10000', () => {
      expect(SpelParserConfiguration.DEFAULT.maximumAutoGrowSize).toBe(10_000);
    });

    it('should have treatIntegersAsLong = false', () => {
      expect(SpelParserConfiguration.DEFAULT.treatIntegersAsLong).toBe(false);
    });

    it('should be a singleton', () => {
      expect(SpelParserConfiguration.DEFAULT).toBe(SpelParserConfiguration.DEFAULT);
    });
  });

  describe('custom configuration', () => {
    it('should accept autoGrowNullReferences', () => {
      const config = new SpelParserConfiguration(true);
      expect(config.autoGrowNullReferences).toBe(true);
      expect(config.autoGrowCollections).toBe(false);
    });

    it('should accept autoGrowCollections', () => {
      const config = new SpelParserConfiguration(false, true);
      expect(config.autoGrowCollections).toBe(true);
    });

    it('should accept maximumAutoGrowSize', () => {
      const config = new SpelParserConfiguration(false, false, 500);
      expect(config.maximumAutoGrowSize).toBe(500);
    });

    it('should accept treatIntegersAsLong', () => {
      const config = new SpelParserConfiguration(false, false, 10_000, true);
      expect(config.treatIntegersAsLong).toBe(true);
    });

    it('should accept all custom values', () => {
      const config = new SpelParserConfiguration(true, true, 100, true);
      expect(config.autoGrowNullReferences).toBe(true);
      expect(config.autoGrowCollections).toBe(true);
      expect(config.maximumAutoGrowSize).toBe(100);
      expect(config.treatIntegersAsLong).toBe(true);
    });
  });

  describe('immutability', () => {
    it('properties should be readonly', () => {
      const config = new SpelParserConfiguration();
      // These are readonly properties, tested at type level
      expect(typeof config.autoGrowNullReferences).toBe('boolean');
      expect(typeof config.autoGrowCollections).toBe('boolean');
      expect(typeof config.maximumAutoGrowSize).toBe('number');
      expect(typeof config.treatIntegersAsLong).toBe('boolean');
    });
  });
});
