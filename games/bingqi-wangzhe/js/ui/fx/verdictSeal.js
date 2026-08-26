/**
 * 胜负印章：战斗结束时盖下的那一方朱印。
 *
 * 分两段：印章从高处砸下（scale 2.6 → 1，带轻微旋转），落定后墨迹晕开。
 * 降级模式直接给终态，不做补间。
 */

import { h } from '../dom.js';
import { reducedMotion } from '../motion.js';

const FACE = {
  player: { char: '胜', cls: 'is-win', caption: '凯旋' },
  enemy: { char: '败', cls: 'is-lose', caption: '折戟' },
  draw: { char: '平', cls: 'is-draw', caption: '两不相下' }
};

/**
 * @param {'player'|'enemy'|'draw'} winner
 * @param {{grade?:string, caption?:string}} [opts]
 */
export function verdictSeal(winner, opts = {}) {
  const face = FACE[winner] || FACE.draw;
  const el = h(`.seal.${face.cls}`, { role: 'img', 'aria-label': `${face.char}·${opts.caption || face.caption}` },
    h('.seal__ink'),
    h('.seal__stamp',
      h('.seal__char', { text: face.char }),
      opts.grade ? h('.seal__grade', { text: opts.grade }) : null),
    h('.seal__caption', { text: opts.caption || face.caption }));
  if (reducedMotion()) el.classList.add('is-instant');
  return el;
}

/** 盖章：挂上去并触发落印动画，返回印章节点。 */
export function stampSeal(host, winner, opts = {}) {
  const seal = verdictSeal(winner, opts);
  host.append(seal);
  if (reducedMotion()) {
    seal.classList.add('is-stamped');
    return seal;
  }
  requestAnimationFrame(() => seal.classList.add('is-stamped'));
  return seal;
}

export default stampSeal;
