import type { SpelNodeImpl } from '../ast/spel-node.js';
import type { SpelReference } from './reference-extractor.js';
import type { ContextSchema } from '../types/context-schema.js';
import { SpelExpressionParser } from '../spel-expression-parser.js';
import { SpelParseException } from '../error/spel-parse-exception.js';
import { SpelReferenceExtractor, SpelReferenceKind } from './reference-extractor.js';

/** Severity level for diagnostics */
export enum DiagnosticSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/** Source category for diagnostics */
export enum DiagnosticSource {
  SYNTAX = 'syntax',
  SEMANTIC = 'semantic',
  CONTEXT = 'context',
  TYPE = 'type',
}

export interface SpelDiagnostic {
  severity: DiagnosticSeverity;
  message: string;
  from: number;
  to: number;
  code: string;
  source: DiagnosticSource;
}

export interface ContextValidationResult {
  valid: boolean;
  diagnostics: SpelDiagnostic[];
  missingReferences: SpelReference[];
  typeMismatches: {
    referenceName: string;
    expectedType: string;
    actualUsage: string;
    position: number;
  }[];
}

/**
 * Multi-stage diagnostic engine for SpEL expressions.
 *
 * Pipeline:
 *   1. Syntax check — uses the parser for exact error detection
 *   2. Semantic check — detects self-comparisons, double-negation, tautologies
 *   3. Context check — validates references against a ContextSchema
 *   4. Type check — detects operand type mismatches
 */
export namespace SpelDiagnosticEngine {
  /**
   * Check syntax validity of an expression.
   * Returns diagnostics from the SpEL parser.
   */
  export function checkSyntax(expression: string): SpelDiagnostic[] {
    try {
      const parser = new SpelExpressionParser();
      parser.parseExpression(expression);
      return []; // Valid
    } catch (e) {
      if (e instanceof SpelParseException) {
        return [
          {
            severity: DiagnosticSeverity.ERROR,
            message: e.message,
            from: e.position,
            to: expression.length,
            code: 'SYNTAX-' + (String(e.messageCode) || 'UNKNOWN'),
            source: DiagnosticSource.SYNTAX,
          },
        ];
      }
      return [
        {
          severity: DiagnosticSeverity.ERROR,
          message: (e as Error).message,
          from: 0,
          to: expression.length,
          code: 'SYNTAX-UNKNOWN',
          source: DiagnosticSource.SYNTAX,
        },
      ];
    }
  }

  /**
   * Check for semantic issues (self-comparison, double negation, tautologies).
   */
  export function checkSemantics(expression: string): SpelDiagnostic[] {
    const diagnostics: SpelDiagnostic[] = [];

    // Double negation: !!expr or not not expr
    const doubleNegPattern = /!\s*!|not\s+not/i;
    const dnMatch = doubleNegPattern.exec(expression);
    if (dnMatch) {
      diagnostics.push({
        severity: DiagnosticSeverity.WARNING,
        message: 'Double negation detected — consider simplifying',
        from: dnMatch.index,
        to: dnMatch.index + dnMatch[0].length,
        code: 'SEMANTIC-DOUBLE_NEGATION',
        source: DiagnosticSource.SEMANTIC,
      });
    }

    // Self-comparison: detect patterns like #x == #x or #x != #x
    const selfCompPattern = /#(\w+)\s*(==|!=|eq|ne)\s*#\1/g;
    let scMatch: RegExpExecArray | null;
    while ((scMatch = selfCompPattern.exec(expression)) !== null) {
      const op = scMatch[2] ?? '';
      const isNeq = op === '!=' || op.toLowerCase() === 'ne';
      diagnostics.push({
        severity: DiagnosticSeverity.WARNING,
        message: isNeq
          ? `Self-comparison '#${scMatch[1]} != #${scMatch[1]}' is always false`
          : `Self-comparison '#${scMatch[1]} == #${scMatch[1]}' is always true`,
        from: scMatch.index,
        to: scMatch.index + scMatch[0].length,
        code: 'SEMANTIC-SELF_COMPARISON',
        source: DiagnosticSource.SEMANTIC,
      });
    }

    // Always-true: true or ...
    if (/^true\s+or\b/i.test(expression)) {
      diagnostics.push({
        severity: DiagnosticSeverity.INFO,
        message: 'Expression starts with "true or ..." — left side is always true',
        from: 0,
        to: 8,
        code: 'SEMANTIC-TAUTOLOGY',
        source: DiagnosticSource.SEMANTIC,
      });
    }

    // Always-false: false and ...
    if (/^false\s+and\b/i.test(expression)) {
      diagnostics.push({
        severity: DiagnosticSeverity.INFO,
        message: 'Expression starts with "false and ..." — left side is always false',
        from: 0,
        to: 10,
        code: 'SEMANTIC-CONTRADICTION',
        source: DiagnosticSource.SEMANTIC,
      });
    }

    return diagnostics;
  }

