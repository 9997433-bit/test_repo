import { BATTLE_STATE, createBattle } from "../../core/battle.js";
import { LAUNCH_X, LAUNCH_Y, MAX_AIM_DEG, MAX_SPEED, MIN_SPEED } from "../../core/sim.js";
import { hasUlt } from "../../core/skills.js";
import {
  applyDraft,
  createRaidLevel,
  createRogueLevel,
  createTowerLevel,
  rollDraft,
  stageByIndex,
} from "../../modes/index.js";
import { button, clear, el, mount } from "../dom.js";
import { createRenderer } from "../render.js";
import { heroCanvas } from "../widgets.js";

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** fx.css 的一次性动画类：摘掉 → 强制回流 → 挂回去才会重播（ART_DIRECTION §5）。 */
function replayClass(node, cls, siblings = []) {
  for (const other of siblings) if (other !== cls) node.classList.remove(other);
  node.classList.remove(cls);
  void node.offsetWidth;
  node.classList.add(cls);
}

const HITSTOP_CLASSES = ["fx-hitstop", "fx-hitstop-lg"];
const SHAKE_CLASSES = ["fx-shake-sm", "fx-shake-md", "fx-shake-lg"];
/** 与 fx.css 的 animation-duration 对齐，用来判断「上一次还没播完」。 */
const SHAKE_SECONDS = [0.32, 0.4, 0.52];

function buildLevel(app, params) {
  switch (params.mode) {
    case "tower":
      return createTowerLevel(params.floor ?? app.save.towerFloor ?? 1);
    case "rogue":
      return createRogueLevel();
    case "raid":
      return createRaidLevel();
    case "adventure":
    default:
      return stageByIndex(params.stageIndex ?? app.save.adventureStage ?? 1);
  }
}

