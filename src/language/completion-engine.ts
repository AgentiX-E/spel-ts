import type { ContextSchema } from '../types/context-schema.js';

/**
 * Category of a completion suggestion.
 */
export enum CompletionKind {
  KEYWORD = 'keyword',
  OPERATOR = 'operator',
  VARIABLE = 'variable',
  PROPERTY = 'property',
  METHOD = 'method',
  FUNCTION = 'function',
  BEAN = 'bean',
  TYPE = 'type',
  SNIPPET = 'snippet',
}

export interface CompletionItem {
  label: string;
  kind: CompletionKind;
  detail?: string;
  documentation?: string;
  insertText: string;
  sortPriority: number;
}

/**
 * Static completions that are always available regardless of context.
 */
const STATIC_COMPLETIONS: CompletionItem[] = [
  // Keywords
  { label: 'null', kind: CompletionKind.KEYWORD, detail: 'Null literal', insertText: 'null', sortPriority: 50 },
  { label: 'true', kind: CompletionKind.KEYWORD, detail: 'Boolean true', insertText: 'true', sortPriority: 50 },
  { label: 'false', kind: CompletionKind.KEYWORD, detail: 'Boolean false', insertText: 'false', sortPriority: 50 },
  { label: 'new', kind: CompletionKind.KEYWORD, detail: 'Constructor call', insertText: 'new ', sortPriority: 50 },
  { label: 'T()', kind: CompletionKind.KEYWORD, detail: 'Type reference', insertText: 'T($1)', sortPriority: 50 },

  // Operators
  { label: 'and (&&)', kind: CompletionKind.OPERATOR, detail: 'Logical AND', insertText: 'and ', sortPriority: 40 },
  { label: 'or (||)', kind: CompletionKind.OPERATOR, detail: 'Logical OR', insertText: 'or ', sortPriority: 40 },
  { label: 'not (!)', kind: CompletionKind.OPERATOR, detail: 'Logical NOT', insertText: 'not ', sortPriority: 40 },
  { label: '==', kind: CompletionKind.OPERATOR, detail: 'Equal to', insertText: '== ', sortPriority: 40 },
  { label: '!=', kind: CompletionKind.OPERATOR, detail: 'Not equal to', insertText: '!= ', sortPriority: 40 },
  { label: '>', kind: CompletionKind.OPERATOR, detail: 'Greater than', insertText: '> ', sortPriority: 40 },
  { label: '<', kind: CompletionKind.OPERATOR, detail: 'Less than', insertText: '< ', sortPriority: 40 },
  { label: '>=', kind: CompletionKind.OPERATOR, detail: 'Greater than or equal', insertText: '>= ', sortPriority: 40 },
  { label: '<=', kind: CompletionKind.OPERATOR, detail: 'Less than or equal', insertText: '<= ', sortPriority: 40 },
  { label: 'matches', kind: CompletionKind.OPERATOR, detail: 'Regex match', insertText: "matches '$1'", sortPriority: 40 },
  { label: 'between', kind: CompletionKind.OPERATOR, detail: 'Range check', insertText: 'between {$1, $2}', sortPriority: 40 },
  { label: 'instanceof', kind: CompletionKind.OPERATOR, detail: 'Type check', insertText: 'instanceof ', sortPriority: 40 },
  { label: '?:', kind: CompletionKind.OPERATOR, detail: 'Elvis (null-safe default)', insertText: '?: $1', sortPriority: 40 },

  // Snippets
  { label: '?: ternary', kind: CompletionKind.SNIPPET, detail: 'Ternary conditional', insertText: '$1 ? $2 : $3', sortPriority: 20 },
  { label: '.?[]', kind: CompletionKind.SNIPPET, detail: 'Collection selection (all)', insertText: '.?[$1]', sortPriority: 20 },
  { label: '.![]', kind: CompletionKind.SNIPPET, detail: 'Collection projection', insertText: '.![$1]', sortPriority: 20 },
  { label: '.^[]', kind: CompletionKind.SNIPPET, detail: 'Collection selection (first)', insertText: '.^[$1]', sortPriority: 20 },
  { label: '.*[]', kind: CompletionKind.SNIPPET, detail: 'Collection selection (last)', insertText: '.*[$1]', sortPriority: 20 },
  { label: '#this', kind: CompletionKind.SNIPPET, detail: 'Current element reference', insertText: '#this', sortPriority: 30 },
];

/**
 * Completion engine for SpEL expressions.
 *
 * Provides context-aware auto-completion suggestions for editors.
 * When a ContextSchema is available, suggestions include variable names,
 * property names, method names, bean names, and type names.
 */
