import { BUFF_LABEL, SEAS, createFishing, fishReward } from "../../modes/index.js";
import { button, clear, el } from "../dom.js";
import { screenHeader } from "../widgets.js";

export const fishingScreen = {
  id: "fishing",
  mount(app, root) {
    const body = el("div", { class: "scroll-body" });
    root.append(screenHeader(app, "佛系钓鱼", "节奏收杆 · 钓怪物球换战斗 BUFF"), body);

    let session = null;
    let marker = null;
    let zone = null;
    let statusText = null;

    function seaSelect() {
      clear(body).append(
        el("p", { class: "hint", text: "标记来回移动，在绿色判定区内收杆。正中心为完美（3 分），边缘 1 分。5 次机会。" }),
        app.save.fishBuff
          ? el("p", { class: "buff-note", text: `当前渔获：${app.save.fishBuff.name}（剩余 ${app.save.fishBuff.battles} 场）` })
          : null,
        el("div", { class: "sea-list" },
          SEAS.map((sea) =>
            el("button", { type: "button", class: `sea-card theme-${sea.theme}`, onclick: () => start(sea.id) }, [
              el("b", { text: sea.name }),
              el("span", { class: "muted small", text: sea.desc }),
              el("span", { class: "muted small", text: `判定区 ${Math.round(sea.zone * 100)}% · 速度 ×${sea.speed}` }),
            ]),
          ),
        ),
        el("div", { class: "row-actions" }, [button("返回", () => app.back(), { variant: "ghost" })]),
      );
    }

    function start(seaId) {
      app.audio.play("ui");
      session = createFishing(seaId);
      session.reroll();
      zone = el("i", { class: "fish-zone" });
      marker = el("i", { class: "fish-marker" });
      statusText = el("p", { class: "fish-status", text: `剩余 ${session.castsLeft} 次 · 得分 ${session.score}` });
      const track = el("div", { class: "fish-track", onclick: () => strike() }, [zone, marker]);
      clear(body).append(
        el("h3", { text: session.sea.name }),
        track,
        statusText,
        el("div", { class: "row-actions" }, [
          button("收杆！（空格）", () => strike(), { variant: "primary", icon: "🎣" }),
          button("放弃", () => { session = null; seaSelect(); }, { variant: "ghost" }),
        ]),
      );
      syncZone();
    }

    function syncZone() {
      if (!session || !zone) return;
      zone.style.left = `${session.zoneStart * 100}%`;
      zone.style.width = `${session.zoneSize * 100}%`;
    }

    function strike() {
      if (!session || session.finished) return;
      const r = session.strike();
      app.audio.play(r.perfect ? "catchFish" : r.hit ? "peg" : "clank");
      statusText.textContent = r.perfect
        ? "完美！+3"
        : r.hit
          ? "上钩 +1"
          : "空军…… +0";
      syncZone();
      if (session.finished) setTimeout(finishSession, 500);
      else setTimeout(() => {
        if (statusText) statusText.textContent = `剩余 ${session.castsLeft} 次 · 得分 ${session.score}`;
      }, 600);
    }

    function finishSession() {
      const reward = fishReward(session);
      app.addGold(reward.gold);
      app.save.fishBuff = { ...reward.buff, battles: 3 };
      app.save.fishBest[session.sea.id] = Math.max(app.save.fishBest?.[session.sea.id] ?? 0, session.score);
      app.persist();
      app.audio.play("win");
      const label = BUFF_LABEL[reward.buff.kind]?.(reward.buff.value) ?? "";
      clear(body).append(
        el("div", { class: "result-card win" }, [
          el("h2", { class: "result-title", text: "渔获！" }),
          el("h3", { text: reward.fish.name }),
          el("p", { class: "muted", text: `得分 ${session.score} / ${session.sea.casts * 3} · 完美 ${session.perfect} 次` }),
          el("p", { class: "buff-note", text: `${label}（接下来 3 场战斗生效）` }),
          el("p", { text: `🪙 +${reward.gold}` }),
          el("div", { class: "detail-actions" }, [
            button("再钓一次", () => seaSelect(), { variant: "primary" }),
            button("去战斗", () => app.navigate("adventure"), { icon: "🥚" }),
            button("主菜单", () => app.navigate("menu", {}, { replace: true }), { variant: "ghost" }),
          ]),
        ]),
      );
      session = null;
    }

    seaSelect();

    return {
      tick(dt) {
        if (!session || session.finished || !marker) return;
        session.update(dt);
        marker.style.left = `${session.marker * 100}%`;
      },
      onKey(e) {
        if (e.key === "Escape") app.back();
        if (e.key === " ") {
          e.preventDefault();
          strike();
        }
      },
    };
  },
};
