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
//   ?t=6.5                  manual 模式下先快进到第 t 秒
//   ?seed=7                 对局种子
//   ?crumble=1.2            每隔几秒往台面上砸一发（0 表示不砸）
//   ?combat=real            强行接 src/combat（见下面 loadDeps 里的说明）
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
 * 起一局真的对局。data / combat / ai 缺席时 sim 会自己退回内置兜底，
 * 冒烟台照样能跑，只是掌不全。
 */
export async function createLiveMatch({ seed = 7, crumbleEvery = 1.2, combat = 'sim' } = {}) {
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

  const state = sim.createMatch({ seed, gloveId: 'granite', offhandId: 'meteor', botCount: 3 });
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
      const inputs = { [LOCAL_ID]: humanInput(view) };
      if (ai) {
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
      crumble(view);
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
        tiles: state.arena.tiles.length,
        broken: state.arena.brokenCount,
        kos: state.stats.kos,
        hits: state.stats.hits,
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
        hud.textContent =
          `${s.tier}  dpr ${s.pixelRatio.toFixed(2)}  draw ${s.drawCalls}  tris ${s.triangles}` +
          `  |  t ${m.t}s  tiles ${m.tiles - m.broken}/${m.tiles}  ko ${m.kos}`;
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
    /** 定步快进，用于截图对齐到同一时刻 */
    advance(seconds, dt = 1 / 60) {
      const n = Math.max(1, Math.round(seconds / dt));
      for (let i = 0; i < n; i++) step(dt);
      return n;
    },
    smash: (...a) => match.smash(...a),
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
    api.advance(warm > 0 ? warm : 1 / 60);
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
