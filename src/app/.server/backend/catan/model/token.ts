const TokenValue = {
  Two: "two",
  Three: "three",
  Four: "four",
  Five: "five",
  Six: "six",
  Eight: "eight",
  Nine: "nine",
  Ten: "ten",
  Eleven: "eleven",
  Twelve: "twelve",
} as const;

export type TokenValue = (typeof TokenValue)[keyof typeof TokenValue];

const TOKEN_VALUE_PIPS_MAP = {
  [TokenValue.Two]: 1,
  [TokenValue.Three]: 2,
  [TokenValue.Four]: 3,
  [TokenValue.Five]: 4,
  [TokenValue.Six]: 5,
  [TokenValue.Eight]: 5,
  [TokenValue.Nine]: 4,
  [TokenValue.Ten]: 3,
  [TokenValue.Eleven]: 2,
  [TokenValue.Twelve]: 1,
} as const;

const TOKEN_VALUE_TO_INT = {
  [TokenValue.Two]: 2,
  [TokenValue.Three]: 3,
  [TokenValue.Four]: 4,
  [TokenValue.Five]: 5,
  [TokenValue.Six]: 6,
  [TokenValue.Eight]: 8,
  [TokenValue.Nine]: 9,
  [TokenValue.Ten]: 10,
  [TokenValue.Eleven]: 11,
  [TokenValue.Twelve]: 12,
} as const;

const INT_TO_TOKEN_VALUE = {
  2: TokenValue.Two,
  3: TokenValue.Three,
  4: TokenValue.Four,
  5: TokenValue.Five,
  6: TokenValue.Six,
  8: TokenValue.Eight,
  9: TokenValue.Nine,
  10: TokenValue.Ten,
  11: TokenValue.Eleven,
  12: TokenValue.Twelve,
} as const;

const TOKEN_VALUE_DISPLAY_NAME = {
  [TokenValue.Two]: "Two",
  [TokenValue.Three]: "Three",
  [TokenValue.Four]: "Four",
  [TokenValue.Five]: "Five",
  [TokenValue.Six]: "Six",
  [TokenValue.Eight]: "Eight",
  [TokenValue.Nine]: "Nine",
  [TokenValue.Ten]: "Ten",
  [TokenValue.Eleven]: "Eleven",
  [TokenValue.Twelve]: "Twelve",
} as const;

// biome-ignore lint/suspicious/noExplicitAny: no other way to do this
type DistributeToken<T extends TokenValue> = T extends any ? Token<T> : never;
export class Token<V extends TokenValue = TokenValue> {
  readonly value: V;

  private constructor(v: V) {
    this.value = v;
  }
  get pips(): (typeof TOKEN_VALUE_PIPS_MAP)[V] {
    return TOKEN_VALUE_PIPS_MAP[this.value];
  }

  get int(): (typeof TOKEN_VALUE_TO_INT)[V] {
    return TOKEN_VALUE_TO_INT[this.value];
  }

  get displayName(): (typeof TOKEN_VALUE_DISPLAY_NAME)[V] {
    return TOKEN_VALUE_DISPLAY_NAME[this.value];
  }

  static fromValue<V extends TokenValue>(value: V): DistributeToken<V> {
    return new Token(value) as DistributeToken<V>;
  }

  static fromInt<Int extends keyof typeof INT_TO_TOKEN_VALUE>(
    value: Int,
  ): DistributeToken<(typeof INT_TO_TOKEN_VALUE)[Int]> {
    return Token.fromValue(INT_TO_TOKEN_VALUE[value]);
  }

  eq(other: Token): boolean {
    return other.value === this.value;
  }

  static Two: Token<typeof TokenValue.Two> = new Token(TokenValue.Two);
  static Three: Token<typeof TokenValue.Three> = new Token(TokenValue.Three);
  static Four: Token<typeof TokenValue.Four> = new Token(TokenValue.Four);
  static Five: Token<typeof TokenValue.Five> = new Token(TokenValue.Five);
  static Six: Token<typeof TokenValue.Six> = new Token(TokenValue.Six);
  static Eight: Token<typeof TokenValue.Eight> = new Token(TokenValue.Eight);
  static Nine: Token<typeof TokenValue.Nine> = new Token(TokenValue.Nine);
  static Ten: Token<typeof TokenValue.Ten> = new Token(TokenValue.Ten);
  static Eleven: Token<typeof TokenValue.Eleven> = new Token(TokenValue.Eleven);
  static Twelve: Token<typeof TokenValue.Twelve> = new Token(TokenValue.Twelve);

  static All: Token[] = [
    Token.Two,
    Token.Three,
    Token.Four,
    Token.Five,
    Token.Five,
    Token.Six,
    Token.Eight,
    Token.Nine,
    Token.Ten,
    Token.Eleven,
    Token.Twelve,
  ];
}
