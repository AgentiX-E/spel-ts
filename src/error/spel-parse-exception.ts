import type { SpelMessage } from './spel-message.js';

/**
 * 对标 Spring SpelParseException
 *
 * 表达式解析阶段的异常。包含位置信息和错误码，便于定位问题。
 */
export class SpelParseException extends Error {
  public readonly position: number;
  public readonly messageCode: SpelMessage;
  public readonly inserts: string[];

  constructor(position: number, messageCode: SpelMessage, ...inserts: string[]) {
    const msg = `SpelParseException[${messageCode}]: ${inserts.join(', ')}`;
    super(msg);
    this.name = 'SpelParseException';
    this.position = position;
    this.messageCode = messageCode;
    this.inserts = inserts;
  }

  /**
   * 带表达式字符串的完整错误消息
   */
  public toDetailedString(expressionString: string): string {
    return `SpelParseException at position ${this.position.toString()} in "${expressionString}": ` +
      `[${this.messageCode.toString()}] ${this.inserts.join(', ')}`;
  }
}
