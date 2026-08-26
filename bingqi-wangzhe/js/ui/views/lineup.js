/** 战阵：5 栏位上阵 + 羁绊预览 + 战力总览。 */

import { h, clear } from '../dom.js';
import { icon, weaponIcon } from '../icons.js';
import { fmtNum, elementCN, qualityCN, ELEMENT_BEATS } from '../format.js';
import { emptyState, openSheet } from '../components/feedback.js';
import { weaponCard } from '../components/weaponCard.js';
import { haptic, ripple } from '../motion.js';

export function lineupView(ctx) {
  const { game, ui } = ctx;

  const powerCard = h('.card.card--framed');
  const slotsCard = h('.card');
  const bondCard = h('.card');
  const counterCard = h('.card');

  const el = h('.view.stagger', { id: 'panel-lineup', role: 'tabpanel', 'aria-labelledby': 'tab-lineup' },
    powerCard, slotsCard, bondCard, counterCard);

  function renderPower() {
    clear(powerCard);
    const equipped = game.lineup().filter(Boolean).length;
    powerCard.append(
      h('.card__inner.section',
        h('.powerplate',
          h('div', { style: { textAlign: 'center' } },
            h('.powerplate__val.t-num', { text: fmtNum(game.estimatePower()) }),
            h('.powerplate__cap', { text: '战 力' }))),
        h('.row.row--between',
          h('.t-dim', { style: { fontSize: '11px' }, text: `上阵 ${equipped}/${game.lineupUnlocked()} 栏` }),
          h('.t-dim', { style: { fontSize: '11px' }, text: `兵器库 ${game.weapons().length} 把` }))));
  }

  function renderSlots() {
    clear(slotsCard);
    const lineup = game.lineup();
    const unlocked = game.lineupUnlocked();

    const slots = lineup.map((uid, i) => {
      if (i >= unlocked) {
        return h('button.slot.slot--locked', {
          type: 'button',
          disabled: true,
          title: game.lineupUnlockHint(i)
        }, h('.slot__no.t-num', { text: String(i + 1) }), icon('lock'),
        h('.slot__hint', { text: '未解锁' }));
      }
      const w = uid ? game.weapon(uid) : null;
      if (!w) {
        return h('button.slot.slot--empty', {
          type: 'button',
          onclick: () => openPicker(i)
        }, h('.slot__no.t-num', { text: String(i + 1) }), icon('plus'),
        h('.slot__hint', { text: '空位' }));
      }
      return h('button.slot.slot--filled', {
        type: 'button',
        dataset: { quality: w.quality, element: w.element },
        style: { '--el': `var(--el-${w.element})` },
        onclick: () => openPicker(i)
      },
      h('.slot__no.t-num', { text: String(i + 1) }),
      icon(weaponIcon(w.type), 'slot__sigil'),
      h('.slot__name', { text: w.name }),
      h('.slot__lv', { text: `Lv${w.level}` }));
    });

    slotsCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '战阵栏位' }),
          h('.section__rule'),
          h('.section__meta', { text: unlocked < 5 ? `第 ${unlocked + 1} 栏待解锁` : '五栏尽开' })),
        h('.lineup', slots),
        h('.t-dim', { style: { fontSize: '10.5px' }, text: '点击栏位上阵或替换；栏位随主线进度解锁。' })));
  }

  function renderBonds() {
    clear(bondCard);
    const bonds = game.bonds();
    bondCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '羁绊' }),
          h('.section__rule'),
          h('.section__meta', { text: `${bonds.filter((b) => b.active).length}/${bonds.length} 生效` })),
        h('.section', { style: { gap: '6px' } },
          bonds.map((b) =>
            h(`.bond${b.active ? '.is-active' : ''}`,
              h('.bond__mark', icon(b.active ? 'check' : 'lock')),
              h('.grow',
                h('.bond__name', { text: b.name }),
                h('.bond__desc', { text: b.desc })),
              h('.t-num.t-dim', { style: { fontSize: '11px' }, text: b.detail }))))));
  }

  function renderCounter() {
    clear(counterCard);
    const counts = { fire: 0, ice: 0, thunder: 0 };
    game.lineup().filter(Boolean).forEach((uid) => {
      const w = game.weapon(uid);
      if (w) counts[w.element] += 1;
    });
    counterCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '三相克制' }),
          h('.section__rule'),
          h('.section__meta', { text: '克制 ×1.35 / 被克 ×0.75' })),
        h('.stat-grid',
          Object.entries(counts).map(([elm, n]) =>
            h('.stat', { style: { borderColor: n ? `color-mix(in srgb, var(--el-${elm}) 50%, transparent)` : null } },
              h('.stat__k', { text: `${elementCN(elm)} 克 ${elementCN(ELEMENT_BEATS[elm])}` }),
              h('.stat__v', { style: { color: `var(--el-${elm})` }, text: `${n} 把` }))))));
  }

  function openPicker(slot) {
    const lineup = game.lineup();
    const current = lineup[slot];
    const all = game.weapons().sort((a, b) => b.power - a.power);

    const body = h('.section');
    if (!all.length) {
      body.append(emptyState({
        icon: 'anvilSmall',
        title: '尚无兵器可用',
        hint: '先去工坊起炉锻造一把。',
        action: { label: '前往工坊', onClick: () => { sheet.close(); ui.go('forge'); } }
      }));
    } else {
      body.append(h('.baglist', all.map((w) => weaponCard(w, {
        selected: w.uid === current,
        onClick: (weapon) => {
          const res = game.setLineup(slot, weapon.uid);
          if (!res.ok) return ui.toast.bad(res.error);
          haptic(10);
          ui.toast.ok(`${weapon.name} 已入第 ${slot + 1} 阵`);
          sheet.close();
          renderAll();
          ui.refreshChrome();
        }
      }))));
    }

    const sheet = openSheet(ui.host, {
      title: `第 ${slot + 1} 栏 · 择兵`,
      body,
      foot: current
        ? [h('button.btn.btn--ghost.btn--block', {
          type: 'button',
          text: '卸下此栏',
          onclick: (e) => {
            ripple(e);
            game.clearSlot(slot);
            sheet.close();
            renderAll();
            ui.refreshChrome();
          }
        })]
        : null
    });
  }

  function renderAll() {
    renderPower();
    renderSlots();
    renderBonds();
    renderCounter();
  }

  renderAll();

  return { el, onEnter: renderAll };
}
