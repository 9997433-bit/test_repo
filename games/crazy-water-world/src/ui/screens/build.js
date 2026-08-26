// 建造屏：落位预览（合法绿格 / 非法红格）、移动、升级、拆除、旋转、扩建。
// 所有判定都问 world 的 can* 前置检查，UI 不复刻一行规则。
import {
  canBuild,
  canDemolish,
  canExpand,
  canMove,
  canUpgrade,
  placeBuilding,
  moveBuilding,
  upgradeBuilding,
  demolishBuilding,
  expandRaft,
  footprint,
  footprintOf,
  seaLayout,
  canvasToCell,
} from "../../world/index.js";
import { BUILDINGS, UNLOCK_LEVEL } from "../../data/buildings.js";
import { h, setText, setClass, setDisabled, rebuildIf, clear } from "../dom.js";
import { costLine, failLine } from "../copy.js";

const MODES = [
  { id: "place", label: "放置" },
  { id: "move", label: "移动" },
  { id: "upgrade", label: "升级" },
  { id: "demolish", label: "拆除" },
];

const DIRS = [
  { dir: "right", label: "向右 →" },
  { dir: "down", label: "向下 ↓" },
  { dir: "left", label: "← 向左" },
  { dir: "up", label: "↑ 向上" },
];

function tileAt(state, x, y) {
  return state.raft.tiles[y]?.[x] || null;
}

function buildingAt(state, x, y) {
  const tile = tileAt(state, x, y);
  return tile ? state.buildings.find((b) => b.id === tile.buildingId) || null : null;
}

// 当前指针格对应的「预览」：足迹 + 是否合法 + 说明。
// 是纯函数：ghost 画什么、点下去会发生什么，用的是同一个判定。
export function previewOf(ctx) {
  const s = ctx.state;
  const b = ctx.ui.build;
  if (!b.hover) return null;
  const { x, y } = b.hover;

  if (b.mode === "place") {
    const check = canBuild(s, b.type, x, y, b.rot);
    return {
      cells: footprint(b.type, x, y, b.rot),
      ok: check.ok,
      check,
      label: check.ok ? `放下${BUILDINGS[b.type].name}` : check.message,
    };
  }

  if (b.mode === "move") {
    const moving = b.moveId ? s.buildings.find((it) => it.id === b.moveId) : null;
    if (!moving) {
      const target = buildingAt(s, x, y);
      return target
        ? { cells: footprintOf(target), ok: true, pick: true, label: `拿起${BUILDINGS[target.type]?.name || "建筑"}` }
        : { cells: [[x, y]], ok: false, label: "这儿没建筑可搬" };
    }
    const check = canMove(s, moving.id, x, y, b.rot);
    return {
      cells: footprint(moving.type, x, y, b.rot),
      ok: check.ok,
      check,
      label: check.ok ? `搬到这儿` : check.message,
    };
  }

  const target = buildingAt(s, x, y);
  if (!target) return { cells: [[x, y]], ok: false, label: "空地，没东西可选" };
  if (b.mode === "upgrade") {
    const check = canUpgrade(s, target.id);
    return {
      cells: footprintOf(target),
      ok: check.ok,
      check,
      label: check.ok ? `升到 ${check.level} 级 · ${costLine(check.cost)}` : check.message,
    };
  }
  const armed = b.armedId === target.id;
  return {
    cells: footprintOf(target),
    ok: false,
    demolish: true,
    label: armed ? "再点一次，真拆" : `拆 ${BUILDINGS[target.type]?.name || "建筑"}（退一半材料）`,
  };
}

function paintGhost(ctx) {
  const layer = ctx.refs.ghost;
  if (!layer) return;
  const s = ctx.state;
  const active = s.meta.screen === "build" && !s.explore.dive;
  const preview = active ? previewOf(ctx) : null;
  if (!preview) {
    if (layer.__sig !== "") {
      layer.__sig = "";
      clear(layer);
    }
    return;
  }

  const box = ctx.canvas.getBoundingClientRect();
  const layout = seaLayout(s, box.width || 1, box.height || 1);
  const cls = preview.pick ? "pick" : preview.demolish ? "bad" : preview.ok ? "ok" : "bad";
  const sig = `${cls}|${layout.cell}|${layout.ox}|${layout.oy}|${preview.label}|${preview.cells.map((c) => c.join(",")).join(";")}`;
  rebuildIf(layer, sig, () => {
    const nodes = preview.cells.map(([cx, cy]) =>
      h("div", {
        class: `cww-ghost-cell ${cls}`,
        style: {
          left: `${layout.ox + cx * layout.cell + 2}px`,
          top: `${layout.oy + cy * layout.cell + 2}px`,
          width: `${layout.cell - 4}px`,
          height: `${layout.cell - 4}px`,
        },
      }),
    );
    const [hx, hy] = preview.cells[0] || [0, 0];
    nodes.push(
      h("div", {
        class: `cww-ghost-label ${cls === "ok" || cls === "pick" ? "" : "bad"}`,
        text: preview.label,
        style: {
          left: `${layout.ox + hx * layout.cell + layout.cell / 2}px`,
          top: `${Math.max(22, layout.oy + hy * layout.cell)}px`,
        },
      }),
    );
    return nodes;
  });
}

