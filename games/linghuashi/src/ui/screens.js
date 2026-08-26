import { CLASSES } from "../data/classes.js";
import { STAGES } from "../data/stages.js";
import { ENEMIES } from "../data/enemies.js";
import { REALMS, realmById } from "../data/realms.js";
import { TALENTS, applyTalent } from "../classes/talents.js";
import { tickIdle } from "../progression/idle.js";
import { breakthrough } from "../progression/realm.js";
import { catchBeast } from "../progression/beasts.js";
import { mountPainter } from "../drawing/canvas.js";
import { createBattle } from "../combat/battle.js";
import { playStroke } from "../audio/sfx.js";

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
  }[screen];
  view(root, store, navigate);
}

function renderSplash(root, store, navigate) {
  root.innerHTML = `
    <section class="screen hero">
      <div class="stamp">印</div>
      <p class="sub">以笔为刃 · 以画通灵</p>
      <h1 class="brand">灵画师</h1>
      <p class="muted">水墨秘境独立卷。绘直线穿云，圈圆护体，折线破军，螺旋布阵。</p>
      <div class="actions">
        <button data-go="class">开卷入世</button>
        <button data-go="hub">续写残卷</button>
      </div>
    </section>`;
  root.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.go === "hub" && !store.get().classId) navigate("class");
      else navigate(b.dataset.go);
    };
  });
}

function renderClass(root, store, navigate) {
  const chosen = store.get().classId;
  root.innerHTML = `
    <section class="screen">
      <p class="sub">择一道途</p>
      <h2 class="brand" style="font-size:2.2rem">六门修行</h2>
      <div class="grid class-grid"></div>
      <div class="actions" style="margin-top:18px">
        <button data-back>返卷首</button>
        <button data-ok ${chosen ? "" : "disabled"}>以此入世</button>
      </div>
    </section>`;
  const grid = root.querySelector(".class-grid");
  CLASSES.filter((c) => !c.hidden).forEach((c) => {
    const btn = document.createElement("button");
    btn.className = `class-card card ${chosen === c.id ? "active" : ""}`;
    btn.innerHTML = `<strong>${c.name}</strong><div class="muted">${c.motto}</div><div>本命：${c.element}</div>`;
    btn.onclick = () => {
      store.set({ classId: c.id });
      navigate("class");
    };
    grid.appendChild(btn);
  });
  root.querySelector("[data-back]").onclick = () => navigate("splash");
  root.querySelector("[data-ok]").onclick = () => chosen && navigate("hub");
}