export class SpelCompletionEngine {
  /**
   * Get completion suggestions at a given cursor position.
   *
   * @param expression The current expression text
   * @param position Cursor position (character offset)
   * @param contextSchema Optional context schema for context-aware completions
   * @returns Sorted list of completion items
   */
  static getCompletions(
    expression: string,
    position: number,
    contextSchema?: ContextSchema,
  ): CompletionItem[] {
    const prefix = SpelCompletionEngine.#getPrefixAt(expression, position);
    const items: CompletionItem[] = [];

    // Always include static completions filtered by prefix
    for (const item of STATIC_COMPLETIONS) {
      if (SpelCompletionEngine.#matchesPrefix(item.label, prefix)) {
        items.push(item);
      }
    }

    // Add context-aware completions if schema is available
    if (contextSchema) {
      items.push(...SpelCompletionEngine.getContextCompletions(expression, position, contextSchema, prefix));
    }

    // Sort by priority (descending) then alphabetically
    items.sort((a, b) => {
      if (b.sortPriority !== a.sortPriority) return b.sortPriority - a.sortPriority;
      return a.label.localeCompare(b.label);
    });

    return items;
  }

  /**
   * Get static keyword and operator completions (no context needed).
   */
  static getStaticCompletions(): CompletionItem[] {
    return [...STATIC_COMPLETIONS];
  }

  /**
   * Get context-aware completions based on a ContextSchema.
   */
  static getContextCompletions(
    _expression: string,
    _position: number,
    contextSchema: ContextSchema,
    prefix: string = '',
  ): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Variables from context schema
    for (const [name, schema] of Object.entries(contextSchema.variables ?? {})) {
      const label = '#' + name;
      if (SpelCompletionEngine.#matchesPrefix(label, prefix)) {
        items.push({
          label,
          kind: CompletionKind.VARIABLE,
          detail: schema.type ? `Variable (${schema.type})` : 'Variable',
          insertText: '#' + name,
          sortPriority: 100,
        });
      }
    }

    // Root object fields
    if (contextSchema.root) {
      for (const [name, schema] of Object.entries(contextSchema.root.fields ?? {})) {
        if (SpelCompletionEngine.#matchesPrefix(name, prefix)) {
          items.push({
            label: name,
            kind: CompletionKind.PROPERTY,
            detail: schema.type ? `Field (${schema.type})` : 'Field',
            insertText: name,
            sortPriority: 90,
          });
        }
      }

      // Root object methods
      for (const [name, schema] of Object.entries(contextSchema.root.methods ?? {})) {
        if (SpelCompletionEngine.#matchesPrefix(name, prefix)) {
          items.push({
            label: name + '()',
            kind: CompletionKind.METHOD,
            detail: schema.returnType ? `→ ${schema.returnType}` : 'Method',
            insertText: name + '($1)',
            sortPriority: 85,
          });
        }
      }
    }

    // Registered functions
    for (const [name, schema] of Object.entries(contextSchema.functions ?? {})) {
      const label = '#' + name;
      if (SpelCompletionEngine.#matchesPrefix(label, prefix)) {
        items.push({
          label: label + '()',
          kind: CompletionKind.FUNCTION,
          detail: schema.returnType ? `→ ${schema.returnType}` : 'Function',
          insertText: '#' + name + '($1)',
          sortPriority: 95,
        });
      }
    }

    // Registered beans
    for (const [name, schema] of Object.entries(contextSchema.beans ?? {})) {
      const label = '@' + name;
      if (SpelCompletionEngine.#matchesPrefix(label, prefix)) {
        items.push({
          label,
          kind: CompletionKind.BEAN,
          detail: schema.type ? `Bean (${schema.type})` : 'Bean',
          insertText: '@' + name,
          sortPriority: 90,
        });
      }
    }

    // Registered types
    for (const [name, schema] of Object.entries(contextSchema.types ?? {})) {
      const label = 'T(' + name + ')';
      if (SpelCompletionEngine.#matchesPrefix(label, prefix)) {
        items.push({
          label,
          kind: CompletionKind.TYPE,
          detail: schema.className ? `Class: ${schema.className}` : 'Type',
          insertText: 'T(' + name + ')',
          sortPriority: 85,
        });
      }
    }

    return items;
  }

  // ===== Private helpers =====

  /**
   * Extract the word at the cursor position as the completion prefix.
   */
  static #getPrefixAt(expression: string, position: number): string {
    const before = expression.substring(0, position);
    const match = before.match(/(#|@|T\()?[\w.]*$/);
    return match ? match[0] : '';
  }

  /**
   * Check if a label matches the current prefix (case-insensitive).
   */
  static #matchesPrefix(label: string, prefix: string): boolean {
    if (!prefix) return true;
    return label.toLowerCase().startsWith(prefix.toLowerCase());
  }
}
