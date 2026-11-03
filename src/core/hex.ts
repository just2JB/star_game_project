// Hex grid rules. Flat-top hexes in "odd-q" offset coordinates:
// odd columns are pushed down half a tile. Pure TypeScript, no Phaser.

export interface Hex {
  q: number; // column
  r: number; // row
}

export const hex = (q: number, r: number): Hex => ({ q, r });
export const sameHex = (a: Hex, b: Hex): boolean => a.q === b.q && a.r === b.r;
export const hexKey = (h: Hex): string => `${h.q},${h.r}`;

function toCube(h: Hex): [number, number, number] {
  const x = h.q;
  const z = h.r - (h.q - (h.q & 1)) / 2;
  return [x, -x - z, z];
}

export function hexDistance(a: Hex, b: Hex): number {
  const [ax, ay, az] = toCube(a);
  const [bx, by, bz] = toCube(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
}

const ODD_COL = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]];
const EVEN_COL = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];

export function neighbors(h: Hex): Hex[] {
  const offsets = h.q & 1 ? ODD_COL : EVEN_COL;
  return offsets.map(([dq, dr]) => hex(h.q + dq, h.r + dr));
}

export interface Board {
  cols: number;
  rows: number;
}

export const inBoard = (b: Board, h: Hex): boolean =>
  h.q >= 0 && h.q < b.cols && h.r >= 0 && h.r < b.rows;

/**
 * Shortest path from `from` to `to` (both included), stepping only on tiles
 * inside the board that are not blocked. Returns null when unreachable.
 */
export function findPath(
  board: Board,
  from: Hex,
  to: Hex,
  isBlocked: (h: Hex) => boolean = () => false,
): Hex[] | null {
  if (!inBoard(board, to) || isBlocked(to)) return null;
  const prev = new Map<string, Hex | null>([[hexKey(from), null]]);
  const queue: Hex[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (sameHex(cur, to)) {
      const path: Hex[] = [cur];
      let p = prev.get(hexKey(cur));
      while (p) {
        path.unshift(p);
        p = prev.get(hexKey(p));
      }
      return path;
    }
    for (const n of neighbors(cur)) {
      const k = hexKey(n);
      if (prev.has(k) || !inBoard(board, n) || isBlocked(n)) continue;
      prev.set(k, cur);
      queue.push(n);
    }
  }
  return null;
}

/** Pixel centre of a hex for a flat-top layout with outer radius `size`. */
export function hexToPixel(h: Hex, size: number): { x: number; y: number } {
  return {
    x: size * 1.5 * h.q,
    y: size * Math.sqrt(3) * (h.r + 0.5 * (h.q & 1)),
  };
}

/** Hex whose centre is nearest to the pixel, or null if outside the board. */
export function pixelToHex(board: Board, x: number, y: number, size: number): Hex | null {
  let best: Hex | null = null;
  let bestD = Infinity;
  for (let q = 0; q < board.cols; q++) {
    for (let r = 0; r < board.rows; r++) {
      const c = hexToPixel(hex(q, r), size);
      const d = Math.hypot(x - c.x, y - c.y);
      if (d < bestD) {
        bestD = d;
        best = hex(q, r);
      }
    }
  }
  return bestD <= size ? best : null;
}
