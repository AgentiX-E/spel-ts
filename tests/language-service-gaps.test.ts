/**
 * Language Service Coverage Gaps — targeted tests for uncovered branches.
 *
 * Covers gaps in:
 *   - SpelDiagnosticEngine  (60% stmts / 50% branches → target ≥80%)
 *   - SpelReferenceExtractor (75% stmts / 56% branches → target ≥80%)
 *   - SpelFormatter          (83% stmts / 82% branches → target ≥90%)
 *   - SpelEvaluatorAdapter   (93% stmts / 59% branches → target ≥85%)
 */
import { describe, it, expect } from 'vitest';
import {
  SpelExpressionParser,
  StandardEvaluationContext,
  SpelReferenceExtractor,
  SpelReferenceKind,
  SpelDiagnosticEngine,
  DiagnosticSeverity,
  DiagnosticSource,
  SpelFormatter,
  SpelEvaluatorAdapter,
  SpelCompletionEngine,
  CompletionKind,
} from '../src/index.js';

// =====================================================================
// 1. SPELDIAGNOSTICENGINE — SEMANTIC gaps
// =====================================================================
describe('SpelDiagnosticEngine — semantic gaps', () => {
  it('checkSemantics detects SEMANTIC-CONTRADICTION (false and ...)', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('false and #x > 5');
    expect(diags.some((d) => d.code === 'SEMANTIC-CONTRADICTION')).toBe(true);
  });

  it('checkSemantics detects self-comparison with !=', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('#x != #x');
    const sc = diags.find((d) => d.code === 'SEMANTIC-SELF_COMPARISON');
    expect(sc).toBeDefined();
    expect(sc!.message).toContain('always false');
  });

  it('checkSemantics detects self-comparison with ne', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('#x ne #x');
    const sc = diags.find((d) => d.code === 'SEMANTIC-SELF_COMPARISON');
    expect(sc).toBeDefined();
    expect(sc!.message).toContain('always false');
  });

  it('checkSemantics detects self-comparison with eq (always true)', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('#val eq #val');
    const sc = diags.find((d) => d.code === 'SEMANTIC-SELF_COMPARISON');
    expect(sc).toBeDefined();
    expect(sc!.message).toContain('always true');
  });

  it('checkSemantics works for not not variant', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('not not true');
    expect(diags.some((d) => d.code === 'SEMANTIC-DOUBLE_NEGATION')).toBe(true);
  });
});

// =====================================================================
// 2. SPELDIAGNOSTICENGINE — CONTEXT all reference types
// =====================================================================
describe('SpelDiagnosticEngine — checkContext all ref types', () => {
  const fullSchema = {
    root: {
      name: 'order',
      type: 'Order',
      fields: {
        amount: { type: 'number' as const },
        status: { type: 'string' as const },
      },
      methods: {},
    },
    variables: { score: { type: 'number' } },
    beans: { myBean: { type: 'MyService' } },
    types: { Math: { className: 'java.lang.Math' } },
    functions: { myFunc: { returnType: 'string', params: [] } },
  };

  // --- BEAN ---
  it('checkContext — defined bean produces no diagnostic', () => {
    const diags = SpelDiagnosticEngine.checkContext('@myBean', fullSchema);
    expect(diags.filter((d) => d.code === 'CONTEXT-UNDEFINED_BEAN').length).toBe(0);
  });

  it('checkContext — undefined bean produces diagnostic', () => {
    const diags = SpelDiagnosticEngine.checkContext('@unknownBean', fullSchema);
    expect(diags.some((d) => d.code === 'CONTEXT-UNDEFINED_BEAN')).toBe(true);
  });

  // --- BEAN_FACTORY ---
  it('checkContext — undefined factory bean produces diagnostic', () => {
    const diags = SpelDiagnosticEngine.checkContext('&@unknownFactory', fullSchema);
    expect(diags.some((d) => d.code === 'CONTEXT-UNDEFINED_BEAN')).toBe(true);
  });

  // --- TYPE ---
  it('checkContext — defined type produces no diagnostic', () => {
    const diags = SpelDiagnosticEngine.checkContext('T(Math).random()', fullSchema);
    expect(diags.filter((d) => d.code === 'CONTEXT-UNDEFINED_TYPE').length).toBe(0);
  });

  it('checkContext — undefined type produces diagnostic', () => {
    const emptySchema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const diags = SpelDiagnosticEngine.checkContext('T(Unknown).method()', emptySchema);
    expect(diags.some((d) => d.code === 'CONTEXT-UNDEFINED_TYPE')).toBe(true);
  });

  // --- VARIABLE skip for root/this ---
  it("checkContext — variable named 'root' is silently skipped", () => {
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    // 'root' is skipped by the variable check logic
    const diags = SpelDiagnosticEngine.checkContext('#root', schema);
    expect(diags.filter((d) => d.code === 'CONTEXT-UNDEFINED_VARIABLE').length).toBe(0);
  });

  it("checkContext — variable named 'this' is silently skipped", () => {
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const diags = SpelDiagnosticEngine.checkContext('#this', schema);
    expect(diags.filter((d) => d.code === 'CONTEXT-UNDEFINED_VARIABLE').length).toBe(0);
  });

  // --- FUNCTION (via method-style reference) ---
  it('checkContext — defined variable produces no diagnostic', () => {
    const schemaWithVar = {
      ...fullSchema,
      variables: { ...fullSchema.variables, myFunc: { type: 'string' } },
    };
    const diags = SpelDiagnosticEngine.checkContext('#myFunc', schemaWithVar);
    // #myFunc without parens is parsed as VariableReference
    expect(diags.filter((d) => d.code === 'CONTEXT-UNDEFINED_VARIABLE').length).toBe(0);
  });

  it('checkContext — undefined function name as variable triggers variable diagnostic', () => {
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const diags = SpelDiagnosticEngine.checkContext('#unknownFunc', schema);
    // Parsed as VARIABLE, not FUNCTION (no parens = variable ref)
    expect(diags.some((d) => d.code === 'CONTEXT-UNDEFINED_VARIABLE')).toBe(true);
  });

  // --- validate covers all stages with schema ---
  it('validate runs context check when schema provided for valid syntax', () => {
    const diags = SpelDiagnosticEngine.validate('#missing', {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    });
    expect(diags.some((d) => d.code === 'CONTEXT-UNDEFINED_VARIABLE')).toBe(true);
  });

  it('validate includes semantic warnings even with valid syntax', () => {
    const diags = SpelDiagnosticEngine.validate('true or #x > 5');
    expect(diags.some((d) => d.code === 'SEMANTIC-TAUTOLOGY')).toBe(true);
  });
});

