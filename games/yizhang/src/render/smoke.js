// 渲染层冒烟台。
//
// 这是开发用的独立入口，不是游戏：它自己起一局**真的** sim（src/sim + src/data +
// src/combat + src/ai），用脚本代替玩家操作，然后把 sim.getView() 原样喂给渲染层。
// 之所以不再自己捏一份假 view：渲染层唯一该证明的事情就是「真实契约能画出来」，
// 假数据只会把契约漂移藏起来。壳与输入由 src/main.js 负责，这里一概不碰。
//
//   npm run dev  →  http://localhost:4181/src/render/smoke.html
//
// URL 参数：
//   ?quality=high|mid|low   起始画质档
//   ?mobile=1               走移动端分支（镜头震动减弱）
//   ?spectator=1            观战机位（绕岛推轨）
//   ?manual=1               不自动 rAF，由 window.smoke.step(dt) 驱动（截图/回归用）
//   ?dpr=1.5                覆盖设备像素比
//   ?hud=1                  显示一行调试读数
//   ?t=6.5                  manual 模式下先快进到第 t 秒（只有最后半秒真渲染）
//   ?seed=7                 对局种子
//   ?crumble=1.2            每隔几秒往台面上砸一发（0 表示不砸）
//   ?combat=real            强行接 src/combat（见下面 createLiveMatch 里的说明）
//   ?phase=arena            跳过安全区直接进裂岛（缺省 hub：开局在走道上）
//   ?picked=0               开局不带主掌，走道里挑到掌门才会开（看传送门两态）
//   ?unlock=all             全解锁（缺省只有木棉 + 带进来的两只，其余是未点亮的石掌）
//   ?tour=0                 关掉大厅走查脚本，人物站着不动（拍静帧用）
//
// 就绪后 window.smoke 可用；异步引导的 Promise 在 window.smokeReady 上。

import {
  createRenderer,
  dispose,
  getStats,
  resize,
  setQuality,
  setSpectator,
  sync,
} from './index.js';
import { mulberry32 } from './noise.js';

const params = new URLSearchParams(globalThis.location?.search ?? '');
const opt = (k, d) => params.get(k) ?? d;
const numOpt = (k, d) => {
  const v = Number.parseFloat(params.get(k));
  return Number.isFinite(v) ? v : d;
};

const LOCAL_ID = 'p0';

/** yaw = 0 面向 -Z：朝 (dx,dz) 看过去的 yaw。 */
function yawToward(dx, dz) {
  return Math.atan2(-dx, -dz);
}

/**
 * 大厅走查脚本。
 *
 * 沿走道从近端走到门口，在每一座台座旁停一下（进得了交互半径，焦点就落在那只掌上），
 * 途中挑一只主掌与一只副掌，最后走进传送门。它替代的是「玩家的手」，
 * 所以只产出 sim 的 Input，不直接改状态。
 */
function createHubTour() {
  let plan = null;
  let idx = 0;
  let dwell = 0;
  let pressed = false;

  function buildPlan(hub) {
    // 从走道近端（z 大）往门口（z 小）逐座走；停位在台座与中线之间，落在交互半径里
    const stops = [...hub.pedestals]
      .sort((a, b) => b.z - a.z)
      .map((ped) => ({
        gloveId: ped.gloveId,
        unlocked: ped.unlocked !== false,
        x: ped.x + (ped.x < hub.origin.x ? 1.55 : -1.55),
        z: ped.z,
        lookX: ped.x,
        lookZ: ped.z,
        equip: false,
      }));
    // 挑两只能挑的：一只进主掌位，一只进副掌位
    const pickable = stops.filter((s) => s.unlocked);
    if (pickable[0]) pickable[0].equip = true;
    if (pickable[Math.min(2, pickable.length - 1)]) pickable[Math.min(2, pickable.length - 1)].equip = true;
    return stops;
  }

  return {
    reset() {
      plan = null;
      idx = 0;
      dwell = 0;
      pressed = false;
    },
    input(view, dt) {
      const hub = view.hub;
      const me = view.players.find((p) => p.id === LOCAL_ID);
      if (!hub || !me) return {};
      if (!plan) plan = buildPlan(hub);

      const goal =
        idx < plan.length
          ? plan[idx]
          : { x: hub.portal.x, z: hub.portal.z + 0.4, lookX: hub.portal.x, lookZ: hub.portal.z - 4, equip: false };

      const dx = goal.x - me.x;
      const dz = goal.z - me.z;
      const d = Math.hypot(dx, dz);
      const yaw = yawToward(goal.lookX - me.x, goal.lookZ - me.z);

      let interact = false;
      if (d < 0.32 && idx < plan.length) {
        dwell += dt;
        if (goal.equip && !pressed && dwell > 0.35) {
          interact = true;
          pressed = true;
        }
        if (dwell > 1.3) {
          idx++;
          dwell = 0;
          pressed = false;
        }
        return { moveX: 0, moveZ: 0, yaw, interact };
      }
      // 走过去：走的方向是世界方向，朝向另算，所以人是「侧着看展示掌」走过去的
      return { moveX: dx / Math.max(d, 1e-4), moveZ: dz / Math.max(d, 1e-4), yaw, interact };
    },
  };
}

