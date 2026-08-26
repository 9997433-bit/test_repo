import { SAVE_KEY, pref } from "../../core/store.js";
import { button, el } from "../dom.js";
import { screenHeader } from "../widgets.js";

function toggle(label, desc, value, onChange) {
  const input = el("input", { type: "checkbox", checked: value });
  input.addEventListener("change", () => onChange(input.checked));
  return el("label", { class: "toggle" }, [
    el("div", {}, [el("b", { text: label }), el("span", { class: "muted small", text: desc })]),
    el("span", { class: "switch" }, [input, el("i", {})]),
  ]);
}

export const settingsScreen = {
  id: "settings",
  mount(app, root) {
    const s = app.save.settings;
    const set = (k, v) => {
      s[k] = v;
      app.persist();
      app.audio.play("ui");
    };

    root.append(
      screenHeader(app, "设置", `存档键 ${SAVE_KEY}`),
      el("div", { class: "scroll-body" }, [
        toggle("音效", "WebAudio 实时合成，无外部音频资产", pref(app.save, "sfx"), (v) => { set("sfx", v); app.audio.setSfx(v); }),
        toggle("背景音乐", "合成琶音循环", pref(app.save, "music"), (v) => { set("music", v); app.audio.setMusic(v); }),
        toggle("屏幕震动", "命中与爆炸时的镜头反馈", s.shake !== false, (v) => set("shake", v)),
        toggle("减少动态", "降低粒子数量，适合眩晕敏感", s.reduceMotion === true, (v) => set("reduceMotion", v)),
        toggle("弹道预测（3 次反弹）", "关闭后只显示 1 次反弹，难度更高", pref(app.save, "aimAssist"), (v) => set("aimAssist", v)),
        el("div", { class: "info-box" }, [
          el("h4", { text: "操作" }),
          el("ul", {}, [
            el("li", { text: "拖拽 / 触摸滑动：瞄准，松手发射" }),
            el("li", { text: "空格：发射；← → 微调角度；↑ ↓ 调整力度" }),
            el("li", { text: "1–5：切换上场英雄；Q：释放大招" }),
            el("li", { text: "Esc：暂停 / 返回" }),
          ]),
        ]),
        el("div", { class: "info-box" }, [
          el("h4", { text: "存档" }),
          el("p", { class: "muted small", text: `金币 ${Math.round(app.save.gold)} · 通关 ${app.save.adventureStage - 1} · 塔层 ${app.save.towerFloor} · 肉鸽最高 ${app.save.bestRogueWave} 波 · 讨伐最高 ${app.save.bestRaidDamage}` }),
          button("清空存档", () => {
            app.modal((box, close) => {
              box.append(
                el("h3", { text: "确认清空存档？" }),
                el("p", { class: "muted small", text: "所有养成、进度与图鉴都会重置，且无法撤销。" }),
                el("div", { class: "detail-actions" }, [
                  button("确认清空", () => { app.reset(); close(); app.toast("存档已重置"); app.navigate("menu", {}, { replace: true }); }, { variant: "danger" }),
                  button("取消", close, { variant: "ghost" }),
                ]),
              );
            });
          }, { variant: "danger" }),
        ]),
        el("p", { class: "caps-line", text: `版本 ${app.version} · 模块状态 ${app.caps}` }),
        el("div", { class: "row-actions" }, [button("返回", () => app.back(), { variant: "ghost" })]),
      ]),
    );

    return { onKey(e) { if (e.key === "Escape") app.back(); } };
  },
};
