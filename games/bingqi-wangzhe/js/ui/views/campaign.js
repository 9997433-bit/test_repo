/** 试炼：40 关主线，每 5 关一位精英 BOSS。 */

import { h, clear, fromHTML } from '../dom.js';
import { icon, ELEMENT_ICON } from '../icons.js';
import { elementCN, fmtNum } from '../format.js';
import { emptyState, openSheet } from '../components/feedback.js';
import { battleReport } from '../components/battleReport.js';
import { ripple, haptic } from '../motion.js';

export function campaignView(ctx) {
  const { game, ui } = ctx;

  const heroCard = h('.card.card--framed');
  const listWrap = h('.section');

  const el = h('.view', { id: 'panel-campaign', role: 'tabpanel', 'aria-labelledby': 'tab-campaign' },
    heroCard, listWrap);

  function progressRing(done, total) {
    const r = 27;
    const c = 2 * Math.PI * r;
    const ratio = total ? done / total : 0;
    return fromHTML(`
      <svg viewBox="0 0 62 62" aria-hidden="true">
        <circle cx="31" cy="31" r="${r}" fill="none" stroke="rgba(228,184,74,.16)" stroke-width="4"/>
        <circle cx="31" cy="31" r="${r}" fill="none" stroke="var(--gold)" stroke-width="4"
                stroke-linecap="round" stroke-dasharray="${c}"
                stroke-dashoffset="${c * (1 - ratio)}"/>
      </svg>`);
  }

  function renderHero() {
    const stages = game.stages();
    const cleared = game.campaign().cleared;
    const next = stages.find((s) => s.index === cleared + 1) || stages[stages.length - 1];
    clear(heroCard);
    heroCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '主线试炼' }),
          h('.section__rule'),
          h('.section__meta', { text: `${cleared}/${stages.length} 关` })),
        h('.campaign__hero',
          h('.campaign__ring',
            progressRing(cleared, stages.length),
            h('div', { style: { textAlign: 'center' } },
              h('.campaign__ringval', { text: String(cleared) }),
              h('.campaign__ringcap', { text: '已破' }))),
          h('.grow',
            h('.wcard__name', { text: cleared >= stages.length ? '兵谱已尽' : `下一关 · ${next.name}` }),
            h('.wcard__title', { text: `${next.regionName} · ${elementCN(next.element)}属` }),
            h('.row', { style: { marginTop: '4px', gap: '10px' } },
              h('.t-dim', { style: { fontSize: '11px' }, text: `推荐战力 ${fmtNum(next.powerReq)}` }),
              h('.t-dim', { style: { fontSize: '11px' }, text: `体力 ${next.staminaCost}` }))),
          h('button.btn.btn--primary.btn--sm', {
            type: 'button',
            onclick: (e) => { ripple(e); challenge(next); }
          }, icon('trial'), '出征'))));
  }

  function stageRow(stage) {
    const cleared = game.campaign().cleared;
    const stars = game.campaign().stars[stage.id] || 0;
    const locked = stage.index > cleared + 1;
    const isCurrent = stage.index === cleared + 1;
    const done = stage.index <= cleared;

    const row = h('button.stagerow', {
      type: 'button',
      disabled: locked,
      class: [locked ? 'is-locked' : '', isCurrent ? 'is-current' : '', stage.isElite ? 'is-elite' : ''],
      style: { '--el': `var(--el-${stage.element})` },
      onclick: (e) => { ripple(e); challenge(stage); }
    },
    h('.stagerow__no.t-num', { text: String(stage.index) }),
    h('.stagerow__body',
      h('.stagerow__name', { text: stage.name },
        stage.isElite ? h('span.tag', { style: { color: 'var(--cinnabar-lit)' }, text: '精英' }) : null,
        done ? h('span.tag', { style: { color: 'var(--ok)' }, text: '已破' }) : null),
      h('.stagerow__meta',
        h('span', icon(ELEMENT_ICON[stage.element]), ` ${elementCN(stage.element)}`),
        h('span', '战力 ', h('b', { text: fmtNum(stage.powerReq) })),
        h('span', '体力 ', h('b', { text: String(stage.staminaCost) })),
        stage.bossName ? h('span.t-dim', { text: stage.bossName }) : null)),
    h('.stagerow__side',
      locked ? icon('lock') : h('.stars', [0, 1, 2].map((i) => icon('star', i < stars ? 'is-on' : ''))),
      locked ? null : h('.t-dim', { style: { fontSize: '10px' }, text: done ? '再战' : '挑战' })));
    return row;
  }

  function renderList() {
    const stages = game.stages();
    clear(listWrap);
    if (!stages.length) {
      listWrap.append(emptyState({ icon: 'trial', title: '尚无关卡数据', hint: '等待 data/stages.js 接入。' }));
      return;
    }
    const cleared = game.campaign().cleared;
    game.regions().forEach((region) => {
      const inRegion = stages.filter((s) => s.regionId === region.id);
      if (!inRegion.length) return;
      const doneCount = inRegion.filter((s) => s.index <= cleared).length;
      listWrap.append(
        h('.region', { style: { '--el': `var(--el-${region.element})` } },
          h('.region__head',
            h('.region__name', { text: region.name }),
            h('.region__rule'),
            h('.region__count', { text: `${doneCount}/${inRegion.length}` })),
          h('.section', { style: { gap: '6px' } }, inRegion.map(stageRow)))
      );
    });
  }

  function challenge(stage) {
    const res = game.challengeStage(stage.id);
    if (!res.ok) return ui.toast.bad(res.error);
    haptic(res.result.winner === 'player' ? [12, 40, 18] : 30);
    ui.refreshChrome();
    renderHero();
    renderList();
    openSheet(ui.host, {
      title: `第 ${stage.index} 关 · ${stage.name}`,
      body: battleReport(res.result, {
        subtitle: `${stage.regionName} · ${stage.waves} 波${stage.bossName ? ` · ${stage.bossName}` : ''}`
      }),
      foot: [
        h('button.btn.btn--ghost.grow', { type: 'button', text: '知道了', onclick: (e) => e.target.closest('.scrim')?.remove() }),
        h('button.btn.btn--primary.grow', {
          type: 'button',
          text: '再战一场',
          onclick: (e) => { e.target.closest('.scrim')?.remove(); challenge(stage); }
        })
      ]
    });
  }

  renderHero();
  renderList();

  return {
    el,
    onEnter() {
      renderHero();
      renderList();
    }
  };
}
