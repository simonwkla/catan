export enum Token {
  Two = "two",
  Three = "three",
  Four = "four",
  Five = "five",
  Six = "six",
  Eight = "eight",
  Nine = "nine",
  Ten = "ten",
  Eleven = "eleven",
  Twelve = "twelve",
}

const TOKEN_PIPS_MAP: Record<Token, number> = {
  [Token.Two]: 1,
  [Token.Three]: 2,
  [Token.Four]: 3,
  [Token.Five]: 4,
  [Token.Six]: 5,
  [Token.Eight]: 5,
  [Token.Nine]: 4,
  [Token.Ten]: 3,
  [Token.Eleven]: 2,
  [Token.Twelve]: 1,
};

const TOKEN_TO_INT: Record<Token, number> = {
  [Token.Two]: 2,
  [Token.Three]: 3,
  [Token.Four]: 4,
  [Token.Five]: 5,
  [Token.Six]: 6,
  [Token.Eight]: 8,
  [Token.Nine]: 9,
  [Token.Ten]: 10,
  [Token.Eleven]: 11,
  [Token.Twelve]: 12,
};

function pips(token: Token): number {
  return TOKEN_PIPS_MAP[token];
}

function toInt(token: Token): number {
  return TOKEN_TO_INT[token];
}

export const token = {
  pips,
  toInt,
};
