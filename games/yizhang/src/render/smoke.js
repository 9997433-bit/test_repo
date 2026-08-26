// 渲染层冒烟台。
//
// 这是开发用的独立入口，不是游戏：它自己造一份假的 view（走位的角色、间歇的扇击、
// 会掉血的台面板块），只为在没有 sim / UI / 输入的情况下单独验证 src/render。
// 真正的主循环由 Opus-4 在 src/main.js 里接线。
//
//   npm run dev  →  http://localhost:4181/src/render/smoke.html
//
// URL 参数：
//   ?quality=high|mid|low   起始画质档
//   ?mobile=1               走移动端分支（镜头震动减弱）
//   ?manual=1               不自动 rAF，由 window.smoke.step(dt) 驱动（截图/回归用）
//   ?dpr=1.5                覆盖设备像素比
//   ?hud=1                  显示一行调试读数
//   ?t=6.5                  manual 模式下先快进到第 t 秒

import {
  createRenderer,
  dispose,
  getStats,
  resize,
  setQuality,
  setSpectator,
  sync,
} from './index.js';

const params = new URLSearchParams(globalThis.location?.search ?? '');
const opt = (k, d) => params.get(k) ?? d;

const ARENA = 20;
const PLAYER_IDS = ['p0', 'b1', 'b2', 'b3'];
const GLOVES = ['cotton', 'granite', 'gale', 'frost'];

/** 一份最小的假 sim，只产出渲染需要的字段，字段名与 CONTRACT 的 view 对齐。 */
export function createFakeMatch(seed = 7) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const players = PLAYER_IDS.map((id, i) => ({
    id,
    kind: i === 0 ? 'human' : 'bot',
    x: Math.cos((i / 4) * Math.PI * 2) * 7,
    y: 0,
    z: Math.sin((i / 4) * Math.PI * 2) * 7,
    yaw: 0,
    gloveId: GLOVES[i % GLOVES.length],
    alive: true,
    invulnT: 0,
    awakenedT: 0,
    kills: 0,
  }));

  const tiles = Array.from({ length: 4 }, (_, i) => ({
    id: `t${i}`,
    sector: i,
    hp: 100,
    maxHp: 100,
  }));

  let t = 0;
  let seq = 0;
  let nextSlap = 1.1;
  let nextHeavy = 3.4;
  const events = [];
  const pending = [];

  return {
    get view() {
      return { t, arenaRadius: ARENA, tiles, players, events };
    },
    step(dt) {
      t += dt;
      events.length = 0;
      while (pending.length) events.push(pending.shift());

      players.forEach((p, i) => {
        // 各自绕不同的李萨如轨迹走，速度不一样，制造错落的构图
        const sp = 0.55 + i * 0.16;
        const r = 5.4 + i * 1.5;
        const px = Math.cos(t * sp + i * 1.9) * r + Math.sin(t * sp * 0.6) * 1.8;
        const pz = Math.sin(t * sp * 1.3 + i * 2.4) * r * 0.85;
        const dx = px - p.x;
        const dz = pz - p.z;
        if (Math.hypot(dx, dz) > 1e-4) p.yaw = Math.atan2(dx, dz);
        p.x = px;
        p.z = pz;
        p.y = i === 2 ? Math.max(0, Math.sin(t * 1.4) * 1.6) : 0;
        p.awakenedT = i === 1 && t % 12 > 6 ? 8 : 0;
        p.invulnT = i === 3 && t % 9 > 7.6 ? 0.6 : 0;
      });

      if (t > nextSlap) {
        nextSlap = t + 0.7 + rnd() * 0.9;
        const a = Math.floor(rnd() * players.length);
        let b = Math.floor(rnd() * players.length);
        if (b === a) b = (b + 1) % players.length;
        events.push({
          id: ++seq,
          type: 'slap',
          attacker: players[a].id,
          target: players[b].id,
          x: (players[a].x + players[b].x) / 2,
          y: 1.25,
          z: (players[a].z + players[b].z) / 2,
          power: 0.8 + rnd() * 0.8,
        });
      }

      if (t > nextHeavy) {
        nextHeavy = t + 2.6 + rnd() * 2.4;
        const a = Math.floor(rnd() * players.length);
        const tile = tiles[Math.floor(rnd() * tiles.length)];
        tile.hp = Math.max(0, tile.hp - 26 - rnd() * 22);
        events.push({
          id: ++seq,
          type: 'smash',
          attacker: players[a].id,
          x: players[a].x,
          y: 0.2,
          z: players[a].z,
          power: 1.4 + rnd() * 0.6,
        });
      }

      return this.view;
    },
    /** 手工塞一个事件（回归截图用），下一次 step 时被渲染层消费 */
    inject(e) {
      const ev = { id: ++seq, ...e };
      pending.push(ev);
      return ev;
    },
    /** 直接读某个玩家，方便把事件放在他脚下 */
    player(id) {
      return players.find((p) => p.id === id) ?? players[0];
    },
    reset() {
      t = 0;
      seq = 0;
      tiles.forEach((tile) => {
        tile.hp = 100;
      });
    },
  };
}

export function bootSmoke(canvas) {
  const match = createFakeMatch(11);
  const renderer = createRenderer(canvas, {
    quality: opt('quality', 'high'),
    mobile: opt('mobile', '0') === '1',
    spectator: opt('spectator', '0') === '1',
    localId: 'p0',
    arenaRadius: ARENA,
    seed: 20240501,
    preserveDrawingBuffer: true,
  });

  const dprOverride = Number.parseFloat(opt('dpr', ''));
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
        hud.textContent = `${s.tier}  dpr ${s.pixelRatio.toFixed(2)}  draw ${s.drawCalls}  tris ${s.triangles}`;
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
    /** 定步快进，用于截图对齐到同一时刻 */
    advance(seconds, dt = 1 / 60) {
      const n = Math.max(1, Math.round(seconds / dt));
      for (let i = 0; i < n; i++) step(dt);
      return n;
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
    const warm = Number.parseFloat(opt('t', '0'));
    api.advance(Number.isFinite(warm) && warm > 0 ? warm : 1 / 60);
  } else {
    raf = requestAnimationFrame(loop);
    globalThis.addEventListener?.('keydown', (e) => {
      if (e.key === '1') api.setQuality('high');
      if (e.key === '2') api.setQuality('mid');
      if (e.key === '3') api.setQuality('low');
    });
  }

  return api;
}

if (typeof document !== 'undefined') {
  const canvas = document.getElementById('gl');
  if (canvas) bootSmoke(canvas);
}