function renderHub(root, store, navigate) {
  let save = tickIdle(store.get());
  store.set(save);
  const realm = realmById(save.realmId);
  root.innerHTML = `
    <section class="screen">
      <div class="hud">
        <div>
          <p class="sub">${save.playerName}</p>
          <h2 class="brand" style="font-size:2rem">${CLASSES.find((c) => c.id === save.classId)?.name || "未择业"} · ${realm.name}</h2>
        </div>
        <div class="card">灵气丹 ${save.qiPills} · 包子 ${save.buns} · 修为 ${save.xp}/${Number.isFinite(realm.xp) ? realm.xp : "∞"}</div>
      </div>
      ${save.idleClaim?.pills ? `<p class="card">挂机 ${save.idleClaim.minutes.toFixed(1)} 分，得丹 ${save.idleClaim.pills}、包子 ${save.idleClaim.buns}</p>` : ""}
      <div class="grid hub-grid" style="margin-top:16px">
        <div class="card">
          <h3>秘境出战</h3>
          <div class="grid stages"></div>
        </div>
        <div class="grid">
          <div class="card">
            <h3>修炼</h3>
            <div class="row">
              <button data-break>突破境界</button>
              <button data-beast>收伏灵兽</button>
              <button data-gal>画阁</button>
            </div>
            ${save.notice ? `<p>${save.notice}</p>` : ""}
            <div class="talents"></div>
          </div>
        </div>
      </div>
    </section>`;
  const stages = root.querySelector(".stages");
  STAGES.forEach((s) => {
    const e = ENEMIES.find((x) => x.id === s.enemyId);
    const b = document.createElement("button");
    b.textContent = `${s.name} · 敌 ${e.name}`;
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
  const box = root.querySelector(".talents");
  TALENTS.forEach((t) => {
    const lv = save.talents?.[t.id] || 0;
    const b = document.createElement("button");
    b.textContent = `${t.name} ${lv}/5`;
    b.onclick = () => {
      store.set(applyTalent(store.get(), t.id));
      navigate("hub");
    };
    box.appendChild(b);
  });
}

function renderBattle(root, store, navigate) {
  const save = store.get();
  const stage = STAGES.find((s) => s.id === save.stageId) || STAGES[0];
  const enemy = ENEMIES.find((e) => e.id === stage.enemyId);
  const realm = realmById(save.realmId);
  const cls = CLASSES.find((c) => c.id === save.classId) || CLASSES[0];
  const battle = createBattle({
    player: { id: "player", name: save.playerName, classId: cls.id, element: cls.element, hp: realm.hp, atk: realm.atk, qi: realm.qi },
    enemy: { ...enemy, realmId: save.realmId },
    seed: stage.id.length + save.xp,
  });

  root.innerHTML = `
    <section class="screen">
      <div class="portrait">
        <div>
          <div class="sub">${stage.name}</div>
          <h2>${enemy.name}</h2>
          <p class="muted">${enemy.lore}</p>
        </div>
        <div class="vtitle">挥毫</div>
      </div>
      <div class="battle-layout">
        <canvas class="paper" id="paper"></canvas>
        <aside class="card">
          <div>你 ${cls.name}</div>
          <div class="bar"><i id="hp"></i></div>
          <div class="bar qi"><i id="qi"></i></div>
          <div class="bar shield"><i id="sh"></i></div>
          <div>敌</div>
          <div class="bar"><i id="ehp"></i></div>
          <p id="hint" class="muted">直线穿透 · 圆护盾 · 折线破甲 · 螺旋阵 · 云回春</p>
          <div class="log" id="log"></div>
          <button data-flee>收笔撤退</button>
        </aside>
      </div>
    </section>`;

  const hp = root.querySelector("#hp");
  const qi = root.querySelector("#qi");
  const sh = root.querySelector("#sh");
  const ehp = root.querySelector("#ehp");
  const log = root.querySelector("#log");
  const hint = root.querySelector("#hint");

  function paint() {
    const s = battle.getState();
    hp.style.width = `${(s.player.hp / s.player.maxHp) * 100}%`;
    qi.style.width = `${(s.player.qi / s.player.maxQi) * 100}%`;
    sh.style.width = `${Math.min(100, (s.player.shield / 80) * 100)}%`;
    ehp.style.width = `${(s.enemy.hp / s.enemy.maxHp) * 100}%`;
    log.innerHTML = s.log.map((l) => `<div>${l.msg}</div>`).join("");
    if (s.finished) {
      store.set({ lastResult: s.finished, lastStage: stage.id });
      if (s.finished === "win") {
        const next = {
          ...store.get(),
          xp: store.get().xp + stage.reward.xp,
          qiPills: store.get().qiPills + stage.reward.qiPills,
        };
        if (next.gallery.length >= 6 && !next.inkUnlocked) next.inkUnlocked = true;
        store.set(next);
      }
      navigate("result");
    }
  }

  const painter = mountPainter(root.querySelector("#paper"), {
    onStroke(stroke) {
      playStroke(stroke.type, store.get().settings.mute);
      hint.textContent = `识别 ${stroke.type} · 精度 ${(stroke.precision * 100).toFixed(0)}% · 笔势 ${(stroke.pressure * 100).toFixed(0)}%`;
      const gallery = [...store.get().gallery, { type: stroke.type, precision: stroke.precision, at: Date.now() }].slice(-24);
      store.set({ gallery });
      battle.cast(stroke, cls.element);
      paint();
    },
  });

  const timer = window.setInterval(() => {
    battle.tick(200);
    paint();
  }, 200);

  root.querySelector("[data-flee]").onclick = () => {
    window.clearInterval(timer);
    painter.destroy();
    navigate("hub");
  };
}

function renderResult(root, store, navigate) {
  const save = store.get();
  const win = save.lastResult === "win";
  root.innerHTML = `
    <section class="screen hero">
      <div class="stamp">${win ? "胜" : "败"}</div>
      <h2 class="brand" style="font-size:2.6rem">${win ? "墨痕已定" : "纸尽锋折"}</h2>
      <p>${win ? "秘境留下灵气丹与残页。" : "再绘一次，笔锋会更准。"}</p>
      <div class="actions">
        <button data-hub>回画阁</button>
        <button data-again>再战</button>
      </div>
    </section>`;
  root.querySelector("[data-hub]").onclick = () => navigate("hub");
  root.querySelector("[data-again]").onclick = () => navigate("battle");
}

function renderGallery(root, store, navigate) {
  const items = store.get().gallery || [];
  root.innerHTML = `
    <section class="screen">
      <h2 class="brand" style="font-size:2rem">画阁</h2>
      <p class="muted">近 ${items.length} 笔。集齐六式可感召墨客隐线。</p>
      <div class="grid">${items.map((g) => `<div class="card">${g.type} · ${(g.precision * 100).toFixed(0)}%</div>`).join("") || "<p>尚无墨迹</p>"}</div>
      <button data-back style="margin-top:16px">返回</button>
    </section>`;
  root.querySelector("[data-back]").onclick = () => navigate("hub");
  void REALMS;
}
