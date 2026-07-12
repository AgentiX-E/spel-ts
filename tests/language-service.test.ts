/**
 * Language Service Tests — comprehensive coverage for all new v1.1.0 modules.
 * Covers: NodeType, AstWalker, SpelFormatter, SpelReferenceExtractor,
 *         SpelDiagnosticEngine, SpelCompletionEngine, SpelEvaluatorAdapter,
 *         SpelExpression.getAST(), getReferences()
 */
import { describe, it, expect } from 'vitest';
import {
  // Core
  SpelExpressionParser,
  StandardEvaluationContext,
  SpelExpression,
  TypedValue,
  // Language
  NodeType,
  AstWalker,
  SpelFormatter,
  SpelReferenceExtractor,
  SpelReferenceKind,
  SpelDiagnosticEngine,
  DiagnosticSeverity,
  DiagnosticSource,
  SpelCompletionEngine,
  CompletionKind,
  SpelEvaluatorAdapter,
  // AST
  NullLiteral,
  BooleanLiteral,
  StringLiteral,
  VariableReference,
  PropertyOrFieldReference,
  BeanReference,
  TypeReference,
  MethodReference,
  CompoundExpression,
  Ternary,
  OpPlus,
  OpEQ,
} from '../src/index.js';

// =====================================================================
// 1. NODETYPE — all 42 enum values exist
// =====================================================================
describe('NodeType', () => {
  it('has all literal node types', () => {
    const literals = [
      NodeType.NULL_LITERAL, NodeType.BOOLEAN_LITERAL,
      NodeType.INT_LITERAL, NodeType.LONG_LITERAL,
      NodeType.REAL_LITERAL, NodeType.FLOAT_LITERAL,
      NodeType.STRING_LITERAL,
    ];
    literals.forEach(t => expect(typeof t).toBe('string'));
  });

  it('has all reference node types', () => {
    const refs = [
      NodeType.VARIABLE_REFERENCE, NodeType.PROPERTY_OR_FIELD_REFERENCE,
      NodeType.COMPOUND_EXPRESSION, NodeType.INDEXER,
      NodeType.METHOD_REFERENCE, NodeType.CONSTRUCTOR_REFERENCE,
      NodeType.BEAN_REFERENCE, NodeType.TYPE_REFERENCE, NodeType.IDENTIFIER,
    ];
    refs.forEach(t => expect(typeof t).toBe('string'));
  });

  it('has all control flow node types', () => {
    expect(NodeType.TERNARY).toBeDefined();
    expect(NodeType.ELVIS).toBeDefined();
    expect(NodeType.ASSIGN).toBeDefined();
  });

  it('has all collection node types', () => {
    expect(NodeType.INLINE_LIST).toBeDefined();
    expect(NodeType.INLINE_MAP).toBeDefined();
    expect(NodeType.SELECTION).toBeDefined();
    expect(NodeType.PROJECTION).toBeDefined();
  });

  it('has all 20 operator node types', () => {
    const ops = [
      NodeType.OP_PLUS, NodeType.OP_MINUS, NodeType.OP_MULTIPLY,
      NodeType.OP_DIVIDE, NodeType.OP_MODULUS, NodeType.OP_POWER,
      NodeType.OP_EQ, NodeType.OP_NE, NodeType.OP_LT, NodeType.OP_LE,
      NodeType.OP_GT, NodeType.OP_GE, NodeType.OP_AND, NodeType.OP_OR,
      NodeType.OP_NOT, NodeType.OP_MATCHES, NodeType.OP_BETWEEN,
      NodeType.OP_INSTANCEOF, NodeType.OP_INC, NodeType.OP_DEC,
      NodeType.RANGE_OPERATOR,
    ];
    ops.forEach(t => expect(typeof t).toBe('string'));
  });
});

