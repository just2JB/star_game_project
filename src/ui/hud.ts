// HUD drawn as HTML on top of the game canvas, same look as the wiki mock.
// Text stays sharp at any window size because it is not part of the 320x180
// pixel canvas. The HUD only shows state and reports clicks; rules live in core.

const CSS = `
#frame{--ink:#ece9ff;--mute:#8f88c9;--f-display:"Do Hyeon","IBM Plex Sans KR",sans-serif;--f-mono:"IBM Plex Mono",ui-monospace,monospace;
  position:relative;aspect-ratio:16/9;width:min(100vw,calc(100vh*16/9));margin:auto;container-type:inline-size;background:#000;overflow:clip;
  font-family:"IBM Plex Sans KR",sans-serif;color:var(--ink);font-size:clamp(7px,1.5cqw,15px);line-height:1.35;user-select:none}
#frame #game{position:absolute;inset:0}
#frame canvas{image-rendering:pixelated;touch-action:none}
.g-hud-tl{position:absolute;left:1.5%;top:3%;display:grid;gap:.25em;font-family:var(--f-mono);font-size:.82em;text-shadow:0 1px 0 #05040b,0 0 3px #05040b;pointer-events:none}
.g-hud-tl .r{display:flex;align-items:center;gap:.35em}
.g-hud-tl .big{font-family:var(--f-display);font-size:1.7em;line-height:1}
.g-hud-tl .pip,.g-ico{width:.7em;height:.7em;display:inline-block;clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);flex:none}
.g-ico{width:.8em;height:.8em}
.g-lab{font-size:.78em;color:var(--mute);letter-spacing:.06em}
.g-top{position:absolute;top:2.5%;left:50%;transform:translateX(-50%);display:flex;gap:.6em;align-items:baseline;white-space:nowrap;text-shadow:0 1px 0 #05040b,0 0 4px #05040b;pointer-events:none}
.g-stage{font-family:var(--f-display);font-size:1.25em}
.g-escbtn{position:absolute;top:2.5%;right:1.5%;font:inherit;font-family:var(--f-mono);font-size:.72em;color:var(--mute);background:rgba(5,4,11,.35);border:1px solid #2b2752;padding:.2em .5em;cursor:pointer}
.g-acts{position:absolute;right:1.5%;bottom:14.5%;display:flex;flex-direction:column;align-items:flex-end;gap:.35em}
.g-icons{display:flex;gap:.35em;align-items:center}
.g-sep{width:1px;height:1.8em;background:#3a3366;margin:0 .15em}
.g-icon{position:relative;width:2.6em;height:2.6em;padding:.45em;background:rgba(10,9,24,.45);border:1px solid #3a3366;color:#c9c4f0;cursor:pointer;display:flex;align-items:center;justify-content:center}
.g-icon svg{width:100%;height:100%;fill:currentColor;display:block}
.g-icon.act{color:#ffb070;border-color:#7a4a2a}
.g-icon.act[data-k="compose"]{color:#c69bff;border-color:#5a3a8a}
.g-icon:hover{background:rgba(30,26,60,.8)}
.g-icon .tip{display:none;position:absolute;right:0;bottom:115%;white-space:nowrap;background:#05040b;border:1px solid #8f88c9;color:var(--ink);padding:.25em .5em;font-size:.78em}
.g-icon:hover .tip,.g-icon:focus-visible .tip{display:block}
.g-pts{display:flex;gap:.8em;font-family:var(--f-mono);font-size:.78em;color:var(--mute);text-shadow:0 1px 0 #05040b;align-items:center}
.g-pts span{display:flex;align-items:center;gap:.2em}
.g-tl{position:absolute;z-index:3;left:1.5%;right:1.5%;bottom:1.5%;height:11%;display:grid;grid-template-columns:auto minmax(0,1fr);gap:.9em;align-items:stretch;background:linear-gradient(to top,rgba(5,4,11,.55),rgba(5,4,11,0))}
.g-tl-ctl{display:flex;align-items:center;gap:.4em}
.g-tl-ctl button{font:inherit;font-family:var(--f-mono);font-size:.78em;color:var(--mute);background:rgba(5,4,11,.35);border:1px solid #2b2752;padding:.2em .45em;cursor:pointer;white-space:nowrap}
.g-tl-ctl button.g-endturn{color:#ffd2b0;border-color:#ff7a2e;background:rgba(42,20,16,.75);padding:.3em .7em;font-size:.85em}
.g-tl-ctl button[disabled]{opacity:.35;cursor:default}
.g-spd{display:flex;gap:.2em}
.g-spd button[aria-pressed="true"]{color:var(--ink);border-color:#8f88c9}
.g-axis{position:relative;border-left:2px solid #ff7a2e}
.g-axis::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(143,136,201,.45)}
.g-tick{position:absolute;top:44%;height:12%;width:1px;background:#2b2752}
.g-tick.big{top:36%;height:28%;background:#3a3366}
.g-mk{position:absolute;transform:translateX(-50%);display:flex;justify-content:center;cursor:help;z-index:1;transition:left .3s}
.g-mk .face{font-family:var(--f-mono);font-size:.72em;line-height:1;padding:.2em .35em;border:1px solid;white-space:nowrap}
.g-mk.enemy{top:0}
.g-mk.enemy .face{color:#ffd6dc;background:rgba(58,13,24,.8);clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);padding:.45em .5em;border:0;box-shadow:inset 0 0 0 1px #ff3b5c}
.g-mk.me{top:56%}
.g-mk.me .face{color:#dff4ff;background:rgba(13,42,68,.8);border-color:#4fc0ff}
.g-mk .tip{display:none;position:absolute;bottom:115%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#05040b;border:1px solid #8f88c9;color:var(--ink);padding:.3em .55em;font-size:.82em;z-index:5}
.g-mk:hover .tip{display:block}
.g-say{position:absolute;left:50%;bottom:15%;transform:translateX(-50%);font-size:.8em;color:var(--mute);text-shadow:0 1px 0 #05040b,0 0 3px #05040b;white-space:nowrap;pointer-events:none}
.g-escmenu{position:absolute;inset:0;z-index:20;background:rgba(5,4,11,.72);display:flex;align-items:center;justify-content:center}
.g-escmenu[hidden]{display:none}
.g-esc-box{background:#0d0b1f;border:1px solid #3a3366;padding:1em 1.2em;display:grid;gap:.8em;min-width:40%}
.g-esc-box .t{font-family:var(--f-display);font-size:1.4em}
.g-esc-box p{margin:0;font-size:.88em;color:var(--mute)}
.g-esc-box button{justify-self:start;font:inherit;font-size:.9em;color:var(--ink);border:1px solid #ff7a2e;background:#2a1410;padding:.35em .9em;cursor:pointer}
`;

