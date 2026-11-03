// Where each hex sits on the 320x180 screen. Same squashed layout as the
// wiki mock: flat-top, odd-q, radius 12, height squashed by SQ.
import type { Board, Hex } from "../core/hex";
import { SQ, W } from "./pixelArt";

export const R = 12;
export const BOARD: Board = { cols: 13, rows: 6 };
const VY = R * 1.732 * SQ;
const BW = (BOARD.cols - 1) * 1.5 * R + 2 * R;
const X0 = Math.round(W / 2 - BW / 2 + R) + 16;
const Y0 = 32 - 8;

/** Screen centre of a hex. */
export function hexCenter(h: Hex): [number, number] {
  return [X0 + h.q * 1.5 * R, Y0 + (h.r + (h.q % 2 ? 0.5 : 0)) * VY];
}

/** Hex under a screen point, or null when the point is off the board. */
export function hexAtPoint(x: number, y: number): Hex | null {
  let best: Hex | null = null;
  let bestD = Infinity;
  for (let q = 0; q < BOARD.cols; q++) {
    for (let r = 0; r < BOARD.rows; r++) {
      const [hx, hy] = hexCenter({ q, r });
      const d = Math.hypot(x - hx, (y - hy) / SQ);
      if (d < bestD) {
        bestD = d;
        best = { q, r };
      }
    }
  }
  return bestD <= R ? best : null;
}
