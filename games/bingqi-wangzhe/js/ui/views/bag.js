/** 背包：兵器卡列表 + 强化 / 分解 / 上阵，附设置。 */

import { h, clear } from '../dom.js';
import { icon, RESOURCE_ICON } from '../icons.js';
import {
  QUALITY_ORDER, qualityCN, fmtNum, resourceCN, RESOURCE_COLOR
} from '../format.js';
import { emptyState, openSheet } from '../components/feedback.js';
import { weaponCard, weaponDetail } from '../components/weaponCard.js';
import {
  motionPreference, setMotionPreference, reducedMotion, ripple, haptic
} from '../motion.js';

const SORTS = [
  { id: 'power', label: '战力', cmp: (a, b) => b.power - a.power },
  { id: 'quality', label: '品质', cmp: (a, b) => QUALITY_ORDER.indexOf(b.quality) - QUALITY_ORDER.indexOf(a.quality) },
  { id: 'level', label: '等级', cmp: (a, b) => b.level - a.level },
  { id: 'new', label: '最新', cmp: (a, b) => b.createdAt - a.createdAt }
];

export function bagView(ctx) {
  const { game, ui } = ctx;

  let sortId = 'power';
  let qualityFilter = null;

  const headCard = h('.card.card--framed');
  const listCard = h('.card');
  const settingsCard = h('.card');

  const el = h('.view', { id: 'panel-bag', role: 'tabpanel', 'aria-labelledby': 'tab-bag' },
    headCard, listCard, settingsCard);

  function renderHead() {
    const all = game.weapons();
    const equipped = game.lineup().filter(Boolean).length;
    const byQ = QUALITY_ORDER.map((q) => [q, all.filter((w) => w.quality === q).length]);
    clear(headCard);
    headCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '行囊' }),
          h('.section__rule'),
          h('.section__meta', { text: `${all.length} 把 · 上阵 ${equipped}` })),
        h('.filters',
          h('button.chip', {
            type: 'button',
            'aria-pressed': String(qualityFilter === null),
            onclick: () => { qualityFilter = null; renderAll(); }
          }, `全部 ${all.length}`),
          ...byQ.map(([q, n]) => {
            const c = h('button.chip', {
              type: 'button',
              disabled: n === 0,
              'aria-pressed': String(qualityFilter === q),
              onclick: () => { qualityFilter = qualityFilter === q ? null : q; haptic(6); renderAll(); }
            }, `${qualityCN(q)} ${n}`);
            c.dataset.quality = q;
            c.style.setProperty('--el', 'var(--q)');
            c.style.color = n ? 'var(--q)' : '';
            return c;
          })),
        h('.bagbar',
          h('span', { text: '排序' }),
          ...SORTS.map((s) => h(`button.sortbtn${sortId === s.id ? '' : ''}`, {
            type: 'button',
            style: sortId === s.id ? { color: 'var(--gold)', borderColor: 'var(--gold-deep)' } : null,
            onclick: () => { sortId = s.id; haptic(6); renderAll(); }
          }, sortId === s.id ? icon('sort') : null, s.label)))));
  }

  function renderList() {
    const sorter = SORTS.find((s) => s.id === sortId) || SORTS[0];
    const all = game.weapons()
      .filter((w) => !qualityFilter || w.quality === qualityFilter)
      .sort(sorter.cmp);

    clear(listCard);
    listCard.append(
      h('.card__inner.section',
        all.length
          ? h('.baglist.stagger', all.map((w) => weaponCard(w, { onClick: openDetail })))
          : emptyState({
            icon: qualityFilter ? 'codex' : 'bag',
            title: qualityFilter ? `尚无「${qualityCN(qualityFilter)}」品阶的兵器` : '行囊空空如也',
            hint: qualityFilter
              ? '提高炉阶或使用幸运符，可提升高品质概率。'
              : '去炉火工坊起一炉，第一把兵器就此诞生。',
            action: qualityFilter
              ? { label: '看全部', onClick: () => { qualityFilter = null; renderAll(); } }
              : { label: '前往工坊', onClick: () => ui.go('forge') }
          })));
  }

  function openDetail(w) {
    const body = h('div');
    const foot = h('div', { style: { display: 'contents' } });

    const rebuild = () => {
      const fresh = game.weapon(w.uid);
      if (!fresh) { sheet.close(); renderAll(); return; }
      const cost = game.enhanceCost(fresh.uid) || {};
      const canPay = Object.entries(cost).every(([k, v]) => (game.resources()[k] || 0) >= v);
      const cap = fresh.levelCap ?? game.levelCap?.(fresh.uid) ?? 30;
      const maxed = fresh.level >= cap;

      clear(body);
      body.append(weaponDetail(fresh, game));
      body.append(
        h('.section',
          h('.section__head', h('.section__title', { text: '强化消耗' }), h('.section__rule')),
          h('.cost', Object.entries(cost).map(([k, v]) =>
            h(`.cost__item${(game.resources()[k] || 0) >= v ? '' : '.is-short'}`,
              { style: { '--res-color': RESOURCE_COLOR[k] } },
              icon(RESOURCE_ICON[k] || 'coin'),
              h('span', { text: resourceCN(k) }),
              h('b', { text: fmtNum(v) })))),
          h('.t-dim', { style: { fontSize: '10.5px' }, text: '每 3 级解锁 1 个技能槽（最多 3 个）。' })));

      clear(foot);
      foot.append(
        h('button.btn.btn--ghost', {
          type: 'button',
          text: fresh.equippedSlot >= 0 ? '卸下' : '上阵',
          onclick: (e) => {
            ripple(e);
            if (fresh.equippedSlot >= 0) {
              game.clearSlot(fresh.equippedSlot);
              ui.toast.ok(`${fresh.name} 已卸下`);
            } else {
              const slot = game.lineup().findIndex((x, i) => !x && i < game.lineupUnlocked());
              if (slot < 0) return ui.toast.bad('战阵已满，请到战阵页替换');
              game.setLineup(slot, fresh.uid);
              ui.toast.ok(`${fresh.name} 已入第 ${slot + 1} 阵`);
            }
            ui.refreshChrome();
            renderAll();
            rebuild();
          }
        }),
        h('button.btn.btn--ghost', {
          type: 'button',
          text: '分解',
          onclick: (e) => {
            ripple(e);
            const res = game.dismantleWeapon(fresh.uid);
            if (!res.ok) return ui.toast.bad(res.error);
            ui.toast.ok('已分解，材料返还 60%');
            ui.refreshChrome();
            sheet.close();
            renderAll();
          }
        }),
        h('button.btn.btn--gold.grow', {
          type: 'button',
          disabled: maxed || !canPay,
          text: maxed ? '已至上限' : '强化 +1',
          onclick: (e) => {
            ripple(e);
            const res = game.enhanceWeapon(fresh.uid);
            if (!res.ok) return ui.toast.bad(res.error);
            haptic(14);
            if (res.unlockedSlot) ui.toast.gold(`解锁技能槽 ${res.weapon.skillSlots}/3`);
            else ui.toast.ok(`${res.weapon.name} → Lv${res.weapon.level}`);
            ui.refreshChrome();
            renderAll();
            rebuild();
          }
        })
      );
    };

    const sheet = openSheet(ui.host, { title: '兵器详情', body, foot: [foot] });
    rebuild();
  }

  function renderSettings() {
    clear(settingsCard);
    const prefs = [
      { id: 'auto', label: '跟随系统' },
      { id: 'full', label: '完整动效' },
      { id: 'reduced', label: '减少动效' }
    ];
    settingsCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '设置' }),
          h('.section__rule'),
          h('.section__meta', { text: reducedMotion() ? '当前：低动效' : '当前：完整动效' })),
        h('.recipe__label', { text: '动效偏好（尊重 prefers-reduced-motion）' }),
        h('.segmented', prefs.map((p) =>
          h('button.segmented__item', {
            type: 'button',
            'aria-pressed': String(motionPreference() === p.id),
            onclick: () => {
              setMotionPreference(p.id);
              ui.toast.show(`动效：${p.label}`, 'info', 'gear');
              renderSettings();
            }
          }, p.label))),
        h('.listrow',
          icon('gear'),
          h('.grow',
            h('.bond__name', { text: '数据来源' }),
            h('.bond__desc', {
              text: game.hasCore
                ? '逻辑层已全量接入，界面读写真实存档。'
                : `界面由 mockGame 驱动，待接入：${(game.pendingLabels || []).join(' / ') || '—'}`
            })),
          h('span.tag', {
            style: { color: game.hasCore ? 'var(--ok)' : 'var(--warn)' },
            text: game.source || 'mock'
          })),
        h('.row.row--wrap', (game.capabilities || []).map((c) =>
          h('span.tag', {
            style: { color: c.ready ? 'var(--ok)' : 'var(--paper-4)' },
            text: `${c.label} ${c.ready ? '✓' : '待接'}`
          }))),
        h('button.btn.btn--ghost.btn--block', {
          type: 'button',
          text: '重置演示存档',
          onclick: (e) => {
            ripple(e);
            game.reset?.();
            ui.toast.ok('存档已重置');
            ui.refreshChrome();
            ui.rerenderAll();
          }
        })));
  }

  function renderAll() {
    renderHead();
    renderList();
    renderSettings();
  }

  renderAll();

  return { el, onEnter: renderAll };
}
