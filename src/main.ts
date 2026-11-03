import Phaser from "phaser";
import { BattleScene } from "./scenes/BattleScene";

// The game renders at 320x180 and is scaled up to fit the window.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 320,
  height: 180,
  pixelArt: true,
  backgroundColor: "#0a0918",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BattleScene],
});