const ICONS = `
<button type="button" class="g-icon act" data-k="compose" aria-label="성운 조성"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="5" y="3" width="6" height="2"/><rect x="3" y="5" width="10" height="2"/><rect x="2" y="7" width="12" height="3"/><rect x="4" y="10" width="8" height="2"/><rect x="7" y="7" width="2" height="2" fill="#fff"/><rect x="1" y="13" width="2" height="1"/><rect x="13" y="2" width="2" height="1"/></svg><span class="tip">성운 조성 · 다음 단계에서 열려요</span></button>
<button type="button" class="g-icon act" data-k="emit" aria-label="성운 사출"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="1" y="7" width="9" height="2"/><rect x="9" y="5" width="2" height="6"/><rect x="11" y="6" width="2" height="4"/><rect x="13" y="7" width="2" height="2"/><rect x="2" y="4" width="3" height="1"/><rect x="2" y="11" width="3" height="1"/></svg><span class="tip">성운 사출 · 다음 단계에서 열려요</span></button>
<span class="g-sep"></span>
<button type="button" class="g-icon" data-k="items" aria-label="아이템"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="5" width="12" height="9"/><rect x="5" y="2" width="6" height="3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="7" y="7" width="2" height="3" fill="#05040b"/></svg><span class="tip">아이템</span></button>
<button type="button" class="g-icon" data-k="stats" aria-label="능력치"><svg viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="9" width="3" height="5"/><rect x="6.5" y="5" width="3" height="9"/><rect x="11" y="2" width="3" height="12"/></svg><span class="tip">능력치</span></button>`;

export interface HudState {
  myTurn: boolean;
  turn: number;
  hp: number;
  hpMax: number;
  ap: number;
  apMax: number;
  mp: number;
  mpMax: number;
  reserved: boolean;
}

export interface TimelineMark {
  key: string; // stable id for the marker element
  who: "me" | "enemy";
  label: string; // text on the marker
  at: number; // 0..1 along the axis
  tip: string;
}

export interface Hud {
  setState(s: HudState): void;
  setTimeline(marks: TimelineMark[]): void;
  say(text: string): void;
  onEndTurn(cb: () => void): void;
  menuOpen(): boolean;
}

