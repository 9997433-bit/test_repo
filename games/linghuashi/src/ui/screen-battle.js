import { announce, button, el, meter } from "./dom.js";
import { muteToggle, strokeGlyph } from "./components.js";
import { acquirePainter, canvasBox, previewStroke, refreshPainter, releasePainter } from "./painter-host.js";
import { STROKE_KEYS, keyboardStroke, strokeKeyByKey, strokeKeyByType } from "./keycast.js";
import { openTutorial, shouldShowTutorial } from "./tutorial.js";
import { talentMult } from "../classes/talents.js";
import { beastBonus } from "../progression/beasts.js";
import { beginBattle, settleBattle } from "../progression/settle.js";
import { CLASSES } from "../data/classes.js";
import { STAGES } from "../data/stages.js";
import { ENEMIES } from "../data/enemies.js";
import { realmById } from "../data/realms.js";
import { TALISMANS } from "../data/talismans.js";
import { createBattle } from "../combat/battle.js";
import { enemyIntent } from "../combat/ai.js";
import { playStroke } from "../audio/index.js";
import { normalizeForStorage } from "../drawing/replay.js";
import { GALLERY_POINTS, pushGallery } from "../core/store.js";

const TICK_MS = 200;
const SHIELD_REF = 80;
const INTENT_TEXT = { bound: "被缚", strike: "蓄势", watch: "观势" };

/**
 * 把养成侧的数值接到战斗上：battle.js 文档里的嵌套写法，
 * talent.* 直接吃 talentMult(save, tree)，beast 直接吃 beastBonus(save)。
 */
function modifiersFor(save) {
  return {
    talent: { atk: talentMult(save, "atk"), def: talentMult(save, "def"), sup: talentMult(save, "sup") },
    beast: beastBonus(save),
  };
}

