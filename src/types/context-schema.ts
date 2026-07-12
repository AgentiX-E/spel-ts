/**
 * ContextSchema — metadata describing the SpEL evaluation context.
 *
 * Used by:
 * 1. NL→SpEL engines: constructing LLM prompts with context information
 * 2. Validation pipelines: verifying expression references are valid
 * 3. Template engines: matching correct field names during slot filling
 * 4. GBNF generators: generating grammar with all valid identifiers
 * 5. Editors: providing auto-completion suggestions and diagnostics
 *
 * Originally defined in @agentix-e/nl2spel. Moved to spel-ts as the canonical
 * source of truth for SpEL type metadata.
 */

/** Top-level context schema describing all available entities */
export interface ContextSchema {
  /** Root object metadata (accessible as #root or #rootName) */
  root: RootObjectSchema | null;

  /** Variable declarations accessible via #varName */
  variables: Record<string, VariableSchema>;

  /** Bean declarations accessible via @beanName or &@factory */
  beans: Record<string, BeanSchema>;

  /** Type declarations accessible via T(TypeName) */
  types: Record<string, TypeSchema>;

  /** Function declarations accessible via #functionName(args) */
  functions: Record<string, FunctionSchema>;
}

/** Root object metadata */
export interface RootObjectSchema {
  /** Root object name (referenced as #rootName in SpEL) */
  name: string;

  /** Root object type (e.g., 'Order', 'com.example.User') */
  type: string;

  /** Root object fields accessible via #root.field or #rootName.field */
  fields: Record<string, FieldSchema>;

  /** Root object methods accessible via #root.method(args) */
  methods: Record<string, MethodSchema>;
}

/** Field metadata for a property/field on an object */
export interface FieldSchema {
  /** SpEL type category */
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'map';

  /** Fully qualified SpEL type name (e.g., 'java.math.BigDecimal') */
  spelType?: string;

  /** Human-readable field description */
  description?: string;

  /** Nested fields for object-typed fields */
  fields?: Record<string, FieldSchema>;

  /** Whether the field is a collection (array/List/Set) */
  isCollection?: boolean;

  /** Element type for collections (e.g., 'OrderItem') */
  elementType?: string;

  /** Whether the field can be null */
  nullable?: boolean;

  /** Example value for documentation/LLM context */
  example?: unknown;
}

/** Variable declaration metadata */
export interface VariableSchema {
  /** Variable type */
  type: string;

  /** Description for semantic matching */
  description?: string;

  /** Whether the variable can be null */
  nullable?: boolean;

  /** Default/example value */
  value?: unknown;
}

/** Bean declaration metadata */
export interface BeanSchema {
  /** Bean type/class */
  type: string;

  /** Description for semantic matching */
  description?: string;

  /** Whether the bean is a singleton */
  singleton?: boolean;
}

/** Type declaration metadata */
export interface TypeSchema {
  /** Fully qualified class name (e.g., 'java.time.LocalDate') */
  className?: string;

  /** Description for semantic matching */
  description?: string;

  /** Instance methods */
  methods?: Record<string, MethodSchema>;

  /** Static methods */
  staticMethods?: Record<string, MethodSchema>;
}

/** Method signature metadata */
export interface MethodSchema {
  /** Method return type */
  returnType: string;

  /** Method parameters */
  params?: Array<{ name: string; type: string }>;

  /** Human-readable description */
  description?: string;
}

/** Function declaration metadata */
export interface FunctionSchema {
  /** Function return type */
  returnType: string;

  /** Function parameters */
  params: Array<{ name: string; type: string }>;

  /** Human-readable description */
  description?: string;
}
