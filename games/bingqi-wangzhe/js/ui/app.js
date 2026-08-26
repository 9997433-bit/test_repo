/**
 * 应用外壳：顶部资源条 + 6 Tab 路由 + 视图容器。
 *
 * 契约（ARCHITECTURE.md 冻结）：
 *   export function mountApp(root, game)
 *
 * `game` 可以是任意形状——包括 `{ boot: true }` 这样的占位对象。
 * 真正的逻辑层来了以后，既可以直接传入 mountApp，也可以在运行时后注入：
 *
 *   const app = mountApp(root, {});
 *   app.setGame(realGame);   // 热替换，界面无需重载
 */

import { h, clear } from './dom.js';
import { createUiGame, hasCoreRuntime, probeLogicModules } from './gameAdapter.js';
import { createResourceBar } from './components/resourceBar.js';
import { createTabBar } from './components/tabBar.js';
import { createToaster } from './components/feedback.js';
import { syncDocument, onMotionChange } from './motion.js';

import { forgeView } from './views/forge.js';
import { campaignView } from './views/campaign.js';
import { lineupView } from './views/lineup.js';
import { codexView } from './views/codex.js';
import { arenaView } from './views/arena.js';
import { bagView } from './views/bag.js';

export const TABS = [
  { id: 'forge', label: '工坊', icon: 'anvil', view: forgeView },
  { id: 'campaign', label: '试炼', icon: 'trial', view: campaignView },
  { id: 'lineup', label: '战阵', icon: 'lineup', view: lineupView },
  { id: 'codex', label: '图鉴', icon: 'codex', view: codexView },
  { id: 'arena', label: '竞技', icon: 'arena', view: arenaView },
  { id: 'bag', label: '背包', icon: 'bag', view: bagView }
];

const DEFAULT_TAB = 'forge';

