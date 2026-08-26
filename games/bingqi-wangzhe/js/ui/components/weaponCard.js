/** 兵器卡（背包 / 选将 / 详情）。 */

import { h } from '../dom.js';
import { icon, weaponIcon, ELEMENT_ICON } from '../icons.js';
import { qualityCN, elementCN, fmtNum } from '../format.js';

export function weaponCard(w, { onClick, selected = false, compact = false } = {}) {
  const card = h(
    'button.wcard',
    {
      type: 'button',
      class: selected ? 'is-selected' : '',
      dataset: { quality: w.quality, element: w.element, uid: w.uid },
      onclick: onClick ? (e) => onClick(w, e) : null,
      'aria-label': `${w.name} ${qualityCN(w.quality)} 等级${w.level}`
    },
    h(
      '.wcard__sigil',
      icon(weaponIcon(w.type)),
      h('.wcard__lv.t-num', { text: `Lv${w.level}` })
    ),
    h(
      '.wcard__body',
      h('.wcard__name', { text: w.name },
        w.equippedSlot >= 0
          ? h('span.tag', { style: { color: 'var(--gold)' }, text: `阵${w.equippedSlot + 1}` })
          : null),
      compact ? null : h('.wcard__title', { text: w.title || '' }),
      h(
        '.wcard__tags',
        h('span.tag.tag--q', { text: qualityCN(w.quality) }),
        h('span.tag.tag--el', { text: `${elementCN(w.element)}·${w.type}` }),
        ...(compact ? [] : (w.affixes || []).slice(0, 2).map((a) =>
          h('span.tag', { style: { color: 'var(--paper-3)' }, text: `${a.name}+${a.value}${a.unit}` })))
      ),
      compact
        ? null
        : h(
          '.wcard__stats',
          h('span', '攻 ', h('b', { text: fmtNum(w.stats.atk) })),
          h('span', '御 ', h('b', { text: fmtNum(w.stats.hp) })),
          h('span', '速 ', h('b', { text: fmtNum(w.stats.speed) }))
        )
    ),
    h(
      '.wcard__side',
      h('.wcard__power', h('span', '战力'), h('span', { text: fmtNum(w.power) })),
      icon(ELEMENT_ICON[w.element] || 'flame', 'wcard__el')
    )
  );
  card.style.setProperty('--el', `var(--el-${w.element})`);
  return card;
}

/** 兵器详情主体（弹层内使用）。 */
export function weaponDetail(w, game) {
  const cap = game.levelCap?.() ?? 30;
  return h(
    '.section',
    { dataset: { quality: w.quality, element: w.element } },
    h(
      '.detail__hero',
      h('.detail__sigil', icon(weaponIcon(w.type))),
      h(
        '.grow',
        h('.detail__name', { text: w.name }),
        h('.wcard__title', { text: w.title || '' }),
        h(
          '.wcard__tags',
          h('span.tag.tag--q', { text: qualityCN(w.quality) }),
          h('span.tag.tag--el', { text: `${elementCN(w.element)}·${w.type}` }),
          h('span.tag', { style: { color: 'var(--paper-3)' }, text: `Lv ${w.level}/${cap}` })
        )
      )
    ),
    h(
      '.stat-grid',
      statBox('攻击', w.stats.atk),
      statBox('生命', w.stats.hp),
      statBox('速度', w.stats.speed),
      statBox('暴击', `${Math.round(w.stats.crit * 100)}%`),
      statBox('战力', fmtNum(w.power))
    ),
    h('.section__head', h('.section__title', { text: '技能' }), h('.section__rule')),
    h(
      '.affix',
      h('.affix__dot'),
      h('.grow',
        h('.affix__name', { text: w.skill?.name || '无' }),
        h('.t-dim', { style: { fontSize: '10.5px' }, text: w.skill?.desc || '' })),
      w.skill?.cd ? h('span.t-num.t-dim', { text: `CD ${w.skill.cd}` }) : null
    ),
    h('.section__head',
      h('.section__title', { text: '词条' }),
      h('.section__rule'),
      h('.section__meta', { text: `技能槽 ${w.skillSlots}/3` })),
    (w.affixes || []).length
      ? h('.section', (w.affixes || []).map((a) =>
        h('.affix',
          h('.affix__dot'),
          h('.affix__name', { text: a.name }),
          h('.affix__val', { text: `+${a.value}${a.unit}` }))))
      : h('.t-dim', { style: { fontSize: '11.5px' }, text: '此兵未生词条 —— 凡铁本无华。' }),
    w.lore ? h('.detail__lore', { text: w.lore }) : null
  );
}

function statBox(k, v) {
  return h('.stat', h('.stat__k', { text: k }), h('.stat__v', { text: String(v) }));
}
