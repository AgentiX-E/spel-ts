import type { SpelMessage } from './spel-message.js';

/**
 * Parallels Spring SpelEvaluationException
 *
 * Exception during evaluation. Contains position and error code.
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
   * Full error message with expression string
   */
  public toDetailedString(expressionString: string): string {
    return `SpelEvaluationException at position ${this.position.toString()} in "${expressionString}": ` +
      `[${this.messageCode.toString()}] ${this.inserts.join(', ')}`;
  }
}
