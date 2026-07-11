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
