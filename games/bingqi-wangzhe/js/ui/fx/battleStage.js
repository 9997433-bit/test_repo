/**
 * 战斗舞台：把 combat 引擎吐出来的 timeline 播成一段能看的仗。
 *
 * 组成：
 *  - 上下两排单位牌（敌 / 我），各带血条、元素色与状态图标；
 *  - 一层 canvas 负责元素弹道（见 `fx/ballistics.js`）；
 *  - 受击闪白 + 伤害飘字 + 击破慢动作 + 结算印章；
 *  - WebAudio 合成的命中 / 克制 / 击破 / 胜负音（见 `ui/audio.js`）；
 *  - 下方仍保留文字战报，逐条追加，跟着演出滚动。
 *
 * 群体技单独成一次演出：同一次出手打出的多条 damage 事件会被归成一组，
 * 由**首条**事件一口气放完扇形横扫 / 连锁跳跃，其余成员只补战报文字，
 * 免得五个目标各飞一发单体弹道、看上去像五次普攻。
 *
 * 两种输入都吃：
 *  1. **引擎战报**（`result.timeline[i].t`）：事件带 uid / hp / 元素，做全套演出；
 *  2. **mock 战报**（`{round, kind, element, text}`）：没有单位表，
 *     退化成「我军 ⇄ 敌军」两块牌，仍然有弹道、闪白与印章。
 *
 * 降级（prefers-reduced-motion）：不建 canvas、不跑 rAF，
 * 一次性把终局血量、完整文字战报与印章渲染出来。
 */

import { h, clear } from '../dom.js';
import { icon, weaponIcon, statusMeta, ELEMENT_ICON } from '../icons.js';
import { reducedMotion } from '../motion.js';
import { play as playCue, impact as impactCue } from '../audio.js';
import { createBallisticField } from './ballistics.js';
import { stampSeal } from './verdictSeal.js';

/** 整场演出压缩到这个时长附近（毫秒），长仗自动加速。 */
const TARGET_MS = 8200;
/** 击破慢动作：时间缩放与持续时间。 */
const KO_SCALE = 0.26;
const KO_MS = 560;
/** mock 战报每条的名义间隔。 */
const MOCK_STEP_MS = 320;
/** 命中音最短间隔：连打时只出一声，不然是一片糊掉的噪音。 */
const HIT_SOUND_GAP_MS = 70;
/** 一次出手打出多少条 damage 才算群体技。 */
const GROUP_BREAKERS = new Set(['action', 'round', 'wave', 'end', 'start']);

const LOG_TYPES = new Set(['start', 'wave', 'round', 'damage', 'heal', 'kill', 'skill', 'dot', 'shield', 'status', 'end']);

function isEngineResult(result) {
  return Array.isArray(result?.timeline) && result.timeline.some((e) => typeof e?.t === 'string');
}

/**
 * 存活数 / 总数。
 * `liveGame` 递过来的战报里这两项已经是数字，引擎原始战报里 `survivors` 却是
 * 一整排单位快照、`total` 压根没有——两种都要能印出「3/5」而不是 `[object Object]`。
 */
function countOf(value, fallback = 0) {
  if (Array.isArray(value)) return value.length;
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

/** 战报的「N 回合 · 存活 x/y」一行。 */
export function survivalLine(result) {
  const total = countOf(result?.total ?? result?.players, 0);
  const alive = countOf(result?.survivors, 0);
  return `${countOf(result?.rounds, 0)} 回合 · 存活 ${alive}/${total}`;
}

function centerIn(el, hostRect) {
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - hostRect.left,
    y: r.top + r.height / 2 - hostRect.top
  };
}

