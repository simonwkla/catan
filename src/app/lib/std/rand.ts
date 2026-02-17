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

  number(min?: number, max?: number) {
    if (min === undefined || max === undefined) {
      return this.rand();
    }
    return this.rand() * (max - min) + min;
  }

  int(min: number, max: number) {
    return Math.floor(this.number() * (max - min + 1)) + min;
  }

  static seed(): Seed {
    return [seedgen(), seedgen(), seedgen(), seedgen()];
  }
}
