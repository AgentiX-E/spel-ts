/**
 * Type descriptor, parallels Spring TypeDescriptor
 */
export interface TypeDescriptor {
  /** Type name (e.g. 'java.lang.String') */
  readonly name: string;

  /** JS constructor */
  readonly constructor: new (...args: unknown[]) => unknown;

  /** Static methods */
  readonly staticMethods: Record<string, (...args: unknown[]) => unknown>;

  /** Static fields */
  readonly staticFields: Record<string, unknown>;

  /** Type check */
  isInstance(value: unknown): boolean;

  /** Create instance */
  newInstance(...args: unknown[]): unknown;

  /** Call static method */
  callStaticMethod(name: string, ...args: unknown[]): unknown;

  /** Get static field */
  getStaticField(name: string): unknown;
}

/**
 * Duck-type guard for a resolved type handle.
 *
 * Exported so the places that must treat a `T(...)` result specially share one
 * definition rather than each testing for a different subset of members.
 */
export function isTypeDescriptor(value: unknown): value is TypeDescriptor {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.isInstance === 'function' &&
    typeof candidate.callStaticMethod === 'function' &&
    typeof candidate.staticMethods === 'object'
  );
}
