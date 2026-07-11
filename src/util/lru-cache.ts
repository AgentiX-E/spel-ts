/**
 * Generic LRU cache
 *
 * Used for regex caching in OperatorMatches and JavaRegexConverter.
 * Evicts least recently used entry when capacity limit is reached.
 *
 * @param capacity maximum number of cached entries
 */
export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map<K, V>();
  }

  /**
   * Get cached value. If present, marks it as recently used.
   */
  public get(key: K): V | undefined {
    if (!this.map.has(key)) {
      return undefined;
    }
    // Map iteration order = insertion order; delete+reinsert to move to end
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /**
   * Set cached value. Evicts least recently used entry if capacity exceeded.
   */
  public set(key: K, value: V): void {
    // Capacity 0 stores nothing
    if (this.capacity === 0) {
      return;
    }

    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict oldest entry (first in Map iteration)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  /**
   * Check if key exists
   */
  public has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * Delete specified key
   */
  public delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * Clear cache
   */
  public clear(): void {
    this.map.clear();
  }

  /**
   * Current cache entry count
   */
  public get size(): number {
    return this.map.size;
  }
}
