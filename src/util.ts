// Small shared helpers: DOM lookup, HTML escaping, seedable randomness.

export const $ = (s: string) => document.querySelector(s) as HTMLElement;
export const $o = (s: string) => document.querySelector(s) as HTMLElement | null;
export const $$ = (s: string, root: ParentNode = document) => Array.from(root.querySelectorAll<HTMLElement>(s));

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// The RNG is swappable so daily shifts and bosses can be seeded and identical for everyone.
let RNG: () => number = Math.random;
export const setRng = (f: () => number) => { RNG = f; };
export const resetRng = () => { RNG = Math.random; };
export const rnd = () => RNG();
export const pick = <T>(a: T[]): T => a[Math.floor(rnd() * a.length)];
export const shuffle = <T>(a: T[]): T[] => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export function mulberry(s: number): () => number {
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