// =====================================================================
// 3. SPELDIAGNOSTICENGINE — parseWithDiagnostics
// =====================================================================
describe('SpelDiagnosticEngine — parseWithDiagnostics gaps', () => {
  it('parseWithDiagnostics returns semantic diags for valid expression', () => {
    const result = SpelDiagnosticEngine.parseWithDiagnostics('!!true');
    expect(result.ast).not.toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it('parseWithDiagnostics with syntax error returns code with messageCode', () => {
    const result = SpelDiagnosticEngine.parseWithDiagnostics('1 +');
    expect(result.ast).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0].code.startsWith('SYNTAX-')).toBe(true);
  });
});

// =====================================================================
// 4. SPELREFERENCEEXTRACTOR — extractFromAst types
// =====================================================================
describe('SpelReferenceExtractor — extractFromAst types', () => {
  const parser = new SpelExpressionParser();

  it('extractFromAst detects BEAN_REFERENCE as BEAN kind', () => {
    const ast = parser.parseRaw('@myBean');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    const beanRef = refs.find((r) => r.kind === SpelReferenceKind.BEAN);
    expect(beanRef).toBeDefined();
    expect(beanRef!.name).toBe('myBean');
  });

  it('extractFromAst detects factory bean as BEAN_FACTORY kind', () => {
    const ast = parser.parseRaw('&@myFactory');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    const factoryRef = refs.find((r) => r.kind === SpelReferenceKind.BEAN_FACTORY);
    expect(factoryRef).toBeDefined();
    expect(factoryRef!.name).toBe('myFactory');
  });

  it('extractFromAst detects TYPE_REFERENCE', () => {
    const ast = parser.parseRaw('T(Math).random()');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    const typeRef = refs.find((r) => r.kind === SpelReferenceKind.TYPE);
    expect(typeRef).toBeDefined();
    expect(typeRef!.name).toBe('Math');
  });

  it('extractFromAst returns correct path for bean ref', () => {
    const ast = parser.parseRaw('@myBean');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    expect(refs[0].path).toEqual(['myBean']);
  });

  it('extractFromAst sets correct nodeType for bean ref', () => {
    const ast = parser.parseRaw('@myBean');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    expect(refs[0].nodeType).toBe(ast.nodeType);
  });
});

