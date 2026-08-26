import { announce, button, el } from "./dom.js";
import { pageHeader } from "./components.js";
import { moProgress, unlockedClasses } from "../classes/unlock.js";
import { strokeKeyByType } from "./keycast.js";

const ELEMENT_NAMES = { metal: "金", wood: "木", water: "水", fire: "火", earth: "土", thunder: "雷" };

export function renderClass({ root, store, navigate }) {
  const save = store.get();
  // 隐藏职业「墨客」只有在画阁集齐六式后才进入这个列表。
  const list = unlockedClasses(save);
  const progress = moProgress(save);
  const chosen = save.classId;

  const confirm = button({
    class: "primary",
    text: "以此入世",
    "aria-disabled": chosen ? null : "true",
    onclick: () => {
      if (!store.get().classId) {
        announce("请先选择一门修行。", { assertive: true });
        return;
      }
      navigate("hub");
    },
  });

  const grid = el("div", { class: "grid class-grid", role: "radiogroup", "aria-label": "选择修行" });

  function paintCards() {
    const current = store.get().classId;
    grid.querySelectorAll("[data-class]").forEach((node) => {
      const active = node.dataset.class === current;
      node.classList.toggle("active", active);
      node.setAttribute("aria-checked", active ? "true" : "false");
      node.tabIndex = active || (!current && node === grid.firstElementChild) ? 0 : -1;
    });
    confirm.setAttribute("aria-disabled", current ? "false" : "true");
    confirm.classList.toggle("is-disabled", !current);
  }

  list.forEach((c) => {
    const card = button(
      {
        class: "class-card card",
        role: "radio",
        "aria-checked": "false",
        dataset: { class: c.id },
        onclick: () => {
          store.set({ classId: c.id });
          store.persist();
          paintCards();
          announce(`已择 ${c.name}，${c.motto}`);
        },
      },
      [
        el("strong", {}, [c.name, c.hidden ? el("span", { class: "badge", text: "隐" }) : null]),
        el("div", { class: "muted", text: c.motto }),
        el("div", { text: `本命 ${ELEMENT_NAMES[c.element] ?? c.element} · ${roleName(c.role)}` }),
      ],
    );
    grid.appendChild(card);
  });

  // 方向键在单选组内移动焦点，符合 radiogroup 的键盘预期。
  grid.addEventListener("keydown", (ev) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(ev.key)) return;
    const cards = [...grid.querySelectorAll("[data-class]")];
    const idx = cards.indexOf(document.activeElement);
    if (idx < 0) return;
    ev.preventDefault();
    const dir = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : -1;
    const next = cards[(idx + dir + cards.length) % cards.length];
    next.focus();
    next.click();
  });

  const section = el("section", { class: "screen" }, [
    pageHeader({ kicker: "择一道途", title: `${numberName(list.length)}门修行` }),
    progress.unlocked
      ? el("p", { class: "notice card", role: "status", text: "画阁六式已齐，隐线「墨客」现身可选。" })
      : el("p", {
          class: "muted",
          text: `画阁已通 ${progress.have} / ${progress.need} 式，集齐可感召隐藏道途。还差：${progress.missing
            .map((t) => strokeKeyByType(t)?.name ?? t)
            .join("、")}`,
        }),
    grid,
    el("div", { class: "actions" }, [button({ text: "返卷首", onclick: () => navigate("splash") }), confirm]),
  ]);

  root.appendChild(section);
  paintCards();
  return null;
}

function numberName(n) {
  return ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"][n] ?? String(n);
}

function roleName(role) {
  return { burst: "爆发", tank: "坚守", caster: "术法", healer: "疗愈", summoner: "召灵", controller: "掌控", assassin: "疾袭" }[role] ?? role;
}
