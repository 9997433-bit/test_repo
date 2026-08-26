import { CLASSES, classById } from "../data/classes.js";
import { STAGES, isStageUnlocked, nextStage } from "../data/stages.js";
import { enemyById } from "../data/enemies.js";
import { realmById } from "../data/realms.js";
import { TALISMANS, CASTABLE_TYPES } from "../data/talismans.js";
import { TALENTS, applyTalent } from "../classes/talents.js";
import { tickIdle } from "../progression/idle.js";
import { breakthrough } from "../progression/realm.js";
import { catchBeast, releaseBeast, BEAST_COST } from "../progression/beasts.js";
import { checkInkUnlock, masteredTypes, recordStroke, INK_TYPES, INK_MASTERY_THRESHOLD } from "../progression/unlock.js";
import { mountPainter } from "../drawing/canvas.js";
import { classifyStroke } from "../drawing/recognizer.js";
import { templatePoints } from "../drawing/templates.js";
import { normalizeForStorage, replayOnCanvas } from "../drawing/replay.js";
import { createBattle } from "../combat/battle.js";
import { computeMods } from "../combat/mods.js";
import { startLoop } from "../core/loop.js";
import { playStroke } from "../audio/sfx.js";
import { TUTORIAL_STEPS, tutorialStart, tutorialAdvance } from "./tutorial.js";

const ELEMENT_LABEL = { metal: "金", wood: "木", water: "水", fire: "火", earth: "土", thunder: "雷" };
const TYPE_LABEL = { line: "直线", curve: "曲线", circle: "圆盾", zigzag: "折线", spiral: "螺旋", cloud: "云形", scribble: "余墨" };

export function renderApp(root, store, navigate) {
  const save = store.get();
  root.innerHTML = "";
  const screen = save.screen || "splash";
  const view = {
    splash: renderSplash,
    class: renderClass,
    hub: renderHub,
    battle: renderBattle,
    gallery: renderGallery,
    result: renderResult,
  }[screen] || renderSplash;
  return view(root, store, navigate);
}

function chip(element) {
  return `<span class="chip el-${element}">${ELEMENT_LABEL[element] || "?"}</span>`;
}

/* ---------------- 卷首 ---------------- */

function renderSplash(root, store, navigate) {
  const save = store.get();
  root.innerHTML = `
    <section class="screen hero fade-in">
      <div class="enso" aria-hidden="true"></div>
      <div class="stamp" aria-hidden="true">印</div>
      <p class="sub">以笔为刃 · 以画通灵</p>
      <h1 class="brand">灵画师</h1>
      <p class="muted">水墨秘境独立卷。绘直线穿云，圈圆护体，折线破军，螺旋布阵，云笔回春，曲线缚灵。</p>
      <div class="actions">
        <button data-go="class" class="primary">开卷入世</button>
        <button data-go="hub" ${save.classId ? "" : "disabled"}>续写残卷</button>
      </div>
      <p class="muted small">鼠标 / 触屏挥毫，或全程键盘【1–6】施法 · Esc 收笔</p>
    </section>`;
  root.querySelectorAll("button[data-go]").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.go === "hub" && !store.get().classId) navigate("class");
      else navigate(b.dataset.go);
    };
  });
}

/* ---------------- 择业 ---------------- */

function renderClass(root, store, navigate) {
  const save = store.get();
  const chosen = save.classId;
  root.innerHTML = `
    <section class="screen fade-in">
      <p class="sub">择一道途</p>
      <h2 class="brand mid">${save.inkUnlocked ? "七门修行" : "六门修行"}</h2>
      ${save.inkUnlocked ? `<p class="notice-ink">六式已成，隐藏道途「墨客」向你敞开。</p>` : ""}
      <div class="grid class-grid" role="radiogroup" aria-label="选择职业"></div>
      <div class="actions" style="margin-top:18px">
        <button data-back>返卷首</button>
        <button data-ok class="primary" ${chosen ? "" : "disabled"}>以此入世</button>
      </div>
    </section>`;
  const grid = root.querySelector(".class-grid");
  CLASSES.filter((c) => !c.hidden || save.inkUnlocked).forEach((c) => {
    const btn = document.createElement("button");
    btn.className = `class-card card ${chosen === c.id ? "active" : ""} ${c.hidden ? "ink-class" : ""}`;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", chosen === c.id ? "true" : "false");
    const bonuses = Object.entries(c.bonus)
      .map(([t, v]) => `${TYPE_LABEL[t]} +${Math.round(v * 100)}%`)
      .join(" · ");
    btn.innerHTML = `
      <strong>${c.name}${c.hidden ? " · 隐" : ""}</strong>
      <div class="muted">${c.motto}</div>
      <div class="row-sm">${chip(c.element)}<span class="muted small">${bonuses}</span></div>`;
    btn.onclick = () => {
      store.set({ classId: c.id });
      renderClass(root, store, navigate);
    };
    grid.appendChild(btn);
  });
  root.querySelector("[data-back]").onclick = () => navigate("splash");
  root.querySelector("[data-ok]").onclick = () => store.get().classId && navigate("hub");
}

