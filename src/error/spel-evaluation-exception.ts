import type { SpelMessage } from './spel-message.js';

/**
 * 对标 Spring SpelEvaluationException
 *
 * 表达式求值阶段的异常。包含位置信息和错误码。
 */
export class SpelEvaluationException extends Error {
  public position: number;
  public readonly messageCode: SpelMessage;
  public readonly inserts: string[];

  constructor(position: number, messageCode: SpelMessage, ...inserts: string[]) {
    const msg = `SpelEvaluationException[${messageCode}]: ${inserts.join(', ')}`;
    super(msg);
    this.name = 'SpelEvaluationException';
    this.position = position;
    this.messageCode = messageCode;
    this.inserts = inserts;
  }

  /**
   * 带表达式字符串的完整错误消息
   */
  public toDetailedString(expressionString: string): string {
    return `SpelEvaluationException at position ${this.position.toString()} in "${expressionString}": ` +
      `[${this.messageCode.toString()}] ${this.inserts.join(', ')}`;
  }
}
