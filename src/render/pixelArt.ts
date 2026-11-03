// Pixel-art drawing on a plain 2D canvas, ported from the wiki's battle mock
// so the game looks the same as the design. Everything draws at 1 game pixel
// = 1 canvas pixel (320x180); Phaser only scales the result up.

export const W = 320;
export const H = 180;

export const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export type ElementKey = "heat" | "cold" | "charge" | "grav" | "light" | "dark" | "organic";

/** Colour ramps per element, darkest to brightest. */
export const RAMP: Record<ElementKey, string[]> = {
  heat: ["#4a1408", "#a3330e", "#ff7a2e", "#ffc27a", "#fff1d6"],
  cold: ["#0a2440", "#1a65a0", "#4fc0ff", "#aee8ff", "#f0fbff"],
  charge: ["#3f3005", "#a27f08", "#ffd93d", "#fff09a", "#fffde6"],
  grav: ["#110c36", "#3326a3", "#6b5cff", "#b2a8ff", "#ecebff"],
  light: ["#4d4434", "#a8987a", "#e9dfc2", "#fff6df", "#ffffff"],
  dark: ["#050208", "#1c0f2b", "#4d1f73", "#b14dff", "#e6c0ff"],
  organic: ["#0c3418", "#1d8039", "#58d873", "#b5f3c0", "#eeffef"],
};

export const SPACE = ["#06050d", "#0c0a1c", "#16123a", "#241d55", "#33286b"];
export const VOID: Record<string, string> = {
  o: "#1b1a22", l: "#c9c6d1", m: "#8a8794", d: "#4a4856", v: "#000000", e: "#ff3b5c",
};
export const RED = "#ff3b5c";

type Ctx = CanvasRenderingContext2D;

export function rng(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
export function ease(u: number): number {
  u = clamp(u, 0, 1);
  return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
}

export function px(c: Ctx, x: number, y: number, col: string): void {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), 1, 1);
}

/* ---------- squashed flat-top hex spans ---------- */
export const SQ = 0.72;

const spanCache = new Map<number, [number, number][]>();
/** Horizontal runs [dy, halfWidth] that make up a squashed hex of radius r. */
export function spans(r: number): [number, number][] {
  const hit = spanCache.get(r);
  if (hit) return hit;
  const hh = Math.floor(r * 0.866 * SQ);
  const a: [number, number][] = [];
  for (let dy = -hh; dy <= hh; dy++) a.push([dy, Math.round(r - Math.abs(dy) / (SQ * 1.732))]);
  spanCache.set(r, a);
  return a;
}

export function fillHex(c: Ctx, cx: number, cy: number, r: number, col: string): void {
  c.fillStyle = col;
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (const [dy, w] of spans(r)) c.fillRect(cx - w, cy + dy, 2 * w, 1);
}

export function ditherHex(c: Ctx, cx: number, cy: number, r: number, col: string, th: number, off: number): void {
  c.fillStyle = col;
  cx = Math.round(cx);
  cy = Math.round(cy);
  for (const [dy, w] of spans(r)) {
    for (let x = cx - w; x < cx + w; x++) {
      const y = cy + dy;
      if (BAYER[(x + off) & 3][y & 3] < th) c.fillRect(x, y, 1, 1);
    }
  }
}

/** Hex outline (top and bottom rows full, sides 1px). */
export function outlineHex(c: Ctx, cx: number, cy: number, r: number, col: string): void {
  c.fillStyle = col;
  cx = Math.round(cx);
  cy = Math.round(cy);
  const sp = spans(r);
  sp.forEach(([dy, w], i) => {
    if (i === 0 || i === sp.length - 1) c.fillRect(cx - w, cy + dy, 2 * w, 1);
    else {
      c.fillRect(cx - w, cy + dy, 1, 1);
      c.fillRect(cx + w - 1, cy + dy, 1, 1);
    }
  });
}

/* ---------- background ---------- */
export function makeBackground(): HTMLCanvasElement {
  const bg = document.createElement("canvas");
  bg.width = W;
  bg.height = H;
  const c = bg.getContext("2d")!;
  const blobs = [[60, 40, 70, 0.9], [250, 120, 90, 0.8], [180, 20, 50, 0.5]];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let n = 0;
      for (const [bx, by, br, s] of blobs) {
        const d = ((x - bx) ** 2 + ((y - by) * 1.4) ** 2) / (br * br);
        n += s * Math.exp(-d * 2.2);
      }
      const v = 0.18 + n * 0.55 + (y / H) * 0.12;
      const t = v * 4 + (BAYER[x & 3][y & 3] / 16 - 0.5) * 0.9;
      px(c, x, y, SPACE[clamp(Math.floor(t), 0, 3)]);
    }
  }
  const r = rng(7);
  for (let i = 0; i < 120; i++) px(c, r() * W, r() * H, r() < 0.7 ? "#2c2660" : "#4a4290");
  return bg;
}

const twinkle = (() => {
  const r = rng(21);
  const a: { x: number; y: number; p: number; s: number; big: boolean }[] = [];
  for (let i = 0; i < 34; i++) {
    a.push({ x: Math.floor(r() * W), y: Math.floor(r() * H), p: r() * 6.28, s: 0.6 + r() * 1.8, big: r() < 0.25 });
  }
  return a;
})();

