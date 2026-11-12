// Shifty: the night-shift cyber-ghost. Cute, 16-bit, dead to the world, still on shift.
// Drawn from a tiny pixel grid so the app, the icons, every pose and every animation frame come from one definition.
// Pure TypeScript with no DOM access, so the icon script can import it too. (Animation lives in shifty-live.ts.)

export type Pose = 'dead' | 'happy' | 'shock' | 'sleepy' | 'cheer';
export type HatId = '' | 'beanie' | 'cap' | 'sunglasses' | 'party' | 'halo' | 'crown';

/** One animation frame. Everything is optional; the defaults are Shifty at rest. */
export interface Look {
  pose?: Pose;
  hem?: 0 | 1;          // which way the zig-zag hem sits (flip it to make him float)
  arm?: 0 | 1 | 2 | 3;  // 0 down, 1-2 right arm waving, 3 both up
  led?: boolean;        // headset LED and circuit traces
  tongue?: 0 | 1;      // tongue wiggle
  gaze?: -1 | 0 | 1;   // eyes look left / ahead / right
  blink?: boolean;     // X eyes squash flat for a moment
  hat?: HatId;
}

const W = 20;
const H = 18;
const PAD = 1;                 // room for the outline around the edge pixels
const HEAD = 6;                // extra rows above the head for hats
const GW = W + 2 * PAD;
const GH = H + 2 * PAD + HEAD;
const COLORS: Record<string, string> = {
  o: '#0b1220', // outline
  w: '#eaf4ff', // body
  s: '#a9c7ee', // shade
  c: '#22d3ee', // cyber cyan
  g: '#3ee68a', // headset green
  p: '#f472b6', // cheeks, tongue
  y: '#fbbf24', // gold
  r: '#ff4d5e', // red
  b: '#38bdf8', // sky
  v: '#a78bfa', // violet
  k: '#06080c', // black
};

/** Hats: rows top to bottom, anchored so the last row sits on the head. `lift` floats it up (halo). */
const HAT_PIXELS: Record<string, { x: number; rows: string[]; lift?: number }> = {
  party: { x: 7, rows: ['..rr..', '..oo..', '.oyyo.', '.opyo.', 'oyypyo'] },
  crown: { x: 6, rows: ['y.y..y.y', 'yyyyyyyy', 'yrycyyry'] },
  halo: { x: 6, rows: ['..cccc..', '.c....c.', '..cccc..'], lift: 1 },
  cap: { x: 5, rows: ['..oooo....', '.obbbbo...', 'obbbbbboo.', 'ooooooooo.'] },
  beanie: { x: 6, rows: ['...ww...', '..gggg..', '.gggggg.', 'oooooooo'] },
};

export const HAT_NAMES: Record<Exclude<HatId, ''>, string> = {
  beanie: 'Night-shift beanie', cap: 'Lucky cap', sunglasses: 'Deal-with-it shades', party: 'Party hat', halo: 'Halo', crown: 'Boss crown',
};

