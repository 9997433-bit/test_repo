/** 竞技：本地镜像 AI 对手 20 名 + ELO-lite 排名。 */

import { h, clear, fromHTML } from '../dom.js';
import { icon, weaponIcon, ELEMENT_ICON } from '../icons.js';
import { fmtNum, elementCN, fmtAgo } from '../format.js';
import { emptyState, openSheet } from '../components/feedback.js';
import { battleReport } from '../components/battleReport.js';
import { ripple, haptic } from '../motion.js';

const DIFF_CN = { easy: '优势', even: '势均', hard: '劣势' };

export function arenaView(ctx) {
  const { game, ui } = ctx;

  const rankCard = h('.card.card--framed');
  const listCard = h('.card');
  const logCard = h('.card');

  const el = h('.view.stagger', { id: 'panel-arena', role: 'tabpanel', 'aria-labelledby': 'tab-arena' },
    rankCard, listCard, logCard);

  function badge(rank) {
    return fromHTML(`
      <svg class="icon" viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 3 50 12v18c0 12-9 20-22 23C15 50 6 42 6 30V12z"
              fill="rgba(228,184,74,.14)" stroke="currentColor" stroke-width="1.6"/>
        <path d="M28 9 44 15.6V30c0 9-6.6 15.2-16 17.6C18.6 45.2 12 39 12 30V15.6z"
              fill="none" stroke="currentColor" stroke-width="1" opacity=".55"/>
      </svg>`);
  }

  function renderRank() {
    const a = game.arena();
    clear(rankCard);
    rankCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '兵器竞技' }),
          h('.section__rule'),
          h('.section__meta', { text: `今日剩余 ${a.ticketsLeft}/5 次` })),
        h('.arena__rank',
          h('.arena__badge', badge(a.rank), h('.arena__badgeno.t-num', { text: String(a.rank) })),
          h('.grow',
            h('.wcard__name', { text: `当前排名 第 ${a.rank} 位` }),
            h('.wcard__title', { text: `积分 ${fmtNum(a.points)} · 战力 ${fmtNum(game.estimatePower())}` }),
            h('.t-dim', { style: { fontSize: '10.5px', marginTop: '3px' }, text: '挑战不消耗体力；胜则夺其名次，负则小挫积分。' })))));
  }

  function foeRow(foe) {
    const disabled = game.arena().ticketsLeft <= 0;
    return h('button.foe', {
      type: 'button',
      disabled,
      style: { '--el': `var(--el-${foe.element})` },
      onclick: (e) => { ripple(e); fight(foe); }
    },
    h(`.foe__rank.t-num${foe.rank <= 3 ? '.is-top' : ''}`, { text: `#${foe.rank}` }),
    h('.foe__avatar', icon(ELEMENT_ICON[foe.element])),
    h('.foe__body',
      h('.foe__name', { text: foe.name }, h('span.tag', { style: { color: 'var(--paper-4)' }, text: foe.title })),
      h('.foe__meta', '战力 ', h('b', { text: fmtNum(foe.power) }), ` · 积分 ${foe.points} · ${elementCN(foe.element)}阵`)),
    h('span.foe__diff.is-' + foe.difficulty, { text: DIFF_CN[foe.difficulty] }));
  }

  function renderList() {
    clear(listCard);
    const foes = game.arenaOpponents();
    const a = game.arena();
    listCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '擂台对手' }),
          h('.section__rule'),
          h('.section__meta', { text: `${foes.length} 名镜像` })),
        a.ticketsLeft <= 0
          ? emptyState({
            icon: 'clock',
            title: '今日挑战已尽',
            hint: '明日辰时刷新 5 次挑战机会。'
          })
          : null,
        foes.length
          ? h('.section', { style: { gap: '6px' } }, foes.map(foeRow))
          : emptyState({ icon: 'arena', title: '擂台空置', hint: '暂无可挑战的镜像对手。' })));
  }

  function renderLog() {
    const log = game.arena().log || [];
    clear(logCard);
    logCard.append(
      h('.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '战绩' }),
          h('.section__rule'),
          h('.section__meta', { text: log.length ? `近 ${log.length} 场` : '' })),
        log.length
          ? h('.section', { style: { gap: '5px' } }, log.map((r) =>
            h('.listrow',
              icon(r.win ? 'check' : 'close'),
              h('.grow', h('.foe__name', { text: r.foe }),
                h('.foe__meta', { text: fmtAgo(r.at) })),
              h('span.tag', {
                style: { color: r.win ? 'var(--ok)' : 'var(--bad)' },
                text: r.win ? (r.rankChange ? `胜 · 升 ${r.rankChange} 名` : '胜') : '负'
              }))))
          : emptyState({
            icon: 'scroll',
            title: '尚无战绩',
            hint: '挑战任意镜像对手，此处会留下战报摘要。'
          })));
  }

  function fight(foe) {
    const res = game.arenaFight(foe.id);
    if (!res.ok) return ui.toast.bad(res.error);
    haptic(res.result.winner === 'player' ? [12, 40, 18] : 30);
    ui.refreshChrome();
    renderAll();
    if (res.result.rankChange) ui.toast.gold(`名次上升 ${res.result.rankChange} 位`);
    openSheet(ui.host, {
      title: `擂台 · ${foe.name}`,
      body: battleReport(res.result, { subtitle: `${foe.title} · ${elementCN(foe.element)}阵 · 战力 ${fmtNum(foe.power)}` }),
      foot: [h('button.btn.btn--ghost.btn--block', {
        type: 'button',
        text: '退下擂台',
        onclick: (e) => e.target.closest('.scrim')?.remove()
      })]
    });
  }

  function renderAll() {
    renderRank();
    renderList();
    renderLog();
  }

  renderAll();

  return { el, onEnter: renderAll };
}
