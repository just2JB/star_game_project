import Phaser from "phaser";
import { findPath, hexDistance, hexKey, sameHex, type Hex } from "../core/hex";
import { TurnOrder } from "../core/turnOrder";
import { BOARD, R, hexAtPoint, hexCenter } from "../render/layout";
import {
  H, RAMP, RED, W, ditherHex, drawShard, drawSpirit, drawStars, ease, fillHex,
  makeBackground, outlineHex, spans, spiritShadow, type ElementKey,
} from "../render/pixelArt";
import type { Hud } from "../ui/hud";

const MOVE_RANGE = 1;
const MP_MAX = 1;
const AP_MAX = 5;
const HP_MAX = 5;
const ME_INTERVAL = 4;
const TIMELINE_WINDOW = 24;
const STEP_MS = 200;

interface Enemy {
  id: string;
  letter: string;
  name: string;
  h: Hex;
  seed: number;
  hp: number;
}

interface Walk {
  from: Hex;
  to: Hex;
  start: number;
}

/**
 * Battle screen. Every frame is drawn by hand into one 320x180 canvas with the
 * same pixel-art routines as the wiki mock; Phaser scales it and handles input.
 */
export class BattleScene extends Phaser.Scene {
  private hud!: Hud;
  private screen!: Phaser.Textures.CanvasTexture;
  private bg!: HTMLCanvasElement;
  private element: ElementKey = "heat";

  private spirit: Hex = { q: 2, r: 3 };
  private enemies: Enemy[] = [
    { id: "a", letter: "A", name: "파편 A", h: { q: 8, r: 2 }, seed: 1, hp: 7 },
    { id: "b", letter: "B", name: "파편 B", h: { q: 9, r: 2 }, seed: 3, hp: 6 },
    { id: "c", letter: "C", name: "파편 C", h: { q: 7, r: 2 }, seed: 5, hp: 8 },
    { id: "e", letter: "정", name: "정예 파편", h: { q: 11, r: 4 }, seed: 2, hp: 9 },
    { id: "d", letter: "D", name: "파편 D", h: { q: 10, r: 0 }, seed: 4, hp: 5 },
  ];
  private order = new TurnOrder([
    { id: "me", interval: ME_INTERVAL, next: 0 },
    { id: "a", interval: 5, next: 3 },
    { id: "b", interval: 6, next: 4.5 },
    { id: "c", interval: 7, next: 1.5 },
    { id: "e", interval: 9, next: 6 },
    { id: "d", interval: 8, next: 7.5 },
  ]);

  private turn = 1;
  private myTurn = true;
  private hp = HP_MAX;
  private ap = 3;
  private mp = MP_MAX;
  private dest: Hex | null = null;

  private dragging = false;
  private hover: Hex | null = null;
  private walk: Walk | null = null;
  private flash = new Map<string, number>();

  constructor() {
    super("battle");
  }

  init(data: { hud: Hud }) {
    this.hud = data.hud;
  }

