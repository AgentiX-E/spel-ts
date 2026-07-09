import { TypedValue } from './typed-value.js';
import type { EvaluationContext } from './evaluation-context/evaluation-context.js';
import type { PropertyAccessor } from './evaluation-context/property-accessor.js';
import type { MethodResolver } from './evaluation-context/method-resolver.js';
import type { TypeLocator } from './type/type-locator.js';
import type { BeanResolver } from './bean/bean-resolver.js';
import { SpelTypeConverter } from './bridge/type-coercion.js';
import { MapAccessor } from './evaluation-context/map-accessor.js';
import { ArrayAccessor } from './evaluation-context/array-accessor.js';
import { ReflectivePropertyAccessor } from './evaluation-context/reflective-property-accessor.js';
import { ReflectiveMethodResolver } from './evaluation-context/reflective-method-resolver.js';

export class StandardEvaluationContext implements EvaluationContext {
  private rootObject: TypedValue;
  private readonly variables = new Map<string, TypedValue>();
  private readonly functions = new Map<string, (...args: unknown[]) => unknown>();
  private readonly propertyAccessors: PropertyAccessor[] = [];
  private readonly methodResolvers: MethodResolver[] = [];

  private typeLocator: TypeLocator;
  private beanResolver: BeanResolver;
  private typeConverter: SpelTypeConverter;

  constructor(rootObject?: unknown) {
    this.rootObject = new TypedValue(rootObject);

    this.propertyAccessors.push(new MapAccessor());
    this.propertyAccessors.push(new ArrayAccessor());
    this.propertyAccessors.push(new ReflectivePropertyAccessor());

    this.methodResolvers.push(new ReflectiveMethodResolver());

    // These will be set to actual implementations later; for now use placeholder stubs
    this.typeLocator = {
      findType: (name: string) => {
        throw new Error(`Type "${name}" not found. TypeLocator not configured.`);
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      registerType: () => {},
      hasType: () => false,
    };

    this.beanResolver = {
      resolve: (name: string) => {
        throw new Error(`Bean "${name}" not found. BeanResolver not configured.`);
      },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      register: () => {},
      has: () => false,
    };

    this.typeConverter = new SpelTypeConverter();
  }

  public getRootObject(): TypedValue { return this.rootObject; }
  public setRootObject(obj: unknown): void { this.rootObject = new TypedValue(obj); }

  public lookupVariable(name: string): TypedValue | null {
    return this.variables.get(name) ?? null;
  }
  public setVariable(name: string, value: unknown): void {
    this.variables.set(name, new TypedValue(value));
  }

  public lookupFunction(name: string): ((...args: unknown[]) => unknown) | null {
    return this.functions.get(name) ?? null;
  }
  public registerFunction(name: string, fn: (...args: unknown[]) => unknown): void {
    this.functions.set(name, fn);
  }

  public getPropertyAccessors(): PropertyAccessor[] { return this.propertyAccessors; }
  public addPropertyAccessor(accessor: PropertyAccessor): void {
    this.propertyAccessors.push(accessor);
  }

  public getMethodResolvers(): MethodResolver[] { return this.methodResolvers; }
  public addMethodResolver(resolver: MethodResolver): void {
    this.methodResolvers.push(resolver);
  }

  public getTypeLocator(): TypeLocator { return this.typeLocator; }
  public setTypeLocator(typeLocator: TypeLocator): void { this.typeLocator = typeLocator; }

  public getBeanResolver(): BeanResolver { return this.beanResolver; }
  public setBeanResolver(beanResolver: BeanResolver): void { this.beanResolver = beanResolver; }

  public getTypeConverter(): SpelTypeConverter { return this.typeConverter; }

  public createChildContext(rootObject: unknown): EvaluationContext {
    const child = new StandardEvaluationContext(rootObject);
    child.typeLocator = this.typeLocator;
    child.beanResolver = this.beanResolver;
    child.typeConverter = this.typeConverter;
    for (const [name, fn] of this.functions) {
      child.functions.set(name, fn);
    }
    return child;
  }
}
