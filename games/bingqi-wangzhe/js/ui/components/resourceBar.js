/** 顶部资源条：铜钱 / 精铁 / 体力 / 玄晶（+ 战力徽标）。 */

import { h, replace } from '../dom.js';
import { icon, RESOURCE_ICON } from '../icons.js';
import { fmtExact, fmtNum, resourceCN, RESOURCE_COLOR, fmtDuration } from '../format.js';
import { pulse } from '../motion.js';

const SHOWN = ['coin', 'iron', 'stamina', 'diamond'];

export function createResourceBar(game) {
  const cells = new Map();
  const prev = new Map();

  const bar = h('.resbar', { role: 'status', 'aria-label': '资源' });

  SHOWN.forEach((id) => {
    const val = h('.res__val.t-num', { text: '0' });
    const cell = h(
      `.res.res--${id}`,
      {
        style: { '--res-color': RESOURCE_COLOR[id] },
        title: resourceCN(id)
      },
      icon(RESOURCE_ICON[id], 'res__icon'),
      h('.res__body', val, h('.res__name', { text: resourceCN(id) })),
      h('.res__tick')
    );
    cells.set(id, { cell, val });
    bar.append(cell);
  });

  const powerVal = h('span.t-num', { text: '0' });
  const powerBadge = h('.brand__power', { title: '当前战阵战力' },
    icon('power'), powerVal);

  function update() {
    const res = game.resources();
    SHOWN.forEach((id) => {
      const { cell, val } = cells.get(id);
      const n = Math.floor(res[id] || 0);
      if (id === 'stamina') {
        const cap = game.staminaCap?.() ?? 120;
        val.textContent = `${n}`;
        val.dataset.cap = `/${cap}`;
        const eta = game.staminaEtaSeconds?.() ?? 0;
        cell.title = n >= cap ? '体力已满' : `下一点体力：${fmtDuration(eta)}`;
      } else {
        val.textContent = n >= 100000 ? fmtNum(n) : fmtExact(n);
        cell.title = `${resourceCN(id)} ${fmtExact(n)}`;
      }
      if (prev.has(id) && prev.get(id) !== n) {
        pulse(cell, 'is-bumped', 400);
      }
      prev.set(id, n);
    });
    powerVal.textContent = fmtNum(game.estimatePower());
  }

  update();

  return { el: bar, powerBadge, update };
}

/** 资源掉落条（战报奖励 / 挂机产出复用） */
export function lootRow(loot) {
  const items = Object.entries(loot).filter(([, v]) => v > 0);
  if (!items.length) return h('.t-dim', { text: '无产出' });
  return h(
    '.idle__loot',
    items.map(([id, v]) =>
      h('.loot', { style: { '--res-color': RESOURCE_COLOR[id] } },
        icon(RESOURCE_ICON[id] || 'coin'),
        h('b', { text: `+${fmtNum(v)}` }),
        h('span.t-dim', { text: resourceCN(id) }))
    )
  );
}

export { replace };
