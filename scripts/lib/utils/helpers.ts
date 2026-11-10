export const ascii = (bytes: Uint8Array, from: number, to: number): string =>
  String.fromCharCode(...bytes.subarray(from, to));

export const plural = (count: number, word: string): string =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

export const unknownKeys = (record: Record<string, unknown>, allowed: Set<string>): string[] =>
  Object.keys(record).filter((key) => !allowed.has(key));
