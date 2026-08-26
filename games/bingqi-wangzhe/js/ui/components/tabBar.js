/** 底部 6 Tab 导航。 */

import { h } from '../dom.js';
import { icon } from '../icons.js';
import { haptic } from '../motion.js';

export function createTabBar(tabs, onSelect) {
  const buttons = new Map();

  const el = h(
    'nav.tabbar',
    { role: 'tablist', 'aria-label': '主导航' },
    tabs.map((t) => {
      const dot = h('.tab__dot', { hidden: true });
      const btn = h(
        'button.tab',
        {
          type: 'button',
          role: 'tab',
          id: `tab-${t.id}`,
          'aria-controls': `panel-${t.id}`,
          'aria-selected': 'false',
          onclick: () => {
            haptic(8);
            onSelect(t.id);
          }
        },
        h('.tab__glow'),
        icon(t.icon),
        h('.tab__label', { text: t.label }),
        dot
      );
      buttons.set(t.id, { btn, dot });
      return btn;
    })
  );

  function setActive(id) {
    buttons.forEach(({ btn }, key) => {
      btn.setAttribute('aria-selected', key === id ? 'true' : 'false');
    });
  }

  /** 红点提示（例如挂机可领取、竞技有次数） */
  function setBadge(id, on) {
    const entry = buttons.get(id);
    if (entry) entry.dot.hidden = !on;
  }

  return { el, setActive, setBadge };
}