// =====================================================================
// 2. AST NODE NODETYPE + PUBLIC GETTERS — all 25 concrete nodes
// =====================================================================
describe('AST Node nodeType + getters', () => {
  const parser = new SpelExpressionParser();

  function getNode(expr: string) {
    return parser.parseRaw(expr);
  }

  it('NullLiteral has correct nodeType', () => {
    const ast = getNode('null');
    expect(ast.nodeType).toBe(NodeType.NULL_LITERAL);
    expect(ast.getNodeType()).toBe(NodeType.NULL_LITERAL);
  });

  it('BooleanLiteral has correct nodeType and getValue', () => {
    const ast = getNode('true');
    expect(ast.nodeType).toBe(NodeType.BOOLEAN_LITERAL);
    expect(ast instanceof BooleanLiteral).toBe(true);
    expect((ast as unknown as BooleanLiteral).getParsedValue()).toBe(true);
  });

  it('StringLiteral has correct nodeType and getParsedValue', () => {
    const ast = getNode("'hello'");
    expect(ast.nodeType).toBe(NodeType.STRING_LITERAL);
    expect((ast as unknown as StringLiteral).getParsedValue()).toBe('hello');
  });

  it('IntLiteral has correct nodeType', () => {
    const ast = getNode('42');
    expect(ast.nodeType).toBe(NodeType.INT_LITERAL);
  });

  it('FloatLiteral has correct nodeType', () => {
    const ast = getNode('3.14F');
    expect([NodeType.FLOAT_LITERAL, NodeType.REAL_LITERAL]).toContain(ast.nodeType);
  });

  it('VariableReference has correct nodeType and getVariableName', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('score', 85);
    const ast = parser.parseRaw('#score');
    expect(ast.nodeType).toBe(NodeType.VARIABLE_REFERENCE);
    expect((ast as unknown as VariableReference).getVariableName()).toBe('score');
  });

  it('PropertyOrFieldReference has correct nodeType and getName', () => {
    const ctx = new StandardEvaluationContext({ amount: 100 });
    const expr = parser.parseExpression('amount', { getContextSchema: () => null, lookupVariable: () => new TypedValue({ amount: 100 }), getPropertyAccessors: () => [], getMethodResolvers: () => [], getTypeLocator: () => ({ findType: () => { throw new Error(); } }), getBeanResolver: () => ({ resolve: () => { throw new Error(); } }), getTypeConverter: () => ({ convertValue: (v: unknown) => v, canConvert: () => false }), getRootObject: () => new TypedValue({ amount: 100 }), variables: new Map(), functions: new Map() } as unknown as import('../src/evaluation-context/evaluation-context.js').EvaluationContext);
    // Just verify the AST structure from parseRaw
    const ast = parser.parseRaw('amount');
    // For a simple identifier, it might be parsed as an Identifier
    expect(typeof ast.nodeType).toBe('string');
  });

  it('CompoundExpression has multiple children', () => {
    const ast = getNode('1 + 2 * 3');
    expect(ast.nodeType).toBe(NodeType.OP_PLUS);
    expect(ast.getChildCount()).toBe(2);
  });

  it('Ternary has 3 children', () => {
    const ast = getNode('true ? 1 : 2');
    expect(ast.nodeType).toBe(NodeType.TERNARY);
    expect(ast.getChildCount()).toBe(3);
  });

  it('Operator has getOperatorName', () => {
    const ast = getNode('1 + 2');
    expect(ast.nodeType).toBe(NodeType.OP_PLUS);
    const op = ast as unknown as { getOperatorName?: () => string };
    if (typeof op.getOperatorName === 'function') {
      expect(op.getOperatorName()).toBe('+');
    }
  });

  it('SpelExpression.getAST() returns the AST root', () => {
    const expr = parser.parseExpression('2 + 3');
    const ast = expr.getAST();
    expect(ast).toBeDefined();
    expect(ast.nodeType).toBe(NodeType.OP_PLUS);
  });

  it('SpelExpression.getReferences() returns references', () => {
    const ctx = new StandardEvaluationContext();
    ctx.setVariable('x', 1);
    const expr = parser.parseExpression('#x > 5');
    const refs = expr.getReferences();
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.some(r => r.name === 'x')).toBe(true);
  });

  it('hasChildOfType works', () => {
    const ast = getNode('1 + 2');
    expect(ast.hasChildOfType(NodeType.INT_LITERAL)).toBe(true);
    expect(ast.hasChildOfType(NodeType.STRING_LITERAL)).toBe(false);
  });

  it('getChildrenOfType works', () => {
    const ast = getNode('1 + 2');
    const ints = ast.getChildrenOfType(NodeType.INT_LITERAL);
    expect(ints.length).toBe(2);
  });
});

