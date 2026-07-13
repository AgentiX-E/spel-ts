import type { SpelNodeImpl } from '../ast/spel-node.js';
import type { ContextSchema } from '../types/context-schema.js';
import type { SpelReference } from './reference-extractor.js';
import type { ContextValidationResult } from './diagnostic-engine.js';
import type { CompletionItem } from './completion-engine.js';
import type { FormatOptions } from './spel-formatter.js';

/**
 * SpelEvaluator — abstract interface for SpEL parsing and validation.
 *
 * Defined in spel-ts as the canonical source of truth.
 * Consumers (nl2spel, spel-editor, CLI tools) program against this interface
 * without depending on any specific implementation.
 *
 * spel-ts provides a built-in implementation: SpelEvaluatorAdapter.
 */
export interface SpelEvaluator {
  /**
   * Parse a SpEL expression and return syntax validation results.
   * For syntactically invalid expressions, the errors array is non-empty.
   */
  parse(expression: string): ParseResult | Promise<ParseResult>;

  /**
   * Get the available context schema.
   * Returns null if no context information is available
   * (syntax-only validation, no type/context check).
   */
  getContextSchema(): ContextSchema | null | Promise<ContextSchema | null>;

  // ===== Enhanced capabilities (all optional, backward-compatible) =====

  /**
   * Evaluate an expression with given runtime context.
   * Optional — used for semantic validation and test evaluation.
   */
  evaluate?(expression: string, context: Record<string, unknown>): unknown;

  /**
   * Extract all structured references from an expression
   * (variables, root properties, beans, types, functions).
   * Returns references even for syntactically invalid expressions
   * via heuristic fallback.
   */
  extractReferences?(expression: string): SpelReference[];

  /**
   * Validate expression references against a context schema.
   * Detects missing variables, unknown properties, type mismatches.
   */
  validateContext?(expression: string, contextSchema: ContextSchema): ContextValidationResult;

  /**
   * Get completion suggestions at a given cursor position.
   * Returns context-aware suggestions when contextSchema is provided,
   * otherwise returns static keyword/operator completions.
   */
  getCompletions?(
    expression: string,
    position: number,
    contextSchema?: ContextSchema,
  ): CompletionItem[];

  /**
   * Format a SpEL expression with consistent spacing and indentation.
   */
  format?(expression: string, options?: FormatOptions): string;
}

/** Result of parsing a SpEL expression */
export interface ParseResult {
  /** Whether the expression is syntactically valid */
  valid: boolean;

  /** Parse errors (empty if valid) */
  errors: ParseError[];

  /**
   * AST root node on successful parse.
   * Type is SpelNodeImpl for strong typing (was unknown in nl2spel's definition).
   */
  ast?: SpelNodeImpl;
}

/** A single parse error with position information */
export interface ParseError {
  /** Human-readable error message */
  message: string;

  /** Character offset where the error starts */
  position: number;

  /** Length of the problematic region (optional) */
  length?: number;

  /** Machine-readable error code (optional, e.g., 'MISSING_TERNARY_COLON') */
  code?: string;
}
