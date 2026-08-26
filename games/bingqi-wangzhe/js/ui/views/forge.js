/**
 * 炉火工坊：三阶段炉 → 三锤演出 → 品质揭示卡。
 * 这是整个游戏的「造器」入口，也是视觉基调最重的一屏。
 */

import { h, clear } from '../dom.js';
import { icon, weaponIcon, RESOURCE_ICON, ELEMENT_ICON } from '../icons.js';
import {
  QUALITY_ORDER, qualityCN, elementCN, resourceCN, RESOURCE_COLOR,
  fmtNum, fmtDuration, pct
} from '../format.js';
import { furnaceArt, hammerArt, ridgeArt } from '../art/furnace.js';
import { createSparkField } from '../fx/sparks.js';
import { flyLoot } from '../fx/flyingLoot.js';
import { reducedMotion, ripple, haptic, pulse } from '../motion.js';
import { strike as strikeSound, reveal as revealSound, play as playCue } from '../audio.js';
import { emptyState, openSheet } from '../components/feedback.js';
import { lootRow } from '../components/resourceBar.js';
import { weaponCard } from '../components/weaponCard.js';

const ELEMENTS = ['fire', 'ice', 'thunder'];

export function forgeView(ctx) {
  const { game, ui } = ctx;

  const opts = {
    stage: 'iron',
    elementBias: null,
    useLucky: false,
    useMasterForge: false
  };

  let phase = 'idle';      // idle | armed | revealing
  let strikes = 0;
  let pending = null;      // 已锻出但尚未揭示的兵器
  let sparks = null;

  /* ----------------------- 炉膛 ----------------------- */

  const canvas = h('canvas.hearth__canvas', { 'aria-hidden': 'true' });
  const stageName = h('.hearth__stagename', { text: '精铁炉' });
  const phaseText = h('span', { text: '待起炉' });
  const pips = [0, 1, 2].map(() => h('.strikes__pip'));

  const hearth = h(
    '.hearth',
    ridgeArt(),
    h('.hearth__halo'),
    furnaceArt(),
    hammerArt(),
    canvas,
    h('.hearth__flash'),
    h('.hearth__banner', stageName, phaseText),
    h('.strikes', pips)
  );

  const tempFill = h('.bar__fill', { style: { width: '0%' } });
  const tempVal = h('.temp__val', { text: '0°' });
  const temp = h(
    '.temp',
    h('.temp__label', { text: '炉温' }),
    h('.bar', tempFill),
    tempVal
  );

  /* ----------------------- 炉阶选择 ----------------------- */

  const stageBtns = game.forgeStages().map((s) =>
    h('button.segmented__item', {
      type: 'button',
      'aria-pressed': String(s.id === opts.stage),
      dataset: { stage: s.id },
      onclick: (e) => {
        if (phase !== 'idle') return ui.toast.bad('炉中有物，先锤完这一炉');
        const preview = game.previewForge({ ...opts, stage: s.id });
        if (preview.locked) return ui.toast.bad(preview.lockHint);
        opts.stage = s.id;
        ripple(e);
        refresh();
      }
    }, s.name)
  );
  const stagePicker = h('.segmented', { role: 'group', 'aria-label': '炉阶' }, stageBtns);
  const stageHint = h('.t-dim', { style: { fontSize: '11px' }, text: '' });

  /* ----------------------- 配料 ----------------------- */

  const elChips = ELEMENTS.map((el) =>
    h('button.chip.chip--el', {
      type: 'button',
      dataset: { element: el },
      'aria-pressed': 'false',
      onclick: () => {
        if (phase !== 'idle') return;
        opts.elementBias = opts.elementBias === el ? null : el;
        haptic(6);
        refresh();
      }
    }, icon(ELEMENT_ICON[el]), `${elementCN(el)}偏向`)
  );

  const luckyChip = h('button.chip', {
    type: 'button',
    'aria-pressed': 'false',
    onclick: () => {
      if (phase !== 'idle') return;
      opts.useLucky = !opts.useLucky;
      haptic(6);
      refresh();
    }
  }, icon('charm'), '幸运符');

  const masterChip = h('button.chip', {
    type: 'button',
    'aria-pressed': 'false',
    onclick: () => {
      if (phase !== 'idle') return;
      const ready = game.previewForge(opts).masterForgeReady;
      if (!ready) return ui.toast.bad('大师熔炉今日已用');
      opts.useMasterForge = !opts.useMasterForge;
      haptic(6);
      refresh();
    }
  }, icon('sparkle'), '大师熔炉');

  const costRow = h('.cost');
  const oddsBar = h('.oddsbar', { role: 'img', 'aria-label': '品质概率' });
  const oddsLegend = h('.oddslegend');

  /* ----------------------- 主按钮 ----------------------- */

  const actionLabel = h('span', { text: '起炉锻造' });
  const actionSub = h('span.btn__sub', { text: '' });
  const actionBtn = h('button.btn.btn--primary.btn--lg.btn--block', {
    type: 'button',
    onclick: (e) => {
      ripple(e);
      phase === 'idle' ? startForge() : strike();
    }
  }, icon('anvilSmall'), actionLabel, actionSub);

  const cancelBtn = h('button.btn.btn--ghost.btn--sm', {
    type: 'button',
    hidden: true,
    text: '一锤定音（跳过演出）',
    onclick: () => {
      while (phase === 'armed') strike(true);
    }
  });

  /* ----------------------- 挂机产出 ----------------------- */

  const idleCard = h('.card.card--framed');

  function renderIdle() {
    const peek = game.peekIdle();
    clear(idleCard);
    idleCard.append(
      h(
        '.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '炉边挂机' }),
          h('.section__rule'),
          h('.section__meta', { text: peek.capped ? '已达 8 小时上限' : `已积累 ${fmtDuration(peek.seconds)}` })),
        peek.empty
          ? emptyState({
            icon: 'clock',
            title: '炉温尚温，暂无产出',
            hint: '推进试炼可提升挂机产出；离线最多结算 8 小时。'
          })
          : h(
            '.idle',
            h('.idle__dial', icon('recycle')),
            h('.grow', lootRow(peek.loot)),
            h('button.btn.btn--gold.btn--sm', {
              type: 'button',
              onclick: (e) => {
                ripple(e);
                const res = game.collectIdle();
                if (!res.ok) return ui.toast.bad(res.error || '暂无产出');
                // 先飞币再重绘：飞行起点就是这枚按钮，重绘会把它换掉。
                flyLoot(e.currentTarget, res.loot, {
                  resourceCell: ui.resourceCell,
                  onDone: () => ui.refreshChrome()
                });
                haptic([8, 24, 12]);
                playCue('coin');
                ui.toast.gold('炉边所得，已入囊中');
                ui.refreshChrome();
                renderIdle();
              }
            }, icon('coin'), '领取')
          )
      )
    );
  }

  /* ----------------------- 兵谱近作 ----------------------- */

  const recentCard = h('.card');

  function renderRecent() {
    const list = game.weapons().slice(-3).reverse();
    clear(recentCard);
    recentCard.append(
      h(
        '.card__inner.section',
        h('.section__head',
          h('.section__title', { text: '近日出炉' }),
          h('.section__rule'),
          h('.section__meta', { text: `共 ${game.weapons().length} 把` })),
        list.length
          ? h('.baglist.stagger', list.map((w) => weaponCard(w, {
            compact: true,
            onClick: (weapon) => openSheetForWeapon(weapon)
          })))
          : emptyState({
            icon: 'anvilSmall',
            title: '兵谱空空',
            hint: '起炉锻一把，从凡铁开始。'
          })
      )
    );
  }

  function openSheetForWeapon(w) {
    import('../components/weaponCard.js').then(({ weaponDetail }) => {
      openSheet(ui.host, { title: '兵器详情', body: weaponDetail(w, game) });
    });
  }

  /* ----------------------- 刷新 ----------------------- */

  function refresh() {
    const preview = game.previewForge(opts);

    // 炉阶
    stageBtns.forEach((b) => {
      const id = b.dataset.stage;
      const p = game.previewForge({ ...opts, stage: id });
      b.setAttribute('aria-pressed', String(id === opts.stage));
      b.disabled = p.locked || phase !== 'idle';
      b.title = p.locked ? p.lockHint : p.hint;
    });
    stageName.textContent = preview.stageName;
    stageHint.textContent = preview.locked ? preview.lockHint : preview.hint;
    forgeCard.dataset.stage = opts.stage;

    // 配料
    elChips.forEach((c) => {
      c.setAttribute('aria-pressed', String(opts.elementBias === c.dataset.element));
      c.style.setProperty('--el', `var(--el-${c.dataset.element})`);
      c.disabled = phase !== 'idle';
    });
    luckyChip.setAttribute('aria-pressed', String(opts.useLucky));
    luckyChip.disabled = phase !== 'idle';
    masterChip.setAttribute('aria-pressed', String(opts.useMasterForge));
    masterChip.disabled = phase !== 'idle' || !preview.masterForgeReady;
    masterChip.title = preview.masterForgeReady ? '史诗以上权重 ×1.8，每日一次' : '今日已用';

    // 成本
    clear(costRow);
    preview.costs.forEach((c) => {
      costRow.append(
        h(`.cost__item${c.ok ? '' : '.is-short'}`,
          { style: { '--res-color': RESOURCE_COLOR[c.id] } },
          icon(RESOURCE_ICON[c.id] || 'coin'),
          h('span', { text: resourceCN(c.id) }),
          h('b', { text: `${c.need}` }),
          h('span.t-dim', { text: `/${fmtNum(c.have)}` }))
      );
    });

    // 概率
    clear(oddsBar);
    clear(oddsLegend);
    QUALITY_ORDER.forEach((q) => {
      const p = preview.odds[q] || 0;
      if (p > 0) {
        oddsBar.append(h('.oddsbar__seg', {
          dataset: { quality: q },
          style: { flexGrow: String(p) },
          title: `${qualityCN(q)} ${pct(p)}`
        }));
      }
      if (p >= 0.0005) {
        oddsLegend.append(h('.oddslegend__item', { dataset: { quality: q } },
          h('.oddslegend__swatch'),
          h('span', { text: `${qualityCN(q)} ${pct(p)}` })));
      }
    });

    // 按钮
    if (phase === 'idle') {
      actionLabel.textContent = '起炉锻造';
      actionSub.textContent = preview.locked ? preview.lockHint : '';
      actionBtn.disabled = !preview.canForge;
      cancelBtn.hidden = true;
    } else if (phase === 'armed') {
      actionLabel.textContent = `落 锤 ${strikes + 1}／3`;
      actionSub.textContent = strikes === 2 ? '此锤见真章' : '';
      actionBtn.disabled = false;
      cancelBtn.hidden = reducedMotion() ? false : strikes === 0;
    }

    pips.forEach((p, i) => p.classList.toggle('is-hit', i < strikes));
    const t = strikes / 3;
    tempFill.style.width = `${Math.round(t * 100)}%`;
    tempVal.textContent = `${Math.round(320 + t * 1180)}°`;
    phaseText.textContent = phase === 'idle' ? '待起炉' : strikes >= 3 ? '成器' : '锻造中';
  }

  /* ----------------------- 锻造流程 ----------------------- */

  function startForge() {
    const res = game.forgeWeapon(opts);
    if (!res.ok) return ui.toast.bad(res.error || '无法起炉');
    pending = res;
    phase = 'armed';
    strikes = 0;
    sparks?.setAmbient(true);
    ui.refreshChrome();
    refresh();
    ui.toast.show('炉火已起，三锤定形', 'info', 'flame');
  }

  function strike(silent = false) {
    if (phase !== 'armed') return;
    strikes += 1;
    haptic([10, 20, 26][strikes - 1] || 14);
    // 「一锤定音」连着落三锤，声音仍逐锤给，听得出这一炉已经收尾
    strikeSound(strikes);

    if (!silent && !reducedMotion()) {
      pulse(forgeCard, 'is-striking', 340);
      pulse(ui.shell, 'is-shaking', 260);
    }
    sparks?.burst({
      x: 0.5,
      y: 0.62,
      count: [70, 100, 170][strikes - 1] || 90,
      power: [0.85, 1, 1.4][strikes - 1] || 1
    });

    refresh();

    if (strikes >= 3) {
      phase = 'revealing';
      const delay = reducedMotion() ? 0 : 340;
      setTimeout(() => openReveal(pending), delay);
    }
  }

  /* ----------------------- 揭示卡 ----------------------- */

  function openReveal(result) {
    const w = result.weapon;
    const card = h('.reveal__card', { dataset: { quality: w.quality, element: w.element } },
      h('.reveal__face.reveal__face--back',
        h('img.reveal__backart', { src: './assets/brand/card-back.svg', alt: '', 'aria-hidden': 'true' })),
      h('.reveal__face.reveal__face--front',
        h('.reveal__aura'),
        h('.reveal__qbanner', { text: qualityCN(w.quality) }),
        h('.reveal__sigil', icon(weaponIcon(w.type))),
        h('.reveal__info',
          h('.reveal__name', { text: w.name }),
          h('.reveal__title', { text: w.title || '' }),
          h('.reveal__affixes',
            h('span.tag.tag--el', { text: `${elementCN(w.element)}·${w.type}` }),
            ...(w.affixes || []).map((a) =>
              h('span.tag', { style: { color: 'var(--gold)' }, text: `${a.name}+${a.value}${a.unit}` })),
            result.isNew ? h('span.tag', { style: { color: 'var(--cinnabar-lit)' }, text: '图鉴新收录' }) : null),
          h('.reveal__lore', { text: w.lore || '' })))
    );
    card.style.setProperty('--el', `var(--el-${w.element})`);

    const overlay = h('.scrim.reveal',
      h('div', { style: { display: 'grid', placeItems: 'center' } },
        card,
        h('.reveal__actions',
          h('button.btn.btn--ghost.grow', {
            type: 'button',
            text: '收入行囊',
            onclick: () => finish(false)
          }),
          h('button.btn.btn--gold.grow', {
            type: 'button',
            text: '再锻一把',
            onclick: () => finish(true)
          }))));

    ui.host.append(overlay);

    const flip = () => {
      card.classList.add('is-flipped');
      revealSound(w.quality);
      if (['legendary', 'mythic'].includes(w.quality)) {
        ui.toast.gold(`${qualityCN(w.quality)}出世 · ${w.name}`);
        if (!reducedMotion()) {
          sparks?.burst({ x: 0.5, y: 0.5, count: 220, power: 1.7 });
          pulse(ui.shell, 'is-shaking', 260);
        }
      } else if (result.isNew) {
        ui.toast.ok(`图鉴新收录 · ${w.name}`);
      }
    };
    reducedMotion() ? flip() : setTimeout(flip, 520);

    function finish(again) {
      overlay.remove();
      pending = null;
      strikes = 0;
      phase = 'idle';
      sparks?.setAmbient(false);
      ui.refreshChrome();
      renderRecent();
      refresh();
      if (again) {
        const preview = game.previewForge(opts);
        preview.canForge ? startForge() : ui.toast.bad('材料不足，先去试炼寻些矿石');
      }
    }
  }

  /* ----------------------- 组装 ----------------------- */

  const forgeCard = h('.card.card--framed.forge', { dataset: { stage: opts.stage } },
    h('.card__inner.section',
      h('.section__head',
        h('.section__title', { text: '炉火工坊' }),
        h('.section__rule'),
        h('.section__meta', { text: '寻器 · 造器 · 用器' })),
      stagePicker,
      stageHint,
      hearth,
      temp,
      h('.recipe',
        h('.recipe__label', { text: '配料' }),
        h('.row.row--wrap', ...elChips, luckyChip, masterChip),
        h('.recipe__label', { text: '消耗' }),
        costRow,
        h('.recipe__label', { text: '品质概率' }),
        oddsBar,
        oddsLegend),
      actionBtn,
      cancelBtn));

  const el = h('.view.stagger', { id: 'panel-forge', role: 'tabpanel', 'aria-labelledby': 'tab-forge' },
    idleCard,
    forgeCard,
    recentCard);

  renderIdle();
  renderRecent();
  refresh();

  // canvas 需要挂载后才有尺寸
  requestAnimationFrame(() => {
    sparks = createSparkField(canvas);
  });

  return {
    el,
    onEnter() {
      renderIdle();
      renderRecent();
      refresh();
    },
    destroy() {
      sparks?.destroy();
      sparks = null;
    }
  };
}