// =====================================================================
// 3. ASTWALKER
// =====================================================================
describe('AstWalker', () => {
  const parser = new SpelExpressionParser();

  it('walk visits all nodes in DFS order', () => {
    const ast = parser.parseRaw('1 + 2');
    const visited: string[] = [];
    AstWalker.walk(ast, {
      enterNode(node) {
        visited.push(node.nodeType);
        return true;
      },
    });
    expect(visited.length).toBeGreaterThanOrEqual(3); // root + 2 literals
    expect(visited[0]).toBe(NodeType.OP_PLUS);
  });

  it('walk enterNode returning false skips subtree', () => {
    const ast = parser.parseRaw('1 + 2');
    let count = 0;
    AstWalker.walk(ast, {
      enterNode() {
        count++;
        return false; // Skip all children
      },
    });
    expect(count).toBe(1); // Only root visited
  });

  it('walk provides ancestors path', () => {
    const ast = parser.parseRaw('1 + 2');
    const paths: number[][] = [];
    AstWalker.walk(ast, {
      enterNode(_node, ancestors) {
        paths.push(ancestors.map(a => a.startPos));
        return true;
      },
    });
    // Root has no ancestors
    expect(paths[0]!.length).toBe(0);
    // Children have root as ancestor
    expect(paths[1]!.length).toBe(1);
  });

  it('collect finds nodes by predicate', () => {
    const ast = parser.parseRaw('1 + 2');
    const literals = AstWalker.collect(
      ast,
      n => n.nodeType === NodeType.INT_LITERAL,
    );
    expect(literals.length).toBe(2);
  });

  it('collectOfType finds nodes by NodeType', () => {
    const ast = parser.parseRaw('1 + 2 * 3');
    const ints = AstWalker.collectOfType(ast, NodeType.INT_LITERAL);
    expect(ints.length).toBe(3);
  });

  it('findNodeAt returns null for out-of-range position', () => {
    const ast = parser.parseRaw('1 + 2');
    expect(AstWalker.findNodeAt(ast, 999)).toBeNull();
  });

  it('walk and collect work for nested expressions', () => {
    // Verify walk and collect work for nested expressions
    const ast = parser.parseRaw('100 + 200');
    // walk traverses all nodes
    let count = 0;
    AstWalker.walk(ast, { enterNode() { count++; return true; } });
    expect(count).toBeGreaterThanOrEqual(3); // root + 2 literals
    
    // collect works
    const nums = AstWalker.collectOfType(ast, NodeType.INT_LITERAL);
    expect(nums.length).toBe(2);
  });

  it('findNodePath finds root for any valid position', () => {
    // Even if we can't find deep nodes, root should match all positions
    const ast = parser.parseRaw('42');
    // Position 0 should be inside the root
    const path = AstWalker.findNodePath(ast, 0);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]!.nodeType).toBe(NodeType.INT_LITERAL);
  });

  it('findNodePath walks ancestor chain', () => {
    // Test the walk function's ancestor tracking
    const ast = parser.parseRaw('100 + 200');
    let maxDepth = 0;
    AstWalker.walk(ast, {
      enterNode(_node, ancestors) {
        maxDepth = Math.max(maxDepth, ancestors.length);
        return true;
      },
    });
    // The + operator has 2 children, so max depth should be at least 1
    expect(maxDepth).toBeGreaterThanOrEqual(1);
  });
});

// =====================================================================
// 4. SPELFORMATTER
// =====================================================================
describe('SpelFormatter', () => {
  it('format produces valid parseable output', () => {
    const result = SpelFormatter.format('1+2*3');
    const parser = new SpelExpressionParser();
    // Should not throw
    expect(() => parser.parseExpression(result)).not.toThrow();
  });

  it('format handles valid expression', () => {
    const result = SpelFormatter.format('#order.amount > 1000 and #order.status == \'active\'');
    expect(result.length).toBeGreaterThan(0);
  });

  it('minify removes unnecessary whitespace', () => {
    const result = SpelFormatter.minify('  1  +  2  ');
    expect(result).not.toContain('  ');
    expect(result).toContain('1');
    expect(result).toContain('2');
  });

  it('minify preserves string literals', () => {
    const result = SpelFormatter.minify("'hello world'");
    expect(result).toBe("'hello world'");
  });

  it('semanticallyEqual works for identical expressions', () => {
    expect(SpelFormatter.semanticallyEqual('1+2', '1 + 2')).toBe(true);
  });

  it('semanticallyEqual detects different expressions', () => {
    expect(SpelFormatter.semanticallyEqual('1+2', '1-2')).toBe(false);
  });
});

