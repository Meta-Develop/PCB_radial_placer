export type NumericExpressionResult =
  | {
      ok: true;
      value: number;
      isExpression: boolean;
    }
  | {
      ok: false;
      error: string;
    };

class NumericExpressionParser {
  private readonly input: string;
  private position = 0;
  private sawBinaryOperator = false;
  private sawUnaryOperator = false;
  private sawParenthesis = false;

  constructor(input: string) {
    this.input = input;
  }

  parse(): NumericExpressionResult {
    try {
      this.skipWhitespace();
      if (this.isAtEnd()) {
        return { ok: false, error: 'Enter a numeric value or expression.' };
      }

      const value = this.parseExpression();
      this.skipWhitespace();

      if (!this.isAtEnd()) {
        return { ok: false, error: `Unexpected character "${this.currentChar()}".` };
      }

      if (!Number.isFinite(value)) {
        return { ok: false, error: 'Expression result must be a finite number.' };
      }

      return {
        ok: true,
        value,
        isExpression: this.sawBinaryOperator || this.sawUnaryOperator || this.sawParenthesis,
      };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Invalid numeric expression.' };
    }
  }

  private parseExpression(): number {
    return this.parseAdditive();
  }

  private parseAdditive(): number {
    let value = this.parseMultiplicative();

    while (true) {
      this.skipWhitespace();
      if (this.match('+')) {
        this.sawBinaryOperator = true;
        value += this.parseMultiplicative();
      } else if (this.match('-')) {
        this.sawBinaryOperator = true;
        value -= this.parseMultiplicative();
      } else {
        return value;
      }
    }
  }

  private parseMultiplicative(): number {
    let value = this.parseUnary();

    while (true) {
      this.skipWhitespace();
      if (this.match('*')) {
        this.sawBinaryOperator = true;
        value *= this.parseUnary();
      } else if (this.match('/')) {
        this.sawBinaryOperator = true;
        const denominator = this.parseUnary();
        if (denominator === 0) {
          throw new Error('Division by zero is not allowed.');
        }
        value /= denominator;
      } else {
        return value;
      }
    }
  }

  private parseUnary(): number {
    this.skipWhitespace();
    if (this.match('+')) {
      this.sawUnaryOperator = true;
      return this.parseUnary();
    }
    if (this.match('-')) {
      this.sawUnaryOperator = true;
      return -this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    this.skipWhitespace();

    if (this.match('(')) {
      this.sawParenthesis = true;
      const value = this.parseExpression();
      this.skipWhitespace();
      if (!this.match(')')) {
        throw new Error('Missing closing parenthesis.');
      }
      return value;
    }

    return this.parseNumber();
  }

  private parseNumber(): number {
    this.skipWhitespace();
    const start = this.position;
    let sawDigit = false;

    while (this.isDigit(this.currentChar())) {
      sawDigit = true;
      this.position += 1;
    }

    if (this.currentChar() === '.') {
      this.position += 1;
      while (this.isDigit(this.currentChar())) {
        sawDigit = true;
        this.position += 1;
      }
    }

    if (!sawDigit) {
      throw new Error('Expected a number or parenthesized expression.');
    }

    if (this.currentChar() === 'e' || this.currentChar() === 'E') {
      const exponentStart = this.position;
      this.position += 1;
      if (this.currentChar() === '+' || this.currentChar() === '-') {
        this.position += 1;
      }

      let exponentDigits = 0;
      while (this.isDigit(this.currentChar())) {
        exponentDigits += 1;
        this.position += 1;
      }

      if (exponentDigits === 0) {
        this.position = exponentStart;
      }
    }

    const rawNumber = this.input.slice(start, this.position);
    const value = Number(rawNumber);
    if (!Number.isFinite(value)) {
      throw new Error('Number literal must be finite.');
    }

    return value;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.currentChar())) {
      this.position += 1;
    }
  }

  private match(expected: string): boolean {
    if (this.currentChar() !== expected) {
      return false;
    }
    this.position += 1;
    return true;
  }

  private currentChar(): string {
    return this.input[this.position] ?? '';
  }

  private isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  private isDigit(value: string): boolean {
    return value >= '0' && value <= '9';
  }
}

export function parseNumericExpression(input: string): NumericExpressionResult {
  return new NumericExpressionParser(input).parse();
}
