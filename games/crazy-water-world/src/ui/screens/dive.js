// 潜水屏：HUD（氧气 / 深度 / 战利品）+ 海底舞台。
// 会话按契约挂在 state.explore.dive，刷新和换屏都不会把老大丢在海里。
import { startDive, diveStep, finishDive } from "../../explore/index.js";
import { DIVE_ZONES } from "../../data/dive.js";
import { RESOURCE_META } from "../../data/resources.js";
import { h, setText, setClass, setStyle, setDisabled, rebuildIf } from "../dom.js";
import { num, quip, resName } from "../copy.js";

const MAX_DEPTH = 90;
const SURFACE_DEPTH = 8;
const DANGER = 6;

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

export const diveScreen = {
  id: "dive",

  /**
   * 推进潜水会话。由 app.js 每帧调用一次，**不分当前在哪一屏**：
   * 切走了氧气照样扣（只是没人给方向输入），会话结束也照样结算入袋 / 掉血。
   * dt 用真实秒 —— 潜水是手感活儿，不跟游戏倍速走。返回推进后的会话（没在潜就是 null）。
   */
  step(ctx, controllable = true) {
    const s = ctx.state;
    const session = s.explore.dive;
    if (!session?.ok || session.done || !s.meta.started) return session || null;

    const input = controllable ? inputOf(ctx) : { x: 0, y: 0, surface: false };
    const next = diveStep(session, input, Math.min(0.05, ctx.dt));
    if (!next.done) {
      ctx.store.replace({ ...s, explore: { ...s.explore, dive: next } });
      return next;
    }

    ctx.store.replace(finishDive(s, next));
    ctx.sfx(next.alive ? "hook" : "hit");
    const where = controllable ? "" : "（你人在别的屏，氧气可没停）";
    ctx.toast(
      next.alive
        ? `上浮成功，捞回 ${next.loot.length} 件深海货。${where}`
        : `被鲨鱼贴脸了，掉了 18 血。${where}${quip()}`,
      next.alive ? "good" : "bad",
    );
    return null;
  },

  mount(ctx) {
    const el = h("section", {}, [
      h("h2", { text: "深海" }),
      h("p", { class: "cww-hint", id: "dive-hint" }),
      h("div", { class: "cww-meter", id: "dive-o2" }, [h("i"), h("em")]),
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
    const hasDock = s.buildings.some((b) => b.type === "dive_dock");
    const session = s.explore.dive;

    const active = !!session?.ok && !session.done;
    setClass(ctx.refs.diveLayer, "on", active && s.meta.screen === "dive");

    const zone = DIVE_ZONES[session?.zone || "wreck"];
    setText(
      r.hint,
      !hasDock
        ? "得先造潜水船坞，徒手下去只能喂鱼。"
        : active
          ? `${session.zoneName || zone?.name || "海底"}：${zone?.flavor || "氧气不等人，捡完就上。"}`
          : "氧气有限，鲨鱼没有。捡到东西记得回浅水区上浮。",
    );

    const o2max = active ? session.oxygenMax || 100 : 100;
    const o2 = active ? Math.max(0, session.oxygen) : 0;
    setStyle(r.o2fill, "width", `${((o2 / o2max) * 100).toFixed(1)}%`);
    setClass(r.o2, "low", active && o2 / o2max < 0.35);
    setText(r.o2label, active ? `氧气 ${Math.ceil(o2)} / ${Math.round(o2max)}` : "氧气 —— 未下潜");
    setText(
      r.stat,
      active
        ? `深度 ${Math.round(session.depth)} / ${Math.round(depthOf(session))} 米 · 已捡 ${session.loot.length} 件 · 剩余点位 ${session.nodes.length} · 气泡 ${(session.bubbles || []).length}`
        : `潜水船坞：${hasDock ? "已就绪" : "未建造"} · 深海是蓝图与传说碎片的主要来源。`,
    );
    setDisabled(r.start, !hasDock || active);
    setDisabled(r.up, !active);

    if (!active || !stage) return;

    const max = depthOf(session);
    rebuildIf(stage.nodes, session.nodes.map((n) => n.id).join(","), () =>
      session.nodes.map((n) =>
        h("div", {
          class: `cww-node${n.res === "blueprint" || n.res === "shard" ? " rare" : ""}${n.kind === "wreck" ? " wreck" : ""}`,
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

  action(ctx, act) {
    if (act === "dive-start") {
      const session = startDive(ctx.state, "wreck");
      if (!session.ok) {
        ctx.toast(`${session.reason} ${quip()}`, "bad");
        ctx.sfx("deny");
        return true;
      }
      ctx.store.replace({ ...ctx.state, explore: { ...ctx.state.explore, dive: session } });
      ctx.sfx("dive");
      ctx.toast(`下水了。氧气 ${Math.round(session.oxygenMax || 100)}，别贪。`);
      return true;
    }
    if (act === "dive-up") {
      const s = ctx.state;
      const session = s.explore.dive;
      if (!session?.ok) return true;
      if (session.depth >= SURFACE_DEPTH) {
        ctx.toast("太深了，先游回水面那层再上浮。", "bad");
        return true;
      }
      ctx.store.replace(finishDive(s, { ...session, done: true }));
      ctx.sfx("hook");
      ctx.toast(`上来了，带回 ${session.loot.length} 件货：${session.loot.map((n) => `${resName(n.res)}×${num(n.n)}`).join(" · ") || "两手空空"}。`, "good");
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
    const session = ctx.state.explore.dive;
    if (session?.ok && !session.done) {
      ctx.toast(`人还在水下！氧气 ${Math.ceil(Math.max(0, session.oxygen))} 还在扣，左上角有回去的按钮。`, "bad");
    }
  },
};