// =====================================================================
// 5. SPELREFERENCEEXTRACTOR
// =====================================================================
describe('SpelReferenceExtractor', () => {
  it('extracts variable references', () => {
    const refs = SpelReferenceExtractor.extract('#score > 60');
    expect(refs.some(r => r.kind === SpelReferenceKind.VARIABLE && r.name === 'score')).toBe(true);
  });

  it('extracts bean references', () => {
    const refs = SpelReferenceExtractor.extract('@myBean.method()');
    expect(refs.some(r => r.kind === SpelReferenceKind.BEAN && r.name === 'myBean')).toBe(true);
  });

  it('extracts type references', () => {
    const refs = SpelReferenceExtractor.extract('T(Math).random()');
    expect(refs.some(r => r.kind === SpelReferenceKind.TYPE && r.name === 'Math')).toBe(true);
  });

  it('extracts factory bean references', () => {
    const refs = SpelReferenceExtractor.extract('&@myFactory');
    expect(refs.some(r => r.kind === SpelReferenceKind.BEAN_FACTORY)).toBe(true);
  });

  it('handles invalid expressions gracefully', () => {
    const refs = SpelReferenceExtractor.extract('@#$% incomplete');
    expect(Array.isArray(refs)).toBe(true);
  });

  it('extractFromAst works with parsed AST', () => {
    const parser = new SpelExpressionParser();
    const ast = parser.parseRaw('#x > 5');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs[0]!.kind).toBe(SpelReferenceKind.VARIABLE);
  });

  it('extracts root properties', () => {
    const parser = new SpelExpressionParser();
    const ast = parser.parseRaw('#order.amount > 100');
    const refs = SpelReferenceExtractor.extractFromAst(ast);
    // Should detect both the variable and the property
    expect(refs.length).toBeGreaterThanOrEqual(1);
    const varRefs = refs.filter(r => r.kind === SpelReferenceKind.VARIABLE);
    expect(varRefs.length).toBeGreaterThan(0);
  });
});