/* ---------------- 洞府 ---------------- */

function renderHub(root, store, navigate) {
  let save = tickIdle(store.get());
  store.set(save);
  const realm = realmById(save.realmId);
  const cls = classById(save.classId);
  const mastered = masteredTypes(save.strokeStats);
  const xpNeed = Number.isFinite(realm.xp) ? realm.xp : null;
  const xpPct = xpNeed ? Math.min(100, (save.xp / xpNeed) * 100) : 100;

  root.innerHTML = `
    <section class="screen fade-in">
      <div class="hud">
        <div>
          <p class="sub">${save.playerName}</p>
          <h2 class="brand mid">${cls?.name || "未择业"} · ${realm.name}</h2>
        </div>
        <div class="card res-card" aria-label="资源">
          <span>灵气丹 <strong>${save.qiPills}</strong></span>
          <span>包子 <strong>${save.buns}</strong></span>
          <span>胜绩 <strong>${save.totalWins || 0}</strong></span>
        </div>
      </div>
      ${save.idleClaim?.pills ? `<p class="card claim">洞府静修 ${save.idleClaim.minutes.toFixed(1)} 分，得灵气丹 ${save.idleClaim.pills}、包子 ${save.idleClaim.buns}。</p>` : ""}
      ${save.notice ? `<p class="card notice" role="status">${save.notice}</p>` : ""}
      <div class="grid hub-grid">
        <div class="card">
          <h3>秘境出战</h3>
          <div class="grid stages" role="list"></div>
        </div>
        <div class="grid side-col">
          <div class="card">
            <h3>境界 · ${realm.name}</h3>
            <div class="bar xp" role="progressbar" aria-label="修为" aria-valuemin="0" aria-valuemax="${xpNeed ?? save.xp}" aria-valuenow="${save.xp}">
              <i style="width:${xpPct}%"></i>
            </div>
            <p class="muted small">修为 ${save.xp}${xpNeed ? ` / ${xpNeed}` : " · 已至绝巅"}</p>
            <button data-break ${xpNeed && save.xp >= xpNeed ? 'class="primary glow"' : ""}>突破境界</button>
          </div>
          <div class="card">
            <h3>天赋（每级 12 丹）</h3>
            <div class="talents"></div>
          </div>
          <div class="card">
            <h3>灵兽（${(save.beasts || []).length}/3）</h3>
            <div class="beasts"></div>
            <button data-beast>收伏灵兽 · ${BEAST_COST} 丹</button>
          </div>
          <div class="card ink-card">
            <h3>墨客隐线</h3>
            <p class="muted small">六式精度 ≥ ${Math.round(INK_MASTERY_THRESHOLD * 100)}% 可感召墨客（${mastered.length}/6）</p>
            <div class="row-sm mastery">${INK_TYPES.map((t) => `<span class="chip ${mastered.includes(t) ? "on" : ""}">${TYPE_LABEL[t]}</span>`).join("")}</div>
            ${save.inkUnlocked && save.classId !== "mo" ? `<button data-mo class="primary">感召墨客</button>` : ""}
          </div>
          <div class="card">
            <h3>杂记</h3>
            <div class="row">
              <button data-gal>画阁</button>
              <button data-class>更换道途</button>
              <button data-mute aria-pressed="${save.settings.mute}">${save.settings.mute ? "解除静音" : "静音"}</button>
              <button data-motion aria-pressed="${save.settings.reducedMotion}">${save.settings.reducedMotion ? "恢复动效" : "减少动效"}</button>
              <button data-reset class="danger">焚卷重修</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;

  const stages = root.querySelector(".stages");
  STAGES.forEach((s) => {
    const e = enemyById(s.enemyId);
    const unlocked = isStageUnlocked(save, s.id);
    const cleared = (save.cleared || []).includes(s.id);
    const b = document.createElement("button");
    b.className = `stage-card ${cleared ? "cleared" : ""} ${s.boss ? "boss" : ""}`;
    b.disabled = !unlocked;
    b.setAttribute("role", "listitem");
    b.innerHTML = `
      <span class="stage-name">${s.name}${s.boss ? " · 终" : ""}</span>
      <span class="row-sm">${chip(s.element)}<span class="muted small">敌 ${e.name} · 荐 ${realmById(s.recommend).name}</span></span>
      <span class="muted small">${unlocked ? `${s.reward.xp} 修为 · ${s.reward.qiPills} 丹` : "先破前一秘境"}</span>
      ${cleared ? '<span class="seal-mini" aria-label="已通关">胜</span>' : ""}`;
    b.onclick = () => {
      store.set({ stageId: s.id, notice: "" });
      navigate("battle");
    };
    stages.appendChild(b);
  });

  root.querySelector("[data-break]").onclick = () => {
    store.set(breakthrough(store.get()));
    navigate("hub");
  };
  root.querySelector("[data-beast]").onclick = () => {
    store.set(catchBeast(store.get()));
    navigate("hub");
  };
  root.querySelector("[data-gal]").onclick = () => navigate("gallery");
  root.querySelector("[data-class]").onclick = () => navigate("class");
  root.querySelector("[data-mute]").onclick = () => {
    store.set({ settings: { ...store.get().settings, mute: !save.settings.mute } });
    navigate("hub");
  };
  root.querySelector("[data-motion]").onclick = () => {
    store.set({ settings: { ...store.get().settings, reducedMotion: !save.settings.reducedMotion } });
    navigate("hub");
  };
  root.querySelector("[data-reset]").onclick = () => {
    if (window.confirm("焚毁此卷、从头再修？存档将清空。")) {
      store.reset?.();
      navigate("splash");
    }
  };
  const mo = root.querySelector("[data-mo]");
  if (mo) {
    mo.onclick = () => {
      store.set({ classId: "mo", notice: "你执起墨客之笔，点墨可改写战场。" });
      navigate("hub");
    };
  }

  const talentBox = root.querySelector(".talents");
  const treeNames = { atk: "攻伐", def: "守御", sup: "辅弼" };
  ["atk", "def", "sup"].forEach((tree) => {
    const label = document.createElement("p");
    label.className = "muted small tree-label";
    label.textContent = treeNames[tree];
    talentBox.appendChild(label);
    TALENTS.filter((t) => t.tree === tree).forEach((t) => {
      const lv = save.talents?.[t.id] || 0;
      const b = document.createElement("button");
      b.className = "talent-btn";
      b.disabled = lv >= 5 || save.qiPills < 12;
      b.innerHTML = `${t.name} <span class="pips">${"●".repeat(lv)}${"○".repeat(5 - lv)}</span>`;
      b.setAttribute("aria-label", `${t.name}，${lv} 级，共 5 级`);
      b.onclick = () => {
        store.set(applyTalent(store.get(), t.id));
        navigate("hub");
      };
      talentBox.appendChild(b);
    });
  });

  const beastBox = root.querySelector(".beasts");
  (save.beasts || []).forEach((bst) => {
    const row = document.createElement("div");
    row.className = "beast-row";
    row.innerHTML = `<span class="beast-glyph" aria-hidden="true">${bst.glyph || "兽"}</span> ${bst.name} <span class="muted small">${bst.desc || bst.passive}</span>`;
    const rel = document.createElement("button");
    rel.textContent = "放归";
    rel.className = "small-btn";
    rel.onclick = () => {
      store.set(releaseBeast(store.get(), bst.uid));
      navigate("hub");
    };
    row.appendChild(rel);
    beastBox.appendChild(row);
  });
  if (!(save.beasts || []).length) beastBox.innerHTML = '<p class="muted small">尚无灵兽随行。</p>';
}

/* ---------------- 战斗 ---------------- */

function renderBattle(root, store, navigate) {
  const save = store.get();
  if (!save.classId) {
    navigate("class");
    return;
  }
  const stage = STAGES.find((s) => s.id === save.stageId) || STAGES[0];
  const enemy = enemyById(stage.enemyId);
  const realm = realmById(save.realmId);
  const cls = classById(save.classId) || CLASSES[0];
  const mods = computeMods(save);
  const reducedMotion =
    save.settings.reducedMotion ||
    (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const battle = createBattle({
    player: { id: "player", name: save.playerName, classId: cls.id, element: cls.element, hp: realm.hp, atk: realm.atk, qi: realm.qi },
    enemy: { ...enemy, realmId: save.realmId },
    seed: stage.id.length * 131 + save.xp + (save.totalWins || 0),
    mods,
  });

  const tutorialMode = stage.id === "tutorial" && !save.tutorialDone;
  let tut = tutorialMode ? tutorialStart() : null;

  root.innerHTML = `
    <section class="screen battle-screen fade-in">
      <div class="portrait">
        <div>
          <div class="sub">${stage.name}</div>
          <h2 class="enemy-title">${enemy.name} ${chip(enemy.element)}</h2>
          <p class="muted small">${enemy.lore}</p>
        </div>
        <div class="enemy-glyph ${stage.boss ? "boss" : ""}" aria-hidden="true">${enemy.name[0]}</div>
        <div class="vtitle" aria-hidden="true">挥毫</div>
      </div>
      ${tutorialMode ? `<div class="card tutorial-bar" role="status" id="tut"></div>` : ""}
      <div class="battle-layout">
        <div class="paper-wrap">
          <canvas class="paper" id="paper" role="img" aria-label="宣纸画布：用鼠标或手指在此绘制符箓轨迹；也可使用数字键 1 到 6 施法"></canvas>
          <div class="floats" id="floats" aria-hidden="true"></div>
        </div>
        <aside class="card battle-panel">
          <div class="row-sm"><strong>${cls.name}</strong> ${chip(cls.element)} <span class="muted small">${realm.name}</span></div>
          <div class="bar" id="hpbar" role="progressbar" aria-label="我方生命"><i id="hp"></i><em id="hptxt"></em></div>
          <div class="bar qi" id="qibar" role="progressbar" aria-label="灵气"><i id="qi"></i><em id="qitxt"></em></div>
          <div class="bar shield" id="shbar" role="progressbar" aria-label="护盾"><i id="sh"></i><em id="shtxt"></em></div>
          <div class="row-sm enemy-row"><strong>敌</strong><span id="intent" class="intent"></span></div>
          <div class="bar enemy" id="ehpbar" role="progressbar" aria-label="敌方生命"><i id="ehp"></i><em id="ehptxt"></em></div>
          <div class="bar gauge" aria-hidden="true"><i id="gauge"></i></div>
          <div class="row-sm status-chips" id="status"></div>
          <p id="hint" class="muted small" role="status">六式在手：横直线 / 弧曲线 / 闭合圆 / 急折线 / 旋螺纹 / 鼓包云</p>
          <div class="talisman-legend" id="legend" role="toolbar" aria-label="符箓速施"></div>
          <div class="log" id="log" role="log" aria-live="polite" aria-label="战斗记录"></div>
          <button data-flee>收笔撤退（Esc）</button>
        </aside>
      </div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const hp = $("#hp");
  const qi = $("#qi");
  const sh = $("#sh");
  const ehp = $("#ehp");
  const gauge = $("#gauge");
  const log = $("#log");
  const hint = $("#hint");
  const intentEl = $("#intent");
  const statusEl = $("#status");
  const floats = $("#floats");
  const tutEl = $("#tut");
  let lastLogLen = -1;
  let finishedHandled = false;
  let finishTimer = 0;

  const painter = mountPainter($("#paper"), {
    reducedMotion,
    onStroke(stroke) {
      handleStroke(stroke, false);
    },
  });

  function paintTutorial() {
    if (!tut || !tutEl) return;
    if (tut.done) {
      tutEl.innerHTML = `<strong>六式已成</strong><span>${tut.feedback?.msg || "放手施为！"}</span>`;
      painter.setGuide(null);
      return;
    }
    const step = TUTORIAL_STEPS[tut.step];
    tutEl.innerHTML = `
      <strong>${step.title}（${tut.step + 1}/6）</strong>
      <span>${step.text}</span>
      ${tut.feedback ? `<span class="${tut.feedback.ok ? "good" : "warn"}">${tut.feedback.msg}</span>` : ""}`;
    painter.setGuide(step.type);
  }

  function spawnFloat(text, kind) {
    if (reducedMotion || !floats) return;
    const span = document.createElement("span");
    span.className = `float ${kind}`;
    span.textContent = text;
    span.style.left = `${18 + Math.random() * 56}%`;
    span.style.top = `${22 + Math.random() * 36}%`;
    span.addEventListener("animationend", () => span.remove());
    floats.appendChild(span);
  }

  function handleStroke(stroke, viaKey) {
    const s0 = battle.getState();
    if (s0.finished) return;
    playStroke(stroke.type, store.get().settings.mute);
    const label = TYPE_LABEL[stroke.type] || stroke.type;
    hint.textContent = `识别 ${label} · 精度 ${(stroke.precision * 100).toFixed(0)}% · 笔势 ${((stroke.pressure ?? 0.5) * 100).toFixed(0)}%${viaKey ? " · 键控" : ""}`;

    // 画阁与六式精进记录（键控记模板原始精度，战斗用折算精度）
    let next = recordStroke(store.get(), { type: stroke.type, precision: stroke.recordPrecision ?? stroke.precision });
    if (stroke.type !== "scribble") {
      const entry = {
        type: stroke.type,
        precision: +(stroke.recordPrecision ?? stroke.precision).toFixed(3),
        at: Date.now(),
        viaKey,
        points: normalizeForStorage(stroke.raw || []),
      };
      next = { ...next, gallery: [...next.gallery, entry].slice(-24) };
    }
    if (!next.inkUnlocked && checkInkUnlock(next)) {
      next = { ...next, inkUnlocked: true, notice: "六式皆入化境——隐藏道途「墨客」已解锁！" };
      hint.textContent = "六式皆入化境，墨客已应召！";
    }
    store.set(next);

    if (tut && !tut.done) {
      tut = tutorialAdvance(tut, stroke);
      paintTutorial();
    }

    const { events } = battle.cast(stroke, cls.element);
    const ev = events[0];
    if (ev) {
      if (ev.dealt > 0) spawnFloat(`-${Math.round(ev.dealt)}${ev.crit ? "!" : ""}`, ev.crit ? "crit" : "dmg");
      else if (stroke.type === "circle") spawnFloat("盾", "buff");
      else if (stroke.type === "cloud") spawnFloat("春", "heal");
      if (ev.combo >= 3) spawnFloat(`${ev.combo} 连`, "combo");
    }
    paint();
  }

  function castByKey(type) {
    const s = battle.getState();
    if (s.finished) return;
    const { w, h } = paperSize();
    const tpl = classifyStroke(templatePoints(type, { w, h }));
    painter.playback(type);
    handleStroke({ ...tpl, precision: tpl.precision * 0.85, recordPrecision: tpl.precision, raw: templatePoints(type, { w, h }) }, true);
  }

  function paperSize() {
    const rect = $("#paper").getBoundingClientRect();
    return { w: Math.max(320, rect.width), h: Math.max(240, rect.height) };
  }

  const legend = $("#legend");
  CASTABLE_TYPES.forEach((type) => {
    const t = TALISMANS[type];
    const b = document.createElement("button");
    b.className = "talisman-key";
    b.dataset.type = type;
    b.setAttribute("aria-keyshortcuts", t.key);
    b.setAttribute("title", `${t.name} · ${t.desc} · 耗灵 ${t.qi}`);
    b.innerHTML = `<kbd>${t.key}</kbd><span class="glyph">${t.glyph}</span><span class="tname">${t.name}</span><span class="muted small">${t.qi}灵</span>`;
    b.onclick = () => castByKey(type);
    legend.appendChild(b);
  });

  function paint() {
    const s = battle.getState();
    hp.style.width = `${(s.player.hp / s.player.maxHp) * 100}%`;
    qi.style.width = `${(s.player.qi / s.player.maxQi) * 100}%`;
    sh.style.width = `${Math.min(100, (s.player.shield / 90) * 100)}%`;
    ehp.style.width = `${(s.enemy.hp / s.enemy.maxHp) * 100}%`;
    $("#hptxt").textContent = `${Math.ceil(s.player.hp)}/${s.player.maxHp}`;
    $("#qitxt").textContent = `${Math.floor(s.player.qi)}`;
    $("#shtxt").textContent = s.player.shield > 0.5 ? `${Math.round(s.player.shield)}` : "";
    $("#ehptxt").textContent = `${Math.ceil(s.enemy.hp)}/${s.enemy.maxHp}`;
    setBarNow("#hpbar", s.player.hp, s.player.maxHp);
    setBarNow("#qibar", s.player.qi, s.player.maxQi);
    setBarNow("#shbar", s.player.shield, 90);
    setBarNow("#ehpbar", s.enemy.hp, s.enemy.maxHp);

    const intent = battle.getIntent();
    intentEl.textContent = intent.label;
    intentEl.className = `intent ${intent.id}`;
    gauge.style.width = `${intent.ratio * 100}%`;

    const chips = [];
    if (s.enemy.shield > 0.5) chips.push(`<span class="chip">敌盾 ${Math.round(s.enemy.shield)}</span>`);
    if (s.enemy.shred > 0) chips.push(`<span class="chip warn">破甲 ${Math.round(s.enemy.shred * 100)}%</span>`);
    if (s.combo >= 2) chips.push(`<span class="chip on">${s.combo} 连击</span>`);
    statusEl.innerHTML = chips.join("");

    if (s.log.length !== lastLogLen) {
      lastLogLen = s.log.length;
      log.innerHTML = s.log.map((l) => `<div class="lg-${l.kind || "info"}">${l.msg}</div>`).join("");
    }

    if (s.finished && !finishedHandled) {
      finishedHandled = true;
      finish(s);
    }
  }

  function setBarNow(sel, now, max) {
    const el = $(sel);
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", String(Math.round(max)));
    el.setAttribute("aria-valuenow", String(Math.round(now)));
  }

  function finish(s) {
    const win = s.finished === "win";
    const cur = store.get();
    const patch = {
      lastResult: s.finished,
      lastStage: stage.id,
      lastStats: { ...s.stats },
      bestCombo: Math.max(cur.bestCombo || 0, s.stats.maxCombo),
    };
    if (win) {
      patch.xp = cur.xp + stage.reward.xp;
      patch.qiPills = cur.qiPills + stage.reward.qiPills;
      patch.totalWins = (cur.totalWins || 0) + 1;
      if (!(cur.cleared || []).includes(stage.id)) patch.cleared = [...(cur.cleared || []), stage.id];
      if (stage.id === "tutorial") patch.tutorialDone = true;
    }
    store.set(patch);
    finishTimer = window.setTimeout(() => navigate("result"), reducedMotion ? 0 : 500);
  }

  function onKey(ev) {
    if (ev.key === "Escape") {
      navigate("hub");
      return;
    }
    const type = CASTABLE_TYPES.find((t) => TALISMANS[t].key === ev.key);
    if (type) {
      ev.preventDefault();
      castByKey(type);
      legend.querySelector(`[data-type="${type}"]`)?.classList.add("pressed");
      window.setTimeout(() => legend.querySelector(`[data-type="${type}"]`)?.classList.remove("pressed"), 160);
    }
  }
  window.addEventListener("keydown", onKey);

  const stopLoop = startLoop({
    stepMs: 200,
    onTick: (dt) => battle.tick(dt),
    onFrame: paint,
  });

  $("[data-flee]").onclick = () => navigate("hub");

  if (tut) paintTutorial();
  paint();

  return function cleanup() {
    stopLoop();
    painter.destroy();
    window.clearTimeout(finishTimer);
    window.removeEventListener("keydown", onKey);
  };
}

