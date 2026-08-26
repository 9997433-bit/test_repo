// 钓鱼屏：节奏条 + 鱼类图鉴。
// 这一竿的所有事实都在 state.explore.fishing.cast 上（beginCast 写、hookCast 收），
// UI 这层只留一只「本竿扫了几秒」的表演时钟——刷新、切屏、天气强制收杆都不会出现
// 「屏幕上还有竿子、state 里已经没有」的双轨。窗口只画高亮区，不写数字
// （data/fish.js FISHING_RULES.windowHidden 的口径）。
import { beginCast, castCursor, fishCodex, fishingHud, gradeCast, hookCast, GRADES } from "../../explore/index.js";
import { FISHING_RULES, SEAS } from "../../data/fish.js";
import { h, setText, setClass, setDisabled, setStyle, setHidden, setAttr, rebuildIf } from "../dom.js";
import { num, quip, resName, RARITY_LABEL } from "../copy.js";

const HOOK_LINES = ["漂亮，这一杆有手感。", "稳。老大今天状态在线。", "上钩了，晚饭有着落。"];
const MISS_LINES = ["空军。手比脑子慢半拍。", "跑了。就当是放生。", "差一点点——这话你说了三遍了。"];

let lineCursor = 0;

function castOf(state) {
  const cast = state.explore?.fishing?.cast;
  return cast?.ok ? cast : null;
}

function biteLine(mul) {
  if (!(mul > 0)) return "鱼今天罢工";
  if (mul > 1) return `咬钩 ×${mul.toFixed(1)}，好时候`;
  if (mul < 1) return `咬钩 ×${mul.toFixed(1)}，窗口收窄`;
  return "咬钩正常";
}

function seaLine(hud) {
  const names = hud.seas.map((id) => SEAS[id]?.name || id).join(" · ");
  return `开放海域：${names || "暂无"} · 天气 ${hud.weather}（${biteLine(hud.fishing)}）· 钓鱼椅 ${hud.chairLevel || 0} 级`;
}

function gainLine(gained) {
  return (
    Object.entries(gained || {})
      .map(([k, v]) => `${resName(k)}×${num(v)}`)
      .join(" · ") || "两手空空"
  );
}

function catchLine(last) {
  if (!last) return "";
  if (last.forced) return `${last.name}：天气强制收杆，不算空军`;
  if (last.miss) return `${last.name} 跑了`;
  const head = last.grade === GRADES.PERFECT ? "完美！" : "上钩！";
  return `${head}${last.name} → ${gainLine(last.gained)}${last.newEntry ? " · 图鉴 +1" : ""}`;
}

function rarityOf(entry) {
  return RARITY_LABEL[entry.rarity] || entry.rarity;
}

