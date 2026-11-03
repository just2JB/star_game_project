import Phaser from "phaser";
import { BattleScene } from "./scenes/BattleScene";
import { createHud } from "./ui/hud";

// The game renders at 320x180 inside a 16:9 frame; the HUD is HTML on top.
const parent = document.getElementById("game")!;
const hud = createHud(parent);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  width: 320,
  height: 180,
  pixelArt: true,
  backgroundColor: "#05040b",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
});
game.scene.add("battle", BattleScene, true, { hud });
