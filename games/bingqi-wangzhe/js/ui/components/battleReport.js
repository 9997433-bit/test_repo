/** 战报：判定 + 时间轴 + 奖励。战役与竞技共用。 */

import { h } from '../dom.js';
import { icon } from '../icons.js';
import { lootRow } from './resourceBar.js';
import { reducedMotion } from '../motion.js';

export function battleReport(result, { subtitle } = {}) {
  const win = result.winner === 'player';

  const timeline = h('.timeline');
  result.timeline.forEach((entry, i) => {
    const row = h(
      `.tl${entry.kind === 'foe' ? '.tl--foe' : ''}${entry.kind === 'sys' ? '.tl--sys' : ''}`,
      {
        style: {
          '--el': entry.element ? `var(--el-${entry.element})` : null,
          animationDelay: reducedMotion() ? '0ms' : `${Math.min(i * 26, 700)}ms`
        }
      },
      h('.tl__round.t-num', { text: entry.round ? `R${entry.round}` : '—' }),
      h('.tl__text', { html: entry.text })
    );
    timeline.append(row);
  });

  return h(
    '.report',
    h(`.report__verdict.${win ? 'is-win' : 'is-lose'}`, { text: win ? '胜' : '败' }),
    h('.row.row--between',
      h('.t-dim', { style: { fontSize: '11px' }, text: subtitle || '' }),
      h('.t-dim', { style: { fontSize: '11px' }, text: `${result.rounds} 回合 · 存活 ${result.survivors}/${result.total}` })),
    win && result.stars
      ? h('.row', { style: { justifyContent: 'center' } },
        h('.stars', { style: { gap: '6px' } },
          [0, 1, 2].map((i) => icon('star', i < result.stars ? 'is-on' : ''))))
      : null,
    h('.section__head', h('.section__title', { text: '战报' }), h('.section__rule')),
    timeline,
    result.rewards && Object.keys(result.rewards).length
      ? h('.section',
        h('.section__head', h('.section__title', { text: '所获' }), h('.section__rule')),
        h('.rewards', lootRow(result.rewards)))
      : null
  );
}