/**
 * 把「同一次出手打出的多条伤害」归成群体技组。
 *
 * 判据只看引擎已经在事件里写明的东西，不去猜技能语义：
 *  - `tag === 'aoe'`（旋风斩一族全体溅射）→ 扇形横扫；
 *  - `label` 带「·N跳」且打到两个以上目标（雷链一族）→ 连锁跳跃；
 *  - 其余（连环击的两段、连击词条的追打）仍走单体弹道，一发一发飞。
 *
 * 不改 timeline 本身，结果记在一张以事件对象为键的 Map 里——
 * 战报是逻辑层的数据，界面只读。
 *
 * @returns {Map<object, {kind:'fan'|'chain', index:number, members:Array}>}
 */
function groupAoeEvents(events) {
  const groups = new Map();
  for (let i = 0; i < events.length; i += 1) {
    const head = events[i];
    if (head?.t !== 'action' || head.skipped || !head.actorUid) continue;
    const members = [];
    for (let j = i + 1; j < events.length; j += 1) {
      const next = events[j];
      if (GROUP_BREAKERS.has(next?.t)) break;
      if (next?.t === 'damage' && next.actorUid === head.actorUid && next.tag !== 'thorns') {
        members.push(next);
      }
    }
    if (members.length === 0) continue;
    const fan = members.every((m) => m.tag === 'aoe');
    const chain = !fan
      && members.length > 1
      && members.some((m) => /·\s*\d+\s*跳/.test(m.label || ''))
      && new Set(members.map((m) => m.targetUid)).size > 1;
    if (!fan && !chain) continue;
    const kind = fan ? 'fan' : 'chain';
    members.forEach((m, index) => groups.set(m, { kind, index, members }));
  }
  return groups;
}

/**
 * @param {object} result 战报
 * @param {{subtitle?:string, onEnd?:(result:object)=>void}} [opts]
 */
