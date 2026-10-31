// Seeded random numbers so any generated problem or drill can be rebuilt from its seed.

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.next = mulberry32(this.seed);
  }

  /** Integer in [lo, hi], inclusive. */
  int(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  pick(items) {
    return items[Math.floor(this.next() * items.length)];
  }

  chance(p) {
    return this.next() < p;
  }

  shuffle(items) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** n distinct integers from [lo, hi] in random order. */
  distinct(n, lo, hi) {
    const set = new Set();
    while (set.size < n) set.add(this.int(lo, hi));
    return [...set];
  }
}

export function newSeed() {
  if (globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff;
  }
  return Math.floor(Math.random() * 0x7fffffff);
}