  create() {
    this.bg = makeBackground();
    this.screen = this.textures.createCanvas("screen", W, H)!;
    this.add.image(0, 0, "screen").setOrigin(0, 0);

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.canAct()) return;
      const h = hexAtPoint(p.worldX, p.worldY);
      const [sx, sy] = hexCenter(this.spirit);
      const onSprite = Math.hypot(p.worldX - sx, p.worldY - (sy - 8)) <= 9;
      if (onSprite || (h && sameHex(h, this.spirit))) this.dragging = true;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.hover = hexAtPoint(p.worldX, p.worldY);
    });
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      const h = hexAtPoint(p.worldX, p.worldY);
      if (h) this.dropSpirit(h);
    });
    this.input.keyboard?.on("keydown-SPACE", () => this.endTurn());
    this.hud.onEndTurn(() => this.endTurn());

    this.refreshHud();
    this.hud.say("정령을 끌어 옆 칸에 놓아 이동해요. 범위 밖에 놓으면 목적지로 예약돼요.");
  }

  /* ---------- rules glue ---------- */

  private canAct() {
    return this.myTurn && !this.walk && !this.hud.menuOpen();
  }

  private isBlocked = (h: Hex) => this.enemies.some((e) => sameHex(e.h, h));

  private canStepTo(h: Hex) {
    const d = hexDistance(h, this.spirit);
    return this.mp > 0 && d >= 1 && d <= MOVE_RANGE && !this.isBlocked(h);
  }

  private dropSpirit(h: Hex) {
    if (sameHex(h, this.spirit)) return;
    if (this.canStepTo(h)) {
      this.dest = null;
      this.stepTo(h);
      return;
    }
    const path = findPath(BOARD, this.spirit, h, this.isBlocked);
    if (!path) {
      this.hud.say("그 칸으로는 갈 수 없어요.");
      return;
    }
    this.dest = h;
    this.hud.say("목적지를 예약했어요. 이동 포인트가 돌 때마다 가장 짧은 길로 한 칸씩 가요.");
    this.stepTowardDest();
  }

  private stepTowardDest() {
    if (!this.dest || this.mp <= 0) return this.refreshHud();
    const path = findPath(BOARD, this.spirit, this.dest, this.isBlocked);
    if (!path || path.length < 2) {
      this.dest = null;
      return this.refreshHud();
    }
    this.stepTo(path[1]);
  }

  private stepTo(h: Hex) {
    this.mp--;
    this.walk = { from: this.spirit, to: h, start: this.time.now };
    this.time.delayedCall(STEP_MS, () => {
      this.spirit = h;
      this.walk = null;
      if (this.dest && sameHex(this.dest, h)) {
        this.dest = null;
        this.hud.say("목적지에 도착했어요.");
      }
      this.refreshHud();
    });
    this.refreshHud();
  }

  private endTurn() {
    if (!this.canAct()) return;
    this.myTurn = false;
    this.order.endTurn();
    this.refreshHud();
    this.runEnemyTurns();
  }

  /** Enemies take their turns in order until it is the spirit's turn again. */
  private runEnemyTurns() {
    const cur = this.order.current();
    if (cur.id === "me") {
      this.turn++;
      this.myTurn = true;
      this.mp = MP_MAX;
      this.ap = Math.min(AP_MAX, this.ap + 1);
      this.hud.say(`내 차례 (${this.turn}턴). 행동 포인트 +1.`);
      this.refreshHud();
      if (this.dest) this.stepTowardDest();
      return;
    }
    // Enemy AI comes in a later step; for now they just flash and pass.
    this.flash.set(cur.id, this.time.now);
    this.time.delayedCall(280, () => {
      this.order.endTurn();
      this.refreshHud();
      this.runEnemyTurns();
    });
  }

  private refreshHud() {
    this.hud.setState({
      myTurn: this.myTurn, turn: this.turn, hp: this.hp, hpMax: HP_MAX,
      ap: this.ap, apMax: AP_MAX, mp: this.mp, mpMax: MP_MAX, reserved: !!this.dest,
    });
    const now = this.order.now();
    const seen = new Map<string, number>();
    this.hud.setTimeline(
      this.order.preview(TIMELINE_WINDOW).map((s) => {
        const n = (seen.get(s.id) ?? 0) + 1;
        seen.set(s.id, n);
        const en = this.enemies.find((e) => e.id === s.id);
        const when = s.time === now ? "지금" : "+" + (s.time - now).toFixed(1);
        return {
          key: `${s.id}:${s.time}`,
          who: en ? "enemy" : "me",
          label: en ? en.letter : "나",
          at: (s.time - now) / TIMELINE_WINDOW,
          tip: en ? `${when} · ${en.name}` : `${when} · 정령 차례 (${ME_INTERVAL}마다)`,
        } as const;
      }),
    );
  }

  /* ---------- drawing ---------- */

  update(time: number) {
    const T = time / 1000;
    const c = this.screen.getContext();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    c.drawImage(this.bg, 0, 0);
    drawStars(c, T);
    this.drawBoard(c, T);
    this.drawEntities(c, T);
    this.screen.refresh();
  }

  private drawBoard(c: CanvasRenderingContext2D, T: number) {
    for (let q = 0; q < BOARD.cols; q++) {
      for (let r = 0; r < BOARD.rows; r++) {
        const [x, y] = hexCenter({ q, r });
        fillHex(c, x, y, R - 1, "#262249");
        fillHex(c, x, y, R - 2, "#100e26");
        const [dy0, w0] = spans(R - 2)[0];
        c.fillStyle = "#1b1840";
        c.fillRect(Math.round(x) - w0, Math.round(y) + dy0, 2 * w0, 1);
      }
    }
    const pulse = (Math.sin(T * 5) + 1) / 2;
    if (this.dragging && this.mp > 0) {
      for (let q = 0; q < BOARD.cols; q++) {
        for (let r = 0; r < BOARD.rows; r++) {
          const h = { q, r };
          if (!this.canStepTo(h)) continue;
          const [x, y] = hexCenter(h);
          c.save();
          c.globalAlpha = 0.28 + pulse * 0.18;
          fillHex(c, x, y, R - 2, "#4fc0ff");
          c.restore();
          ditherHex(c, x, y, R - 3, "#aee8ff", 2, 0);
        }
      }
    }
    if (this.dest) {
      const [x, y] = hexCenter(this.dest);
      outlineHex(c, x, y, R - 1, Math.floor(T * 3) % 2 ? "#4fc0ff" : "#aee8ff");
      const path = findPath(BOARD, this.spirit, this.dest, this.isBlocked);
      if (path) {
        for (let i = 1; i < path.length; i++) {
          const [a1, b1] = hexCenter(path[i - 1]);
          const [a2, b2] = hexCenter(path[i]);
          for (let k = 2; k < 10; k += 3) {
            const u = k / 11;
            c.fillStyle = "#4fc0ff";
            c.fillRect(Math.round(a1 + (a2 - a1) * u), Math.round(b1 + (b2 - b1) * u), 1, 1);
          }
        }
      }
    }
    if (this.dragging && this.hover && !sameHex(this.hover, this.spirit)) {
      const [x, y] = hexCenter(this.hover);
      const ok = this.canStepTo(this.hover) || !!findPath(BOARD, this.spirit, this.hover, this.isBlocked);
      c.save();
      c.globalAlpha = 0.55;
      fillHex(c, x, y, R - 2, ok ? "#aee8ff" : RED);
      c.restore();
    } else if (this.hover) {
      const [x, y] = hexCenter(this.hover);
      outlineHex(c, x, y, R - 1, this.isBlocked(this.hover) ? RED : "#ffffff");
    }
  }

  private drawEntities(c: CanvasRenderingContext2D, T: number) {
    const ER = RAMP[this.element];
    let [spx, spy] = hexCenter(this.spirit);
    if (this.walk) {
      const f = Math.min(1, (this.time.now - this.walk.start) / STEP_MS);
      const [x0, y0] = hexCenter(this.walk.from);
      const [x1, y1] = hexCenter(this.walk.to);
      const e = ease(f);
      spx = x0 + (x1 - x0) * e;
      spy = y0 + (y1 - y0) * e - Math.round(Math.sin(f * Math.PI) * 3);
    }
    const sCx = Math.round(spx);
    const sCy = Math.round(spy) - 8;

    const ents: { y: number; draw: () => void }[] = [];
    ents.push({
      y: spy,
      draw: () => {
        spiritShadow(c, sCx, Math.round(spy) + 2, ER[2]);
        drawSpirit(c, sCx, sCy, T, this.element, { rings: 1, bright: this.dragging ? 1 : 0 });
      },
    });
    for (const e of this.enemies) {
      const [x, y] = hexCenter(e.h);
      ents.push({
        y,
        draw: () => {
          const fl = this.flash.get(e.id);
          const flash = fl !== undefined && this.time.now - fl < 120;
          c.save();
          c.globalAlpha = 0.5;
          c.fillStyle = "#04030a";
          c.fillRect(Math.round(x) - 3, Math.round(y) + 2, 7, 1);
          c.restore();
          drawShard(c, x - 5, y - 10 + Math.round(Math.sin(T * 1.7 + e.seed) * 0.8), T, e.seed, flash);
          const rx = Math.round(x), ry = Math.round(y);
          c.fillStyle = "#04030a";
          c.fillRect(rx - 5, ry + 4, 11, 3);
          c.fillStyle = "#3a3366";
          c.fillRect(rx - 4, ry + 5, 9, 1);
          c.fillStyle = "#ff6b7f";
          c.fillRect(rx - 4, ry + 5, Math.round((9 * e.hp) / 10), 1);
        },
      });
    }
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
  }

  /** For tests and the screenshot script: stable hex ids under the cursor. */
  debugState() {
    return { spirit: hexKey(this.spirit), mp: this.mp, myTurn: this.myTurn, dest: this.dest && hexKey(this.dest) };
  }
}