export function createBattleStage(result, opts = {}) {
  const reduced = reducedMotion();
  const engine = isEngineResult(result);

  /* --------------------------- 骨架 --------------------------- */

  const enemyRow = h('.bstage__row.bstage__row--enemy');
  const playerRow = h('.bstage__row.bstage__row--player');
  const banner = h('.bstage__banner');
  const roundTag = h('.bstage__round.t-num', { text: 'R0' });
  const canvas = reduced ? null : h('canvas.bstage__canvas', { 'aria-hidden': 'true' });

  const field = h('.bstage__field',
    h('.bstage__grain', { 'aria-hidden': 'true' }),
    enemyRow,
    h('.bstage__mid', banner, roundTag),
    playerRow,
    canvas);

  const timelineEl = h('.timeline.timeline--live', { role: 'log', 'aria-live': 'off' });

  const speedBtn = h('button.bstage__btn', { type: 'button', text: '×1' });
  const skipBtn = h('button.bstage__btn', { type: 'button', text: '跳过演出' });
  const controls = reduced ? null : h('.bstage__bar', speedBtn, skipBtn);

  const el = h('.bstage',
    field,
    controls,
    h('.section__head', h('.section__title', { text: '战报' }), h('.section__rule')),
    timelineEl);

  const fx = canvas ? createBallisticField(canvas) : null;

  /* --------------------------- 单位牌 --------------------------- */

  /** uid → { el, fill, statusHost, statuses, hp, maxHp, seq } */
  const chips = new Map();

  function makeChip(unit, side) {
    const fill = h('i');
    const statusHost = h('.bunit__st', { 'aria-hidden': 'true' });
    const node = h('.bunit', {
      dataset: { element: unit.element || 'none', side, quality: unit.quality || 'common' },
      style: { '--el': `var(--el-${unit.element || 'fire'})` }
    },
    h('.bunit__flash', { 'aria-hidden': 'true' }),
    h('.bunit__sigil', icon(side === 'player' ? weaponIcon(unit.type) : ELEMENT_ICON[unit.element] || 'trial')),
    h('.bunit__name', { text: unit.name || '—' }),
    h('.bunit__hp', fill),
    statusHost,
    h('.bunit__floats'));
    if (unit.isBoss) node.classList.add('is-boss');
    chips.set(unit.uid, {
      el: node,
      fill,
      statusHost,
      /** statusId → { node, turnsEl, turns, meta } */
      statuses: new Map(),
      hp: unit.hp ?? unit.maxHp ?? 1,
      maxHp: unit.maxHp || unit.hp || 1,
      seq: -1
    });
    return node;
  }

  function fillRow(row, units, side) {
    clear(row);
    units.forEach((u) => {
      chips.delete(u.uid);
      row.append(makeChip(u, side));
    });
    row.dataset.count = String(units.length);
  }

  function setHp(uid, hp, maxHp, seq) {
    const chip = chips.get(uid);
    if (!chip) return;
    if (Number.isFinite(seq) && seq < chip.seq) return; // 弹道飞行导致的乱序，丢弃旧值
    chip.seq = Number.isFinite(seq) ? seq : chip.seq;
    chip.hp = Math.max(0, hp ?? chip.hp);
    chip.maxHp = maxHp || chip.maxHp;
    const ratio = chip.maxHp > 0 ? chip.hp / chip.maxHp : 0;
    chip.fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    chip.el.classList.toggle('is-low', ratio > 0 && ratio < 0.3);
    if (chip.hp <= 0) {
      chip.el.classList.add('is-dead');
      dropStatuses(uid);
    }
  }

  /* --------------------------- 状态图标 --------------------------- */

  /**
   * 状态徽章。引擎只在**挂上**状态时发事件，掉落靠界面自己数回合：
   * 每个 `round` 事件把所有徽章 -1，归零即摘。和引擎「按单位回合结算」
   * 相比最多差半个回合，但胜在不需要引擎为界面补一类事件。
   */
  function markStatus(e) {
    const chip = chips.get(e.targetUid);
    if (!chip || chip.hp <= 0) return;
    const meta = statusMeta(e.statusId, { bad: e.bad, name: e.status });
    let entry = chip.statuses.get(e.statusId);
    const fresh = !entry;
    if (fresh) {
      const turnsEl = h('i.bunit__stturn');
      const node = h('.bunit__stchip', {
        dataset: { tone: meta.tone, bad: String(Boolean(meta.bad)) }
      }, icon(meta.icon), turnsEl);
      chip.statusHost.append(node);
      entry = { node, turnsEl, meta, turns: 0 };
      chip.statuses.set(e.statusId, entry);
    }
    entry.turns = Math.max(1, Number(e.turns) || 1);
    entry.turnsEl.textContent = entry.turns > 1 ? String(entry.turns) : '';
    entry.node.title = `${meta.name} · ${entry.turns} 回合`;
    if (!reduced) {
      entry.node.classList.remove('is-in');
      void entry.node.offsetWidth;
      entry.node.classList.add('is-in');
    }
    return fresh ? meta : null;
  }

  function tickStatuses() {
    chips.forEach((chip) => {
      chip.statuses.forEach((entry, id) => {
        entry.turns -= 1;
        if (entry.turns <= 0) {
          entry.node.remove();
          chip.statuses.delete(id);
          return;
        }
        entry.turnsEl.textContent = entry.turns > 1 ? String(entry.turns) : '';
        entry.node.title = `${entry.meta.name} · ${entry.turns} 回合`;
      });
    });
  }

  function dropStatuses(uid) {
    const chip = chips.get(uid);
    if (!chip) return;
    chip.statuses.forEach((entry) => entry.node.remove());
    chip.statuses.clear();
  }

  /** 过波整备：引擎会洗掉我方身上的负面状态，徽章跟着清。 */
  function dropBadStatuses() {
    chips.forEach((chip, uid) => {
      chip.statuses.forEach((entry, id) => {
        if (!entry.meta.bad) return;
        entry.node.remove();
        chip.statuses.delete(id);
      });
      void uid;
    });
  }

  function floatText(uid, text, kind) {
    const chip = chips.get(uid);
    if (!chip) return;
    const host = chip.el.querySelector('.bunit__floats');
    const node = h(`.dmgfloat.is-${kind}`, { text });
    host.append(node);
    if (reduced) {
      setTimeout(() => node.remove(), 900);
      return;
    }
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }

  function flash(uid) {
    const chip = chips.get(uid);
    if (!chip || reduced) return;
    chip.el.classList.remove('is-hit');
    void chip.el.offsetWidth;
    chip.el.classList.add('is-hit');
    setTimeout(() => chip.el.classList.remove('is-hit'), 260);
  }

  /* --------------------------- 事件 → 演出 --------------------------- */

  let koTimer = 0;
  let timeScale = 1;

  function slowMotion() {
    if (reduced) return;
    timeScale = KO_SCALE;
    fx?.setTimeScale(0.4);
    field.classList.add('is-ko');
    clearTimeout(koTimer);
    koTimer = setTimeout(() => {
      timeScale = 1;
      fx?.setTimeScale(1);
      field.classList.remove('is-ko');
    }, KO_MS);
  }

  function lunge(el) {
    if (!el || reduced) return;
    el.classList.remove('is-acting');
    void el.offsetWidth;
    el.classList.add('is-acting');
    setTimeout(() => el.classList.remove('is-acting'), 240);
  }

  function shoot(actorUid, targetUid, element, crit, onImpact) {
    if (!fx) {
      onImpact?.();
      return;
    }
    const from = chips.get(actorUid)?.el;
    const to = chips.get(targetUid)?.el;
    if (!from || !to) {
      onImpact?.();
      return;
    }
    const hostRect = field.getBoundingClientRect();
    fx.fire({
      from: centerIn(from, hostRect),
      to: centerIn(to, hostRect),
      element,
      crit,
      onImpact
    });
    lunge(from);
  }

  /* --------------------------- 声音 --------------------------- */

  let lastHitSound = 0;

  function hitSound(crit, relation) {
    const now = performance.now();
    // 暴击与克制值得盖过间隔限制，普通连打则合成一声
    if (!crit && !relation && now - lastHitSound < HIT_SOUND_GAP_MS) return;
    lastHitSound = now;
    impactCue({ crit, relation });
  }

  // 战斗层对未知技能 id 会合成一个同名技能，战报里就成了「施展【sk_leiting_tu】」。
  // 逻辑层随战报带来一张 id→名字的字典，这里把它换回可读的中文。
  const skillNames = result.skillNames || null;
  function readable(text) {
    if (!skillNames || !text) return text || '';
    return text.replace(/【([A-Za-z0-9_]+)】/g, (m, id) => (skillNames[id] ? `【${skillNames[id]}】` : m));
  }

  function pushLog(event) {
    const kind = event.t === 'kill' ? 'kill' : event.side === 'enemy' ? 'foe' : event.side === 'player' ? 'ally' : 'sys';
    const row = h(`.tl.tl--${kind}`, {
      style: { '--el': event.element ? `var(--el-${event.element})` : null }
    },
    h('.tl__round.t-num', { text: event.round ? `R${event.round}` : '—' }),
    h('.tl__text', event.html ? { html: event.html } : { text: readable(event.text) }));
    timelineEl.append(row);
    if (!reduced) timelineEl.scrollTop = timelineEl.scrollHeight;
    // 只留最近 80 条，长仗不至于把弹层撑爆。
    while (timelineEl.children.length > 80) timelineEl.firstElementChild.remove();
  }

  let sealed = false;

  function seal() {
    if (sealed) return;
    sealed = true;
    field.classList.add('is-sealed');
    stampSeal(field, result.winner, {
      grade: result.grade ? `${result.grade} 阶` : '',
      caption: result.winner === 'player'
        ? survivalLine(result)
        : result.timeout ? '回合触顶' : '再整旗鼓'
    });
    playCue(result.winner === 'player' ? 'victory' : 'defeat');
    opts.onEnd?.(result);
  }

  /** 一条 damage 事件落地：扣血 + 闪白 + 飘字 + 命中音。 */
  function landDamage(e) {
    setHp(e.targetUid, e.hp, e.maxHp, e.seq);
    flash(e.targetUid);
    floatText(e.targetUid, `-${e.damage}`, e.crit ? 'crit' : 'dmg');
    hitSound(e.crit, e.relation === '克制' || e.relation === '被克' ? e.relation : '');
  }

  /**
   * 群体技演出：一次性放完扇面 / 连锁，各目标由弹道回调按命中顺序落地。
   * 少任何一块牌（缩放、滚动导致取不到）都退回「立刻全部落地」，绝不吞事件。
   */
  function playGroup(group) {
    const { kind, members } = group;
    const actorEl = chips.get(members[0].actorUid)?.el;
    const targetEls = members.map((m) => chips.get(m.targetUid)?.el);
    const land = (i) => landDamage(members[i]);

    if (!fx || !actorEl || targetEls.some((t) => !t)) {
      members.forEach((_, i) => land(i));
      return;
    }

    const hostRect = field.getBoundingClientRect();
    const from = centerIn(actorEl, hostRect);
    const targets = targetEls.map((t) => centerIn(t, hostRect));
    const element = members[0].element;
    lunge(actorEl);

    if (kind === 'fan') {
      fx.fan({ from, targets, element, power: 1.15, onImpact: land });
      playCue('aoe');
    } else {
      fx.chain({ from, targets, element, crit: members.some((m) => m.crit), onImpact: land });
      playCue('chain');
    }
  }

  /** @param {boolean} silent 快进 / 降级：只落结果，不做特效 */
  function applyEngineEvent(e, silent) {
    switch (e.t) {
      case 'start':
        fillRow(playerRow, e.players || [], 'player');
        break;
      case 'wave':
        fillRow(enemyRow, e.enemies || [], 'enemy');
        dropBadStatuses();
        banner.textContent = e.name || '';
        if (!silent && !reduced) {
          banner.classList.remove('is-in');
          void banner.offsetWidth;
          banner.classList.add('is-in');
        }
        break;
      case 'round':
        roundTag.textContent = `R${e.round}`;
        tickStatuses();
        break;
      case 'action':
        if (!silent && e.skipped) floatText(e.actorUid, '冻结', 'status');
        break;
      case 'damage': {
        if (silent) {
          setHp(e.targetUid, e.hp, e.maxHp, e.seq);
          break;
        }
        const group = aoeGroups.get(e);
        if (group) {
          // 组内其余成员已经由首条事件一并演完，这里只补战报文字
          if (group.index === 0) playGroup(group);
          break;
        }
        shoot(e.actorUid, e.targetUid, e.element, e.crit, () => landDamage(e));
        break;
      }
      case 'dot':
        setHp(e.targetUid, e.hp, e.maxHp, e.seq);
        if (!silent) {
          floatText(e.targetUid, `-${e.damage}`, 'dot');
          const chip = chips.get(e.targetUid);
          if (chip && fx) {
            const hostRect = field.getBoundingClientRect();
            const p = centerIn(chip.el, hostRect);
            fx.impact(p.x, p.y, e.element, 0.7);
          }
        }
        break;
      case 'heal':
        setHp(e.targetUid, e.hp, e.maxHp, e.seq);
        if (!silent) floatText(e.targetUid, `+${e.amount}`, 'heal');
        break;
      case 'shield':
        if (!silent) floatText(e.targetUid, `盾 ${e.amount}`, 'shield');
        break;
      case 'status': {
        // 徽章在快进 / 降级下也要给：那是信息，不是动画
        const fresh = markStatus(e);
        if (fresh && !silent) floatText(e.targetUid, fresh.name, fresh.bad ? 'status' : 'buff');
        break;
      }
      case 'kill':
        setHp(e.targetUid, 0, undefined, Number.MAX_SAFE_INTEGER);
        if (!silent) {
          chips.get(e.targetUid)?.el.classList.add('is-dying');
          slowMotion();
          playCue('ko');
        }
        break;
      case 'end':
        if (!silent) seal();
        break;
      default:
        break;
    }
    if (LOG_TYPES.has(e.t) && e.text) pushLog(e);
  }

  /* --------------------------- mock 兜底 --------------------------- */

  const MOCK_UNITS = [
    { uid: 'mock-enemy', name: '敌军', element: 'thunder', side: 'enemy', maxHp: 1, hp: 1 },
    { uid: 'mock-player', name: '我军', element: 'fire', side: 'player', maxHp: 1, hp: 1 }
  ];

  function applyMockEvent(e, silent) {
    const mine = e.kind === 'ally';
    const foe = e.kind === 'foe';
    if (!silent && (mine || foe)) {
      const actor = mine ? 'mock-player' : 'mock-enemy';
      const target = mine ? 'mock-enemy' : 'mock-player';
      const dmg = /class="dmg">(\d+)/.exec(e.text || '')?.[1];
      const crit = /暴击/.test(e.text || '');
      const relation = /克制/.test(e.text || '') ? '克制' : /被克/.test(e.text || '') ? '被克' : '';
      shoot(actor, target, e.element, crit, () => {
        flash(target);
        if (dmg) floatText(target, `-${dmg}`, crit ? 'crit' : 'dmg');
        hitSound(crit, relation);
      });
      if (/击破/.test(e.text || '')) {
        slowMotion();
        playCue('ko');
      }
    }
    if (e.round) roundTag.textContent = `R${e.round}`;
    pushLog({ t: 'mock', round: e.round, side: mine ? 'player' : foe ? 'enemy' : null, element: e.element, html: e.text });
  }

  /* --------------------------- 时间轴驱动 --------------------------- */

  const events = Array.isArray(result.timeline) ? result.timeline : [];
  const aoeGroups = engine ? groupAoeEvents(events) : new Map();
  const schedule = engine
    ? events.map((e) => ({ at: Number(e.at) || 0, e }))
    : events.map((e, i) => ({ at: i * MOCK_STEP_MS, e }));
  const totalMs = schedule.length ? schedule[schedule.length - 1].at + 400 : 0;
  // 长仗自动加速：40 回合的战报也要在 8 秒左右播完。
  const baseRate = Math.max(1, Math.min(14, totalMs / TARGET_MS));

  let cursor = 0;
  let clock = 0;
  let raf = 0;
  let last = 0;
  let speedMul = 1;
  let finished = false;

  const applyEvent = engine ? applyEngineEvent : applyMockEvent;

  function initStage() {
    if (engine) {
      fillRow(playerRow, result.players || [], 'player');
      const firstWave = events.find((e) => e.t === 'wave');
      if (firstWave) fillRow(enemyRow, firstWave.enemies || [], 'enemy');
    } else {
      fillRow(enemyRow, [MOCK_UNITS[0]], 'enemy');
      fillRow(playerRow, [MOCK_UNITS[1]], 'player');
      enemyRow.classList.add('is-abstract');
      playerRow.classList.add('is-abstract');
    }
  }

  function finish(silentRest) {
    if (finished) return;
    finished = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (silentRest) {
      fx?.clear();
      while (cursor < schedule.length) {
        applyEvent(schedule[cursor].e, true);
        cursor += 1;
      }
    }
    seal();
  }

  function frame(now) {
    const dt = Math.min(80, now - last || 16);
    last = now;
    clock += dt * baseRate * speedMul * timeScale;

    while (cursor < schedule.length && schedule[cursor].at <= clock) {
      applyEvent(schedule[cursor].e, false);
      cursor += 1;
    }

    if (cursor >= schedule.length) {
      finished = true;
      raf = 0;
      seal();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    initStage();
    if (reduced || !schedule.length) {
      schedule.forEach(({ e }) => applyEvent(e, true));
      cursor = schedule.length;
      seal();
      return;
    }
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  skipBtn.addEventListener('click', () => finish(true));
  speedBtn.addEventListener('click', () => {
    speedMul = speedMul >= 4 ? 1 : speedMul * 2;
    speedBtn.textContent = `×${speedMul}`;
  });

  return {
    el,
    start,
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(koTimer);
      fx?.destroy();
    }
  };
}

export { isEngineResult };
export default createBattleStage;