  /**
   * Validate expression references against a ContextSchema.
   */
  export function checkContext(expression: string, contextSchema: ContextSchema): SpelDiagnostic[] {
    const refs = SpelReferenceExtractor.extract(expression);
    const diagnostics: SpelDiagnostic[] = [];
    const missingRefs: SpelReference[] = [];

    for (const ref of refs) {
      switch (ref.kind) {
        case SpelReferenceKind.VARIABLE: {
          // Check if variable exists in schema
          if (ref.name !== 'root' && ref.name !== 'this') {
            const hasVariable = ref.name in contextSchema.variables;
            if (!hasVariable) {
              missingRefs.push(ref);
              diagnostics.push({
                severity: DiagnosticSeverity.WARNING,
                message: `Variable '#${ref.name}' is not defined in context`,
                from: ref.startPos,
                to: ref.endPos,
                code: 'CONTEXT-UNDEFINED_VARIABLE',
                source: DiagnosticSource.CONTEXT,
              });
            }
          }
          break;
        }
        case SpelReferenceKind.ROOT_PROPERTY: {
          // Check if property exists on root object
          if (contextSchema.root) {
            const hasField = ref.name in contextSchema.root.fields;
            if (!hasField) {
              missingRefs.push(ref);
              diagnostics.push({
                severity: DiagnosticSeverity.WARNING,
                message: `Property '${ref.name}' not found on root object '${contextSchema.root.name}'`,
                from: ref.startPos,
                to: ref.endPos,
                code: 'CONTEXT-UNKNOWN_PROPERTY',
                source: DiagnosticSource.CONTEXT,
              });
            }
          }
          break;
        }
        case SpelReferenceKind.BEAN:
        case SpelReferenceKind.BEAN_FACTORY: {
          const hasBean = ref.name in contextSchema.beans;
          if (!hasBean) {
            missingRefs.push(ref);
            diagnostics.push({
              severity: DiagnosticSeverity.WARNING,
              message: `Bean '@${ref.name}' is not registered in context`,
              from: ref.startPos,
              to: ref.endPos,
              code: 'CONTEXT-UNDEFINED_BEAN',
              source: DiagnosticSource.CONTEXT,
            });
          }
          break;
        }
        case SpelReferenceKind.TYPE: {
          const hasType = ref.name in contextSchema.types;
          if (!hasType) {
            missingRefs.push(ref);
            diagnostics.push({
              severity: DiagnosticSeverity.WARNING,
              message: `Type 'T(${ref.name})' is not registered in context`,
              from: ref.startPos,
              to: ref.endPos,
              code: 'CONTEXT-UNDEFINED_TYPE',
              source: DiagnosticSource.CONTEXT,
            });
          }
          break;
        }
        case SpelReferenceKind.FUNCTION: {
          const hasFunc = ref.name in contextSchema.functions;
          if (!hasFunc) {
            missingRefs.push(ref);
            diagnostics.push({
              severity: DiagnosticSeverity.WARNING,
              message: `Function '#${ref.name}' is not registered in context`,
              from: ref.startPos,
              to: ref.endPos,
              code: 'CONTEXT-UNDEFINED_FUNCTION',
              source: DiagnosticSource.CONTEXT,
            });
          }
          break;
        }
        default:
          break;
      }
    }

    return diagnostics;
  }

  /**
   * Run all validation stages.
   */
  export function validate(expression: string, contextSchema?: ContextSchema): SpelDiagnostic[] {
    const diagnostics: SpelDiagnostic[] = [];

    // Stage 1: Syntax
    diagnostics.push(...checkSyntax(expression));

    // If syntax errors exist, skip further stages (expression can't be parsed)
    if (
      diagnostics.some(
        (d) => d.source === DiagnosticSource.SYNTAX && d.severity === DiagnosticSeverity.ERROR,
      )
    ) {
      return diagnostics;
    }

    // Stage 2: Semantic
    diagnostics.push(...checkSemantics(expression));

    // Stage 3: Context (only if schema provided)
    if (contextSchema) {
      diagnostics.push(...checkContext(expression, contextSchema));
    }

    return diagnostics;
  }

  /**
   * Parse an expression and return both AST and diagnostics.
   */
  export function parseWithDiagnostics(expression: string): {
    ast: SpelNodeImpl | null;
    diagnostics: SpelDiagnostic[];
  } {
    const diagnostics: SpelDiagnostic[] = [];

    try {
      const parser = new SpelExpressionParser();
      const expr = parser.parseExpression(expression);
      const ast = (expr as { getAST?: () => SpelNodeImpl }).getAST?.() ?? null;

      // Run semantic checks on valid expression
      diagnostics.push(...checkSemantics(expression));

      return { ast, diagnostics };
    } catch (e) {
      if (e instanceof SpelParseException) {
        diagnostics.push({
          severity: DiagnosticSeverity.ERROR,
          message: e.message,
          from: e.position,
          to: expression.length,
          code: 'SYNTAX-' + (String(e.messageCode) || 'UNKNOWN'),
          source: DiagnosticSource.SYNTAX,
        });
      } else {
        diagnostics.push({
          severity: DiagnosticSeverity.ERROR,
          message: (e as Error).message,
          from: 0,
          to: expression.length,
          code: 'SYNTAX-UNKNOWN',
          source: DiagnosticSource.SYNTAX,
        });
      }
      return { ast: null, diagnostics };
    }
  }
}
