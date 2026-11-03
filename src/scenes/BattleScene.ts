import Phaser from "phaser";
import { type Board, type Hex, findPath, hex, hexDistance, hexToPixel, pixelToHex, sameHex } from "../core/hex";

const BOARD: Board = { cols: 13, rows: 6 };
const SIZE = 10; // hex outer radius in game pixels
const ORIGIN = { x: 70, y: 38 }; // where hex (0,0) is drawn
const MOVE_RANGE = 1; // move points per turn (1 point = 1 tile)

const COLORS = {
  tile: 0x100e26,
  tileEdge: 0x262249,
  moveOk: 0x4fc0ff,
  moveBad: 0xff3b5c,
  spirit: 0xffe9b8,
  spiritCore: 0xffffff,
  shard: 0x8f8aa8,
  shardEye: 0xff3b5c,
};

/** First prototype step: hex board and dragging the spirit one tile. */
export class BattleScene extends Phaser.Scene {
  private spiritHex: Hex = hex(2, 3);
  private enemies: Hex[] = [hex(8, 2), hex(9, 2), hex(7, 2), hex(11, 4), hex(10, 0)];
  private spirit!: Phaser.GameObjects.Container;
  private overlay!: Phaser.GameObjects.Graphics;
  private dragging = false;
  private moving = false;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super("battle");
  }

  create(): void {
    this.drawBoard();
    this.overlay = this.add.graphics();
    this.enemies.forEach((h) => this.drawShard(h));
    this.spirit = this.makeSpirit();
    this.placeSpirit();

    this.hint = this.add
      .text(4, 168, "정령을 끌어 옆 칸에 놓기", { fontFamily: "monospace", fontSize: "8px", color: "#8f88c9" })
      .setResolution(4);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.moving) return;
      const h = this.hexAt(p);
      if (h && sameHex(h, this.spiritHex)) this.dragging = true;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.dragging) this.drawDragPreview(this.hexAt(p));
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.overlay.clear();
      const target = this.hexAt(p);
      if (target && this.canMoveTo(target)) this.moveTo(target);
    });
  }

  private toScreen(h: Hex): { x: number; y: number } {
    const p = hexToPixel(h, SIZE);
    return { x: ORIGIN.x + p.x, y: ORIGIN.y + p.y };
  }

  private hexAt(p: Phaser.Input.Pointer): Hex | null {
    return pixelToHex(BOARD, p.worldX - ORIGIN.x, p.worldY - ORIGIN.y, SIZE);
  }

  private isBlocked = (h: Hex): boolean => this.enemies.some((e) => sameHex(e, h));

  private canMoveTo(h: Hex): boolean {
    const d = hexDistance(h, this.spiritHex);
    return d >= 1 && d <= MOVE_RANGE && !this.isBlocked(h);
  }

  private hexPoints(cx: number, cy: number, r: number): Phaser.Math.Vector2[] {
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push(new Phaser.Math.Vector2(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))));
    }
    return pts;
  }

  private drawBoard(): void {
    const g = this.add.graphics();
    for (let q = 0; q < BOARD.cols; q++) {
      for (let r = 0; r < BOARD.rows; r++) {
        const { x, y } = this.toScreen(hex(q, r));
        g.fillStyle(COLORS.tile, 1).fillPoints(this.hexPoints(x, y, SIZE - 1), true);
        g.lineStyle(1, COLORS.tileEdge, 1).strokePoints(this.hexPoints(x, y, SIZE - 1), true);
      }
    }
  }

  private drawDragPreview(target: Hex | null): void {
    const g = this.overlay.clear();
    for (let q = 0; q < BOARD.cols; q++) {
      for (let r = 0; r < BOARD.rows; r++) {
        const h = hex(q, r);
        if (!this.canMoveTo(h)) continue;
        const { x, y } = this.toScreen(h);
        g.fillStyle(COLORS.moveOk, 0.3).fillPoints(this.hexPoints(x, y, SIZE - 2), true);
      }
    }
    if (target && !sameHex(target, this.spiritHex)) {
      const { x, y } = this.toScreen(target);
      const ok = this.canMoveTo(target);
      g.lineStyle(1, ok ? COLORS.moveOk : COLORS.moveBad, 1).strokePoints(this.hexPoints(x, y, SIZE - 2), true);
    }
  }

  private makeSpirit(): Phaser.GameObjects.Container {
    // Placeholder art: a sharp four-point star with a bright core.
    const g = this.add.graphics();
    g.fillStyle(COLORS.spirit, 1);
    g.fillTriangle(0, -9, -2, 0, 2, 0).fillTriangle(0, 9, -2, 0, 2, 0);
    g.fillTriangle(-9, 0, 0, -2, 0, 2).fillTriangle(9, 0, 0, -2, 0, 2);
    g.fillStyle(COLORS.spiritCore, 1).fillRect(-1, -1, 3, 3);
    const c = this.add.container(0, 0, [g]);
    this.tweens.add({ targets: g, y: -1.5, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    return c;
  }

  private drawShard(h: Hex): void {
    const { x, y } = this.toScreen(h);
    const g = this.add.graphics({ x, y: y - 6 });
    g.fillStyle(COLORS.shard, 1).fillTriangle(0, -6, -5, 0, 5, 0).fillTriangle(0, 6, -5, 0, 5, 0);
    g.fillStyle(0x05040b, 1).fillRect(-2, -2, 4, 4);
    g.fillStyle(COLORS.shardEye, 1).fillRect(0, -1, 2, 2);
  }

  private placeSpirit(): void {
    const { x, y } = this.toScreen(this.spiritHex);
    this.spirit.setPosition(x, y - 6);
  }

  private moveTo(target: Hex): void {
    const path = findPath(BOARD, this.spiritHex, target, this.isBlocked);
    if (!path) return;
    this.moving = true;
    const steps = path.slice(1).map((h) => {
      const { x, y } = this.toScreen(h);
      return { x, y: y - 6, duration: 160, ease: "Quad.easeOut" };
    });
    this.tweens.chain({
      targets: this.spirit,
      tweens: steps,
      onComplete: () => {
        this.spiritHex = target;
        this.moving = false;
        this.hint.setText(`이동 완료 (${target.q}, ${target.r})`);
      },
    });
  }
}