export const fishScreen = {
  id: "fish",

  mount(ctx) {
    const el = h("section", {}, [
      h("h2", { text: "钓鱼椅" }),
      h("p", { class: "cww-hint", id: "fish-hint" }),
      h("div", { class: "cww-rhythm" }, [
        h("div", { class: "cww-track idle", id: "fish-track" }, [
          h("div", { class: "cww-zone", id: "fish-zone", style: { display: "none" } }, [
            h("div", { class: "cww-zone-core", id: "fish-core" }),
          ]),
          h("div", { class: "cww-needle", id: "fish-needle" }),
        ]),
      ]),
      h("div", { class: "cww-row" }, [
        h("button", { "data-act": "cast", id: "fish-cast", class: "primary", text: "抛竿" }),
        h("button", { "data-act": "hook", id: "fish-hook", text: "收杆" }),
        h("button", { "data-act": "dex", id: "fish-dex-btn", "aria-pressed": "false", text: "图鉴" }),
        h("span", { class: "cww-hint", text: "空格 / F 一键抛收" }),
      ]),
      h("div", { class: "cww-catch", id: "fish-catch" }),
      h("p", { class: "cww-hint", id: "fish-sea" }),
      h("div", { class: "hidden", id: "fish-dex" }, [
        h("p", { class: "cww-hint", id: "fish-dex-sum" }),
        h("div", { class: "cww-dex", id: "fish-dex-grid" }),
      ]),
    ]);
    ctx.refs.fish = {
      hint: el.querySelector("#fish-hint"),
      track: el.querySelector("#fish-track"),
      zone: el.querySelector("#fish-zone"),
      core: el.querySelector("#fish-core"),
      needle: el.querySelector("#fish-needle"),
      cast: el.querySelector("#fish-cast"),
      hook: el.querySelector("#fish-hook"),
      dexBtn: el.querySelector("#fish-dex-btn"),
      catch: el.querySelector("#fish-catch"),
      sea: el.querySelector("#fish-sea"),
      dex: el.querySelector("#fish-dex"),
      dexSum: el.querySelector("#fish-dex-sum"),
      dexGrid: el.querySelector("#fish-dex-grid"),
    };
    return el;
  },

  /**
   * 每帧跑一次，**不分当前在哪一屏**（app.js 调）：推表演时钟，并盯住「不是老大按的」
   * 那次收杆——海啸把线收回来时（syncFishingWeather / hookCast 内部的强制分支）
   * 得有人开口解释，不然老大只会看到竿子凭空空了。
   */
  watch(ctx) {
    const s = ctx.state;
    const f = ctx.ui.fish;
    const fishing = s.explore.fishing || {};
    const cast = castOf(s);

    if (f.cooldown > 0) f.cooldown = Math.max(0, f.cooldown - ctx.dt);
    // 认对象引用而不是 id：同一 tick 内先收后抛也能把时钟归零。
    if (cast !== f.castRef) {
      f.castRef = cast;
      f.elapsed = 0;
      if (cast) f.pos = 0;
    }
    if (cast) {
      f.elapsed += ctx.dt;
      f.pos = castCursor(cast, f.elapsed);
    }

    const last = fishing.lastCatch || null;
    if (last !== f.seenCatch) {
      f.seenCatch = last;
      if (last?.forced) {
        f.cooldown = FISHING_RULES.missCooldownSec;
        ctx.sfx("alarm");
        ctx.toast(`${last.name}这杆废了：天气翻脸，线先收回来。命比鱼贵。`, "bad");
      }
    }
    return cast;
  },

  update(ctx) {
    const s = ctx.state;
    const f = ctx.ui.fish;
    const r = ctx.refs.fish;
    const hud = fishingHud(s);
    const cast = castOf(s);
    const grade = cast ? gradeCast(cast, f.pos) : null;

    setClass(r.track, "idle", !cast);
    setStyle(r.needle, "left", `${(f.pos * 100).toFixed(2)}%`);
    setClass(r.needle, "good", !!grade?.hit && !grade.perfect);
    setClass(r.needle, "perfect", !!grade?.perfect);
    setStyle(r.zone, "display", cast ? "block" : "none");
    if (cast) {
      const [a, b] = cast.window;
      const [pa, pb] = cast.perfect;
      const width = Math.max(1e-6, b - a);
      setStyle(r.zone, "left", `${(a * 100).toFixed(2)}%`);
      setStyle(r.zone, "width", `${(width * 100).toFixed(2)}%`);
      setStyle(r.core, "left", `${(((pa - a) / width) * 100).toFixed(2)}%`);
      setStyle(r.core, "width", `${(((pb - pa) / width) * 100).toFixed(2)}%`);
    }

    setText(
      r.hint,
      cast
        ? hud.fishing > 0
          ? "指针进绿区就收杆，中间的金条是完美区。"
          : `${hud.weather}：这杆随时会被强制收回，赶紧收。`
        : !hud.canCast
          ? hud.reason
          : f.cooldown > 0
            ? `线缠了，${f.cooldown.toFixed(1)} 秒后能重抛。`
            : "抛竿，然后盯住指针。窗口位置每条鱼都不一样。",
    );
    setClass(r.hint, "bad", (!cast && !hud.canCast) || (!!cast && !(hud.fishing > 0)));
    setDisabled(r.cast, !hud.canCast || !!cast || f.cooldown > 0);
    setDisabled(r.hook, !cast);

    const last = s.explore.fishing.lastCatch;
    setClass(r.catch, "hit", !!last && !last.miss);
    setClass(r.catch, "miss", !!last && !!last.miss);
    setText(r.catch, catchLine(last));
    setText(r.sea, seaLine(hud));

    const dex = fishCodex(s);
    setText(r.dexBtn, `图鉴 ${dex.known}/${dex.total}`);
    setAttr(r.dexBtn, "aria-pressed", f.dexOpen ? "true" : "false");
    setClass(r.dexBtn, "on", f.dexOpen);
    setHidden(r.dex, !f.dexOpen);
    if (!f.dexOpen) return;

    const here = dex.entries.filter((e) => e.available).length;
    setText(r.dexSum, `已收录 ${dex.known}/${dex.total} 种 · 当前海域可遇 ${here} 种 · 首钓那一条另给金币`);
    const sig = dex.entries.map((e) => `${e.known ? 1 : 0}${e.available ? 1 : 0}${e.caught}${e.perfect}`).join(",");
    rebuildIf(r.dexGrid, sig, () =>
      dex.entries.map((e) =>
        h("div", { class: `cww-dex-cell${e.known ? "" : " unknown"}${e.available ? " here" : ""}` }, [
          h("b", { text: e.known ? e.name : "？？？" }),
          h("span", { text: `${e.seaName} · ${rarityOf(e)}${e.available ? " · 在池" : ""}` }),
          h("span", {
            text: e.known
              ? `捕获 ${e.caught} · 完美 ${e.perfect} · ${gainLine(e.value)}`
              : e.encountered
                ? `见过 ${e.encountered} 次，还没钓上来`
                : "还没见过",
          }),
          e.known && e.lore ? h("i", { text: e.lore }) : null,
        ]),
      ),
    );
  },

  action(ctx, act) {
    const f = ctx.ui.fish;
    if (act === "dex") {
      f.dexOpen = !f.dexOpen;
      ctx.sfx("tap");
      return true;
    }
    if (act === "cast") {
      const s = ctx.state;
      if (castOf(s) || f.cooldown > 0) return true;
      const next = beginCast(s);
      // beginCast 不合规时原样返回：拒绝的理由问 fishingHud，UI 不复读解锁表。
      if (next === s) {
        ctx.toast(`${fishingHud(s).reason} ${quip()}`, "bad");
        ctx.sfx("deny");
        return true;
      }
      ctx.store.replace(next);
      ctx.sfx("cast");
      ctx.toast("抛出去了。盯紧指针，老大。");
      return true;
    }
    if (act === "hook") {
      const s = ctx.state;
      const cast = castOf(s);
      if (!cast) return true;
      const timing = f.pos;
      const next = hookCast(s, timing);
      const last = next.explore.fishing.lastCatch;
      f.seenCatch = last;
      f.cooldown = last?.miss ? FISHING_RULES.missCooldownSec : 0;
      ctx.store.replace(next);
      lineCursor += 1;

      if (last?.forced) {
        ctx.sfx("alarm");
        ctx.toast(`${cast.fish.name}这杆废了：天气不让钓，线先收回来。不算空军。`, "bad");
        return true;
      }
      if (last?.miss) {
        ctx.sfx("deny");
        ctx.toast(`${last.name}跑了。${MISS_LINES[lineCursor % MISS_LINES.length]}`, "bad");
        return true;
      }
      ctx.sfx(last.newEntry ? "rare" : "hook");
      const head = last.grade === GRADES.PERFECT ? "完美收杆！" : "上钩！";
      const dexTail = last.newEntry ? `图鉴 +1${last.bonus?.coins ? `，首钓 +${last.bonus.coins} 金币。` : "。"}` : "";
      ctx.toast(
        `${head}${last.name} → ${gainLine(last.gained)}。${dexTail}${HOOK_LINES[lineCursor % HOOK_LINES.length]}`,
        "good",
      );
      return true;
    }
    return false;
  },

  key(ctx, k) {
    if (k === " " || k === "f") {
      fishScreen.action(ctx, castOf(ctx.state) ? "hook" : "cast");
      return true;
    }
    if (k === "t") {
      fishScreen.action(ctx, "dex");
      return true;
    }
    return false;
  },

  // 换屏不再偷偷把线剪掉：竿子在 state 里继续挂着，左面板会挂一条提示，
  // 真正决定它命运的是天气（海啸强制收杆）。
  leave(ctx) {
    if (castOf(ctx.state)) {
      ctx.toast("线还留在水里。天气一翻脸就得强制收杆，左上角有回去的按钮。", "bad");
    }
  },
};