/** Wraps the Phaser parent element in a 16:9 frame and builds the HUD around it. */
export function createHud(gameParent: HTMLElement, ticks = 24): Hud {
  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);

  const frame = document.createElement("div");
  frame.id = "frame";
  gameParent.replaceWith(frame);
  frame.append(gameParent);

  const el = (tag: string, cls: string, html = "") => {
    const e = document.createElement(tag);
    e.className = cls;
    e.innerHTML = html;
    frame.append(e);
    return e;
  };
  const hudTl = el("div", "g-hud-tl");
  el("div", "g-top", '<span class="g-lab">탐사 중</span><span class="g-stage">얼어붙은 성계대</span><span class="g-lab">좌표 12, −4</span>');
  const escBtn = el("button", "g-escbtn", "ESC 메뉴") as HTMLButtonElement;
  const acts = el("div", "g-acts", `<div class="g-pts"></div><div class="g-icons">${ICONS}</div>`);
  const pts = acts.querySelector(".g-pts")!;
  const sayEl = el("div", "g-say");
  const tl = el("div", "g-tl", '<div class="g-tl-ctl"><button type="button" class="g-endturn" title="턴 종료 (Space)">턴 종료</button><span class="g-spd"></span></div><div class="g-axis" aria-label="턴 순서표"></div>');
  const endBtn = tl.querySelector(".g-endturn") as HTMLButtonElement;
  const axis = tl.querySelector(".g-axis")!;
  const spd = tl.querySelector(".g-spd")!;
  const menu = el("div", "g-escmenu", '<div class="g-esc-box"><div class="t">메뉴</div><p>설정, 저장, 나가기가 여기에 들어올 자리예요.</p><button type="button">계속하기</button></div>');
  menu.hidden = true;

  for (let i = 0; i <= ticks; i++) {
    const k = document.createElement("span");
    k.className = "g-tick" + (i % 4 === 0 ? " big" : "");
    k.style.left = (i / ticks) * 100 + "%";
    axis.append(k);
  }
  [1, 2, 4].forEach((v) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = v + "x";
    b.title = "적 차례 연출 배속";
    b.setAttribute("aria-pressed", String(v === 1));
    b.addEventListener("click", () => spd.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))));
    spd.append(b);
  });

  const toggleMenu = () => (menu.hidden = !menu.hidden);
  escBtn.addEventListener("click", toggleMenu);
  menu.querySelector("button")!.addEventListener("click", toggleMenu);
  window.addEventListener("keydown", (e) => e.key === "Escape" && toggleMenu());

  let say = (t: string) => (sayEl.textContent = t);
  acts.querySelectorAll<HTMLButtonElement>(".g-icon").forEach((b) =>
    b.addEventListener("click", () => say(b.querySelector(".tip")!.textContent ?? "")),
  );

  const endCbs: (() => void)[] = [];
  endBtn.addEventListener("click", () => endCbs.forEach((f) => f()));

  const marks = new Map<string, HTMLElement>();
  const pip = (on: boolean, col: string, off: string) => `<span class="pip" style="background:${on ? col : off}"></span>`;
  const ico = (col: string) => `<i class="g-ico" style="background:${col}"></i>`;

  return {
    setState(s) {
      let h = `<div class="r"><span class="big">${s.myTurn ? "내 차례" : "적 차례"}</span></div><div class="r">`;
      for (let i = 0; i < s.hpMax; i++) h += pip(i < s.hp, "#ff6b7f", "#3a2040");
      h += `</div><div class="r" style="color:var(--mute)">${s.turn}턴 · Lv 3 · 단서 2/5</div>`;
      hudTl.innerHTML = h;
      let q = "<span>행동 ";
      for (let i = 0; i < s.apMax; i++) q += ico(i < s.ap ? "#fff1c4" : "#3a3366");
      q += "</span><span>이동 ";
      for (let i = 0; i < s.mpMax; i++) q += ico(i < s.mp ? "#4fc0ff" : "#1a3550");
      q += (s.reserved ? " 예약" : "") + "</span>";
      pts.innerHTML = q;
      endBtn.disabled = !s.myTurn;
    },
    setTimeline(list) {
      const seen = new Set<string>();
      for (const m of list) {
        seen.add(m.key);
        let e = marks.get(m.key);
        if (!e) {
          e = document.createElement("span");
          e.className = "g-mk " + m.who;
          e.innerHTML = '<span class="face"></span><span class="tip"></span>';
          axis.append(e);
          marks.set(m.key, e);
        }
        (e.firstChild as HTMLElement).textContent = m.label;
        (e.lastChild as HTMLElement).textContent = m.tip;
        e.style.left = m.at * 100 + "%";
      }
      marks.forEach((e, k) => {
        if (!seen.has(k)) {
          e.remove();
          marks.delete(k);
        }
      });
    },
    say: (t) => say(t),
    onEndTurn: (cb) => endCbs.push(cb),
    menuOpen: () => !menu.hidden,
  };
}
