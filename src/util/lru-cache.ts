/**
 * 泛型 LRU 缓存
 *
 * 用于 OperatorMatches 和 JavaRegexConverter 中的正则缓存。
 * 当缓存达到容量上限时，淘汰最久未使用的条目。
 *
 * @param capacity 最大缓存条目数
 */
export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map<K, V>();
  }

  /**
   * 获取缓存值。若存在则将其标记为最近使用。
   */
  public get(key: K): V | undefined {
    if (!this.map.has(key)) {
      return undefined;
    }
    // Map 迭代顺序即插入顺序，删除再插入以移至末尾
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /**
   * 设置缓存值。若超出容量则淘汰最久未使用的条目。
   */
  public set(key: K, value: V): void {
    // 容量为 0 时不存储任何内容
    if (this.capacity === 0) {
      return;
    }

    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // 淘汰最旧的条目 (Map 迭代的第一个)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  /**
   * 检查键是否存在
   */
  public has(key: K): boolean {
    return this.map.has(key);
  }

  /**
   * 删除指定键
   */
  public delete(key: K): boolean {
    return this.map.delete(key);
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this.map.clear();
  }

  /**
   * 当前缓存条目数
   */
  public get size(): number {
    return this.map.size;
  }
}
