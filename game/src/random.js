// Seeded random numbers for Gobble Run: one small deterministic generator
// (mulberry32) plus the helpers the world builder and the hazard spawner use.
// A fixed seed makes a run reproducible; a run that starts from the title
// screen seeds itself from the clock so every escape feels a little different.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Roll a float in [min, max) from a generator function.
export function roll(rng, min, max) {
  return min + rng() * (max - min);
}

// Roll an integer in [min, max] inclusive.
export function rollInt(rng, min, max) {
  return Math.floor(roll(rng, min, max + 1));
}

// Pick one element of an array at random.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Shuffle a copy of an array in place order using the given generator.
export function shuffled(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

// Clamp a value into [min, max].
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

// Smooth interpolation helper used by the farmer and the camera shake.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
