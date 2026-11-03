import { describe, expect, it } from "vitest";
import { findPath, hex, hexDistance, hexToPixel, neighbors, pixelToHex, sameHex } from "../src/core/hex";

const board = { cols: 13, rows: 6 };

describe("hex grid", () => {
  it("every neighbor is at distance 1", () => {
    for (const h of [hex(2, 3), hex(3, 3), hex(0, 0)]) {
      for (const n of neighbors(h)) expect(hexDistance(h, n)).toBe(1);
    }
  });

  it("measures distance across odd and even columns", () => {
    expect(hexDistance(hex(2, 3), hex(6, 4))).toBe(4);
    expect(hexDistance(hex(0, 0), hex(0, 5))).toBe(5);
    expect(hexDistance(hex(1, 1), hex(1, 1))).toBe(0);
  });

  it("finds the shortest path around a blocked tile", () => {
    const blocked = hex(3, 3);
    const path = findPath(board, hex(2, 3), hex(4, 3), (h) => sameHex(h, blocked))!;
    expect(path[0]).toEqual(hex(2, 3));
    expect(path[path.length - 1]).toEqual(hex(4, 3));
    expect(path.length - 1).toBe(hexDistance(hex(2, 3), hex(4, 3)));
    expect(path.some((h) => sameHex(h, blocked))).toBe(false);
  });

  it("returns null when the goal is blocked or off the board", () => {
    expect(findPath(board, hex(0, 0), hex(20, 0))).toBeNull();
    expect(findPath(board, hex(0, 0), hex(1, 1), (h) => sameHex(h, hex(1, 1)))).toBeNull();
  });

  it("converts pixels back to the same hex", () => {
    const h = hex(5, 2);
    const p = hexToPixel(h, 10);
    expect(pixelToHex(board, p.x + 2, p.y - 2, 10)).toEqual(h);
  });
});
