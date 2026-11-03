// Used only by build-artifact: the page loads Phaser from a CDN as a global,
// so imports of "phaser" resolve to window.Phaser instead of being bundled.
export default window.Phaser;
