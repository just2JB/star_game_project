// Builds one self-contained HTML page of the current prototype so it can be
// shared as a link (Claude Artifact). Phaser comes from jsDelivr; the game code
// is bundled and inlined. Output: dist-artifact/star-spirit.html
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const phaserVersion = require("phaser/package.json").version;

const out = await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  alias: { phaser: "./scripts/phaser-global.js" },
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<title>별의 정령 프로토타입</title>
<style>
  :root { --bg: #05040b; color-scheme: dark; }
  html, body { height: 100%; }
  body { background: var(--bg); overflow: hidden; }
  #game { width: 100%; height: 100%; }
  #game canvas { image-rendering: pixelated; touch-action: none; }
</style>
<div id="game"></div>
<script src="https://cdn.jsdelivr.net/npm/phaser@${phaserVersion}/dist/phaser.min.js"></script>
<script>${js}</script>
`;
mkdirSync("dist-artifact", { recursive: true });
writeFileSync("dist-artifact/star-spirit.html", html);
console.log(`dist-artifact/star-spirit.html (${(html.length / 1024).toFixed(1)} KB, phaser ${phaserVersion} from jsDelivr)`);
