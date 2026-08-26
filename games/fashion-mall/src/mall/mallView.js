import { SHOPS, shopRate } from "../data/balance.js";
import { GOALS, SHOPS_COPY, SHOP_LOCKED_HINT, FAIL } from "../data/copy.js";
import { A11Y } from "../data/a11y.js";
import { charmOf, shopBonusMap, formatGold } from "../core/economy.js";
import { persist, syncUnlocks } from "../core/state.js";
import { SHOP_LEVEL_MAX } from "../core/limits.js";
import { upgradeShop, hireStaff, shopUpgradeCost, shopHireCost } from "../core/actions.js";
import { esc } from "../ui/dom.js";
import { sfx } from "../core/audio.js";

const COUNTDOWN_MS = 1000;
/** 飘字与 --anim-coin 的 --dur-drama 对齐，留一点余量再摘节点。 */
const FLOAT_MS = 700;

/** 只在文本真的变了才落笔，升级/招聘与每秒刷新都不产生多余的 DOM 变更。 */
function paintText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
  return node;
}

/** 反复写同一个 disabled 也会记一条属性变更，稳态下能省则省。 */
function setDisabled(node, disabled) {
  if (node && node.disabled !== disabled) node.disabled = disabled;
}

/** `.row` 自带 display:flex，光靠 hidden 属性盖不住，语义与显隐要一起给。 */
function setShown(node, shown) {
  if (!node || node.hidden === !shown) return;
  node.hidden = !shown;
  node.style.display = shown ? "" : "none";
}

/**
 * 未解锁店卡的摇一摇（DESIGN_SYSTEM §9.2）。连点也要能重播，所以先摘类再强制回流；
 * 动画结束自己摘掉，卡片本身不重建，焦点留在原处。
 */
function shakeCard(card) {
  if (!card) return;
  card.classList.remove("shake");
  void card.offsetWidth;
  card.classList.add("shake");
  if (card._shakeBound) return;
  // 卡片自己还挂着入场的 fm-pop-in，只认摇一摇那条 animationend 才不会提前摘类。
  card._shakeBound = true;
  card.addEventListener("animationend", (e) => {
    if (e.animationName === "fm-shake") card.classList.remove("shake");
  });
}

/**
 * 升级 / 招聘成功的飘字（`--anim-coin`，与小游戏 `.mg-float` 同一套动效 token）。
 * 宿主是升级行本身，飘字绝对定位、不参与 flex 排布，也就不会挤动刚点过的按钮。
 */
function floatOnRow(row, text) {
  if (!row || !text) return;
  const node = document.createElement("span");
  node.className = "mall-float";
  node.setAttribute("aria-hidden", "true");
  node.textContent = text;
  row.append(node);
  setTimeout(() => node.remove(), FLOAT_MS);
}

/** 数值一律先格式化再交给 copy：GOALS.line 只拼句子，不做数学。 */
function goalLine(state, now = Date.now()) {
  const goal = state.goal;
  if (!goal) return "";
  const remain = Math.max(0, goal.until - now);
  const mins = Math.floor(remain / 60000);
  const secs = Math.floor((remain % 60000) / 1000);
  return GOALS.line({
    tier: goal.tier,
    targetText: formatGold(goal.target),
    leftText: formatGold(Math.max(0, goal.target - state.goldEarned)),
    timeText: `${mins}:${String(secs).padStart(2, "0")}`,
    rewardText: `${formatGold(goal.reward?.gold)} 金`,
  });
}

/** 目标行每秒重写，读屏名跟着换，前缀交代"这一行是什么"。 */
function paintGoal(node, text) {
  if (!node) return;
  paintText(node, text);
  const label = text ? A11Y.goal(text) : null;
  if (label === null) node.removeAttribute("aria-label");
  else if (node.getAttribute("aria-label") !== label) node.setAttribute("aria-label", label);
}