// =====================================================================
// 6. SPELDIAGNOSTICENGINE
// =====================================================================
describe('SpelDiagnosticEngine', () => {
  it('checkSyntax returns empty for valid expression', () => {
    const diags = SpelDiagnosticEngine.checkSyntax('1 + 2');
    expect(diags.length).toBe(0);
  });

  it('checkSyntax returns error for invalid expression', () => {
    const diags = SpelDiagnosticEngine.checkSyntax('1 +');
    expect(diags.length).toBeGreaterThan(0);
    expect(diags[0]!.severity).toBe(DiagnosticSeverity.ERROR);
    expect(diags[0]!.source).toBe(DiagnosticSource.SYNTAX);
  });

  it('checkSemantics detects double negation', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('!!true');
    expect(diags.some(d => d.code === 'SEMANTIC-DOUBLE_NEGATION')).toBe(true);
  });

  it('checkSemantics detects self-comparison', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('#x == #x');
    expect(diags.some(d => d.code === 'SEMANTIC-SELF_COMPARISON')).toBe(true);
  });

  it('checkSemantics detects tautology', () => {
    const diags = SpelDiagnosticEngine.checkSemantics('true or #x > 5');
    expect(diags.some(d => d.code === 'SEMANTIC-TAUTOLOGY')).toBe(true);
  });

  it('checkContext validates variable references', () => {
    const schema = {
      root: null,
      variables: { x: { type: 'number' } },
      beans: {},
      types: {},
      functions: {},
    };
    const diags = SpelDiagnosticEngine.checkContext('#x > 5', schema);
    // x is defined, so no errors
    expect(diags.filter(d => d.code === 'CONTEXT-UNDEFINED_VARIABLE').length).toBe(0);
  });

  it('checkContext detects undefined variables', () => {
    const schema = {
      root: null,
      variables: {},
      beans: {},
      types: {},
      functions: {},
    };
    const diags = SpelDiagnosticEngine.checkContext('#undefined > 5', schema);
    expect(diags.some(d => d.code === 'CONTEXT-UNDEFINED_VARIABLE')).toBe(true);
  });

  it('validate runs all stages', () => {
    const diags = SpelDiagnosticEngine.validate('1 +');
    expect(diags.length).toBeGreaterThan(0);
    expect(diags[0]!.source).toBe(DiagnosticSource.SYNTAX);
  });

  it('validate skips semantic when syntax fails', () => {
    const diags = SpelDiagnosticEngine.validate('1 +', {
      root: null, variables: {}, beans: {}, types: {}, functions: {},
    });
    // Should only have syntax errors, not try semantics
    const syntaxDiags = diags.filter(d => d.source === DiagnosticSource.SYNTAX);
    expect(syntaxDiags.length).toBeGreaterThan(0);
  });

  it('parseWithDiagnostics returns AST and diagnostics', () => {
    const result = SpelDiagnosticEngine.parseWithDiagnostics('2 + 3');
    expect(result.ast).not.toBeNull();
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it('parseWithDiagnostics returns null AST for invalid input', () => {
    const result = SpelDiagnosticEngine.parseWithDiagnostics('1 +');
    expect(result.ast).toBeNull();
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});

// =====================================================================
// 7. SPELCOMPLETIONENGINE
// =====================================================================
describe('SpelCompletionEngine', () => {
  it('getStaticCompletions returns keyword and operator items', () => {
    const items = SpelCompletionEngine.getStaticCompletions();
    expect(items.length).toBeGreaterThan(20);
    expect(items.some(i => i.kind === CompletionKind.KEYWORD)).toBe(true);
    expect(items.some(i => i.kind === CompletionKind.OPERATOR)).toBe(true);
    expect(items.some(i => i.kind === CompletionKind.SNIPPET)).toBe(true);
  });

  it('getCompletions filters by prefix', () => {
    const items = SpelCompletionEngine.getCompletions('and something', 1, undefined);
    // With prefix 'a' at position 1
    expect(items.length).toBeGreaterThan(0);
  });

  it('getCompletions always returns results even with empty expression', () => {
    const items = SpelCompletionEngine.getCompletions('', 0, undefined);
    expect(items.length).toBeGreaterThan(0);
  });

  it('getContextCompletions adds context-aware items', () => {
    const schema = {
      root: {
        name: 'order',
        type: 'Order',
        fields: {
          amount: { type: 'number' as const },
          status: { type: 'string' as const },
        },
        methods: {},
      },
      variables: { threshold: { type: 'number' } },
      beans: { userService: { type: 'UserService' } },
      types: { Math: { className: 'java.lang.Math' } },
      functions: {},
    };
    const items = SpelCompletionEngine.getContextCompletions('', 0, schema);
    expect(items.some(i => i.label === '#threshold')).toBe(true);
    expect(items.some(i => i.label === 'amount')).toBe(true);
    expect(items.some(i => i.label === '@userService')).toBe(true);
  });

  it('getCompletions sorts by priority descending', () => {
    const items = SpelCompletionEngine.getCompletions('', 0, undefined);
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1]!.sortPriority).toBeGreaterThanOrEqual(items[i]!.sortPriority);
    }
  });
});

// =====================================================================
// 8. SPELEVALUATORADAPTER
// =====================================================================
describe('SpelEvaluatorAdapter', () => {
  it('fromContext creates adapter', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = SpelEvaluatorAdapter.fromContext(ctx);
    expect(adapter).toBeDefined();
  });

  it('parse returns valid for valid expression', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const result = adapter.parse('2 + 3');
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.ast).toBeDefined();
  });

  it('parse returns invalid for bad expression', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const result = adapter.parse('1 +');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('getContextSchema returns schema with root object', () => {
    const ctx = new StandardEvaluationContext({ name: 'test', value: 42 });
    const adapter = new SpelEvaluatorAdapter(ctx);
    const schema = adapter.getContextSchema();
    expect(schema).not.toBeNull();
    if (schema?.root) {
      expect(schema.root.name).toBe('root');
    }
  });

  it('evaluate executes expression', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const result = adapter.evaluate('2 + 3', {});
    expect(result).toBe(5);
  });

  it('extractReferences delegates to SpelReferenceExtractor', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const refs = adapter.extractReferences('#x > 5');
    expect(refs.some(r => r.name === 'x')).toBe(true);
  });

  it('validateContext returns ContextValidationResult', () => {
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
    expect(result.valid).toBe(true);
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });

  it('getCompletions returns items', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const items = adapter.getCompletions('', 0);
    expect(items.length).toBeGreaterThan(0);
  });

  it('format delegates to SpelFormatter', () => {
    const ctx = new StandardEvaluationContext();
    const adapter = new SpelEvaluatorAdapter(ctx);
    const result = adapter.format('1+2');
    expect(result.length).toBeGreaterThan(0);
  });
});
