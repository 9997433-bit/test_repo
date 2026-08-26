import { announce, button, el, meter } from "./dom.js";
import { motionToggle, muteToggle, pageHeader } from "./components.js";
import { beastPanel } from "./beast-panel.js";
import { openTutorial } from "./tutorial.js";
import { moProgress } from "../classes/unlock.js";
import { CLASSES } from "../data/classes.js";
import { STAGES } from "../data/stages.js";
import { ENEMIES } from "../data/enemies.js";
import { realmById } from "../data/realms.js";
import { TALENTS, applyTalent } from "../classes/talents.js";
import { tickIdle } from "../progression/idle.js";
import { breakthrough } from "../progression/realm.js";
import { BEAST_CAP } from "../progression/beasts.js";

const TALENT_COST = 12;

export function renderHub({ root, store, navigate }) {
  store.set(tickIdle(store.get()));
  const save = store.get();
  const realm = realmById(save.realmId);
  const cls = CLASSES.find((c) => c.id === save.classId);
  const progress = moProgress(save);
  const idleText = idleClaimText(save);
  const showIdle = !save.idleNoticeShown && Boolean(idleText);

  const xpMeter = meter("修为进度");
  xpMeter.set(save.xp, Number.isFinite(realm.xp) ? realm.xp : Math.max(1, save.xp));

  const section = el("section", { class: "screen" }, [
    pageHeader({
      kicker: save.playerName,
      title: `${cls?.name || "未择业"} · ${realm.name}`,
      tools: [
        muteToggle(store),
        motionToggle(store),
        button({ text: "重看教程", onclick: () => openTutorial({ mount: root, store, markDone: false }) }),
      ],
    }),
    el("div", { class: "card resource-card" }, [
      el("div", { class: "resource-row" }, [
        stat("灵气丹", save.qiPills),
        stat("包子", save.buns),
        stat("修为", `${save.xp} / ${Number.isFinite(realm.xp) ? realm.xp : "∞"}`),
        stat("灵兽", `${save.beasts?.length || 0} / ${BEAST_CAP}`),
      ]),
      xpMeter.node,
    ]),
    showIdle ? el("p", { class: "card idle-banner", role: "status", text: idleText }) : null,
    // 全屏共用一条回执：修炼、灵兽栏、天赋改动后的 notice 都落在这里。
    el("p", { class: "notice hub-notice", role: "status", text: save.notice || "" }),
    el("div", { class: "grid hub-grid" }, [
      el("section", { class: "card", "aria-labelledby": "hub-stages" }, [
        el("h3", { id: "hub-stages", text: "秘境出战" }),
        stageList(store, navigate, save),
      ]),
      el("div", { class: "grid" }, [
        el("section", { class: "card", "aria-labelledby": "hub-cultivate" }, [
          el("h3", { id: "hub-cultivate", text: "修炼" }),
          el("div", { class: "row" }, [
            button({
              text: "突破境界",
              onclick: () => {
                store.set(breakthrough(store.get()));
                navigate("hub");
              },
            }),
            button({ text: "画阁", onclick: () => navigate("gallery") }),
          ]),
          el("p", {
            class: "muted",
            text: progress.unlocked ? "六式圆满，墨客隐线已现。" : `已通六式 ${progress.have} / ${progress.need}`,
          }),
        ]),
        beastPanel({ store, navigate }),
        el("section", { class: "card", "aria-labelledby": "hub-talents" }, [
          el("h3", { id: "hub-talents", text: `天赋 · 每级 ${TALENT_COST} 灵气丹` }),
          talentList(store, navigate, save),
        ]),
      ]),
    ]),
  ]);

  root.appendChild(section);

  if (showIdle) {
    store.set({ idleNoticeShown: true });
    announce(idleText);
  }
  if (save.notice) announce(save.notice);
  return null;
}

/**
 * 挂机提示每次开卷只播一次：
 * tickIdle 已经保证同一笔收益不会重复发放（idleClaimed），
 * 这里再加一道闸门 —— idleNoticeShown 是不落盘的临时字段，
 * 来回枢纽不会反复弹同一条横幅，重开一局又能正常提示。
 */
function idleClaimText(save) {
  const claim = save?.idleClaim;
  if (!claim || save.idleClaimed === false) return "";
  const minutes = Number(claim.minutes) || 0;
  if (minutes <= 0 || (!claim.pills && !claim.buns)) return "";
  return `离卷 ${minutes.toFixed(1)} 分，笔冢自行运气：得灵气丹 ${claim.pills}、包子 ${claim.buns}。`;
}

function stat(label, value) {
  return el("div", { class: "stat" }, [el("span", { class: "stat-label", text: label }), el("strong", { text: String(value) })]);
}

function stageList(store, navigate, save) {
  const cleared = new Set(save.clearedStages || []);
  return el(
    "ul",
    { class: "stage-list", "aria-label": "可挑战的秘境" },
    STAGES.map((s) => {
      const enemy = ENEMIES.find((x) => x.id === s.enemyId);
      const done = cleared.has(s.id);
      return el("li", {}, [
        button(
          {
            class: `stage-btn ${done ? "cleared" : ""}`.trim(),
            "aria-label": `${s.name}，敌 ${enemy.name}，奖励修为 ${s.reward.xp}、灵气丹 ${s.reward.qiPills}${done ? "，已通关" : ""}`,
            onclick: () => {
              store.set({ stageId: s.id, notice: "" });
              navigate("battle");
            },
          },
          [
            el("strong", {}, [s.name, done ? el("span", { class: "badge", text: "通" }) : null]),
            el("span", { class: "muted", text: `敌 ${enemy.name} · ${enemy.lore}` }),
            el("span", { class: "muted", text: `奖励 修为 ${s.reward.xp} · 灵气丹 ${s.reward.qiPills}` }),
          ],
        ),
      ]);
    }),
  );
}

function talentList(store, navigate, save) {
  return el(
    "ul",
    { class: "talent-list", "aria-label": "天赋" },
    TALENTS.map((t) => {
      const lv = save.talents?.[t.id] || 0;
      const maxed = lv >= 5;
      const poor = save.qiPills < TALENT_COST;
      return el("li", {}, [
        button(
          {
            class: "talent-btn",
            "aria-disabled": maxed || poor ? "true" : "false",
            "aria-label": `${t.name}，当前 ${lv} 级，满级 5 级${maxed ? "，已满级" : poor ? "，灵气丹不足" : `，消耗 ${TALENT_COST} 灵气丹升级`}`,
            onclick: () => {
              if (maxed) {
                announce(`${t.name} 已满级。`);
                return;
              }
              const before = store.get();
              const after = applyTalent(before, t.id);
              if (after === before || (after.talents?.[t.id] || 0) === (before.talents?.[t.id] || 0)) {
                announce("灵气丹不足，无法参悟。", { assertive: true });
                return;
              }
              store.set(after);
              navigate("hub");
            },
          },
          [el("span", { text: t.name }), el("span", { class: "talent-lv", text: `${lv}/5` })],
        ),
      ]);
    }),
  );
}
