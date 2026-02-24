export type Seed = [number, number, number, number];

function sfc32([a, b, c, d]: Seed) {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const seedgen = () => (Math.random() * 2 ** 32) >>> 0;

export class Rand {
  private readonly rand: () => number;

  constructor(seed?: Seed) {
    this.rand = sfc32(seed ?? Rand.seed());
  }

  derive(): Rand {
    return new Rand([this.rand(), this.rand(), this.rand(), this.rand()]);
  }

  number(min?: number, max?: number) {
    if (min === undefined || max === undefined) {
      return this.rand();
    }
    return this.rand() * (max - min) + min;
  }

  int(min: number, max: number) {
    return Math.floor(this.number() * (max - min + 1)) + min;
  }

  pick<T>(items: T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  static seed(): Seed {
    return [seedgen(), seedgen(), seedgen(), seedgen()];
  }

  static fromString(str: string, salt = 0): Rand {
    const seed = Rand.hashString(str, salt);
    return new Rand(seed);
  }

  private static hashString(str: string, salt: number): Seed {
    let h1 = 0xdeadbeef ^ salt;
    let h2 = 0x41c6ce57 ^ salt;
    let h3 = 0x9e3779b9 ^ salt;
    let h4 = 0x85ebca77 ^ salt;

    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 0x85ebca6b);
      h2 = Math.imul(h2 ^ ch, 0xc2b2ae3d);
      h3 = Math.imul(h3 ^ ch, 0x27d4eb2f);
      h4 = Math.imul(h4 ^ ch, 0x165667b1);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 15), 0x735a2d97);
    h2 = Math.imul(h2 ^ (h2 >>> 15), 0xcaf649a9);
    h3 = Math.imul(h3 ^ (h3 >>> 16), 0x5bc54f87);
    h4 = Math.imul(h4 ^ (h4 >>> 16), 0x9f2d8b41);

    h1 ^= h2 ^ h3 ^ h4;
    h2 ^= h1;
    h3 ^= h1;
    h4 ^= h1;

    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }
}
