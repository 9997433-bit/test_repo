/**
 * 战报：弹道演出舞台 + 判定 + 奖励。战役与竞技共用。
 *
 * 舞台部分交给 `fx/battleStage.js`（弹道 / 闪白 / 慢动作 / 印章都在那儿），
 * 本文件只负责把它和评级、奖励拼成弹层里的一页。
 */

import { h } from '../dom.js';
import { icon } from '../icons.js';
import { lootRow } from './resourceBar.js';
import { createBattleStage } from '../fx/battleStage.js';
import { flyLoot } from '../fx/flyingLoot.js';

/**
 * @param {object} result 战报（引擎 timeline 或 mock timeline）
 * @param {{subtitle?:string, ui?:object}} [opts] `ui` 传入时，结算奖励会飞向顶部资源条
 */
export function battleReport(result, { subtitle, ui } = {}) {
  const win = result.winner === 'player';
  const rewards = result.rewards && Object.keys(result.rewards).length ? result.rewards : null;
  const rewardBox = rewards
    ? h('.section',
      h('.section__head', h('.section__title', { text: '所获' }), h('.section__rule')),
      h('.rewards', lootRow(rewards)))
    : null;

  const stage = createBattleStage(result, {
    subtitle,
    onEnd: () => {
      if (rewardBox && ui) flyLoot(rewardBox, rewards, { resourceCell: ui.resourceCell });
    }
  });

  const el = h('.report',
    h('.row.row--between',
      h('.t-dim', { style: { fontSize: '11px' }, text: subtitle || '' }),
      h('.t-dim', {
        style: { fontSize: '11px' },
        text: `${result.rounds} 回合 · 存活 ${result.survivors}/${result.total}`
      })),
    win && result.stars
      ? h('.row', { style: { justifyContent: 'center' } },
        h('.stars', { style: { gap: '6px' } },
          [0, 1, 2].map((i) => icon('star', i < result.stars ? 'is-on' : ''))))
      : null,
    stage.el,
    rewardBox);

  // 舞台需要先进 DOM 才量得到尺寸（canvas 与弹道端点都靠 rect）。
  requestAnimationFrame(() => stage.start());
  el.dispose = () => stage.destroy();
  return el;
}

export default battleReport;
