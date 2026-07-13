import type { SpelEvaluator, ParseResult } from './spel-evaluator.js';
import type { ContextSchema } from '../types/context-schema.js';
import type { SpelReference } from './reference-extractor.js';
import type { ContextValidationResult } from './diagnostic-engine.js';
import type { CompletionItem } from './completion-engine.js';
import type { FormatOptions } from './spel-formatter.js';
import { SpelExpressionParser } from '../spel-expression-parser.js';
import { SpelParseException } from '../error/spel-parse-exception.js';
import { StandardEvaluationContext } from '../standard-evaluation-context.js';
import { SpelReferenceExtractor, SpelReferenceKind } from './reference-extractor.js';
import { SpelDiagnosticEngine } from './diagnostic-engine.js';
import { SpelCompletionEngine } from './completion-engine.js';
import { SpelFormatter } from './spel-formatter.js';

export class SpelEvaluatorAdapter implements SpelEvaluator {
  private context: StandardEvaluationContext;

  constructor(context: StandardEvaluationContext) {
    this.context = context;
  }

  static fromContext(ctx: StandardEvaluationContext): SpelEvaluatorAdapter {
    return new SpelEvaluatorAdapter(ctx);
  }

  parse(expression: string): ParseResult {
    try {
      const parser = new SpelExpressionParser();
      const expr = parser.parseExpression(expression);
      return { valid: true, errors: [], ast: expr.getAST() };
    } catch (e) {
      if (e instanceof SpelParseException) {
        return {
          valid: false,
          errors: [{ message: e.message, position: e.position, code: String(e.messageCode) }],
        };
      }
      const err = e instanceof Error ? e : new Error(String(e));
      return { valid: false, errors: [{ message: err.message, position: 0, code: 'UNKNOWN' }] };
    }
  }

  getContextSchema(): ContextSchema | null {
    return SpelEvaluatorAdapter.#extractContextSchema(this.context);
  }

  evaluate(expression: string, context: Record<string, unknown>): unknown {
    const parser = new SpelExpressionParser();
    const expr = parser.parseExpression(expression);
    const evalCtx = new StandardEvaluationContext(context);
    return expr.getValueWithContext(evalCtx);
  }

  extractReferences(expression: string): SpelReference[] {
    return SpelReferenceExtractor.extract(expression);
  }

  validateContext(expression: string, contextSchema: ContextSchema): ContextValidationResult {
    const diagnostics = SpelDiagnosticEngine.checkContext(expression, contextSchema);
    const refs = SpelReferenceExtractor.extract(expression);
    const missingRefs = refs.filter((ref) => {
      switch (ref.kind) {
        case SpelReferenceKind.VARIABLE:
          return (
            ref.name !== 'root' && ref.name !== 'this' && !(ref.name in contextSchema.variables)
          );
        case SpelReferenceKind.ROOT_PROPERTY:
          return contextSchema.root ? !(ref.name in contextSchema.root.fields) : false;
        case SpelReferenceKind.BEAN:
        case SpelReferenceKind.BEAN_FACTORY:
          return !(ref.name in contextSchema.beans);
        case SpelReferenceKind.TYPE:
          return !(ref.name in contextSchema.types);
        case SpelReferenceKind.FUNCTION:
          return !(ref.name in contextSchema.functions);
        default:
          return false;
      }
    });
    return {
      valid: diagnostics.length === 0,
      diagnostics,
      missingReferences: missingRefs,
      typeMismatches: [],
    };
  }

  getCompletions(
    expression: string,
    position: number,
    contextSchema?: ContextSchema,
  ): CompletionItem[] {
    const schema =
      contextSchema ?? SpelEvaluatorAdapter.#extractContextSchema(this.context) ?? undefined;
    return SpelCompletionEngine.getCompletions(expression, position, schema);
  }

  format(expression: string, options?: FormatOptions): string {
    return SpelFormatter.format(expression, options);
  }

  static #extractContextSchema(ctx: StandardEvaluationContext): ContextSchema | null {
    try {
      const schema: ContextSchema = {
        root: null,
        variables: {},
        beans: {},
        types: {},
        functions: {},
      };

      interface StandardContextInternals {
        getRootObject?(): { getValue?(): unknown };
      }
      const internals = ctx as unknown as StandardContextInternals;
      const rootObj = internals.getRootObject?.()?.getValue?.();
      if (typeof rootObj === 'object' && rootObj !== null) {
        const fields: Record<string, { type: string }> = {};
        for (const key of Object.keys(rootObj)) {
          fields[key] = { type: typeof (rootObj as Record<string, unknown>)[key] };
        }
        schema.root = {
          name: 'root',
          type: (rootObj as { constructor?: { name?: string } }).constructor?.name ?? 'object',
          fields: fields as Record<
            string,
            { type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'map' }
          >,
          methods: {},
        };
      }
      return schema;
    } catch {
      return null;
    }
  }
}
