// 潜水屏：海区选择 + HUD（氧气 / 深度 / 战利品）+ 海底舞台。
// 会话按契约挂在 state.explore.dive：beginDive 开、advanceDive 推、finishDive 结账，
// UI 不自己拿着 session 变量。海区表（解锁与拒绝原因）一律问 diveZones，
// HUD 数字一律问 diveHud —— 这一层只负责把它们画出来。
import { advanceDive, beginDive, canDive, diveHud, diveZones, finishDive, DEFAULT_ZONE } from "../../explore/index.js";
import { DIVE_RULES } from "../../data/dive.js";
import { RESOURCE_META } from "../../data/resources.js";
import { h, setText, setClass, setStyle, setDisabled, setAttr, rebuildIf } from "../dom.js";
import { num, quip, resName } from "../copy.js";

const MAX_DEPTH = 90;
const SURFACE_DEPTH = Number.isFinite(DIVE_RULES?.surfaceDepth) ? DIVE_RULES.surfaceDepth : 8;
const DANGER = Number.isFinite(DIVE_RULES?.sharkRadius) ? DIVE_RULES.sharkRadius : 6;
const IDLE_INPUT = { x: 0, y: 0, surface: false };

/** 舞台按会话自己的 maxDepth 缩放：浅滩 40 米也能占满整块海底，不再全按 90 米画。 */
function depthOf(session) {
  return Number.isFinite(session?.maxDepth) && session.maxDepth > 0 ? session.maxDepth : MAX_DEPTH;
}

function inputOf(ctx) {
  const held = ctx.held;
  const left = held.has("arrowleft") || held.has("a") || held.has("pad-left");
  const right = held.has("arrowright") || held.has("d") || held.has("pad-right");
  const up = held.has("arrowup") || held.has("w") || held.has("pad-up");
  const down = held.has("arrowdown") || held.has("s") || held.has("pad-down");
  return {
    x: (right ? 1 : 0) - (left ? 1 : 0),
    y: (down ? 1 : 0) - (up ? 1 : 0),
    surface: held.has(" ") || held.has("pad-surface"),
  };
}

function nearestShark(session) {
  let best = Infinity;
  for (const s of session.sharks) best = Math.min(best, Math.hypot(s.x - session.x, s.y - session.depth));
  return best;
}

/** 老大选的海区。没选过、或选的那片这会儿下不去，就退回默认海区。 */
function wantedZone(ctx) {
  return ctx.ui.dive?.zone || DEFAULT_ZONE;
}

