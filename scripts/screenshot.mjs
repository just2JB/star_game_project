// Starts the dev server, opens the game in headless Chromium, drags the
// spirit one tile and saves screenshots to ./screenshots. Used by AI and
// humans to check the game without opening a browser by hand.
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "vite";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const PORT = 5199;
const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: "error" });
await server.listen();

mkdirSync("screenshots", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
try {
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/01-board.png" });

  // game pixels -> page pixels (canvas is scaled to fit 960x540, i.e. 3x)
  const box = await page.locator("canvas").boundingBox();
  const k = box.width / 320;
  const at = (x, y) => ({ x: box.x + x * k, y: box.y + y * k });
  // same layout as src/render/layout.ts (squashed flat-top, radius 12)
  const hexPos = (q, r) => at(68 + 18 * q, 24 + 12 * 1.732 * 0.72 * (r + 0.5 * (q & 1)));

  const from = hexPos(2, 3), to = hexPos(3, 3);
  await page.mouse.move(hexPos(5, 1).x, hexPos(5, 1).y);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, to.y, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.screenshot({ path: "screenshots/02-dragging.png" });
  await page.mouse.up();
  await page.waitForTimeout(500);
  await page.screenshot({ path: "screenshots/03-moved.png" });

  // end the turn: enemies pass one by one, then it's the spirit's turn again
  await page.keyboard.press("Space");
  await page.waitForTimeout(1600);
  await page.screenshot({ path: "screenshots/04-next-turn.png" });
} finally {
  await browser.close();
  await server.close();
}
if (errors.length) {
  console.error("page errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("screenshots saved to ./screenshots");
