import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../src/util/lru-cache.js';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  describe('basic operations', () => {
    it('should set and get a value', () => {
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('should return undefined for missing key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check existence with has()', () => {
      cache.set('a', 1);
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });

    it('should delete a key', () => {
      cache.set('a', 1);
      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('x')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('capacity and eviction', () => {
    it('should report correct size', () => {
      expect(cache.size).toBe(0);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
    });

    it('should evict least recently used when capacity exceeded', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.set('d', 4); // This should evict 'a'

      expect(cache.size).toBe(3);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should move accessed item to most recently used', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Access 'a' to make it most recently used
      expect(cache.get('a')).toBe(1);

      // Add new item — should evict 'b' (now LRU)
      cache.set('d', 4);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('should update existing key without eviction', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Update 'a'
      cache.set('a', 100);

      expect(cache.size).toBe(3);
      expect(cache.get('a')).toBe(100);
    });

    it('should update existing key and move to MRU', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      // Update 'a' (makes it MRU)
      cache.set('a', 10);

      // Add 'd' — should evict 'b' (now LRU)
      cache.set('d', 4);

      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle capacity of 1', () => {
      const small = new LRUCache<string, number>(1);
      small.set('a', 1);
      expect(small.size).toBe(1);
      small.set('b', 2);
      expect(small.size).toBe(1);
      expect(small.get('a')).toBeUndefined();
      expect(small.get('b')).toBe(2);
    });

    it('should handle capacity of 0', () => {
      const empty = new LRUCache<string, number>(0);
      empty.set('a', 1);
      expect(empty.size).toBe(0);
      expect(empty.get('a')).toBeUndefined();
    });

    it('should handle repeated set of same key', () => {
      cache.set('a', 1);
      cache.set('a', 2);
      cache.set('a', 3);
      expect(cache.size).toBe(1);
      expect(cache.get('a')).toBe(3);
    });

    it('should handle large capacity', () => {
      const large = new LRUCache<number, number>(1000);
      for (let i = 0; i < 1000; i++) {
        large.set(i, i * 2);
      }
      expect(large.size).toBe(1000);
      expect(large.get(500)).toBe(1000);
    });

    it('should evict correctly with large capacity', () => {
      const large = new LRUCache<number, number>(5);
      for (let i = 0; i < 10; i++) {
        large.set(i, i);
      }
      expect(large.size).toBe(5);
      // First 5 should be evicted
      for (let i = 0; i < 5; i++) {
        expect(large.get(i)).toBeUndefined();
      }
      // Last 5 should be present
      for (let i = 5; i < 10; i++) {
        expect(large.get(i)).toBe(i);
      }
    });

    it('should handle generic types', () => {
      const objCache = new LRUCache<string, { id: number; }>(2);
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      objCache.set('first', obj1);
      objCache.set('second', obj2);
      expect(objCache.get('first')).toBe(obj1);
      expect(objCache.get('second')).toBe(obj2);
    });
  });
});