export const diveScreen = {
  id: "dive",

  /**
   * 推进潜水会话。由 app.js 每帧调用一次，**不分当前在哪一屏**：
   * 切走了氧气照样扣（只是没人给方向），会话结束也照样结算入袋 / 掉血。
   * advanceDive 每步按当前天气刷新氧耗倍率，海啸（diveO2 = 0）会直接把人拽上来。
   * dt 用真实秒 —— 潜水是手感活儿，不跟游戏倍速走。返回推进后的会话（没在潜就是 null）。
   */
  step(ctx, controllable = true) {
    const s = ctx.state;
    const session = s.explore.dive;
    if (!session?.ok || session.done || !s.meta.started) return session || null;

    const advanced = advanceDive(s, controllable ? inputOf(ctx) : IDLE_INPUT, Math.min(0.05, ctx.dt));
    const next = advanced.explore.dive;
    if (!next.done) {
      if (advanced !== s) ctx.store.replace(advanced);
      return next;
    }

    ctx.store.replace(finishDive(advanced, next));
    ctx.sfx(next.forced ? "alarm" : next.alive ? "hook" : "hit");
    const where = controllable ? "" : "（你人在别的屏，氧气可没停）";
    ctx.toast(
      next.forced
        ? `${next.message || "紧急上浮"}${where}捞到的 ${next.loot.length} 件照算。`
        : next.alive
          ? `上浮成功，捞回 ${next.loot.length} 件深海货。${where}`
          : `被鲨鱼贴脸了，掉了 ${DIVE_RULES.failHpLoss ?? 18} 血。${where}${quip()}`,
      next.alive ? "good" : "bad",
    );
    return null;
  },

  mount(ctx) {
    const el = h("section", {}, [
      h("h2", { text: "深海" }),
      h("p", { class: "cww-hint", id: "dive-hint" }),
      h("div", { class: "cww-grid", id: "dive-zones" }),
      h("p", { class: "cww-hint", id: "dive-zone-note" }),
      h("div", { class: "cww-meter", id: "dive-o2", role: "meter", "aria-label": "氧气" }, [h("i"), h("em")]),
      h("p", { class: "cww-hint", id: "dive-stat" }),
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "dive-start", id: "dive-start", class: "primary", text: "下潜" }),
        h("button", { "data-act": "dive-up", id: "dive-up", text: "上浮收工" }),
      ]),
      h("div", { class: "cww-dpad" }, [
        h("span", { class: "spacer" }),
        h("button", { "data-hold": "pad-up", text: "▲" }),
        h("span", { class: "spacer" }),
        h("button", { "data-hold": "pad-left", text: "◀" }),
        h("button", { "data-hold": "pad-down", text: "▼" }),
        h("button", { "data-hold": "pad-right", text: "▶" }),
        h("button", { "data-hold": "pad-surface", class: "wide", text: "浮上去（空格）" }),
      ]),
      h("p", {
        class: "cww-hint",
        id: "dive-warn",
        text: "WASD / 方向键游动，空格在浅水区上浮收工。鲨鱼靠近会亮红圈，蓝气泡能补氧。切到别的屏氧气照扣——想歇会儿就先上浮。",
      }),
    ]);
    ctx.refs.dive = {
      hint: el.querySelector("#dive-hint"),
      zones: el.querySelector("#dive-zones"),
      zoneNote: el.querySelector("#dive-zone-note"),
      o2: el.querySelector("#dive-o2"),
      o2fill: el.querySelector("#dive-o2 i"),
      o2label: el.querySelector("#dive-o2 em"),
      stat: el.querySelector("#dive-stat"),
      start: el.querySelector("#dive-start"),
      up: el.querySelector("#dive-up"),
    };
    return el;
  },

  // 舞台是常驻节点（挂在海面层上），只有节点集合变了才重建，位置每帧只改 style。
  mountStage(ctx, layer) {
    const arena = h("div", { class: "cww-arena", id: "dive-arena" }, [
      h("div", { class: "cww-surface" }, [h("span", { text: "水面 · 在这层按空格收工" })]),
      h("div", { class: "cww-nodes", id: "dive-nodes" }),
      h("div", { class: "cww-bubbles", id: "dive-bubbles" }),
      h("div", { class: "cww-sharks", id: "dive-sharks" }),
      h("div", { class: "cww-danger", id: "dive-danger", style: { display: "none" } }),
      h("div", { class: "cww-diver", id: "dive-diver" }),
    ]);
    layer.append(arena);
    ctx.refs.diveStage = {
      arena,
      nodes: arena.querySelector("#dive-nodes"),
      bubbles: arena.querySelector("#dive-bubbles"),
      sharks: arena.querySelector("#dive-sharks"),
      danger: arena.querySelector("#dive-danger"),
      diver: arena.querySelector("#dive-diver"),
    };
  },

  update(ctx) {
    // 会话推进统一由 app.js 的 step() 负责（切屏也照跑），这里只负责画。
    const s = ctx.state;
    const r = ctx.refs.dive;
    const stage = ctx.refs.diveStage;
    const session = s.explore.dive;
    const hud = diveHud(s);
    const zones = diveZones(s);
    const picked = wantedZone(ctx);
    const gate = canDive(s, picked);

    const active = hud.active;
    setClass(ctx.refs.diveLayer, "on", active && s.meta.screen === "dive");

    const here = zones.find((z) => z.id === (active ? hud.zone : picked));
    setText(
      r.hint,
      active
        ? `${hud.zoneName || here?.name || "海底"}：${here?.flavor || "氧气不等人，捡完就上。"}`
        : gate.ok
          ? `${here?.name || "海区"}：${here?.flavor || "氧气有限，鲨鱼没有。"}`
          : gate.reason,
    );
    setClass(r.hint, "bad", !active && !gate.ok);

    // 海区面板：解锁状态与拒绝原因都由 diveZones 给，UI 不复读解锁表。
    rebuildIf(
      r.zones,
      zones.map((z) => `${z.id}${z.unlocked ? 1 : 0}${z.id === picked ? "*" : ""}${active ? "a" : ""}`).join("|"),
      () =>
        zones.map((z) =>
          h("button", {
            class: `cww-pick${z.id === picked ? " on" : ""}${z.unlocked ? "" : " poor"}`,
            "data-act": "dive-zone",
            "data-zone": z.id,
            "aria-pressed": z.id === picked ? "true" : "false",
            title: z.unlocked ? z.flavor : z.reason,
            // 锁着的海区照样可点：点一下把理由说清楚，比一个灰按钮有用。
            disabled: active ? true : null,
          }, [
            h("b", { text: z.name }),
            h("span", { text: z.unlocked ? `氧气 ${z.oxygen} · 鲨鱼 ${z.sharks} · 稀有 ${Math.round(z.rareChance * 100)}%` : z.reason }),
          ]),
        ),
    );
    setText(
      r.zoneNote,
      active
        ? `正在潜：${hud.zoneName} · 天气 ${hud.weather}${hud.diveO2 === hud.o2Mult ? "" : "（氧耗倍率中途变了）"}`
        : `已开 ${zones.filter((z) => z.unlocked).length}/${zones.length} 片海区 · 天气 ${hud.weather}（氧耗 ×${hud.diveO2.toFixed(1)}）`,
    );

    const o2max = hud.oxygenMax || 100;
    setStyle(r.o2fill, "width", `${((active ? hud.oxygenPct : 0) * 100).toFixed(1)}%`);
    setClass(r.o2, "low", active && hud.oxygenPct < 0.35);
    setText(r.o2label, active ? `氧气 ${hud.oxygen} / ${Math.round(o2max)}` : "氧气 —— 未下潜");
    setAttr(r.o2, "aria-valuenow", active ? Math.round(hud.oxygenPct * 100) : 0);
    setText(
      r.stat,
      active
        ? `深度 ${hud.depth} / ${Math.round(hud.maxDepth || MAX_DEPTH)} 米 · 已捡 ${hud.loot} 件 · 剩余点位 ${hud.nodes} · 气泡 ${hud.bubbles}${hud.warning ? " · 氧气告急！" : ""}`
        : `${gate.ok ? "船坞已就绪" : gate.reason} · 深海是蓝图与传说碎片的主要来源。`,
    );
    setDisabled(r.start, !gate.ok || active);
    setDisabled(r.up, !active);

    if (!active || !stage || !session) return;

    const max = depthOf(session);
    rebuildIf(stage.nodes, session.nodes.map((n) => n.id).join(","), () =>
      session.nodes.map((n) =>
        h("div", {
          class: `cww-node${n.rare || n.res === "blueprint" || n.res === "shard" ? " rare" : ""}${n.kind === "wreck" ? " wreck" : ""}`,
          title: `${n.label || resName(n.res)}：${resName(n.res)}×${n.n}`,
          style: {
            left: `${n.x}%`,
            top: `${(n.y / max) * 100}%`,
            background: RESOURCE_META[n.res]?.color || "#fff",
          },
        }),
      ),
    );
    // 气泡是会话里早就有的补给点，之前没人画 —— 不画玩家就永远不知道能补氧。
    rebuildIf(stage.bubbles, (session.bubbles || []).map((b) => b.id).join(","), () =>
      (session.bubbles || []).map((b) =>
        h("div", {
          class: "cww-bubble",
          title: `氧气 +${b.amount}`,
          style: { left: `${b.x}%`, top: `${(b.y / max) * 100}%` },
        }),
      ),
    );
    rebuildIf(stage.sharks, `sharks-${session.sharks.length}`, () =>
      session.sharks.map(() => h("div", { class: "cww-shark" })),
    );
    session.sharks.forEach((sh, i) => {
      const node = stage.sharks.children[i];
      if (!node) return;
      setStyle(node, "left", `${sh.x}%`);
      setStyle(node, "top", `${(sh.y / max) * 100}%`);
      setClass(node, "flip", sh.vx < 0);
      setClass(node, "aggro", !!sh.aggro);
    });

    setStyle(stage.diver, "left", `${session.x}%`);
    setStyle(stage.diver, "top", `${(session.depth / max) * 100}%`);
    const near = nearestShark(session);
    setStyle(stage.danger, "display", near < DANGER * 2.4 ? "block" : "none");
    setStyle(stage.danger, "left", `${session.x}%`);
    setStyle(stage.danger, "top", `${(session.depth / max) * 100}%`);
  },

  action(ctx, act, el) {
    if (act === "dive-zone") {
      const zone = el?.dataset?.zone;
      if (!zone) return true;
      const gate = canDive(ctx.state, zone);
      if (!gate.ok) {
        ctx.toast(`${gate.reason} ${quip()}`, "bad");
        ctx.sfx("deny");
        return true;
      }
      ctx.ui.dive.zone = zone;
      ctx.sfx("tap");
      return true;
    }
    if (act === "dive-start") {
      const s = ctx.state;
      const zone = wantedZone(ctx);
      const next = beginDive(s, zone);
      // beginDive 不合规时原样返回：理由问 canDive，UI 不复读解锁表。
      if (next === s) {
        ctx.toast(`${canDive(s, zone).reason} ${quip()}`, "bad");
        ctx.sfx("deny");
        return true;
      }
      ctx.store.replace(next);
      ctx.sfx("dive");
      const session = next.explore.dive;
      ctx.toast(`下水了：${session.zoneName}，氧气 ${Math.round(session.oxygenMax || 100)}。别贪。`);
      return true;
    }
    if (act === "dive-up") {
      const s = ctx.state;
      const session = s.explore.dive;
      if (!session?.ok || session.done) return true;
      if (session.depth >= SURFACE_DEPTH) {
        ctx.toast("太深了，先游回水面那层再上浮。", "bad");
        return true;
      }
      ctx.store.replace(finishDive(s, { ...session, done: true, surfaced: true }));
      ctx.sfx("hook");
      ctx.toast(
        `上来了，带回 ${session.loot.length} 件货：${session.loot.map((n) => `${resName(n.res)}×${num(n.n)}`).join(" · ") || "两手空空"}。`,
        "good",
      );
      return true;
    }
    return false;
  },

  key(ctx, k) {
    if (k === "enter" && !ctx.state.explore.dive) {
      diveScreen.action(ctx, "dive-start");
      return true;
    }
    return false;
  },

  // 换屏时把海底舞台收起来（会话留在 state 里，回来接着潜）——但氧气不会跟着停。
  leave(ctx) {
    setClass(ctx.refs.diveLayer, "on", false);
    const hud = diveHud(ctx.state);
    if (hud.active) {
      ctx.toast(
        `人还在水下！氧气 ${hud.oxygen} 还在扣，遇上${hud.weather === "海啸预警" ? "这浪头" : "海啸"}会被强制捞上来。左上角有回去的按钮。`,
        "bad",
      );
    }
  },
};