/** The pixel grid for a look: rows of colour letters, ' ' = transparent. */
export function shiftyGrid(look: Look = {}): string[] {
  const pose = look.pose ?? 'dead';
  const hem = look.hem ?? 0, arm = look.arm ?? 0, led = look.led ?? true, tongue = look.tongue ?? 0, gaze = look.gaze ?? 0;
  const g: string[][] = Array.from({ length: GH }, () => Array<string>(GW).fill(' '));
  const bottom = (x: number) => 15 + ((x + hem * 2) % 4 < 2 ? 1 : 0); // zig-zag ghost hem
  const dome: Record<number, [number, number]> = { 0: [7, 12], 1: [5, 14], 2: [3, 16], 3: [2, 17] };
  const rightArm: [number, number] = arm === 0 ? [9, 11] : arm === 1 ? [6, 8] : arm === 2 ? [5, 7] : [4, 6];
  const leftArm: [number, number] = arm === 3 ? [4, 6] : [9, 11];
  const inBody = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (y <= 3 && x >= 2 && x <= 17) return x >= dome[y][0] && x <= dome[y][1];
    if (x <= 1) return y >= leftArm[0] && y <= leftArm[1];
    if (x >= 18) return y >= rightArm[0] && y <= rightArm[1];
    if (y <= 3) return false;
    return x >= 2 && x <= 17 && y <= bottom(x);
  };
  const oy = PAD + HEAD; // grid row of body row 0
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inBody(x - PAD, y - oy)) g[y][x] = x - PAD >= 16 || x - PAD === 1 || x - PAD === 19 ? 's' : 'w';
  // outline: any empty cell touching the body
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (g[y][x] !== ' ') continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < GH && xx >= 0 && xx < GW && inBody(xx - PAD, yy - oy)) { g[y][x] = 'o'; dy = 2; break; }
    }
  }
  const put = (x: number, y: number, c: string) => { x += PAD; y += oy; if (x >= 0 && x < GW && y >= 0 && y < GH) g[y][x] = c; };
  // headset: band over the dome, ear cups, an LED
  for (let x = 6; x <= 13; x++) put(x, 1, 'g');
  for (const x of [4, 5, 14, 15]) put(x, 2, 'g');
  for (const cx of [2, 16]) for (let y = 5; y <= 7; y++) { put(cx, y, 'g'); put(cx + 1, y, 'g'); }
  put(17, 5, led ? 'c' : 'g');
  // cheeks
  for (const x of [4, 5, 14, 15]) put(x, 9, 'p');
  // cyber traces on the tummy (they pulse with the LED)
  for (const [x, y] of [[6, 12], [7, 12], [7, 13], [8, 13], [12, 12], [12, 13], [13, 13]] as const) put(x, y, led ? 'c' : 'g');
  // eyes (left eye centred on x=6, right on x=13; gaze nudges both)
  for (const base of [6, 13]) {
    const ex = base + gaze;
    if (pose === 'dead') {
      if (look.blink) for (let dx = -1; dx <= 1; dx++) put(ex + dx, 7, 'o');
      else for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] as const) put(ex + dx, 7 + dy, 'o');
    } else if (pose === 'happy' || pose === 'cheer') { put(ex - 1, 7, 'o'); put(ex, 6, 'o'); put(ex + 1, 7, 'o'); }
    else if (pose === 'shock') { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(ex + dx, 7 + dy, dx === 0 && dy === 0 ? 'w' : 'o'); }
    else { for (let dx = -1; dx <= 1; dx++) put(ex + dx, 7, 'o'); put(ex + 1, 8, 'o'); }
  }
  // sunglasses sit over the eyes
  if (look.hat === 'sunglasses') {
    for (const [x0, x1] of [[4, 8], [11, 15]] as const) for (let y = 6; y <= 8; y++) for (let x = x0; x <= x1; x++) put(x, y, y === 6 && x > x0 && x < x1 ? 'c' : 'k');
    put(9, 7, 'k'); put(10, 7, 'k');
  }
  // mouth
  if (pose === 'dead') { for (let x = 8; x <= 11; x++) put(x, 10, 'o'); const tx = tongue ? 9 : 10; put(tx, 11, 'p'); put(tx + 1, 11, 'p'); } // tongue out
  else if (pose === 'happy') { put(8, 10, 'o'); put(9, 11, 'o'); put(10, 11, 'o'); put(11, 10, 'o'); }
  else if (pose === 'cheer') { for (let x = 8; x <= 11; x++) put(x, 10, 'o'); for (let x = 9; x <= 10; x++) put(x, 11, 'p'); }
  else if (pose === 'shock') { for (const [x, y] of [[9, 10], [10, 10], [9, 11], [10, 11]] as const) put(x, y, 'o'); }
  else { put(9, 10, 'o'); put(10, 10, 'o'); for (const [x, y] of [[17, 0], [18, 0], [19, 0], [18, 1], [17, 2], [18, 2], [19, 2]] as const) put(x, y, 'c'); } // a little Z
  // hats sit on top of the head
  const hat = look.hat && HAT_PIXELS[look.hat];
  if (hat) {
    const base = -1 - (hat.lift ?? 0);
    hat.rows.forEach((row, i) => { const y = base - (hat.rows.length - 1 - i); for (let k = 0; k < row.length; k++) if (row[k] !== '.') put(hat.x + k, y, row[k]); });
  }
  return g.map((r) => r.join(''));
}

/** Hats that need the extra rows above the head. */
const TALL: HatId[] = ['party', 'crown', 'halo', 'cap', 'beanie'];

/** The hat everyone wears right now (set from the save by the app; the icon script leaves it empty). */
let equipped: HatId = '';
export const setEquipped = (h: HatId) => { equipped = h; };
export const getEquipped = (): HatId => equipped;

/** Inline SVG (crisp pixels). `px` is the rendered width in CSS pixels. Pass a pose name or a full Look. */
export function shiftySvg(look: Pose | Look = 'dead', px = 48, label = 'Shifty the ghost'): string {
  const l: Look = typeof look === 'string' ? { pose: look } : look;
  const withHat: Look = l.hat === undefined ? { ...l, hat: equipped } : l;
  const rows = shiftyGrid(withHat);
  const tall = TALL.includes(withHat.hat ?? '');
  const top = tall ? 0 : HEAD;
  const h = GH - top;
  let rects = '';
  rows.forEach((row, y) => {
    if (y < top) return;
    let x = 0;
    while (x < GW) {
      const c = row[x];
      if (c === ' ') { x++; continue; }
      let run = 1;
      while (x + run < GW && row[x + run] === c) run++;
      rects += `<rect x="${x}" y="${y - top}" width="${run}" height="1" fill="${COLORS[c]}"/>`;
      x += run;
    }
  });
  return `<svg class="shifty" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GW} ${h}" width="${px}" height="${Math.round((px * h) / GW)}" shape-rendering="crispEdges" role="img" aria-label="${label}">${rects}</svg>`;
}

/** Things Shifty says when you poke him. */
export const SHIFTY_LINES = [
  'Shifty is on shift. Technically.',
  'I died at 2am. Still got paged.',
  'Boo. (That was the alert, not me.)',
  'I have 4,112 unread tickets and no pulse.',
  'Read the log line. I would, but I am a ghost.',
  'Dead inside, alert on the outside.',
  'My MTTR is infinite. I have all the time in the afterlife.',
  'Being dead is great for uptime.',
  'I phased through the firewall. It was open anyway.',
  'Ask me about my 3am incident. Actually, do not.',
];
