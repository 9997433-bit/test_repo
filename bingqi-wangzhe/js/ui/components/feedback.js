/** 吐司、空状态、弹层：全局反馈组件。 */

import { h, clear } from '../dom.js';
import { icon } from '../icons.js';
import { reducedMotion } from '../motion.js';
import { play as playCue } from '../audio.js';

/* ----------------------------- 吐司 ----------------------------- */

export function createToaster() {
  const el = h('.toasts', { role: 'status', 'aria-live': 'polite' });

  function show(text, kind = 'info', iconName) {
    const node = h(
      `.toast.toast--${kind}`,
      iconName ? icon(iconName) : null,
      h('span', { text })
    );
    el.append(node);
    const life = reducedMotion() ? 1600 : 2200;
    setTimeout(() => {
      node.classList.add('is-out');
      setTimeout(() => node.remove(), reducedMotion() ? 20 : 280);
    }, life);
    // 最多同时 3 条
    while (el.children.length > 3) el.firstElementChild.remove();
  }

  return {
    el,
    show,
    ok: (t) => show(t, 'ok', 'check'),
    // 失败提示配一声短促的闷响：吐司会飘走，声音不会被漏看
    bad: (t) => {
      playCue('error');
      return show(t, 'bad', 'close');
    },
    gold: (t) => show(t, 'gold', 'sparkle')
  };
}

/* ----------------------------- 空状态 ----------------------------- */

/**
 * @param {{icon?:string,title:string,hint?:string,action?:{label:string,onClick:Function}}} opts
 */
export function emptyState({ icon: iconName = 'scroll', title, hint, action }) {
  return h(
    '.empty',
    icon(iconName, 'empty__art'),
    h('.empty__title', { text: title }),
    hint ? h('.empty__hint', { text: hint }) : null,
    action
      ? h('button.btn.btn--sm.btn--ghost', {
        type: 'button',
        text: action.label,
        onclick: action.onClick
      })
      : null
  );
}

/* ----------------------------- 弹层 ----------------------------- */

/**
 * 在 shell 内挂一个居中弹层。
 * @returns {{close:Function, body:HTMLElement, root:HTMLElement}}
 */
export function openSheet(host, { title, body, foot, wide = false, onClose } = {}) {
  const bodyEl = h('.sheet__body');
  if (body) bodyEl.append(body);

  const sheet = h(
    '.sheet',
    { style: wide ? { maxWidth: '100%' } : null, role: 'dialog', 'aria-modal': 'true' },
    h(
      '.sheet__head',
      h('h3.sheet__title', { text: title }),
      h('.grow'),
      h('button.iconbtn', { type: 'button', 'aria-label': '关闭', onclick: () => close() }, icon('close'))
    ),
    bodyEl,
    foot ? h('.sheet__foot', foot) : null
  );

  const scrim = h('.scrim', {
    onclick: (e) => {
      if (e.target === scrim) close();
    }
  }, sheet);

  function close() {
    scrim.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  document.addEventListener('keydown', onKey);
  host.append(scrim);
  return { close, body: bodyEl, root: scrim, setBody: (node) => clear(bodyEl).append(node) };
}
