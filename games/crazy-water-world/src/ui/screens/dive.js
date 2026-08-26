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
      h("p", { class: "cww-hint", text: "WASD / 方向键游动，空格在浅水区上浮收工。鲨鱼靠近会亮红圈。" }),
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
      h("div", { class: "cww-sharks", id: "dive-sharks" }),
      h("div", { class: "cww-danger", id: "dive-danger", style: { display: "none" } }),
      h("div", { class: "cww-diver", id: "dive-diver" }),
    ]);
    layer.append(arena);
    ctx.refs.diveStage = {
      arena,
      nodes: arena.querySelector("#dive-nodes"),
      sharks: arena.querySelector("#dive-sharks"),
      danger: arena.querySelector("#dive-danger"),
      diver: arena.querySelector("#dive-diver"),
    };
  },

  update(ctx) {
    const s = ctx.state;
    const r = ctx.refs.dive;
    const stage = ctx.refs.diveStage;
    const hasDock = s.buildings.some((b) => b.type === "dive_dock");
    let session = s.explore.dive;

    // 推进会话：dt 用真实秒，潜水是手感活儿，不跟游戏倍速走。
    if (session?.ok && !session.done && s.meta.started) {
      const next = diveStep(session, inputOf(ctx), Math.min(0.05, ctx.dt));
      if (next.done) {
        const after = finishDive(s, next);
        ctx.store.replace(after);
        ctx.sfx(next.alive ? "hook" : "hit");
        ctx.toast(
          next.alive
            ? `上浮成功，捞回 ${next.loot.length} 件深海货。`
            : `被鲨鱼贴脸了，掉了 18 血。${quip()}`,
          next.alive ? "good" : "bad",
        );
        session = null;
      } else {
        ctx.store.replace({ ...s, explore: { ...s.explore, dive: next } });
        session = next;
      }
    }

    const active = !!session?.ok && !session.done;
    setClass(ctx.refs.diveLayer, "on", active && s.meta.screen === "dive");

    const zone = DIVE_ZONES[session?.zone || "wreck"];
    setText(
      r.hint,
      !hasDock
        ? "得先造潜水船坞，徒手下去只能喂鱼。"
        : active
          ? `${zone?.name || "海底"}：${zone?.flavor || "氧气不等人，捡完就上。"}`
          : "氧气有限，鲨鱼没有。捡到东西记得回浅水区上浮。",
    );

    const o2 = active ? Math.max(0, session.oxygen) : 0;
    setStyle(r.o2fill, "width", `${o2.toFixed(1)}%`);
    setClass(r.o2, "low", active && o2 < 35);
    setText(r.o2label, active ? `氧气 ${Math.ceil(o2)}%` : "氧气 —— 未下潜");
    setText(
      r.stat,
      active
        ? `深度 ${Math.round(session.depth)} 米 · 已捡 ${session.loot.length} 件 · 剩余点位 ${session.nodes.length}`
        : `潜水船坞：${hasDock ? "已就绪" : "未建造"} · 深海是蓝图与传说碎片的主要来源。`,
    );
    setDisabled(r.start, !hasDock || active);
    setDisabled(r.up, !active);

    if (!active || !stage) return;

    rebuildIf(stage.nodes, session.nodes.map((n) => n.id).join(","), () =>
      session.nodes.map((n) =>
        h("div", {
          class: `cww-node${n.res === "blueprint" || n.res === "shard" ? " rare" : ""}`,
          title: `${resName(n.res)}×${n.n}`,
          style: {
            left: `${n.x}%`,
            top: `${(n.y / MAX_DEPTH) * 100}%`,
            background: RESOURCE_META[n.res]?.color || "#fff",
          },
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
      setStyle(node, "top", `${(sh.y / MAX_DEPTH) * 100}%`);
      setClass(node, "flip", sh.vx < 0);
    });

    setStyle(stage.diver, "left", `${session.x}%`);
    setStyle(stage.diver, "top", `${(session.depth / MAX_DEPTH) * 100}%`);
    const near = nearestShark(session);
    setStyle(stage.danger, "display", near < DANGER * 2.4 ? "block" : "none");
    setStyle(stage.danger, "left", `${session.x}%`);
    setStyle(stage.danger, "top", `${(session.depth / MAX_DEPTH) * 100}%`);
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
      ctx.toast("下水了。氧气 100，别贪。");
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

  // 换屏时把海底舞台收起来（会话留在 state 里，回来接着潜）。
  leave(ctx) {
    setClass(ctx.refs.diveLayer, "on", false);
  },
};
