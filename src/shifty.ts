// Shifty: the night-shift cyber-ghost. Cute, 16-bit, dead to the world, still on shift.
// Drawn from a tiny pixel grid so the app, the icons and every pose come from one definition.
// Pure TypeScript with no DOM access, so the icon script can import it too.

export type Pose = 'dead' | 'happy' | 'shock' | 'sleepy';

const W = 20;
const H = 18;
const PAD = 1; // room for the outline around the edge pixels
const GW = W + 2 * PAD;
const GH = H + 2 * PAD;
const COLORS: Record<string, string> = {
  o: '#0b1220', // outline
  w: '#eaf4ff', // body
  s: '#a9c7ee', // shade
  c: '#22d3ee', // cyber cyan
  g: '#3ee68a', // headset green
  p: '#f472b6', // cheeks and tongue
};

/** The pixel grid for a pose: rows of colour letters, ' ' = transparent. */
export function shiftyGrid(pose: Pose = 'dead'): string[] {
  const g: string[][] = Array.from({ length: GH }, () => Array<string>(GW).fill(' '));
  const bottom = (x: number) => 15 + (x % 4 < 2 ? 1 : 0); // zig-zag ghost hem
  const dome: Record<number, [number, number]> = { 0: [7, 12], 1: [5, 14], 2: [3, 16], 3: [2, 17] };
  const inBody = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    if (y <= 3) return x >= dome[y][0] && x <= dome[y][1];
    if (y >= 9 && y <= 11 && (x <= 1 || x >= 18)) return true; // dangling arms
    return x >= 2 && x <= 17 && y <= bottom(x);
  };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inBody(x - PAD, y - PAD)) g[y][x] = x - PAD >= 16 || x - PAD === 1 || x - PAD === 19 ? 's' : 'w';
  // outline: any empty cell touching the body
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    if (g[y][x] !== ' ') continue;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < GH && xx >= 0 && xx < GW && inBody(xx - PAD, yy - PAD)) { g[y][x] = 'o'; dy = 2; break; }
    }
  }
  const put = (x: number, y: number, c: string) => { x += PAD; y += PAD; if (x >= 0 && x < GW && y >= 0 && y < GH) g[y][x] = c; };
  // headset: band over the dome, ear cups, an LED
  for (let x = 6; x <= 13; x++) put(x, 1, 'g');
  for (const x of [4, 5, 14, 15]) put(x, 2, 'g');
  for (const [cx] of [[2], [16]]) for (let y = 5; y <= 7; y++) { put(cx, y, 'g'); put(cx + 1, y, 'g'); }
  put(17, 5, 'c');
  // cheeks
  for (const x of [4, 5, 14, 15]) put(x, 9, 'p');
  // cyber traces on the tummy
  for (const [x, y] of [[6, 12], [7, 12], [7, 13], [8, 13], [12, 12], [12, 13], [13, 13]] as const) put(x, y, 'c');
  // eyes (left eye centred on x=6, right on x=13)
  for (const ex of [6, 13]) {
    if (pose === 'dead') for (const [dx, dy] of [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]] as const) put(ex + dx, 7 + dy, 'o');
    else if (pose === 'happy') { put(ex - 1, 7, 'o'); put(ex, 6, 'o'); put(ex + 1, 7, 'o'); }
    else if (pose === 'shock') { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(ex + dx, 7 + dy, dx === 0 && dy === 0 ? 'w' : 'o'); }
    else { for (let dx = -1; dx <= 1; dx++) put(ex + dx, 7, 'o'); put(ex + 1, 8, 'o'); }
  }
  // mouth
  if (pose === 'dead') { for (let x = 8; x <= 11; x++) put(x, 10, 'o'); put(10, 11, 'p'); put(11, 11, 'p'); } // tongue out
  else if (pose === 'happy') { put(8, 10, 'o'); put(9, 11, 'o'); put(10, 11, 'o'); put(11, 10, 'o'); }
  else if (pose === 'shock') { for (const [x, y] of [[9, 10], [10, 10], [9, 11], [10, 11]] as const) put(x, y, 'o'); }
  else { put(9, 10, 'o'); put(10, 10, 'o'); for (const [x, y] of [[17, 0], [18, 0], [19, 0], [18, 1], [17, 2], [18, 2], [19, 2]] as const) put(x, y, 'c'); } // a little Z
  return g.map((r) => r.join(''));
}

/** Inline SVG (crisp pixels). `px` is the rendered width in CSS pixels. */
export function shiftySvg(pose: Pose = 'dead', px = 48, label = 'Shifty the ghost'): string {
  const rows = shiftyGrid(pose);
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < GW) {
      const c = row[x];
      if (c === ' ') { x++; continue; }
      let run = 1;
      while (x + run < GW && row[x + run] === c) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${COLORS[c]}"/>`;
      x += run;
    }
  });
  return `<svg class="shifty" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GW} ${GH}" width="${px}" height="${Math.round((px * GH) / GW)}" shape-rendering="crispEdges" role="img" aria-label="${label}">${rects}</svg>`;
}

/** Things Shifty says when you poke him. */
export const SHIFTY_LINES = [
  'Shifty is on shift. Technically.',
  'I died at 2am. Still got paged.',
  'Boo. (That was the alert, not me.)',
  'I have 4,112 unread tickets and no pulse.',
  'Read the log line. I would, but I am a ghost.',
  'Dead inside, alert on the outside.',
  'Escalate nothing. Close everything. Just kidding.',
  'My MTTR is infinite. I have all the time in the afterlife.',
];