// =====================================================================
// 5. SPELREFERENCEEXTRACTOR — extract fallback regex coverage
// =====================================================================
describe('SpelReferenceExtractor — fallback regex gaps', () => {
  it('extract uses fallback for unparseable expression with variable', () => {
    // @myBean #var — parseable bean ref + trailing hash makes parseRaw fail
    const refs = SpelReferenceExtractor.extract('@myBean #var');
    const varRef = refs.find((r) => r.kind === SpelReferenceKind.VARIABLE);
    expect(varRef).toBeDefined();
    expect(varRef!.name).toBe('var');
  });

  it('extract uses fallback for unparseable expression with bean', () => {
    const refs = SpelReferenceExtractor.extract('@myBean #var');
    const beanRef = refs.find((r) => r.kind === SpelReferenceKind.BEAN);
    expect(beanRef).toBeDefined();
    expect(beanRef!.name).toBe('myBean');
  });

  it('fallback — & prefix on @ skips bean regex match for that occurrence', () => {
    // &@factory — the @ here is preceded by &, so bean regex should skip it
    // But factory regex should catch it
    const refs = SpelReferenceExtractor.extract('&@myFactory #x');
    const factoryRefs = refs.filter((r) => r.kind === SpelReferenceKind.BEAN_FACTORY);
    expect(factoryRefs.length).toBe(1);
    expect(factoryRefs[0].name).toBe('myFactory');
    // Verify it is NOT also listed as regular BEAN
    const beanRefs = refs.filter(
      (r) => r.kind === SpelReferenceKind.BEAN && r.name === 'myFactory',
    );
    expect(beanRefs.length).toBe(0);
  });

  it('fallback — type regex captures T(Type) references', () => {
    const refs = SpelReferenceExtractor.extract('T(Math) #x');
    const typeRef = refs.find((r) => r.kind === SpelReferenceKind.TYPE);
    expect(typeRef).toBeDefined();
    expect(typeRef!.name).toBe('Math');
  });

  it('fallback — variable regex captures dotted variable names', () => {
    const refs = SpelReferenceExtractor.extract('@bean #a.b.c');
    const varRef = refs.find((r) => r.kind === SpelReferenceKind.VARIABLE);
    expect(varRef).toBeDefined();
    expect(varRef!.name).toBe('a.b.c');
    expect(varRef!.path).toEqual(['a', 'b', 'c']);
  });
});

// =====================================================================
// 6. SPELFORMATTER — compact & minify edge cases
// =====================================================================
describe('SpelFormatter — compact & minify gaps', () => {
  it('format with compact spacing removes spaces around operators', () => {
    const result = SpelFormatter.format('1 + 2', { spacing: 'compact' });
    // Compact should not contain spaces around + operator
    expect(result).toContain('1+2');
  });

  it('minify preserves string literals with escaped quotes', () => {
    const result = SpelFormatter.minify("'it\\'s'");
    expect(result).toContain("'it\\'s'");
  });

  it('minify handles tabs and newlines in expression', () => {
    const result = SpelFormatter.minify('\t1\t+\t2\n');
    // Space before + (token char), no space after + (not token char)
    expect(result).toBe('1 +2');
  });

  it('minify normalizes multiple spaces around keywords', () => {
    const result = SpelFormatter.minify('1    and    2');
    expect(result).toBe('1 and 2');
  });

  it('minify trims leading/trailing whitespace', () => {
    const result = SpelFormatter.minify('  1+2  ');
    expect(result).toBe('1+2');
  });

  it('minify handles mixed whitespace in strings correctly', () => {
    const result = SpelFormatter.minify("'hello  world'");
    expect(result).toBe("'hello  world'");
  });

  it('format with compact spaces normalizes spacing', () => {
    // AST toStringAST uses && and || symbols, compact removes spaces around them
    const result = SpelFormatter.format('1 and 2 or 3', { spacing: 'compact' });
    // Compact removes spaces around punctuation operators
    expect(result).not.toContain('  ');
    expect(result.length).toBeGreaterThan(0);
  });

  it('semanticallyEqual uses minify fallback for unparseable expressions', () => {
    // Both '1+' and '1+ ' fail parseRaw, fallback to minify comparison
    const result = SpelFormatter.semanticallyEqual('1+', '1+ ');
    expect(result).toBe(true);
  });

  it('semanticallyEqual fallback returns false for different invalid expressions', () => {
    const result = SpelFormatter.semanticallyEqual('1+', '2-');
    expect(result).toBe(false);
  });

  it('semanticallyEqual works with real minify-able invalid expressions', () => {
    const result = SpelFormatter.semanticallyEqual(' true  and  false ', 'true and false');
    expect(result).toBe(true);
  });
});