export function renderBattle({ root, store, navigate }) {
  const save = store.get();
  const stage = STAGES.find((s) => s.id === save.stageId) || STAGES[0];
  const enemy = ENEMIES.find((e) => e.id === stage.enemyId);
  const realm = realmById(save.realmId);
  const cls = CLASSES.find((c) => c.id === save.classId) || CLASSES[0];

  store.set((prev) => beginBattle(prev, stage));

  const battle = createBattle({
    player: { id: "player", name: save.playerName, classId: cls.id, element: cls.element, hp: realm.hp, atk: realm.atk, qi: realm.qi },
    enemy: { ...enemy, realmId: save.realmId },
    seed: stage.id.length + save.xp,
    modifiers: modifiersFor(save),
  });

  let timer = null;
  let rafId = null;
  let settled = false;
  let closeTutorial = null;
  let lastLogTop = null;

  const hpMeter = meter("我方气血");
  const qiMeter = meter("我方灵气", "qi");
  const shieldMeter = meter("我方护盾", "shield");
  const enemyMeter = meter("敌方气血");
  const hpText = el("span", { class: "stat-num" });
  const qiText = el("span", { class: "stat-num" });
  const shieldText = el("span", { class: "stat-num" });
  const enemyText = el("span", { class: "stat-num" });
  const intentNode = el("span", { class: "intent", text: "观势" });
  const comboNode = el("span", { class: "combo", role: "status", "aria-label": "连击" });
  const hintNode = el("p", { id: "battle-hint", class: "muted hint", role: "status", text: "落笔成符：直线穿透 · 曲线束缚 · 圆结护盾 · 折线破甲 · 螺旋轰击 · 云纹回春。" });
  const logList = el("ul", {
    class: "log log-list",
    role: "log",
    "aria-label": "战斗记录",
    "aria-live": "polite",
    "aria-relevant": "additions",
  });

  const fleeBtn = button({ text: "收笔撤退", onclick: () => leave() });
  const castButtons = new Map();

  const castBar = el(
    "div",
    { class: "castbar card", role: "group", "aria-label": "符键条：键盘 1 至 6 施法" },
    STROKE_KEYS.map((entry) => {
      const node = button(
        {
          class: "cast-key",
          "aria-keyshortcuts": entry.key,
          "aria-label": `${entry.name} · ${entry.talisman}，${entry.effect}，消耗灵气 ${entry.qi}，快捷键 ${entry.key}`,
          dataset: { type: entry.type },
          onclick: () => castByType(entry.type),
        },
        [
          el("span", { class: "cast-key-head" }, [el("kbd", { text: entry.key }), strokeGlyph(entry.type, { width: 44, height: 32 })]),
          el("span", { class: "cast-key-name", text: `${entry.name} · ${entry.talisman}` }),
          el("span", { class: "cast-key-cost", text: `灵气 ${entry.qi}` }),
        ],
      );
      castButtons.set(entry.type, node);
      return node;
    }),
  );

  const paperWrap = el("div", { class: "paper-wrap" }, [
    el("p", { class: "muted paper-tip", text: "在纸上作画施法；也可用符键条或数字键 1-6。" }),
  ]);

  const section = el("section", { class: "screen battle-screen" }, [
    el("header", { class: "portrait" }, [
      el("div", {}, [
        el("p", { class: "sub", text: stage.name }),
        el("h2", { class: "brand screen-title", tabindex: "-1", "data-autofocus": true, text: enemy.name }),
        el("p", { class: "muted", text: enemy.lore }),
      ]),
      el("div", { class: "screen-tools" }, [muteToggle(store), fleeBtn]),
      el("div", { class: "vtitle", "aria-hidden": "true", text: "挥毫" }),
    ]),
    el("div", { class: "battle-layout" }, [
      paperWrap,
      el("aside", { class: "card battle-side", "aria-label": "战况" }, [
        el("div", { class: "side-block" }, [
          el("div", { class: "side-head" }, [el("strong", { text: `你 · ${cls.name}` }), hpText]),
          hpMeter.node,
          el("div", { class: "side-head" }, [el("span", { class: "muted", text: "灵气" }), qiText]),
          qiMeter.node,
          el("div", { class: "side-head" }, [el("span", { class: "muted", text: "护盾" }), shieldText]),
          shieldMeter.node,
          el("div", { class: "side-head" }, [el("span", { class: "muted", text: "笔势" }), comboNode]),
        ]),
        el("div", { class: "side-block" }, [
          el("div", { class: "side-head" }, [el("strong", { text: `敌 · ${enemy.name}` }), enemyText]),
          enemyMeter.node,
          el("div", { class: "side-head" }, [el("span", { class: "muted", text: "意图" }), intentNode]),
        ]),
        hintNode,
        logList,
      ]),
    ]),
    castBar,
  ]);

  root.appendChild(section);

  const host = acquirePainter({
    onStroke: (stroke) => cast(stroke, { source: "brush" }),
    label: `水墨画布，正在对战${enemy.name}。用鼠标或手指作画施法；键盘用户可用符键条或数字键 1 至 6。`,
  });
  paperWrap.insertBefore(host.canvas, paperWrap.firstChild);
  if (typeof window.requestAnimationFrame === "function") {
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      refreshPainter();
    });
  } else {
    refreshPainter();
  }

  document.addEventListener("keydown", onKeydown);

  if (shouldShowTutorial(save)) {
    closeTutorial = openTutorial({
      mount: root,
      store,
      onClose: () => {
        closeTutorial = null;
        startClock();
        castButtons.get("line")?.focus();
      },
    });
  } else {
    startClock();
  }

  paint();

  return function dispose() {
    stopClock();
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    document.removeEventListener("keydown", onKeydown);
    releasePainter();
    host.canvas.remove();
    const close = closeTutorial;
    closeTutorial = null;
    close?.();
  };

  function startClock() {
    if (timer !== null || settled) return;
    timer = window.setInterval(() => {
      battle.tick(TICK_MS);
      paint();
    }, TICK_MS);
  }

  function stopClock() {
    if (timer === null) return;
    window.clearInterval(timer);
    timer = null;
  }

  function leave() {
    stopClock();
    announce("已收笔撤退。");
    navigate("hub");
  }

  function castByType(type) {
    if (settled || closeTutorial) return;
    const box = canvasBox();
    const stroke = keyboardStroke(type, box);
    if (!stroke) return;
    previewStroke(stroke.raw);
    const node = castButtons.get(type);
    if (node) {
      // 连按同一个键时要重放高亮，中间必须强制回流一次。
      node.classList.remove("flash");
      void node.offsetWidth;
      node.classList.add("flash");
    }
    cast(stroke, { source: "key" });
  }

  function cast(stroke, { source } = {}) {
    if (settled || closeTutorial || !stroke) return;
    playStroke(stroke.type);
    const talisman = TALISMANS[stroke.type] ?? TALISMANS.scribble;
    const label = strokeKeyByType(stroke.type)?.name ?? "涂鸦";
    hintNode.textContent =
      source === "key"
        ? `符键 ${label} · ${talisman.name} · 精度 ${pct(stroke.precision)}%`
        : `识别 ${label} · ${talisman.name} · 精度 ${pct(stroke.precision)}% · 笔势 ${pct(stroke.pressure)}%`;
    // 只有真正成符的一笔才留痕：灵气不足散掉的笔不该算进画阁与墨客解锁。
    const { events } = battle.cast(stroke, cls.element);
    if (events.length) {
      const entry = { type: stroke.type, precision: stroke.precision, at: Date.now(), points: strokeTrace(stroke) };
      store.set((prev) => ({ gallery: pushGallery(prev.gallery, entry) }));
    }
    paint();
  }

  function paint() {
    const s = battle.getState();
    hpMeter.set(s.player.hp, s.player.maxHp);
    qiMeter.set(s.player.qi, s.player.maxQi);
    shieldMeter.set(Math.min(s.player.shield, SHIELD_REF), SHIELD_REF);
    enemyMeter.set(s.enemy.hp, s.enemy.maxHp);
    hpText.textContent = `${Math.round(s.player.hp)} / ${Math.round(s.player.maxHp)}`;
    qiText.textContent = `${Math.round(s.player.qi)} / ${Math.round(s.player.maxQi)}`;
    shieldText.textContent = `${Math.round(s.player.shield)}`;
    enemyText.textContent = `${Math.round(s.enemy.hp)} / ${Math.round(s.enemy.maxHp)}`;

    const intent = s.enemy.intent ?? enemyIntent(s.t, s.enemy.controlMs);
    intentNode.textContent = INTENT_TEXT[intent] ?? intent;
    intentNode.dataset.intent = intent;
    const combo = s.combo || 0;
    comboNode.textContent = combo > 0 ? `连击 x${combo + 1}` : "";

    for (const [type, node] of castButtons) {
      const short = s.player.qi < (TALISMANS[type]?.qi ?? 0);
      node.classList.toggle("is-short", short);
      node.setAttribute("aria-disabled", short ? "true" : "false");
    }

    appendLog(s.log);
    if (s.finished) finish(s.finished);
  }

  function appendLog(log) {
    if (!log.length || log[0] === lastLogTop) return;
    const fresh = [];
    for (const entry of log) {
      if (entry === lastLogTop) break;
      fresh.push(entry);
    }
    lastLogTop = log[0];
    fresh.reverse();
    for (const entry of fresh) logList.appendChild(el("li", { class: `log-line ${entry.kind || ""}`.trim(), text: entry.msg }));
    while (logList.children.length > 40) logList.removeChild(logList.firstChild);
    logList.scrollTop = logList.scrollHeight;
  }

  function finish(result) {
    if (settled) return;
    settled = true;
    stopClock();
    store.set((prev) => settleBattle(prev, { result, stage }));
    navigate("result");
  }

  function onKeydown(ev) {
    if (ev.defaultPrevented || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    const target = ev.target;
    if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
    if (ev.key === "Escape") {
      ev.preventDefault();
      leave();
      return;
    }
    const entry = strokeKeyByKey(ev.key);
    if (!entry) return;
    ev.preventDefault();
    castByType(entry.type);
  }
}

function pct(value) {
  return Math.round((Number(value) || 0) * 100);
}

/**
 * 给画阁留的点列：手绘与键盘施法的 stroke 都带 raw，
 * 归一化到 [0,1]² 后与画幅无关，换设备也能按当时的笔路回放。
 * 拿不到 raw（例如旧的合成入口）就只留 type，画阁自动退回标准字形。
 */
function strokeTrace(stroke) {
  const raw = stroke?.raw;
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const points = normalizeForStorage(raw, GALLERY_POINTS);
  return points.length >= 2 ? points : null;
}