export const battleScreen = {
  id: "battle",
  mount(app, root, params = {}) {
    const mode = params.mode ?? "adventure";
    const level = buildLevel(app, params);
    const loadout = app.loadout(mode === "rogue" ? { flatLevel: 5 } : {});
    if (!loadout.heroes.length) {
      mount(root, el("p", { class: "hint", text: "队伍为空，请先编队。" }), button("去编队", () => app.navigate("team")));
      return {};
    }

    app.audio.setMood(level.boss || mode === "raid" ? "boss" : "battle");
    app.audio.startMusic(level.boss || mode === "raid" ? "boss" : "battle");

    const canvas = el("canvas", { class: "battle-canvas", width: 480, height: 800 });
    // 震屏与命中停顿分挂两层：同一元素上两条 animation 会互相顶掉，
    // 爆蛋时刻同时给 hitstop + shake，挂一起就只剩一个能播。
    const shakeLayer = el("div", { class: "battle-shake" }, [canvas]);
    const comboFlash = el("div", { class: "fx-combo-flash" });
    shakeLayer.addEventListener("animationend", () => shakeLayer.classList.remove(...SHAKE_CLASSES));
    canvas.addEventListener("animationend", () => canvas.classList.remove(...HITSTOP_CLASSES));
    comboFlash.addEventListener("animationend", () => comboFlash.classList.remove("is-on"));
    const renderer = createRenderer(canvas);
    const battle = createBattle({
      level,
      loadout,
      audio: app.audio,
      settings: app.save.settings,
      seed: `${mode}-${level.id}`,
      onEvent: (type, payload) => app.bus.emit(`battle:${type}`, payload),
    });

    // —— HUD ——
    const hpFill = el("i", { class: "bar-fill hp" });
    const hpText = el("span", { class: "hud-hp-text" });
    const comboBadge = el("div", { class: "combo-badge" });
    const turnText = el("span", { class: "hud-turn" });
    const timerText = el("span", { class: "hud-timer" });
    const shieldText = el("span", { class: "hud-shield" });

    const hudTop = el("div", { class: "hud-top" }, [
      el("button", { class: "icon-btn small", type: "button", onclick: () => openPause(), text: "❚❚" }),
      el("div", { class: "hud-center" }, [
        el("span", { class: "hud-title", text: level.name }),
        el("div", { class: "hud-bar" }, [hpFill]),
        hpText,
      ]),
      el("div", { class: "hud-right" }, [turnText, timerText, shieldText]),
    ]);

    const dock = el("div", { class: "hud-dock" });
    const ultBtn = el("button", { class: "ult-btn", type: "button", onclick: () => castUlt() }, [
      el("span", { class: "ult-icon", text: "✦" }),
      el("span", { class: "ult-label", text: "大招" }),
    ]);
    const hint = el("div", { class: "aim-hint", text: "按住画面拖拽瞄准，松手发射（空格也可发射）" });

    mount(root, shakeLayer, comboFlash, hudTop, hint, dock, ultBtn);

    const heroButtons = battle.heroes.map((hero, i) => {
      const ring = el("i", { class: "energy-ring" });
      const node = el("button", { class: "hero-slot", type: "button", onclick: () => selectHero(i) }, [
        ring,
        heroCanvas(hero, 42),
        el("span", { class: "hero-slot-name", text: hero.name }),
        el("span", { class: "hero-slot-key", text: String(i + 1) }),
      ]);
      return { node, ring, hero };
    });
    mount(dock, ...heroButtons.map((h) => h.node));

    function selectHero(i) {
      if (battle.selectHero(i)) syncHud();
    }
    function castUlt() {
      if (!battle.castUlt()) app.toast("能量不足或此时不可释放", "warn");
      syncHud();
    }

    // —— 输入 ——
    // 多点触控：只认第一根按下的手指，后来的指针一律忽略，
    // 否则第二根手指会抢走瞄准、抬起时还会替第一根手指发射。
    let aimPointerId = null;
    function toWorld(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 480,
        y: ((e.clientY - rect.top) / rect.height) * 800,
      };
    }
    function aimAt(pt) {
      const dx = pt.x - LAUNCH_X;
      const dy = Math.max(6, pt.y - LAUNCH_Y);
      const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
      const dist = Math.hypot(dx, dy);
      battle.setAim(clamp(angle, -MAX_AIM_DEG, MAX_AIM_DEG), clamp(dist / 460, 0.12, 1));
    }
    function dropPointer(e) {
      aimPointerId = null;
      try {
        if (e && canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      } catch { /* pointer 已释放 */ }
    }
    canvas.addEventListener("pointerdown", (e) => {
      app.audio.unlock();
      if (aimPointerId !== null) return;
      if (!battle.canFire()) return;
      aimPointerId = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      aimAt(toWorld(e));
      hint.classList.add("hidden");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerId !== aimPointerId) return;
      aimAt(toWorld(e));
    });
    canvas.addEventListener("pointerup", (e) => {
      if (e.pointerId !== aimPointerId) return;
      dropPointer(e);
      battle.fire();
      syncHud();
    });
    // 取消（手指滑出、系统手势打断）只收指针，不当作发射
    canvas.addEventListener("pointercancel", (e) => {
      if (e.pointerId !== aimPointerId) return;
      dropPointer(e);
    });

    // —— 结算 / 弹窗 ——
    let ended = false;
    let endScheduled = false;
    function finish() {
      if (ended) return;
      ended = true;
      app.audio.setMood("menu");
      app.navigate("result", { mode, level, params, result: battle.result, battle }, { replace: true });
    }

    // 暂停窗只能有一层：Esc 连按、点 HUD 按钮、Esc + 点击混按都只开这一个。
    let pauseModal = null;
    function openPause() {
      if (pauseModal) return;
      if (battle.pendingDraft) return;
      if (battle.state === BATTLE_STATE.WON || battle.state === BATTLE_STATE.LOST) return;
      battle.paused = true;
      app.audio.play("ui");
      // 无论「继续」、Esc 还是切屏关掉的，onClose 都会解除暂停
      pauseModal = app.modal((box, close) => {
        mount(box, 
          el("h3", { text: "暂停" }),
          el("p", { class: "muted small", text: `${level.name} · 回合 ${battle.turn}` }),
          el("div", { class: "detail-actions" }, [
            button("继续", () => close(), { variant: "primary" }),
            button("重新开始", () => { close(); app.navigate("battle", params, { replace: true }); }),
            button("放弃并退出", () => {
              close();
              ended = true;
              app.audio.setMood("menu");
              app.navigate(mode === "adventure" ? "adventure" : "menu", {}, { replace: true });
            }, { variant: "ghost" }),
          ]),
        );
      }, {
        onClose() {
          pauseModal = null;
          battle.paused = false;
        },
      });
    }

    function openDraft() {
      battle.paused = true;
      const options = rollDraft(battle, app.save.owned, level.id);
      app.audio.play("charged");
      // 三选一必须选：Esc 关不掉，否则会留下一个已暂停但没弹窗的战斗
      app.modal((box, close) => {
        mount(box, 
          el("h3", { text: `第 ${battle.wave} 波 · 三选一` }),
          el("div", { class: "draft-row" },
            options.map((opt) =>
              el("button", { class: "draft-card", type: "button", onclick: () => {
                applyDraft(battle, opt, loadout);
                if (opt.kind === "hero") rebuildDock();
                battle.paused = false;
                battle.pendingDraft = false;
                close();
                syncHud();
              } }, [
                opt.kind === "hero"
                  ? heroCanvas(opt.hero, 64, "full")
                  : el("span", { class: "draft-icon", text: "✦" }),
                el("b", { text: opt.kind === "hero" ? opt.hero.name : opt.artifact.name }),
                el("span", { class: "muted small", text: opt.kind === "hero" ? opt.hero.passive : opt.artifact.desc }),
              ]),
            ),
          ),
        );
      }, { dismissible: false });
    }

    function rebuildDock() {
      clear(dock);
      heroButtons.length = 0;
      battle.heroes.forEach((hero, i) => {
        const ring = el("i", { class: "energy-ring" });
        const node = el("button", { class: "hero-slot", type: "button", onclick: () => selectHero(i) }, [
          ring,
          heroCanvas(hero, 42),
          el("span", { class: "hero-slot-name", text: hero.name }),
          el("span", { class: "hero-slot-key", text: String(i + 1) }),
        ]);
        heroButtons.push({ node, ring, hero });
        dock.appendChild(node);
      });
    }

    // —— HUD 同步 ——
    let hudTimer = 0;
    function syncHud() {
      const ratio = battle.playerHp / battle.playerMaxHp;
      hpFill.style.width = `${Math.max(0, ratio) * 100}%`;
      hpFill.style.background = ratio > 0.35 ? "linear-gradient(90deg,#7ee08a,#3ee0c5)" : "linear-gradient(90deg,#ff4d6d,#ff8a3d)";
      hpText.textContent = `${Math.max(0, Math.round(battle.playerHp))}/${battle.playerMaxHp}`;
      turnText.textContent = battle.endless ? `第 ${battle.wave} 波` : `回合 ${battle.turn}`;
      timerText.textContent = battle.timeLimit ? `⏱ ${Math.max(0, battle.timeLimit - battle.elapsed).toFixed(1)}s` : `敌 ${battle.aliveEnemies().length}`;
      shieldText.textContent = battle.shields > 0 ? `🛡×${battle.shields}` : "";
      // 只切状态类，别整块覆盖 className：那会把 fx.css 的 .is-bump / .is-fever 一起抹掉
      comboBadge.textContent = battle.combo > 1 ? `${battle.combo} COMBO` : "";
      comboBadge.classList.toggle("on", battle.combo > 1);
      comboBadge.classList.toggle("hot", battle.combo >= 10);
      comboBadge.classList.toggle("is-fever", battle.burstUntil > battle.elapsed || battle.combo >= battle.comboThreshold);

      const active = battle.activeHero();
      heroButtons.forEach(({ node, ring, hero }, i) => {
        const live = battle.heroes[i] ?? hero;
        const pct = Math.round((live.energy / live.maxEnergy) * 100);
        ring.style.background = `conic-gradient(var(--yolk) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
        node.classList.toggle("active", i === battle.activeIndex);
        node.classList.toggle("ready", live.energy >= live.maxEnergy);
      });
      const ready = active && active.energy >= active.maxEnergy && hasUlt(active.id);
      ultBtn.classList.toggle("ready", !!ready);
      ultBtn.querySelector(".ult-label").textContent = active?.ult?.name ?? "大招";
    }

    if (!root.contains(comboBadge)) root.appendChild(comboBadge);

    // —— juice：把 battle.fx 指令翻译成 fx.css 的一次性动画类 ——
    // 逻辑侧的冻结 / 震屏累积在 core/battle.js，这里只负责视觉重播。
    let clock = 0;
    let shakeTier = -1;
    let shakeUntil = 0;
    let hitstopUntil = 0;

    function playHitstop(duration) {
      const long = (duration ?? 0) >= 0.09;
      const cls = long ? "fx-hitstop-lg" : "fx-hitstop";
      // 别让密集的小停顿把爆蛋那记长脉冲截断
      if (!long && clock < hitstopUntil) return;
      hitstopUntil = clock + (long ? 0.3 : 0.16);
      replayClass(canvas, cls, HITSTOP_CLASSES);
    }

    function playShake(intensity) {
      const tier = intensity >= 1.2 ? 2 : intensity >= 0.8 ? 1 : 0;
      // 上一档还没播完、且这一下不更狠，就别打断（连打时不会抖成糊）
      if (clock < shakeUntil && tier <= shakeTier) return;
      shakeTier = tier;
      shakeUntil = clock + SHAKE_SECONDS[tier];
      replayClass(shakeLayer, SHAKE_CLASSES[tier], SHAKE_CLASSES);
    }

    function drainFx() {
      const queue = battle.takeFx();
      if (!queue.length) return;
      let combo = null;
      let flash = false;
      let hitstop = 0;
      let shake = 0;
      for (const entry of queue) {
        if (entry.kind === "hitstop") hitstop = Math.max(hitstop, entry.duration ?? 0);
        else if (entry.kind === "shake") shake = Math.max(shake, entry.intensity ?? 0);
        else if (entry.kind === "combo-flash") flash = true;
        else if (entry.kind === "combo") combo = entry;
      }
      // 同一帧内多条同类指令只播最狠的那条，避免同帧反复重挂类
      if (hitstop > 0) playHitstop(hitstop);
      if (shake > 0) playShake(shake);
      if (flash) replayClass(comboFlash, "is-on");
      if (combo?.value > 0) replayClass(comboBadge, "is-bump");
    }

    syncHud();

    return {
      tick(dt) {
        clock += dt;
        battle.update(dt);
        renderer.draw(battle);
        drainFx();
        hudTimer += dt;
        if (hudTimer > 0.06) {
          hudTimer = 0;
          syncHud();
        }
        if (battle.pendingDraft && !battle.paused && battle.state === BATTLE_STATE.AIM) openDraft();
        const over = battle.state === BATTLE_STATE.WON || battle.state === BATTLE_STATE.LOST;
        if (over && !endScheduled) {
          endScheduled = true;
          setTimeout(finish, 950);
        }
      },
      onKey(e) {
        if (e.key === "Escape") { openPause(); return; }
        if (battle.paused) return;
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          if (battle.canFire()) battle.fire();
          syncHud();
          return;
        }
        if (e.key.toLowerCase() === "q") { castUlt(); return; }
        if (e.key === "ArrowLeft") { battle.setAim(battle.aim.angle - 2.5, battle.aim.power); return; }
        if (e.key === "ArrowRight") { battle.setAim(battle.aim.angle + 2.5, battle.aim.power); return; }
        if (e.key === "ArrowUp") { battle.setAim(battle.aim.angle, battle.aim.power + 0.05); return; }
        if (e.key === "ArrowDown") { battle.setAim(battle.aim.angle, battle.aim.power - 0.05); return; }
        // 肉鸽三选一会把新英雄追加到坞里，所以按键要覆盖 5 人以上的队伍
        if (/^[1-9]$/.test(e.key)) selectHero(Number(e.key) - 1);
      },
      destroy() {
        app.audio.setMood("menu");
      },
    };
  },
};

export const BATTLE_AIM_LIMITS = { MIN_SPEED, MAX_SPEED, LAUNCH_X, LAUNCH_Y };