function act(ctx) {
  const s = ctx.state;
  const b = ctx.ui.build;
  const preview = previewOf(ctx);
  if (!preview || !b.hover) return;
  const { x, y } = b.hover;

  if (b.mode === "place") {
    if (!preview.ok) {
      ctx.toast(failLine(preview.check), "bad");
      ctx.sfx("deny");
      return;
    }
    ctx.store.replace(placeBuilding(s, b.type, x, y, b.rot));
    ctx.sfx("build");
    ctx.toast(`${BUILDINGS[b.type].name}落成，花了 ${costLine(BUILDINGS[b.type].cost)}。`, "good");
    return;
  }

  if (b.mode === "move") {
    if (!b.moveId) {
      const target = buildingAt(s, x, y);
      if (!target) {
        ctx.toast("这儿没建筑，老大。", "bad");
        return;
      }
      b.moveId = target.id;
      b.rot = target.rot;
      ctx.toast(`拿起${BUILDINGS[target.type]?.name || "建筑"}，点新位置放下（R 旋转）。`);
      return;
    }
    if (!preview.ok) {
      ctx.toast(failLine(preview.check), "bad");
      ctx.sfx("deny");
      return;
    }
    ctx.store.replace(moveBuilding(s, b.moveId, x, y, b.rot));
    b.moveId = null;
    ctx.sfx("build");
    ctx.toast("挪好了。木筏也是要讲风水的。", "good");
    return;
  }

  const target = buildingAt(s, x, y);
  if (!target) {
    ctx.toast("空地一块，点建筑试试。", "bad");
    return;
  }

  if (b.mode === "upgrade") {
    const check = canUpgrade(s, target.id);
    if (!check.ok) {
      ctx.toast(failLine(check), "bad");
      ctx.sfx("deny");
      return;
    }
    ctx.store.replace(upgradeBuilding(s, target.id));
    ctx.sfx("build");
    ctx.toast(`${BUILDINGS[target.type]?.name} 升到 ${check.level} 级。`, "good");
    return;
  }

  if (b.armedId !== target.id) {
    b.armedId = target.id;
    ctx.toast("再点一次就真拆了，想清楚。", "bad");
    return;
  }
  const check = canDemolish(s, target.id);
  if (!check.ok) {
    ctx.toast(failLine(check), "bad");
    return;
  }
  b.armedId = null;
  ctx.store.replace(demolishBuilding(s, target.id));
  ctx.sfx("deny");
  ctx.toast("拆了，回收一半材料。当是交学费。");
}

