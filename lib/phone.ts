/** Normalizes a Spanish mobile ("+34 612 345 678", "0034612345678", "612345678") to 9 digits, or null. */
export function normalizePhone(input: string): string | null {
  let p = input.replace(/[\s\-().]/g, "");
  if (p.startsWith("+34")) p = p.slice(3);
  else if (p.startsWith("0034")) p = p.slice(4);
  return /^[67]\d{8}$/.test(p) ? p : null;
}