/**
 * 起一局真的对局。data / combat / ai 缺席时 sim 会自己退回内置兜底，
 * 冒烟台照样能跑，只是掌不全。
 */
export async function createLiveMatch({
  seed = 7,
  crumbleEvery = 1.2,
  combat = 'sim',
  phase = 'hub',
  picked = true,
  unlockAll = false,
  tour = true,
} = {}) {
  const sim = await import('../sim/index.js');
  const wired = { data: false, combat: 'sim' };

  // 掌表用真的（8 掌的识别色、判定角度、击退都从这儿来）。
  try {
    const data = await import('../data/gloves.js');
    sim.installData(data);
    wired.data = true;
  } catch {
    /* 掌表缺席时 sim 用内置兜底 */
  }

  // combat 默认走 sim 自带的兜底：src/combat 的 resolveSlap 返回数组，而 sim/step.js
  // 读的是 res.hits，接上去一掌都判不中，冒烟台就只剩走位。等那条接线修好再改默认值；
  // 想验证 combat 那套事件名（skillCast / meteorImpact / kill…）能不能画，用 ?combat=real。
  if (combat === 'real') {
    try {
      const mod = await import('../combat/index.js');
      sim.installCombat(mod);
      wired.combat = 'real';
    } catch {
      /* combat 缺席，继续用兜底 */
    }
  }

  let ai = null;
  try {
    ai = await import('../ai/bots.js');
  } catch {
    /* bots 缺席就让他们站着挨打 */
  }

  const state = sim.createMatch({
    seed,
    gloveId: 'granite',
    offhandId: 'meteor',
    botCount: 3,
    phase,
    ...(unlockAll ? { unlocked: 'all' } : {}),
  });
  // 「还没挑掌」的开局：门是封着的，走道里挑到主掌才会开。冒烟台专用，正式壳不这么干。
  if (!picked && state.hub) {
    state.hub.mainGloveId = null;
    state.hub.offGloveId = null;
    state.hub.portalReady = false;
    for (const ped of state.hub.pedestals) ped.selected = null;
  }
  const hubTour = createHubTour();
  const rand = mulberry32(seed * 7919 + 13);
  const botRng = () => rand();

  let t = 0;
  let nextSkill = 2.4;
  let nextDash = 3.1;
  let nextSwitch = 5.5;
  let nextCrumble = 2.0;
  let prev = { slap: false, skill: false, switchGlove: false, dash: false, jump: false };

  /** 脚本玩家：追最近的对手、贴脸就扇、周期性放技能与换掌。 */
  function humanInput(view) {
    const me = view.players.find((p) => p.id === LOCAL_ID);
    if (!me || !me.alive) return {};
    let best = null;
    let bestD = Infinity;
    for (const p of view.players) {
      if (p.id === LOCAL_ID || !p.alive) continue;
      const d = Math.hypot(p.x - me.x, p.z - me.z);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return {};

    const dx = best.x - me.x;
    const dz = best.z - me.z;
    const l = Math.max(1e-4, Math.hypot(dx, dz));
    const close = bestD < 2.3;
    // 贴上去之后绕着对手走，画面里才有攻防来回，而不是两个人对着推
    const strafe = close ? 0.9 : 0;
    const input = {
      moveX: (dx / l) * (close ? 0.1 : 1) + (-dz / l) * strafe,
      moveZ: (dz / l) * (close ? 0.1 : 1) + (dx / l) * strafe,
      yaw: yawToward(dx, dz),
      slap: bestD < 3.0,
      skill: t > nextSkill,
      switchGlove: t > nextSwitch,
      dash: t > nextDash && bestD > 6,
      jump: false,
    };
    if (input.skill) nextSkill = t + 5.5 + rand() * 3;
    if (input.switchGlove) nextSwitch = t + 7 + rand() * 4;
    if (input.dash) nextDash = t + 3 + rand() * 2.5;
    // sim 的技能/换掌/冲刺都是边沿触发，得自己维护「上一帧按住没有」
    const edged = { ...input };
    for (const key of ['skill', 'switchGlove', 'dash', 'jump']) {
      edged[key] = input[key] && !prev[key];
    }
    prev = input;
    return edged;
  }

  /** 定期砸地：保证冒烟台一定能看到裂→塌→破洞的完整链路。 */
  function crumble(view) {
    if (!(crumbleEvery > 0) || t < nextCrumble) return;
    nextCrumble = t + crumbleEvery;
    const alive = state.arena.tiles.filter((tile) => tile.alive);
    if (alive.length === 0) return;
    // 先啃外圈：中间留着给人打，边上先塌，落点才会越来越危险
    alive.sort((a, b) => Math.hypot(b.x, b.z) - Math.hypot(a.x, a.z));
    const pick = alive[Math.floor(rand() * Math.min(24, alive.length))];
    sim.damageTileAt(state, pick.x, pick.z, 55 + rand() * 45);
    void view;
  }

  let view = sim.getView(state);

  return {
    sim,
    state,
    wired,
    get view() {
      return view;
    },
    step(dt) {
      t += dt;
      const inHub = view.phase === 'hub';
      // 安全区里走的是走查脚本；进了岛才切回「追着人扇」的那套
      const inputs = { [LOCAL_ID]: inHub ? (tour ? hubTour.input(view, dt) : {}) : humanInput(view) };
      if (ai && !inHub) {
        for (const p of view.players) {
          if (p.id === LOCAL_ID || !p.alive) continue;
          try {
            inputs[p.id] = ai.think(view, p.id, botRng);
          } catch {
            inputs[p.id] = {};
          }
        }
      }
      sim.step(state, inputs, dt);
      if (!inHub) crumble(view);
      view = sim.getView(state);
      return view;
    },
    /** 直接砸某点，手测碎地用。 */
    smash(x, z, amount = 130) {
      return sim.damageTileAt(state, x, z, amount);
    },
    stats() {
      return {
        t: state.time.toFixed(1),
        phase: state.phase,
        tiles: state.arena.tiles.length,
        broken: state.arena.brokenCount,
        kos: state.stats.kos,
        hits: state.stats.hits,
        focus: state.hub?.focusGloveId ?? null,
        main: state.hub?.mainGloveId ?? null,
        off: state.hub?.offGloveId ?? null,
        portalReady: !!state.hub?.portalReady,
        wired,
      };
    },
  };
}

export async function bootSmoke(canvas) {
  const match = await createLiveMatch({
    seed: numOpt('seed', 7),
    crumbleEvery: numOpt('crumble', 1.2),
    combat: opt('combat', 'sim'),
    phase: opt('phase', 'hub') === 'arena' ? 'arena' : 'hub',
    picked: opt('picked', '1') !== '0',
    unlockAll: opt('unlock', '') === 'all',
    tour: opt('tour', '1') !== '0',
  });

  const renderer = createRenderer(canvas, {
    quality: opt('quality', 'high'),
    mobile: opt('mobile', '0') === '1',
    spectator: opt('spectator', '0') === '1',
    localId: LOCAL_ID,
    arenaRadius: match.view.arena.radius,
    seed: 20240501,
    preserveDrawingBuffer: true,
  });

  const dprOverride = numOpt('dpr', NaN);
  const fit = () => {
    const w = canvas.clientWidth || globalThis.innerWidth || 960;
    const h = canvas.clientHeight || globalThis.innerHeight || 540;
    const dpr = Number.isFinite(dprOverride) ? dprOverride : globalThis.devicePixelRatio || 1;
    resize(w, h, dpr);
  };
  fit();
  globalThis.addEventListener?.('resize', fit);

  const hud = opt('hud', '0') === '1' ? document.getElementById('readout') : null;
  if (hud) hud.style.display = 'block';
  let hudTimer = 0;

  const step = (dt) => {
    sync(match.step(dt), dt);
    if (hud) {
      hudTimer += dt;
      if (hudTimer > 0.25) {
        hudTimer = 0;
        const s = getStats();
        const m = match.stats();
        const zone =
          m.phase === 'hub'
            ? `hub  focus ${m.focus ?? '-'}  主 ${m.main ?? '-'} / 副 ${m.off ?? '-'}  门 ${m.portalReady ? '通' : '封'}`
            : `arena  tiles ${m.tiles - m.broken}/${m.tiles}  ko ${m.kos}`;
        hud.textContent =
          `${s.tier}  dpr ${s.pixelRatio.toFixed(2)}  draw ${s.drawCalls}  tris ${s.triangles}` +
          `  |  t ${m.t}s  ${zone}`;
      }
    }
  };

  const manual = opt('manual', '0') === '1';
  let raf = 0;
  let last = 0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    step(dt);
  };

  const api = {
    renderer,
    match,
    step,
    get view() {
      return match.view;
    },
    /** 定步快进（照常出图），用于截图对齐到同一时刻 */
    advance(seconds, dt = 1 / 60) {
      const n = Math.max(1, Math.round(seconds / dt));
      for (let i = 0; i < n; i++) step(dt);
      return n;
    },
    /**
     * 只推 sim 不出图。截图脚本要跳到第 20 秒时，逐帧渲染要等上千次 draw；
     * 这里让对局自己跑完，最后再由 advance 渲几帧把镜头/动画收住即可。
     */
    fastForward(seconds, dt = 1 / 60) {
      const n = Math.max(0, Math.round(seconds / dt));
      for (let i = 0; i < n; i++) match.step(dt);
      return n;
    },
    smash: (...a) => match.smash(...a),
    /**
     * 抬到台面上方补一张俯视图。跟随/观战机位都是贴着地平线的，
     * 想核对「洞的位置和 sim 的 tile 一一对上」时得换个角度看。
     * 只给截图回归用，正式壳不该调它。
     */
    photo({ from = [0, 34, 30], to = [0, 0, 0] } = {}) {
      const cam = renderer.camera;
      cam.position.set(from[0], from[1], from[2]);
      cam.lookAt(to[0], to[1], to[2]);
      cam.rotation.z = 0;
      renderer.post.render(cam);
      return { from, to };
    },
    /** sim 里塌掉的格子中心，用来跟画面上的洞对位。 */
    holes() {
      return match.state.arena.tiles
        .filter((t) => !t.alive)
        .map((t) => ({ i: t.i, x: t.x, z: t.z }));
    },
    setQuality(tier) {
      const t = setQuality(tier);
      fit();
      return t;
    },
    setSpectator(on) {
      setSpectator(on);
    },
    stats: getStats,
    simStats: () => match.stats(),
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    destroy() {
      api.stop();
      dispose();
    },
  };

  globalThis.smoke = api;

  if (manual) {
    const warm = numOpt('t', 0);
    // 最后一段照常渲染：镜头是阻尼跟随的，塌落动画也只在渲染帧里推进，
    // 直接一帧跳过去会拍到还没收敛的机位和一堆悬在半空的板子。
    const settle = Math.min(warm, 1.8);
    if (warm > settle) api.fastForward(warm - settle);
    api.advance(settle > 0 ? settle : 1 / 60);
  } else {
    raf = requestAnimationFrame(loop);
    globalThis.addEventListener?.('keydown', (e) => {
      if (e.key === '1') api.setQuality('high');
      if (e.key === '2') api.setQuality('mid');
      if (e.key === '3') api.setQuality('low');
      if (e.key === 's') api.setSpectator(true);
    });
  }

  return api;
}

if (typeof document !== 'undefined') {
  const canvas = document.getElementById('gl');
  if (canvas) {
    globalThis.smokeReady = bootSmoke(canvas).catch((err) => {
      console.error('[yizhang/render] 冒烟台启动失败', err);
      const hud = document.getElementById('readout');
      if (hud) {
        hud.style.display = 'block';
        hud.textContent = `冒烟台启动失败：${err?.message ?? err}`;
      }
      throw err;
    });
  }
}
