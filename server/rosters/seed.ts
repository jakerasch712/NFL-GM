/**
 * Deterministic pseudo random helpers. The same key always returns the same
 * value, so a roster built twice from the same inputs is identical.
 */

/** FNV-1a 32 bit hash. */
export function hashString(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Uniform value in [0, 1) derived from the key. */
export function seededUnit(key: string): number {
  return hashString(key) / 0x100000000;
}

/** Integer in [min, max] inclusive derived from the key. */
export function seededInt(key: string, min: number, max: number): number {
  return min + Math.floor(seededUnit(key) * (max - min + 1));
}
