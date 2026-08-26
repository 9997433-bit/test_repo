/**
 * 资源飞币：从「产出的地方」飞到顶部资源条对应的格子。
 *
 * 用 Web Animations API 而不是 CSS class：起点/终点是运行时算出来的两个矩形，
 * 关键帧必须带具体像素，写在 CSS 里反而要塞一堆内联变量。
 *
 * 降级（prefers-reduced-motion）：不产生任何飞行元素，只让目标格子跳一下，
 * 玩家仍然知道「东西进账了」。
 */

import { icon, RESOURCE_ICON } from '../icons.js';
import { RESOURCE_COLOR } from '../format.js';
import { reducedMotion } from '../motion.js';

/** 单种资源最多几枚，太多只是糊屏。 */
const PER_RESOURCE = 4;
const MAX_TOTAL = 14;

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function bump(cell) {
  if (!cell) return;
  cell.classList.remove('is-bumped');
  // 强制重排，保证连续两次领取都能重放动画
  void cell.offsetWidth;
  cell.classList.add('is-bumped');
  setTimeout(() => cell.classList.remove('is-bumped'), 460);
}

/**
 * @param {HTMLElement} sourceEl 产出的来源节点（按钮 / 奖励条）
 * @param {Record<string, number>} loot
 * @param {{resourceCell?:(id:string)=>HTMLElement|null, onDone?:Function}} [opts]
 */
export function flyLoot(sourceEl, loot, opts = {}) {
  const entries = Object.entries(loot || {}).filter(([, n]) => n > 0);
  if (!entries.length) return;

  const cellOf = opts.resourceCell || (() => null);

  if (!sourceEl || reducedMotion() || typeof document === 'undefined') {
    entries.forEach(([id]) => bump(cellOf(id)));
    opts.onDone?.();
    return;
  }

  const from = centerOf(sourceEl);
  const layer = document.createElement('div');
  layer.className = 'flyloot';
  document.body.append(layer);

  let spawned = 0;
  let pending = 0;
  const finish = () => {
    pending -= 1;
    if (pending <= 0) {
      layer.remove();
      opts.onDone?.();
    }
  };

  entries.forEach(([id, amount], resIndex) => {
    const cell = cellOf(id);
    const target = cell ? centerOf(cell) : { x: from.x, y: 24 };
    const count = Math.max(1, Math.min(PER_RESOURCE, Math.round(Math.log10(amount + 1) * 2) || 1));

    for (let i = 0; i < count && spawned < MAX_TOTAL; i += 1) {
      spawned += 1;
      pending += 1;
      const node = document.createElement('span');
      node.className = 'flyloot__coin';
      node.style.setProperty('--res-color', RESOURCE_COLOR[id] || 'var(--gold)');
      node.append(icon(RESOURCE_ICON[id] || 'coin'));
      layer.append(node);

      const jitterX = (Math.random() - 0.5) * 52;
      const jitterY = (Math.random() - 0.5) * 26;
      const delay = resIndex * 60 + i * 70;
      const duration = 460 + Math.random() * 220;

      const anim = node.animate(
        [
          {
            transform: `translate3d(${from.x}px, ${from.y}px, 0) scale(.5)`,
            opacity: 0
          },
          {
            transform: `translate3d(${from.x + jitterX}px, ${from.y + jitterY - 34}px, 0) scale(1.15)`,
            opacity: 1,
            offset: 0.24
          },
          {
            transform: `translate3d(${target.x}px, ${target.y}px, 0) scale(.42)`,
            opacity: 0.85
          }
        ],
        {
          duration,
          delay,
          easing: 'cubic-bezier(.36,.06,.24,1)',
          fill: 'forwards'
        }
      );

      anim.onfinish = () => {
        node.remove();
        bump(cell);
        finish();
      };
      anim.oncancel = finish;
    }
  });

  if (pending === 0) {
    layer.remove();
    opts.onDone?.();
  }
}

export default flyLoot;
