/** 图鉴：兵谱网格 + 元素/类型/品质筛选 + 收集度加成。 */

import { h, clear } from '../dom.js';
import { icon, weaponIcon, ELEMENT_ICON } from '../icons.js';
import { QUALITY_ORDER, qualityCN, elementCN, pct } from '../format.js';
import { emptyState, openSheet } from '../components/feedback.js';
import { haptic } from '../motion.js';

const ELEMENTS = ['fire', 'ice', 'thunder'];

export function codexView(ctx) {
  const { game, ui } = ctx;

  const filter = { element: null, quality: null, type: null, onlyFound: false };

  const headCard = h('.card.card--framed');
  const filterRow = h('.filters', { role: 'group', 'aria-label': '筛选' });
  const typeRow = h('.filters', { role: 'group', 'aria-label': '类型筛选' });
  const gridWrap = h('.section');

  const el = h('.view', { id: 'panel-codex', role: 'tabpanel', 'aria-labelledby': 'tab-codex' },
    headCard,
    h('.section', filterRow, typeRow),
    gridWrap);

  function chip(label, active, onClick, extra = {}) {
    return h('button.chip', {
      type: 'button',
      'aria-pressed': String(active),
      style: extra.el ? { '--el': `var(--el-${extra.el})` } : extra.style || null,
      onclick: () => { haptic(6); onClick(); }
    }, extra.icon ? icon(extra.icon) : null, label);
  }

  function renderHead() {
    const entries = game.codexEntries();
    const found = entries.filter((e) => e.found).length;
    const total = entries.length;
    const bonus = Math.min(0.15, (found / Math.max(1, total)) * 0.15);
    clear(headCard);
    headCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '兵谱图鉴' }),
          h('.section__rule'),
          h('.section__meta', { text: `全谱 ${total} 把` })),
        h('.collect',
          h('.collect__num.t-num', { text: String(found) }, h('span', { text: `/${total}` })),
          h('.grow',
            h('.bar', h('.bar__fill', { style: { width: `${(found / Math.max(1, total)) * 100}%` } })),
            h('.t-dim', { style: { fontSize: '10.5px', marginTop: '4px' }, text: `收集度加成 攻击/生命 +${pct(bonus, 1)}（满谱 +15%）` })))));
  }

  function renderFilters() {
    clear(filterRow);
    clear(typeRow);

    filterRow.append(chip('全部', !filter.element && !filter.quality && !filter.onlyFound, () => {
      filter.element = null; filter.quality = null; filter.onlyFound = false; renderAll();
    }));
    ELEMENTS.forEach((e) => filterRow.append(
      chip(elementCN(e), filter.element === e, () => {
        filter.element = filter.element === e ? null : e; renderAll();
      }, { el: e, icon: ELEMENT_ICON[e] })
    ));
    filterRow.append(chip('已收录', filter.onlyFound, () => {
      filter.onlyFound = !filter.onlyFound; renderAll();
    }, { icon: 'eye' }));

    QUALITY_ORDER.forEach((q) => {
      const c = chip(qualityCN(q), filter.quality === q, () => {
        filter.quality = filter.quality === q ? null : q; renderAll();
      });
      c.dataset.quality = q;
      c.style.setProperty('--el', 'var(--q)');
      c.style.color = 'var(--q)';
      typeRow.append(c);
    });
  }

  function match(entry) {
    if (filter.element && entry.element !== filter.element) return false;
    if (filter.quality && entry.quality !== filter.quality) return false;
    if (filter.type && entry.type !== filter.type) return false;
    if (filter.onlyFound && !entry.found) return false;
    return true;
  }

  function renderGrid() {
    const entries = game.codexEntries().filter(match);
    clear(gridWrap);

    if (!entries.length) {
      gridWrap.append(emptyState({
        icon: 'codex',
        title: '此类兵器暂无记载',
        hint: '换个筛选条件，或去炉边多锻几把。',
        action: {
          label: '清空筛选',
          onClick: () => {
            filter.element = null; filter.quality = null; filter.type = null; filter.onlyFound = false;
            renderAll();
          }
        }
      }));
      return;
    }

    const byQuality = QUALITY_ORDER
      .map((q) => [q, entries.filter((e) => e.quality === q)])
      .filter(([, list]) => list.length);

    byQuality.forEach(([q, list]) => {
      const found = list.filter((e) => e.found).length;
      gridWrap.append(
        h('.region', { dataset: { quality: q } },
          h('.region__head',
            h('.region__name', { style: { color: 'var(--q)' }, text: qualityCN(q) }),
            h('.region__rule', { style: { background: 'linear-gradient(90deg, var(--q), transparent)', opacity: '.4' } }),
            h('.region__count', { text: `${found}/${list.length}` })),
          h('.codexgrid', list.map(cell)))
      );
    });
  }

  function cell(entry) {
    const node = h('button.codexcell', {
      type: 'button',
      class: entry.found ? '' : 'is-locked',
      dataset: { quality: entry.quality, element: entry.element },
      style: { '--el': `var(--el-${entry.element})` },
      title: entry.found ? `${entry.name}·${entry.title}` : '未收录',
      onclick: () => openDetail(entry)
    },
    entry.found ? h('.codexcell__el') : null,
    icon(entry.found ? weaponIcon(entry.type) : 'lock'),
    h('.codexcell__name', { text: entry.found ? entry.name : '？？？' }),
    entry.count > 1 ? h('.wcard__lv.t-num', { text: `×${entry.count}` }) : null);
    return node;
  }

  function openDetail(entry) {
    const body = entry.found
      ? h('.section', { dataset: { quality: entry.quality, element: entry.element } },
        h('.detail__hero',
          h('.detail__sigil', { style: { '--el': `var(--el-${entry.element})` } }, icon(weaponIcon(entry.type))),
          h('.grow',
            h('.detail__name', { text: entry.name }),
            h('.wcard__title', { text: entry.title }),
            h('.wcard__tags',
              h('span.tag.tag--q', { text: qualityCN(entry.quality) }),
              h('span.tag.tag--el', { style: { '--el': `var(--el-${entry.element})` }, text: `${elementCN(entry.element)}·${entry.type}` }),
              h('span.tag', { style: { color: 'var(--paper-3)' }, text: `已锻 ${entry.count} 次` })))),
        h('.stat-grid',
          h('.stat', h('.stat__k', { text: '基础攻击' }), h('.stat__v.t-num', { text: String(entry.baseAtk) })),
          h('.stat', h('.stat__k', { text: '基础生命' }), h('.stat__v.t-num', { text: String(entry.baseHp) })),
          h('.stat', h('.stat__k', { text: '速度' }), h('.stat__v.t-num', { text: String(entry.speed ?? '—') })),
          h('.stat', h('.stat__k', { text: '出炉' }), h('.stat__v', { style: { fontSize: '13px' }, text: entry.forgeStage || '—' }))),
        entry.skill
          ? h('.affix',
            h('.affix__dot'),
            h('.grow',
              h('.affix__name', { text: entry.skill.name }),
              h('.t-dim', { style: { fontSize: '10.5px' }, text: entry.skill.desc })))
          : null,
        (entry.tags || []).length
          ? h('.row.row--wrap', entry.tags.map((t) => h('span.tag', { style: { color: 'var(--paper-3)' }, text: t })))
          : null,
        entry.lore ? h('.detail__lore', { text: entry.lore }) : null)
      : emptyState({
        icon: 'lock',
        title: '尚未收录',
        hint: `此兵属「${qualityCN(entry.quality)}」，需在对应炉阶锻出后方可入谱。`,
        action: { label: '前往工坊', onClick: () => { sheet.close(); ui.go('forge'); } }
      });

    const sheet = openSheet(ui.host, { title: entry.found ? '兵谱详录' : '未解之兵', body });
  }

  function renderAll() {
    renderHead();
    renderFilters();
    renderGrid();
  }

  renderAll();

  return { el, onEnter: renderAll };
}
