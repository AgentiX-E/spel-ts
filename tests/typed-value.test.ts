import { describe, it, expect } from 'vitest';
import { TypedValue } from '../src/typed-value.js';

describe('TypedValue', () => {
  describe('constructor and getValue', () => {
    it('should hold a null value', () => {
      const tv = new TypedValue(null);
      expect(tv.getValue()).toBeNull();
      expect(tv.isNull()).toBe(true);
    });

    it('should hold undefined as null-like', () => {
      const tv = new TypedValue(undefined);
      expect(tv.getValue()).toBeUndefined();
      expect(tv.isNull()).toBe(true);
    });

    it('should hold a string value', () => {
      const tv = new TypedValue('hello');
      expect(tv.getValue()).toBe('hello');
      expect(tv.isNull()).toBe(false);
    });

    it('should hold a number value', () => {
      const tv = new TypedValue(42);
      expect(tv.getValue()).toBe(42);
    });

    it('should hold a boolean value', () => {
      const tv = new TypedValue(true);
      expect(tv.getValue()).toBe(true);
    });

    it('should hold an object value', () => {
      const obj = { name: 'Alice', age: 30 };
      const tv = new TypedValue(obj);
      expect(tv.getValue()).toBe(obj);
    });

    it('should hold an array value', () => {
      const arr = [1, 2, 3];
      const tv = new TypedValue(arr);
      expect(tv.getValue()).toEqual([1, 2, 3]);
    });

    it('should hold 0 (falsy but not null)', () => {
      const tv = new TypedValue(0);
      expect(tv.getValue()).toBe(0);
      expect(tv.isNull()).toBe(false);
    });

    it('should hold empty string (falsy but not null)', () => {
      const tv = new TypedValue('');
      expect(tv.getValue()).toBe('');
      expect(tv.isNull()).toBe(false);
    });

    it('should hold false (falsy but not null)', () => {
      const tv = new TypedValue(false);
      expect(tv.getValue()).toBe(false);
      expect(tv.isNull()).toBe(false);
    });
  });

  describe('getTypeDescriptor', () => {
    it('should return null by default', () => {
      const tv = new TypedValue(42);
      expect(tv.getTypeDescriptor()).toBeNull();
    });

    it('should return provided type descriptor', () => {
      const typeDesc = { name: 'Number' };
      const tv = new TypedValue(42, typeDesc);
      expect(tv.getTypeDescriptor()).toBe(typeDesc);
    });
  });

  describe('toString', () => {
    it('should convert number to string', () => {
      expect(new TypedValue(42).toString()).toBe('42');
    });

    it('should convert string to string', () => {
      expect(new TypedValue('hello').toString()).toBe('hello');
    });

    it('should convert null to "null"', () => {
      expect(new TypedValue(null).toString()).toBe('null');
    });

    it('should convert boolean to string', () => {
      expect(new TypedValue(true).toString()).toBe('true');
      expect(new TypedValue(false).toString()).toBe('false');
    });
  });

  describe('TypedValue.NULL', () => {
    it('should be a singleton with null value', () => {
      expect(TypedValue.NULL.getValue()).toBeNull();
      expect(TypedValue.NULL.isNull()).toBe(true);
    });

    it('should always return the same instance', () => {
      expect(TypedValue.NULL).toBe(TypedValue.NULL);
    });
  });
});
