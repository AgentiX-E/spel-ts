import { SpelExpressionParser } from '../spel-expression-parser.js';

/**
 * Options for SpEL expression formatting.
 */
export interface FormatOptions {
  indentSize?: number;
  spacing?: 'always' | 'compact';
  maxLineWidth?: number;
}

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  indentSize: 2,
  spacing: 'always',
  maxLineWidth: 120,
};

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class SpelFormatter {
  static format(expression: string, options?: FormatOptions): string {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    try {
      const parser = new SpelExpressionParser();
      const ast = parser.parseRaw(expression);
      const formatted = ast.toStringAST();
      if (opts.spacing === 'compact') {
        return SpelFormatter.#compactSpaces(formatted);
      }
      return formatted;
    } catch {
      return SpelFormatter.minify(expression);
    }
  }

  static minify(expression: string): string {
    let inString: string | null = null;
    let result = '';
    for (let i = 0; i < expression.length; i++) {
      const ch = expression[i] ?? '';
      const prev = result[result.length - 1];
      if ((ch === "'" || ch === '"') && (i === 0 || expression[i - 1] !== '\\')) {
        if (inString === null) {
          inString = ch;
        } else if (inString === ch) {
          inString = null;
        }
      }
      if (inString !== null) {
        result += ch;
        continue;
      }
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        if (prev && prev !== ' ' && SpelFormatter.#isTokenChar(prev)) {
          result += ' ';
        }
        continue;
      }
      result += ch;
    }
    return result.trim();
  }

  static semanticallyEqual(a: string, b: string): boolean {
    try {
      const parser = new SpelExpressionParser();
      return parser.parseRaw(a).toStringAST() === parser.parseRaw(b).toStringAST();
    } catch {
      return SpelFormatter.minify(a) === SpelFormatter.minify(b);
    }
  }

  static #compactSpaces(expr: string): string {
    return expr
      .replace(/\s*([+\-*/%=<>!&|^?:.,;()[\]{}])\s*/g, '$1')
      .replace(/\s+(and|or|not|eq|ne|lt|gt|le|ge|mod|matches|between|instanceof|new)\s+/gi, ' $1 ')
      .trim();
  }

  static #isTokenChar(ch: string): boolean {
    return /[\w#@]/.test(ch);
  }
}
