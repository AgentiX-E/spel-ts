import type { SpelMessage } from './spel-message.js';

/**
 * Parallels Spring SpelParseException
 *
 * Exception during parsing. Contains position and error code for diagnosis.
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
   * Full error message with expression string
   */
  public toDetailedString(expressionString: string): string {
    return (
      `SpelParseException at position ${this.position.toString()} in "${expressionString}": ` +
      `[${this.messageCode.toString()}] ${this.inserts.join(', ')}`
    );
  }
}
