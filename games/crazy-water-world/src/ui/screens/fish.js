// 钓鱼屏：节奏条。指针来回扫，窗口只画成高亮区——绝不把数字写出来泄底
// （data/fish.js FISHING_RULES.windowHidden 的口径）。
import { castLine, resolveHook } from "../../explore/index.js";
import { FISHING_RULES } from "../../data/fish.js";
import { WEATHERS } from "../../data/weather.js";
import { h, setText, setClass, setDisabled, setStyle } from "../dom.js";
import { num, quip, resName, weatherName } from "../copy.js";

const HOOK_LINES = ["漂亮，这一杆有手感。", "稳。老大今天状态在线。", "上钩了，晚饭有着落。"];
const MISS_LINES = ["空军。手比脑子慢半拍。", "跑了。就当是放生。", "差一点点——这话你说了三遍了。"];

let lineCursor = 0;

// 0 → 1 → 0 的三角波：一个来回 = sweep 秒。
function needleAt(elapsed, sweep) {
  const u = (elapsed / sweep) % 1;
  return u <= 0.5 ? u * 2 : 2 - u * 2;
}

function sweepOf(cast) {
  return FISHING_RULES.barSweepSec / (cast?.fish?.bar || 1);
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
        h("span", { class: "cww-hint", text: "空格 / F 一键抛收" }),
      ]),
      h("div", { class: "cww-catch", id: "fish-catch" }),
      h("p", { class: "cww-hint", id: "fish-sea" }),
    ]);
    ctx.refs.fish = {
      hint: el.querySelector("#fish-hint"),
      track: el.querySelector("#fish-track"),
      zone: el.querySelector("#fish-zone"),
      core: el.querySelector("#fish-core"),
      needle: el.querySelector("#fish-needle"),
      cast: el.querySelector("#fish-cast"),
      hook: el.querySelector("#fish-hook"),
      catch: el.querySelector("#fish-catch"),
      sea: el.querySelector("#fish-sea"),
    };
    return el;
  },

  update(ctx) {
    const s = ctx.state;
    const f = ctx.ui.fish;
    const r = ctx.refs.fish;
    const hasChair = s.buildings.some((b) => b.type === "fish_chair");
    const weather = WEATHERS[s.world.weather];

    if (f.cooldown > 0) f.cooldown = Math.max(0, f.cooldown - ctx.dt);
    if (f.cast) {
      f.elapsed += ctx.dt;
      f.pos = needleAt(f.elapsed, f.sweep);
    }

    setClass(r.track, "idle", !f.cast);
    setStyle(r.needle, "left", `${(f.pos * 100).toFixed(2)}%`);
    setStyle(r.zone, "display", f.cast ? "block" : "none");
    if (f.cast) {
      const [a, b] = f.cast.window;
      const mid = (a + b) / 2;
      const half = ((b - a) * FISHING_RULES.perfectRatio) / 2;
      setStyle(r.zone, "left", `${(a * 100).toFixed(2)}%`);
      setStyle(r.zone, "width", `${((b - a) * 100).toFixed(2)}%`);
      setStyle(r.core, "left", `${(((mid - half - a) / (b - a)) * 100).toFixed(2)}%`);
      setStyle(r.core, "width", `${((half * 2 / (b - a)) * 100).toFixed(2)}%`);
    }

    setText(
      r.hint,
      !hasChair
        ? "先在木筏上搭一把钓鱼椅，摸鱼得有工位。"
        : f.cast
          ? "指针进绿区就收杆，中间的金条是完美区。"
          : f.cooldown > 0
            ? `线缠了，${f.cooldown.toFixed(1)} 秒后能重抛。`
            : "抛竿，然后盯住指针。窗口位置每条鱼都不一样。",
    );
    setDisabled(r.cast, !hasChair || !!f.cast || f.cooldown > 0);
    setDisabled(r.hook, !f.cast);

    const last = s.explore.fishing.lastCatch;
    setClass(r.catch, "hit", !!last && !last.miss);
    setClass(r.catch, "miss", !!last && !!last.miss);
    setText(r.catch, last ? (last.miss ? `${last.name} 跑了` : `${f.perfect ? "完美！" : "上钩！"}${last.name}`) : "");

    const deep = s.buildings.some((b) => b.type === "dive_dock");
    setText(
      r.sea,
      `当前海域：近海${deep ? " + 远洋 + 深海（船坞已开）" : "（造潜水船坞可钓远洋/深海）"} · 天气 ${weatherName(s.world.weather)}${weather && weather.fishing === 0 ? "，鱼今天罢工" : ""}`,
    );
  },

  action(ctx, act) {
    const f = ctx.ui.fish;
    if (act === "cast") {
      if (f.cast || f.cooldown > 0) return true;
      const cast = castLine(ctx.state);
      if (!cast.ok) {
        ctx.toast(`${cast.reason} ${quip()}`, "bad");
        ctx.sfx("deny");
        return true;
      }
      f.cast = cast;
      f.elapsed = 0;
      f.sweep = sweepOf(cast);
      f.pos = 0;
      f.perfect = false;
      ctx.sfx("cast");
      ctx.toast("抛出去了。盯紧指针，老大。");
      return true;
    }
    if (act === "hook") {
      if (!f.cast) return true;
      const cast = f.cast;
      const timing = f.pos;
      const [a, b] = cast.window;
      const hit = timing >= a && timing <= b;
      const mid = (a + b) / 2;
      const perfect = hit && Math.abs(timing - mid) <= ((b - a) * FISHING_RULES.perfectRatio) / 2;
      const next = resolveHook(ctx.state, cast, timing);
      f.cast = null;
      f.perfect = perfect;
      f.cooldown = hit ? 0 : FISHING_RULES.missCooldownSec;
      ctx.store.replace(next);
      ctx.sfx(hit ? "hook" : "deny");
      lineCursor += 1;
      if (hit) {
        const gain = Object.entries(cast.fish.value)
          .map(([k, v]) => `${resName(k)}×${num(v)}`)
          .join(" · ");
        ctx.toast(`${perfect ? "完美收杆！" : "上钩！"}${cast.fish.name} → ${gain}。${HOOK_LINES[lineCursor % HOOK_LINES.length]}`, "good");
      } else {
        ctx.toast(`${cast.fish.name}跑了。${MISS_LINES[lineCursor % MISS_LINES.length]}`, "bad");
      }
      return true;
    }
    return false;
  },

  key(ctx, k) {
    if (k === " " || k === "f") {
      fishScreen.action(ctx, ctx.ui.fish.cast ? "hook" : "cast");
      return true;
    }
    return false;
  },

  leave(ctx) {
    // 换屏就把线收了，免得回来时指针还在跑。
    ctx.ui.fish.cast = null;
  },
};
