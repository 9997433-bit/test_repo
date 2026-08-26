// 木筏屏：拾荒引导 + 居民订单 + 吃喝。玩家的「家」。
import { h, setText, setDisabled, setHidden, rebuildIf } from "../dom.js";
import { failLine, num, quip, resName } from "../copy.js";
import { fulfillOrder, orderOf } from "../orders.js";

const EAT_LINES = [
  "干了这碗鱼汤，老大明天还是好汉。",
  "吃饱了才有力气捞垃圾。",
  "这顿算工伤补贴。",
];

let eatCursor = 0;

export const raftScreen = {
  id: "raft",

  mount(ctx) {
    const el = h("section", { class: "cww-screen" }, [
      h("h2", { text: "木筏" }),
      h("p", {
        class: "cww-hint",
        id: "raft-lead",
        text: "点海面上的闪光物就能捞上来，稀有货带金圈。",
      }),
      h("div", { class: "cww-card", id: "raft-order" }),
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "eat", id: "raft-eat", text: "吃饭喝水" }),
        h("button", { "data-act": "goto-build", text: "去建造" }),
      ]),
      h("p", { class: "cww-hint", id: "raft-stat" }),
    ]);
    ctx.refs.raft = {
      lead: el.querySelector("#raft-lead"),
      order: el.querySelector("#raft-order"),
      eat: el.querySelector("#raft-eat"),
      stat: el.querySelector("#raft-stat"),
    };
    return el;
  },

  update(ctx) {
    const s = ctx.state;
    const r = ctx.refs.raft;
    const flot = s.explore.salvage.flotsam;
    const rare = flot.filter((f) => f.rare).length;
    setText(
      r.lead,
      flot.length
        ? `海面上飘着 ${flot.length} 件东西${rare ? `（${rare} 件稀有闪光）` : ""}，点它捞回来。`
        : "海面暂时干净。等等，垃圾自己会来的。",
    );

    const order = orderOf(s);
    setHidden(r.order, !order);
    if (order) {
      const have = s.resources[order.want] || 0;
      const enough = have >= order.qty;
      rebuildIf(r.order, `${order.residentId}|${order.want}|${order.qty}`, () => [
        h("b", { text: `${order.residentName} 的订单` }),
        h("p", { text: `要 ${resName(order.want)} ×${order.qty}，回报 ${order.rewardExp} 经验${order.rewardLine ? ` + ${order.rewardLine}` : ""}。` }),
        h("button", { "data-act": "order", id: "raft-order-btn", text: "交货" }),
        h("span", { class: "cww-tag", id: "raft-order-have" }),
      ]);
      setText(r.order.querySelector("#raft-order-have"), `库存 ${num(have)}/${order.qty}`);
      setDisabled(r.order.querySelector("#raft-order-btn"), !enough);
    }

    const canEat = s.resources.meal >= 1 || s.resources.fillet >= 1 || s.resources.rawFish >= 1;
    setDisabled(r.eat, !canEat);
    setText(
      r.stat,
      `木筏 ${s.raft.width}×${s.raft.height} · 建筑 ${s.buildings.length} 座 · 居民 ${s.residents.length} 人 · 经验 ${num(s.player.exp)}/${s.player.level * 80}`,
    );
  },

  action(ctx, act) {
    if (act === "order") {
      const before = ctx.state;
      const next = fulfillOrder(before);
      if (next === before) {
        ctx.toast(`货不够，凑齐再来。${quip()}`, "bad");
        return true;
      }
      ctx.store.replace(next);
      ctx.sfx("order");
      ctx.toast(next.log[0], "good");
      return true;
    }
    if (act === "eat") {
      const s = ctx.state;
      const pick = s.resources.meal >= 1 ? "meal" : s.resources.fillet >= 1 ? "fillet" : s.resources.rawFish >= 1 ? "rawFish" : null;
      if (!pick) {
        ctx.toast(failLine({ message: "厨房空了，先去弄点吃的" }), "bad");
        return true;
      }
      const gain = pick === "meal" ? { hunger: 46, hp: 8 } : pick === "fillet" ? { hunger: 30, hp: 4 } : { hunger: 16, hp: 0 };
      const resources = { ...s.resources, [pick]: s.resources[pick] - 1 };
      const drank = resources.freshWater >= 1;
      if (drank) resources.freshWater -= 1;
      const line = EAT_LINES[eatCursor++ % EAT_LINES.length];
      ctx.store.replace({
        ...s,
        resources,
        player: {
          ...s.player,
          hunger: Math.min(100, s.player.hunger + gain.hunger),
          thirst: drank ? Math.min(100, s.player.thirst + 40) : s.player.thirst,
          hp: Math.min(100, s.player.hp + gain.hp),
        },
        log: [`吃了 ${resName(pick)}${drank ? " + 淡水" : ""}。${line}`, ...s.log].slice(0, 24),
      });
      ctx.sfx("order");
      ctx.toast(
        `${resName(pick)} 下肚${drank ? "，顺带灌了口淡水" : "（没水，噎得慌）"}。`,
        drank ? "good" : "",
      );
      return true;
    }
    if (act === "goto-build") {
      ctx.setScreen("build");
      return true;
    }
    return false;
  },
};