function readHashTab() {
  const id = (location.hash || '').replace(/^#\/?/, '');
  return TABS.some((t) => t.id === id) ? id : null;
}

/**
 * URL 开关（只作用于 mock 兜底数据，逻辑层接入后即失效）：
 *   ?demo=1   载入中后期展示档（满阵 / 传说神话 / 高炉阶），用于视觉走查
 *   ?fresh=1  忽略本地演示存档，从新档开始
 */
function readMockOptions() {
  const q = new URLSearchParams(location.search);
  return {
    preset: q.get('demo') ? 'demo' : undefined,
    fresh: Boolean(q.get('fresh')),
    seed: q.get('seed') ? Number(q.get('seed')) : undefined
  };
}

export function mountApp(root, injectedGame) {
  syncDocument();

  const mockOptions = readMockOptions();
  let game = createUiGame(injectedGame, mockOptions);
  let activeId = readHashTab() || DEFAULT_TAB;
  const views = new Map();

  /* ---------------- 外壳骨架 ---------------- */

  const stage = h('main.stage', { id: 'stage' });
  const toaster = createToaster();

  let resourceBar = createResourceBar(game);

  const brand = h('.brand',
    h('img.brand__seal', { src: './assets/brand/seal.svg', alt: '', 'aria-hidden': 'true' }),
    h('.brand__text',
      h('h1.brand__title', { text: '兵器王者·炉火' }),
      h('.brand__sub', { text: '炉火兵谱' })),
    h('.brand__spacer'),
    resourceBar.powerBadge);

  const topbar = h('header.topbar', brand, resourceBar.el);

  const tabBar = createTabBar(TABS, (id) => go(id));

  const shell = h('.shell', topbar, stage, tabBar.el, toaster.el);

  /* ---------------- 视图上下文 ---------------- */

  const ui = {
    host: shell,
    shell,
    toast: toaster,
    go,
    refreshChrome,
    rerenderAll,
    /** 飞行资源的落点：顶部资源条对应格子。 */
    resourceCell: (id) => resourceBar.cellFor?.(id) || null
  };

  function ctx() {
    return { game, ui };
  }

  function getView(id) {
    if (views.has(id)) return views.get(id);
    const tab = TABS.find((t) => t.id === id);
    const instance = tab.view(ctx());
    views.set(id, instance);
    return instance;
  }

  function go(id, { push = true } = {}) {
    if (!TABS.some((t) => t.id === id)) id = DEFAULT_TAB;
    activeId = id;
    const view = getView(id);
    clear(stage).append(view.el);
    stage.scrollTop = 0;
    view.onEnter?.();
    tabBar.setActive(id);
    refreshChrome();
    if (push && readHashTab() !== id) {
      history.replaceState(null, '', `#/${id}`);
    }
  }

  function refreshChrome() {
    resourceBar.update();
    const idle = game.peekIdle?.();
    tabBar.setBadge('forge', Boolean(idle && !idle.empty && activeId !== 'forge'));
    tabBar.setBadge('arena', (game.arena?.().ticketsLeft ?? 0) > 0 && activeId !== 'arena');
  }

  /** 逻辑层热替换 / 存档重置后，丢弃所有视图缓存重建。 */
  function rerenderAll() {
    views.forEach((v) => v.destroy?.());
    views.clear();
    go(activeId, { push: false });
  }

  /* ---------------- 时钟与事件 ---------------- */

  const timer = setInterval(() => {
    game.tick?.();
    resourceBar.update();
  }, 5000);

  const offMotion = onMotionChange(() => rerenderAll());
  const onHash = () => {
    const id = readHashTab();
    if (id && id !== activeId) go(id, { push: false });
  };
  window.addEventListener('hashchange', onHash);

  let offGame = game.subscribe?.(() => refreshChrome());

  /** 换一套 game（mock ↔ 逻辑层），资源条与所有视图重建。 */
  function useGame(next) {
    offGame?.();
    game = next;
    const bar = createResourceBar(game);
    resourceBar.el.replaceWith(bar.el);
    resourceBar.powerBadge.replaceWith(bar.powerBadge);
    resourceBar = bar;
    offGame = game.subscribe?.(() => refreshChrome());
    if (mounted) rerenderAll();
    return game;
  }

  /* ---------------- 首帧：等逻辑层探测完再落地 ---------------- */

  let mounted = false;

  function mount() {
    if (mounted) return;
    mounted = true;
    clear(root).append(shell);
    go(activeId, { push: true });
  }

  // core 运行时在场但玩法模块还没注入时，先去仓库里动态 import 一次。
  // 探测期间保留开机画面（约百毫秒），避免「mock 一闪再跳真实存档」的数字跳变。
  if (hasCoreRuntime(injectedGame) && !game.hasCore) {
    const settle = (probe) => {
      if (mounted) return;
      if (probe) {
        const live = createUiGame(injectedGame, mockOptions, probe);
        if (live.hasCore) useGame(live);
      }
      mount();
    };
    const guard = setTimeout(() => settle(null), 3000);
    probeLogicModules()
      .then((probe) => {
        clearTimeout(guard);
        settle(probe);
      })
      .catch((err) => {
        clearTimeout(guard);
        console.error('[bqwz/ui] 逻辑层探测异常', err);
        settle(null);
      });
  } else {
    mount();
  }

  /* ---------------- 对外句柄 ---------------- */

  const handle = {
    get game() {
      return game;
    },
    /** 后注入真实逻辑层，界面原地热替换。 */
    setGame(next, probe) {
      useGame(createUiGame(next, mockOptions, probe));
      mount();
      toaster.ok(game.hasCore ? '逻辑层已接入' : '仍在使用 mock 数据');
      return game;
    },
    go,
    destroy() {
      clearInterval(timer);
      offMotion();
      offGame?.();
      window.removeEventListener('hashchange', onHash);
      views.forEach((v) => v.destroy?.());
      views.clear();
      clear(root);
    }
  };

  // 后注入逃生口：main.js 之外的接入方（或调试）也能拿到句柄调用 setGame()。
  if (typeof window !== 'undefined') window.bqwzApp = handle;

  return handle;
}

export default mountApp;