export function renderMall(root, state, ctx = {}) {
  root._cleanup?.();
  const openShop = typeof ctx === "function" ? ctx : ctx.openShop;
  const toast = (typeof ctx === "object" && ctx.toast) || ((msg) => (state.toast = msg));

  syncUnlocks(state);
  root.innerHTML = `
    <section class="hero">
      <h1>${esc(state.name)} 的时尚百货城</h1>
      <p id="hero-sub"></p>
      <p id="goal-line"></p>
    </section>
    <div class="mall-grid"></div>`;

  // 骨架只搭一次：五家店的卡片与升级行全部建齐（未解锁的行先收起来），
  // 之后所有变化都靠 paintShop 改文本/禁用态，绝不重建节点——刚点过的按钮
  // 还是原来那个 DOM 节点，焦点自然留在原地（RUBRIC C2/D2）。
  const cards = new Map();
  const rows = new Map();

  const grid = root.querySelector(".mall-grid");
  for (const shop of SHOPS) {
    const card = document.createElement("button");
    card.className = "shop-card";
    card.type = "button";
    card.dataset.shop = shop.id;
    card.style.background = `linear-gradient(180deg, ${shop.color}, #fff)`;
    card.innerHTML = `
      <div class="emoji" aria-hidden="true">${shop.emoji}</div>
      <h3>${esc(shop.name)}</h3>
      <small data-meta></small>
      <p style="margin:4px 0 0;font-size:var(--text-2xs);line-height:1.4;color:var(--text-soft)">
        ${esc(SHOPS_COPY[shop.id]?.tagline || "")}</p>
      <div data-status></div>`;
    card.onclick = () => {
      if (!state.shops[shop.id].unlocked) {
        shakeCard(card);
        return toast(SHOP_LOCKED_HINT(String(shop.unlockLevel), shop.name));
      }
      sfx.tap();
      openShop?.(shop.id);
    };
    grid.append(card);
    cards.set(shop.id, {
      card,
      meta: card.querySelector("[data-meta]"),
      status: card.querySelector("[data-status]"),
    });
  }

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.innerHTML = `
    <div class="row">
      <div>
        <strong>店铺升级</strong>
        <p style="margin:6px 0 0;color:var(--ink-soft);font-size:13px">用营收砸装修，员工满员即可自动经营</p>
      </div>
    </div>
    <div id="upgrades"></div>`;
  root.append(panel);

  const box = panel.querySelector("#upgrades");
  for (const shop of SHOPS) {
    const row = document.createElement("div");
    row.className = "row";
    row.style.margin = "10px 0";
    row.dataset.shopRow = shop.id;
    row.innerHTML = `
      <div data-label></div>
      <div style="display:flex;gap:6px">
        <button class="btn ghost" type="button" data-act="up"></button>
        <button class="btn ghost" type="button" data-act="hire"></button>
      </div>`;
    const entry = {
      row,
      label: row.querySelector("[data-label]"),
      up: row.querySelector('[data-act="up"]'),
      hire: row.querySelector('[data-act="hire"]'),
    };
    entry.up.onclick = runner(
      shop,
      entry.up,
      () => upgradeShop(state, shop.id),
      () => `Lv.${state.shops[shop.id].level} ↑`,
    );
    entry.hire.onclick = runner(
      shop,
      entry.hire,
      () => hireStaff(state, shop.id),
      () => `👩 +1`,
    );
    rows.set(shop.id, entry);
    box.append(row);
  }

  function paintShop(shop, charm, bonuses) {
    const s = state.shops[shop.id];
    const view = cards.get(shop.id);
    const rate = s.unlocked ? shopRate(shop, s.level, s.staff, bonuses[shop.id] || 0, charm) : 0;
    view.card.classList.toggle("locked", !s.unlocked);
    paintText(
      view.meta,
      s.unlocked ? `Lv.${s.level} · ${formatGold(rate)}/秒` : `主角 Lv.${shop.unlockLevel} 解锁`,
    );
    paintText(view.status, s.auto ? "自动经营中" : s.unlocked ? "需照看" : "筹备中");

    const entry = rows.get(shop.id);
    setShown(entry.row, s.unlocked);
    if (!s.unlocked) return;
    const maxed = s.level >= SHOP_LEVEL_MAX;
    const full = s.staff >= shop.staffSlots;
    paintText(
      entry.label,
      `${shop.emoji} ${shop.name} Lv.${s.level}${maxed ? "（满级）" : ""} 员工 ${s.staff}/${shop.staffSlots}`,
    );
    paintText(
      entry.up,
      maxed ? `满级 Lv.${SHOP_LEVEL_MAX}` : `升级 ${formatGold(shopUpgradeCost(shop, s.level))}`,
    );
    paintText(entry.hire, full ? "已满员" : `招聘 ${formatGold(shopHireCost(shop, s.staff))}`);
    setDisabled(entry.up, maxed);
    setDisabled(entry.hire, full);
  }

  /** 全表体检一遍，但每处都走 diff：稳态下一个 DOM 写操作都不发生。 */
  function paintAll() {
    const charm = charmOf(state.outfit);
    const bonuses = shopBonusMap(state.partners);
    for (const shop of SHOPS) paintShop(shop, charm, bonuses);
  }

  /**
   * 按钮变灰（满级/满员）时浏览器会把焦点甩回 body，
   * 这时按"同排还能点的按钮 → 本店卡片"的顺序把焦点接住，不让它掉出上下文。
   */
  function keepFocus(shopId, btn) {
    if (!btn.disabled) return btn.focus({ preventScroll: true });
    const entry = rows.get(shopId);
    const alt = [entry.up, entry.hire].find((b) => b !== btn && !b.disabled);
    (alt || cards.get(shopId)?.card)?.focus({ preventScroll: true });
  }

  function runner(shop, btn, action, fxText) {
    return () => {
      const res = action();
      if (!res.ok) return toast(FAIL[res.reason] ?? res.toast);
      sfx.coin();
      persist(state);
      toast(res.toast);
      paintAll();
      floatOnRow(rows.get(shop.id)?.row, fxText?.());
      keepFocus(shop.id, btn);
    };
  }

  const line = root.querySelector("#goal-line");
  const sub = root.querySelector("#hero-sub");
  const paintSub = () => paintText(sub, `主角 Lv.${state.level} · 把冷清店铺一座座爆改。`);

  paintSub();
  paintGoal(line, goalLine(state));
  paintAll();

  // 限时目标是活的：倒计时与等级每秒局部刷新，dispose 必须把这个计时器收掉。
  // 主角在商场页升级也走这里——新解锁的店只是把行显出来，同样不重建节点。
  const timer = setInterval(() => {
    if (!line.isConnected) return clearInterval(timer);
    paintGoal(line, goalLine(state));
    paintSub();
    paintAll();
  }, COUNTDOWN_MS);
  root._cleanup = () => clearInterval(timer);
  return root._cleanup;
}
