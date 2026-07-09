/**
 * 字符分类标志位 — 使用位掩码实现 O(1) 字符类型查询
 *
 * 对标 Spring Tokenizer 中的字符分类机制。
 * 使用 Uint8Array 预计算表，ASCII 范围内 O(1) 查询。
 */

export enum CharFlag {
  NONE = 0,
  LETTER = 1 << 0, // a-z, A-Z
  DIGIT = 1 << 1, // 0-9
  WHITESPACE = 1 << 2, // space, \t, \r, \n
  OPERATOR = 1 << 3, // + - * / % ^ < > = ! | & ? : . , ( ) [ ] { } @ #
  QUOTE = 1 << 4, // ' "
  UNDERSCORE = 1 << 5, // _
  DOLLAR = 1 << 6, // $
  DOT = 1 << 7, // .
  EXPONENT = 1 << 8, // e, E
  SIGN = 1 << 9, // +, - (用于数字上下文)
}

// Uint16Array: CharFlag range includes EXPONENT (256) and SIGN (512),
// which exceed Uint8Array max (255).
const CHAR_FLAG_TABLE = new Uint16Array(128);

function buildCharTable(): void {
  for (let c = 0; c < 128; c++) {
    const ch = String.fromCharCode(c);

    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.LETTER;
    }

    if (c >= 48 && c <= 57) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.DIGIT;
    }

    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      CHAR_FLAG_TABLE[c]! |= CharFlag.WHITESPACE;
    }

    if ('+-*/%^<>=!|&?:,.()[]{}@#'.includes(ch)) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.OPERATOR;
    }

    if (ch === "'" || ch === '"') {
      CHAR_FLAG_TABLE[c]! |= CharFlag.QUOTE;
    }

    // '_' = 95
    if (c === 95) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.UNDERSCORE;
    }

    // '$' = 36
    if (c === 36) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.DOLLAR;
    }

    // '.' = 46
    if (c === 46) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.DOT;
    }

    // 'E' = 69, 'e' = 101
    if (c === 69 || c === 101) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.EXPONENT;
    }

    // '+' = 43, '-' = 45
    if (c === 43 || c === 45) {
      CHAR_FLAG_TABLE[c]! |= CharFlag.SIGN;
    }
  }
}

// 模块初始化时构建字符表
buildCharTable();

/**
 * 获取字符的标志位掩码
 */
export function getCharFlag(ch: number): number {
  return (ch >= 0 && ch < 128) ? CHAR_FLAG_TABLE[ch]! : CharFlag.NONE;
}

/**
 * 检查是否为字母 (a-z, A-Z)
 */
export function isLetter(ch: number): boolean {
  return (getCharFlag(ch) & CharFlag.LETTER) !== 0;
}

/**
 * 检查是否为数字 (0-9)
 */
export function isDigit(ch: number): boolean {
  return (getCharFlag(ch) & CharFlag.DIGIT) !== 0;
}

/**
 * 检查是否为十六进制数字 (0-9, a-f, A-F)
 */
export function isHexDigit(ch: number): boolean {
  return isDigit(ch) ||
    (ch >= 65 && ch <= 70) ||  // A-F
    (ch >= 97 && ch <= 102);   // a-f
}

/**
 * 检查是否为空白字符
 */
export function isWhitespace(ch: number): boolean {
  return (getCharFlag(ch) & CharFlag.WHITESPACE) !== 0;
}

/**
 * 检查是否为操作符字符
 */
export function isOperator(ch: number): boolean {
  return (getCharFlag(ch) & CharFlag.OPERATOR) !== 0;
}

/**
 * 检查是否为引号字符
 */
export function isQuote(ch: number): boolean {
  return (getCharFlag(ch) & CharFlag.QUOTE) !== 0;
}

/**
 * 检查字符是否为标识符的有效起始字符 (字母, _, $)
 */
export function isIdentifierStart(ch: number): boolean {
  const flag = getCharFlag(ch);
  return (flag & (CharFlag.LETTER | CharFlag.UNDERSCORE | CharFlag.DOLLAR)) !== 0;
}

/**
 * 检查字符是否为标识符的有效后续字符 (字母, 数字, _, $)
 */
export function isIdentifierPart(ch: number): boolean {
  const flag = getCharFlag(ch);
  return (flag & (CharFlag.LETTER | CharFlag.DIGIT | CharFlag.UNDERSCORE | CharFlag.DOLLAR)) !== 0;
}