/* ---------------- 结算 ---------------- */

function renderResult(root, store, navigate) {
  const save = store.get();
  const win = save.lastResult === "win";
  const stage = STAGES.find((s) => s.id === save.lastStage) || STAGES[0];
  const st = save.lastStats || {};
  const next = win ? nextStage(stage.id) : null;
  const nextOk = next && isStageUnlocked(save, next.id);
  root.innerHTML = `
    <section class="screen hero fade-in">
      <div class="stamp big ${win ? "" : "lose"}">${win ? "胜" : "败"}</div>
      <h2 class="brand mid">${win ? "墨痕已定" : "纸尽锋折"}</h2>
      <p class="muted">${win ? `${stage.name}告破，秘境留下 ${stage.reward.xp} 修为与 ${stage.reward.qiPills} 灵气丹。` : "再绘一次，笔锋会更准。破甲折线与束缚曲线是逆风良友。"}</p>
      ${save.notice ? `<p class="card notice">${save.notice}</p>` : ""}
      <div class="card stats-card" aria-label="战斗统计">
        <span>用时 ${(st.durationMs / 1000 || 0).toFixed(1)}s</span>
        <span>挥毫 ${st.casts || 0}</span>
        <span>最大连击 ${st.maxCombo || 0}</span>
        <span>造成 ${Math.round(st.damageDealt || 0)}</span>
        <span>治疗 ${Math.round(st.healingDone || 0)}</span>
        <span>暴击 ${st.crits || 0}</span>
        <span>闪避 ${st.dodges || 0}</span>
      </div>
      <div class="actions">
        <button data-hub>回洞府</button>
        <button data-again>再战此地</button>
        ${nextOk ? `<button data-next class="primary">进军「${next.name}」</button>` : ""}
      </div>
    </section>`;
  root.querySelector("[data-hub]").onclick = () => {
    store.set({ notice: "" });
    navigate("hub");
  };
  root.querySelector("[data-again]").onclick = () => {
    store.set({ stageId: stage.id, notice: "" });
    navigate("battle");
  };
  const nx = root.querySelector("[data-next]");
  if (nx) {
    nx.onclick = () => {
      store.set({ stageId: next.id, notice: "" });
      navigate("battle");
    };
  }
}

