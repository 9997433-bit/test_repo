import { announce, button, el } from "./dom.js";
import * as beasts from "../progression/beasts.js";

/**
 * 枢纽的灵兽栏：收伏 / 合成 / 洗练 / 放生四门都收在这一张卡里。
 *
 * 三栏塞满异种灵兽时既合不成也收不了新兽，这道死锁只能靠放生解开；
 * 但放生的数值（返还多少）属于养成层，UI 不替它定价：
 * `progression/beasts.js` 一旦导出 releaseBeast 就直接调它，
 * 没导出时才退回本地的「只腾栏位、不动资源」兜底，绝不自己发钱。
 */

const PASSIVE_TEXT = {
  crit: (v) => `暴击率 +${Math.round(v * 1000) / 10}%`,
  qiRegen: (v) => `每秒回气 +${Math.round(v * 10) / 10}`,
  shield: (v) => `护盾符 +${Math.round(v)}`,
};

export function passiveLabel(beast) {
  const passive = beast?.passive;
  if (!passive) return "无被动";
  const value = Number.isFinite(beast.value) ? beast.value : beasts.beastValue(passive, beast.star || 1);
  return PASSIVE_TEXT[passive] ? PASSIVE_TEXT[passive](value) : `${passive} ${value}`;
}

export function starText(star = 1) {
  const n = Math.min(beasts.MAX_STAR, Math.max(1, star || 1));
  return "★".repeat(n) + "☆".repeat(Math.max(0, beasts.MAX_STAR - n));
}

/** 只腾栏位、不碰资源的兜底放生。养成层导出 releaseBeast 后这条路就不再走。 */
export function releaseFallback(save, uid) {
  const owned = save?.beasts || [];
  const target = owned.find((b) => b.uid === uid);
  if (!target) return { ...save, notice: "未找到该灵兽。" };
  return {
    ...save,
    beasts: owned.filter((b) => b.uid !== uid),
    notice: `已放生「${target.name}」，腾出一栏。`,
  };
}

/** 探测养成层导出：有 releaseBeast 就用它，没有才用兜底。 */
export function resolveReleaseBeast(mod = beasts) {
  return typeof mod?.releaseBeast === "function" ? mod.releaseBeast : releaseFallback;
}

/** 放生返还同样只从养成层读；表里没有就不在 UI 上许诺任何返还。 */
export function releaseRefund(mod = beasts) {
  return Number.isFinite(mod?.RELEASE_REFUND) && mod.RELEASE_REFUND > 0 ? mod.RELEASE_REFUND : null;
}