// =====================================================================
// 7. SPELEVALUATORADAPTER — validateContext & error paths
// =====================================================================
describe('SpelEvaluatorAdapter — validateContext & error paths', () => {
  it('getContextSchema returns null on internal error', () => {
    // Create a mock that throws when getRootObject is called
    const mockCtx = {
      getRootObject: () => {
        throw new Error('internal error');
      },
    };
    const adapter = new SpelEvaluatorAdapter(mockCtx as unknown as StandardEvaluationContext);
    const schema = adapter.getContextSchema();
    expect(schema).toBeNull();
  });

  it('getContextSchema returns schema for context without root object', () => {
    const ctx = new StandardEvaluationContext(); // No root object
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = adapter.getContextSchema();
    expect(schema).not.toBeNull();
    if (schema) {
      expect(schema.root).toBeNull();
      expect(typeof schema.variables).toBe('object');
      expect(typeof schema.beans).toBe('object');
      expect(typeof schema.types).toBe('object');
      expect(typeof schema.functions).toBe('object');
    }
  });

  it('fromContext returns a new adapter', () => {
    const ctx = new StandardEvaluationContext();
    const a1 = SpelEvaluatorAdapter.fromContext(ctx);
    const a2 = SpelEvaluatorAdapter.fromContext(ctx);
    expect(a1).toBeDefined();
    expect(a2).toBeDefined();
    expect(a1).not.toBe(a2); // Different instances
  });

  it('validateContext reports missing beans', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const result = adapter.validateContext('@unknownBean', schema);
    expect(result.valid).toBe(false);
    expect(result.missingReferences.length).toBeGreaterThan(0);
    expect(result.missingReferences.some((r) => r.name === 'unknownBean')).toBe(true);
  });

  it('validateContext reports missing types', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const result = adapter.validateContext('T(Unknown).method()', schema);
    expect(result.valid).toBe(false);
    expect(result.missingReferences.some((r) => r.kind === SpelReferenceKind.TYPE)).toBe(true);
  });

  it('validateContext reports missing factory beans', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const result = adapter.validateContext('&@missingFactory', schema);
    expect(result.missingReferences.length).toBeGreaterThan(0);
  });

  it('validateContext returns typeMismatches array', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = {
      root: null,
      variables: { x: { type: 'number' } },
      beans: {},
      types: {},
      functions: {},
    };
    const result = adapter.validateContext('#x > 5', schema);
    expect(Array.isArray(result.typeMismatches)).toBe(true);
  });

  it('parse returns errors with code for SpelParseException', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const result = adapter.parse('1 +');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toBeDefined();
  });

  it('evaluate uses root object from provided context', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    // Pass root object in context dict — property access without # prefix
    const result = adapter.evaluate('a + 3', { a: 10 });
    expect(result).toBe(13);
  });

  it('getCompletions includes context-aware items with schema', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = {
      root: null,
      variables: { threshold: { type: 'number' } },
      beans: {},
      types: {},
      functions: {},
    };
    const items = adapter.getCompletions('', 0, schema);
    expect(items.some((i) => i.label === '#threshold')).toBe(true);
  });
});

// =====================================================================
// 8. SPELCOMPLETIONENGINE — additional coverage
// =====================================================================
describe('SpelCompletionEngine — additional coverage', () => {
  it('getContextCompletions returns empty for empty schema', () => {
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const items = SpelCompletionEngine.getContextCompletions('', 0, schema);
    // No variables/beans/types/functions in schema → no context items
    expect(items.length).toBe(0);
  });

  it('getContextCompletions with root has methods', () => {
    const schema = {
      root: {
        name: 'obj',
        type: 'MyObject',
        fields: {},
        methods: {
          calculate: { returnType: 'number', params: [{ name: 'x', type: 'number' }] },
        },
      },
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const items = SpelCompletionEngine.getContextCompletions('', 0, schema);
    expect(items.some((i) => i.label === 'calculate()')).toBe(true);
  });

  it('getContextCompletions includes registered types', () => {
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: { LocalDate: { className: 'java.time.LocalDate' } },
      functions: {},
    };
    const items = SpelCompletionEngine.getContextCompletions('', 0, schema);
    expect(items.some((i) => i.label === 'T(LocalDate)')).toBe(true);
  });

  it('getContextCompletions with prefix filters correctly', () => {
    const schema = {
      root: null,
      variables: { alpha: { type: 'number' }, beta: { type: 'number' } },
      beans: {},
      types: {},
      functions: {},
    };
    const items = SpelCompletionEngine.getContextCompletions('', 0, schema, '#a');
    expect(items.some((i) => i.label === '#alpha')).toBe(true);
    expect(items.some((i) => i.label === '#beta')).toBe(false);
  });
});