export const buildScreen = {
  id: "build",

  mount(ctx) {
    const el = h("section", {}, [
      h("h2", { text: "建造" }),
      h("div", { class: "cww-row", id: "build-modes" },
        MODES.map((m) => h("button", { "data-act": "mode", "data-mode": m.id, text: m.label })),
      ),
      h("p", { class: "cww-hint", id: "build-hint" }),
      h("div", { class: "cww-grid", id: "build-grid" }),
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "rot", text: "旋转 R" }),
        h("span", { class: "cww-tag", id: "build-rot", text: "朝向 0°" }),
      ]),
      h("h2", { text: "扩建木筏" }),
      h("p", { class: "cww-hint", id: "build-expand-hint" }),
      h("div", { class: "cww-row", id: "build-dirs" },
        DIRS.map((d) => h("button", { "data-act": "expand", "data-dir": d.dir, text: d.label })),
      ),
    ]);

    const grid = el.querySelector("#build-grid");
    const cards = {};
    for (const def of Object.values(BUILDINGS)) {
      const card = h("button", { class: "cww-pick", "data-act": "pick", "data-type": def.id }, [
        h("b", { text: `${def.name} ${def.w}×${def.h}` }),
        h("span", { class: "cost", text: costLine(def.cost) }),
        h("span", { class: "state" }),
      ]);
      cards[def.id] = card;
      grid.append(card);
    }

    ctx.refs.build = {
      hint: el.querySelector("#build-hint"),
      rot: el.querySelector("#build-rot"),
      expandHint: el.querySelector("#build-expand-hint"),
      modes: [...el.querySelectorAll("#build-modes button")],
      dirs: [...el.querySelectorAll("#build-dirs button")],
      cards,
    };
    return el;
  },

  enter(ctx) {
    ctx.ui.build.armedId = null;
  },

  leave(ctx) {
    ctx.ui.build.hover = null;
    ctx.ui.build.moveId = null;
    ctx.ui.build.armedId = null;
    paintGhost(ctx);
  },

  update(ctx) {
    const s = ctx.state;
    const b = ctx.ui.build;
    const r = ctx.refs.build;

    for (const btn of r.modes) setClass(btn, "primary", btn.dataset.mode === b.mode);
    setText(
      r.hint,
      b.mode === "place"
        ? `选好建筑，把指针移到木筏上：绿格能放，红格不行。当前 ${BUILDINGS[b.type].name}。`
        : b.mode === "move"
          ? b.moveId
            ? "已拿起建筑，点目标位置放下。R 旋转。"
            : "点一座建筑把它拿起来。"
          : b.mode === "upgrade"
            ? "点建筑升级，费用见预览标签。"
            : "点建筑两次拆除，退一半材料。",
    );
    setText(r.rot, `朝向 ${b.rot}°`);

    for (const [id, card] of Object.entries(r.cards)) {
      const def = BUILDINGS[id];
      const need = UNLOCK_LEVEL[id] || 1;
      const locked = s.player.level < need;
      const poor = Object.entries(def.cost).some(([k, v]) => (s.resources[k] || 0) < v);
      setClass(card, "on", b.mode === "place" && b.type === id);
      setClass(card, "poor", locked || poor);
      setText(card.querySelector(".state"), locked ? `需 ${need} 级` : poor ? "材料不够" : def.unique && s.buildings.some((x) => x.type === id) ? "已建成" : "可建");
    }

    const expand = canExpand(s, "right");
    setText(
      r.expandHint,
      expand.ok
        ? `当前 ${s.raft.width}×${s.raft.height}，下一格 ${costLine(expand.cost)}。`
        : `当前 ${s.raft.width}×${s.raft.height}。${expand.message}。`,
    );
    for (const btn of r.dirs) setDisabled(btn, !canExpand(s, btn.dataset.dir).ok);

    paintGhost(ctx);
  },

  action(ctx, actName, el) {
    const b = ctx.ui.build;
    if (actName === "mode") {
      b.mode = el.dataset.mode;
      b.moveId = null;
      b.armedId = null;
      return true;
    }
    if (actName === "pick") {
      b.mode = "place";
      b.type = el.dataset.type;
      const need = UNLOCK_LEVEL[b.type] || 1;
      if (ctx.state.player.level < need) ctx.toast(`${BUILDINGS[b.type].name}要 ${need} 级才解锁。先攒经验，老大。`, "bad");
      return true;
    }
    if (actName === "rot") {
      b.rot = b.rot === 0 ? 90 : 0;
      return true;
    }
    if (actName === "expand") {
      const dir = el.dataset.dir;
      const check = canExpand(ctx.state, dir);
      if (!check.ok) {
        ctx.toast(failLine(check), "bad");
        return true;
      }
      ctx.store.replace(expandRaft(ctx.state, dir));
      ctx.sfx("build");
      ctx.toast(`木筏扩建，花了 ${costLine(check.cost)}。`, "good");
      return true;
    }
    return false;
  },

  key(ctx, k) {
    if (k === "r") {
      ctx.ui.build.rot = ctx.ui.build.rot === 0 ? 90 : 0;
      ctx.toast(`朝向 ${ctx.ui.build.rot}°`);
      return true;
    }
    if (k === "escape" && (ctx.ui.build.moveId || ctx.ui.build.armedId)) {
      ctx.ui.build.moveId = null;
      ctx.ui.build.armedId = null;
      ctx.toast("放下了，什么都没动。");
      return true;
    }
    return false;
  },

  sea(ctx, kind, ev) {
    const b = ctx.ui.build;
    if (kind === "leave") {
      b.hover = null;
      return true;
    }
    const cell = canvasToCell(ctx.canvas, ctx.state, ev.clientX, ev.clientY);
    b.hover = cell;
    if (kind !== "down") return true;

    // 触控没有 hover：第一下先给预览，位置对了再点第二下确认。
    const coarse = ev.pointerType === "touch" || ev.pointerType === "pen";
    const key = `${cell.x},${cell.y}`;
    if (coarse && b.pending !== key) {
      b.pending = key;
      const preview = previewOf(ctx);
      if (preview) ctx.toast(preview.ok ? `${preview.label}：再点一次确认` : preview.label, preview.ok ? "" : "bad");
      return true;
    }
    b.pending = null;
    act(ctx);
    return true;
  },
};