export function beastPanel({ store, navigate }) {
  const save = store.get();
  const owned = save.beasts || [];
  const cap = beasts.BEAST_CAP;

  /** 选中的 uid，最多两只：第一只是主兽，第二只是祭品。 */
  let picked = [];
  let confirmRelease = null;

  const picks = new Map();
  const hint = el("p", { class: "muted beast-hint", role: "status" });

  const list = owned.length
    ? el(
        "ul",
        { class: "beast-list", "aria-label": "已收灵兽" },
        owned.map((beast) => {
          const node = button(
            {
              class: "beast-pick",
              "aria-pressed": "false",
              onclick: () => toggle(beast.uid),
            },
            [
              el("span", { class: "beast-name" }, [
                el("strong", { text: beast.name }),
                el("span", { class: "beast-star", "aria-hidden": "true", text: starText(beast.star) }),
              ]),
              el("span", { class: "muted beast-passive", text: passiveLabel(beast) }),
              el("span", { class: "muted beast-lore", text: beast.lore || "" }),
            ],
          );
          picks.set(beast.uid, { node, beast });
          return el("li", { class: "beast-cell" }, [node]);
        }),
      )
    : el("p", { class: "muted", text: `尚无灵兽。收伏一只可添一份被动，最多 ${cap} 栏。` });

  const catchBtn = button({
    text: `收伏 · 包子 ${beasts.CATCH_COST.buns} 或丹 ${beasts.CATCH_COST.qiPills}`,
    onclick: () => {
      if (owned.length >= cap) {
        announce(`灵兽栏已满，放生一只才能再收。`, { assertive: true });
        return;
      }
      commit(beasts.catchBeast(store.get()));
    },
  });

  const evolveBtn = button({ class: "beast-act", onclick: () => doEvolve() });
  const rerollBtn = button({ class: "beast-act", onclick: () => doReroll() });
  const releaseBtn = button({ class: "beast-act beast-release", onclick: () => doRelease() });

  const section = el("section", { class: "card beast-card", "aria-labelledby": "hub-beasts" }, [
    el("h3", { id: "hub-beasts", text: `灵兽 · ${owned.length} / ${cap}` }),
    list,
    el("div", { class: "row beast-actions" }, [catchBtn, evolveBtn, rerollBtn, releaseBtn]),
    hint,
  ]);

  paint();
  return section;

  function toggle(uid) {
    confirmRelease = null;
    if (picked.includes(uid)) picked = picked.filter((x) => x !== uid);
    // 选第三只时顶掉最早的那只，玩家不必先手动取消。
    else picked = [...picked, uid].slice(-2);
    paint();
  }

  function selected() {
    return picked.map((uid) => picks.get(uid)?.beast).filter(Boolean);
  }

  function commit(next) {
    store.set(next);
    if (next?.notice) announce(next.notice);
    navigate("hub");
  }

  function doEvolve() {
    const [main, fodder] = selected();
    if (!main || !fodder) {
      announce("合成需先选中两只同种同星的灵兽。", { assertive: true });
      return;
    }
    commit(beasts.evolveBeast(store.get(), main.uid, fodder.uid));
  }

  function doReroll() {
    const [only, extra] = selected();
    if (!only || extra) {
      announce("洗练一次只能对一只灵兽。", { assertive: true });
      return;
    }
    commit(beasts.rerollPassive(store.get(), only.uid));
  }

  function doRelease() {
    const [only, extra] = selected();
    if (!only || extra) {
      announce("放生一次只能选一只灵兽。", { assertive: true });
      return;
    }
    // 放生不可撤销，先要一次确认；再点同一只才真的放。
    if (confirmRelease !== only.uid) {
      confirmRelease = only.uid;
      paint();
      announce(`再按一次即放生「${only.name}」。`, { assertive: true });
      return;
    }
    confirmRelease = null;
    const release = resolveReleaseBeast();
    const next = release(store.get(), only.uid);
    commit(next?.notice ? next : { ...next, notice: `已放生「${only.name}」。` });
  }

  function paint() {
    for (const [uid, { node, beast }] of picks) {
      const on = picked.includes(uid);
      node.setAttribute("aria-pressed", on ? "true" : "false");
      node.classList.toggle("is-picked", on);
      node.setAttribute(
        "aria-label",
        `${beast.name}，${beast.star || 1} 星，${passiveLabel(beast)}${on ? "，已选中，按下取消" : "，按下选中"}`,
      );
    }

    const chosen = selected();
    const full = owned.length >= cap;
    const pay = beasts.catchPayment(store.get());
    setAct(catchBtn, !full && Boolean(pay), full ? "灵兽栏已满，先放生一只" : pay ? "" : "包子与灵气丹都不够");

    const evolvable = evolveCheck(chosen, store.get());
    evolveBtn.textContent = chosen.length === 2 ? `合成 · 丹 ${beasts.evolveCost(chosen[0].star || 1)}` : "合成";
    setAct(evolveBtn, evolvable.ok, evolvable.why);

    rerollBtn.textContent = `洗练 · 丹 ${beasts.REROLL_COST}`;
    const canReroll = chosen.length === 1 && (store.get().qiPills || 0) >= beasts.REROLL_COST;
    setAct(rerollBtn, canReroll, chosen.length === 1 ? `灵气丹不足 ${beasts.REROLL_COST}` : "选一只灵兽");

    const refund = releaseRefund();
    const target = chosen.length === 1 ? chosen[0] : null;
    const confirming = Boolean(target) && confirmRelease === target.uid;
    releaseBtn.textContent = confirming
      ? `确认放生「${target.name}」`
      : refund
        ? `放生 · 返包子 ${refund}`
        : "放生";
    releaseBtn.classList.toggle("is-confirming", confirming);
    setAct(releaseBtn, Boolean(target), "选一只灵兽");

    hint.textContent = hintText(chosen, evolvable, confirming, target);
  }

  function setAct(node, enabled, why) {
    node.setAttribute("aria-disabled", enabled ? "false" : "true");
    node.dataset.why = enabled ? "" : why || "";
  }

  function hintText(chosen, evolvable, confirming, target) {
    const refund = releaseRefund();
    if (confirming) {
      return `放生「${target.name}」不可撤销${refund ? `，返还包子 ${refund}` : ""}，再按一次确认。`;
    }
    if (!owned.length) return `收伏需包子 ${beasts.CATCH_COST.buns}，不足时改用灵气丹 ${beasts.CATCH_COST.qiPills}。`;
    if (!chosen.length) return "点灵兽卡选中：选两只同种同星可合成，选一只可洗练或放生。";
    if (chosen.length === 2) return evolvable.ok ? `合成后晋 ${(chosen[0].star || 1) + 1} 星，祭品消失，腾出一栏。` : evolvable.why;
    return `已选「${chosen[0].name}」：洗练必换一种被动；三栏异种时放生可腾栏${refund ? `并返还包子 ${refund}` : ""}。`;
  }
}

function evolveCheck(chosen, save) {
  if (chosen.length !== 2) return { ok: false, why: "选两只同种同星的灵兽" };
  const [main, fodder] = chosen;
  if (main.id !== fodder.id) return { ok: false, why: "只有同种灵兽可以合成。" };
  if ((main.star || 1) !== (fodder.star || 1)) return { ok: false, why: "需同星灵兽方可合成。" };
  if ((main.star || 1) >= beasts.MAX_STAR) return { ok: false, why: `已至 ${beasts.MAX_STAR} 星，无法再合成。` };
  const cost = beasts.evolveCost(main.star || 1);
  if ((save.qiPills || 0) < cost) return { ok: false, why: `合成需灵气丹 ${cost}。` };
  return { ok: true, why: "" };
}