export function drawStars(c: Ctx, t: number): void {
  for (const s of twinkle) {
    const b = (Math.sin(t * s.s + s.p) + 1) / 2;
    px(c, s.x, s.y, b > 0.8 ? "#ecebff" : b > 0.45 ? "#8f88c9" : "#3a3478");
    if (s.big && b > 0.75) {
      c.fillStyle = "#5d55a8";
      c.fillRect(s.x - 1, s.y, 1, 1);
      c.fillRect(s.x + 1, s.y, 1, 1);
      c.fillRect(s.x, s.y - 1, 1, 1);
      c.fillRect(s.x, s.y + 1, 1, 1);
    }
  }
}

/* ---------- star spirit ---------- */
function spiritCols(key: ElementKey) {
  const r = RAMP[key];
  if (key === "dark") return { c0: r[1], c1: r[2], c2: r[3], edge: r[4], glow: r[3] };
  return { c0: r[4], c1: r[3], c2: r[2], edge: r[1], glow: r[2] };
}

function drawRing(c: Ctx, cx: number, cy: number, i: number, t: number, front: boolean): void {
  const g = RAMP.grav;
  const rx = 10 + i * 3, ry = 3 + i;
  const dir = i % 2 ? -1 : 1;
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * 6.283;
    const s = Math.sin(a);
    if (front ? s < 0 : s >= 0) continue;
    px(c, cx + Math.cos(a) * rx, cy + s * ry, front ? g[2] : g[1]);
  }
  const ma = (t * 1.4 * dir + i * 2) % 6.283;
  const ms = Math.sin(ma);
  if (front ? ms >= 0 : ms < 0) px(c, cx + Math.cos(ma) * rx, cy + ms * ry, g[4]);
}

export interface SpiritOpts {
  rings?: number;
  bright?: number;
  second?: ElementKey;
}

export function drawSpirit(c: Ctx, cx: number, cy: number, t: number, key: ElementKey, o: SpiritOpts = {}): void {
  const col = spiritCols(key);
  cy += Math.round(Math.sin(t * 2.2));
  const sec = o.second ? RAMP[o.second] : null;
  const rings = o.rings ?? 0;
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 0.35;
  c.fillStyle = col.glow;
  const gr = 10 + (o.bright ?? 0) * 4;
  for (let dy = -gr; dy <= gr; dy++) {
    for (let dx = -gr; dx <= gr; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > gr || d < 4) continue;
      const f = 1 - (d - 4) / (gr - 4);
      const x = cx + dx, y = cy + dy;
      if (BAYER[x & 3][y & 3] / 16 < f * f * 0.9) c.fillRect(x, y, 1, 1);
    }
  }
  c.restore();
  for (let i = 0; i < rings; i++) drawRing(c, cx, cy + 1, i, t, false);
  const rot = Math.sin(t * 0.8) * 0.18;
  const pulse = (o.bright ?? 0) * 0.8;
  for (let dy = -10; dy <= 10; dy++) {
    for (let dx = -10; dx <= 10; dx++) {
      const d = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      const m = Math.pow(Math.max(0, Math.cos(2 * (ang - rot))), 2);
      const main = Math.pow(Math.max(0, Math.cos(4 * (ang - rot))), 10) * (5.2 + pulse) * (0.55 + 0.45 * m);
      const diag = Math.pow(Math.max(0, Math.cos(4 * (ang - rot - 0.785))), 14) * 2.4;
      const fl = 3.2 + Math.max(main, diag) + Math.sin(t * 9 + ang * 2) * 0.2;
      if (d > fl) continue;
      let cc: string;
      if (d < 1.5) cc = col.c0;
      else if (d < 2.5) cc = col.c1;
      else if (d <= 3.3) cc = col.c2;
      else {
        const isDiag = diag > main;
        cc = d > fl - 1.1 ? (isDiag ? col.edge : col.c2) : col.c1;
        if (sec && isDiag) cc = d > fl - 1.1 ? sec[2] : sec[3];
      }
      px(c, cx + dx, cy + dy, cc);
    }
  }
  for (let i = 0; i < rings; i++) drawRing(c, cx, cy + 1, i, t, true);
}

export function spiritShadow(c: Ctx, cx: number, cy: number, col: string): void {
  c.save();
  c.globalAlpha = 0.55;
  c.fillStyle = "#04030a";
  c.fillRect(cx - 4, cy, 9, 1);
  c.fillRect(cx - 3, cy + 1, 7, 1);
  c.restore();
  c.save();
  c.globalCompositeOperation = "lighter";
  c.globalAlpha = 0.25;
  c.fillStyle = col;
  c.fillRect(cx - 2, cy, 5, 1);
  c.restore();
}

/* ---------- void shard enemy ---------- */
const SHARD = [
  ".....o.....",
  "....olo....",
  "...olmmo...",
  "..olmvvmo..",
  ".olmvvvvdo.",
  "olmmvvevmdo",
  ".odmvvvvdo.",
  "..odmvvdo..",
  "...odmdo...",
  "....odo....",
  ".....o.....",
];

export function drawShard(c: Ctx, x: number, y: number, t: number, seed: number, flash = false): void {
  x = Math.round(x);
  y = Math.round(y);
  const glitchRow = Math.floor(t * 3 + seed) % 7 === 0 ? Math.floor(t * 11 + seed) % 11 : -1;
  for (let r = 0; r < SHARD.length; r++) {
    const row = SHARD[r];
    const sh = r === glitchRow ? 1 : 0;
    for (let k = 0; k < row.length; k++) {
      const ch = row[k];
      if (ch === ".") continue;
      let col = VOID[ch];
      if (ch === "e" && (t * 2 + seed) % 2.8 < 0.15) col = VOID.v;
      if (flash) col = "#ffffff";
      c.fillStyle = col;
      c.fillRect(x + k + sh, y + r, 1, 1);
    }
  }
}