/* ---------------- 画阁 ---------------- */

function renderGallery(root, store, navigate) {
  const save = store.get();
  const items = [...(save.gallery || [])].reverse();
  const mastered = masteredTypes(save.strokeStats);
  const stops = [];
  root.innerHTML = `
    <section class="screen fade-in">
      <p class="sub">墨迹收藏</p>
      <h2 class="brand mid">画阁</h2>
      <div class="card mastery-card">
        <h3>六式精进（${mastered.length}/6 已入化境）</h3>
        <div class="grid mastery-grid">
          ${INK_TYPES.map((t) => {
            const best = save.strokeStats?.[t] || 0;
            const ok = best >= INK_MASTERY_THRESHOLD;
            return `<div class="mastery-item ${ok ? "on" : ""}">
              <span class="glyph">${TALISMANS[t].glyph}</span>
              <span>${TYPE_LABEL[t]}</span>
              <span class="muted small">${best ? `最佳 ${(best * 100).toFixed(0)}%` : "未成"}</span>
            </div>`;
          }).join("")}
        </div>
        <p class="muted small">${save.inkUnlocked ? "墨客已应召，可在「更换道途」中执笔。" : `六式精度皆达 ${Math.round(INK_MASTERY_THRESHOLD * 100)}% 即可感召隐藏职业「墨客」。`}</p>
      </div>
      <h3 style="margin-top:18px">近 ${items.length} 笔 · 点击回放</h3>
      <div class="grid gallery-grid" role="list">
        ${items.length ? "" : '<p class="muted">尚无墨迹。去秘境挥毫，或在战斗中按 1–6 键施法。</p>'}
      </div>
      <button data-back style="margin-top:16px">返回洞府</button>
    </section>`;

  const grid = root.querySelector(".gallery-grid");
  const reducedMotion = save.settings.reducedMotion;
  items.forEach((g) => {
    const cell = document.createElement("button");
    cell.className = "gallery-cell card";
    cell.setAttribute("role", "listitem");
    cell.setAttribute("aria-label", `${TYPE_LABEL[g.type] || g.type}，精度 ${(g.precision * 100).toFixed(0)}%，点击回放`);
    const canvas = document.createElement("canvas");
    canvas.className = "gallery-canvas";
    canvas.width = 150;
    canvas.height = 100;
    const meta = document.createElement("div");
    meta.className = "gallery-meta";
    meta.innerHTML = `<span>${TALISMANS[g.type]?.glyph || "·"} ${TYPE_LABEL[g.type] || g.type}</span><span class="muted small">${(g.precision * 100).toFixed(0)}%${g.viaKey ? " · 键" : ""}</span>`;
    cell.appendChild(canvas);
    cell.appendChild(meta);
    grid.appendChild(cell);
    const pts = g.points && g.points.length >= 2 ? g.points : null;
    const draw = () => {
      if (pts) stops.push(replayOnCanvas(canvas, pts, { reducedMotion }));
      else {
        const tpl = normalizeForStorage(templatePoints(g.type, { w: 300, h: 200 }));
        stops.push(replayOnCanvas(canvas, tpl, { reducedMotion: true, color: "rgba(26,18,11,0.35)" }));
      }
    };
    draw();
    cell.onclick = () => {
      if (pts) stops.push(replayOnCanvas(canvas, pts, { reducedMotion: false }));
    };
  });

  root.querySelector("[data-back]").onclick = () => navigate("hub");
  return function cleanup() {
    stops.forEach((stop) => stop());
  };
}
