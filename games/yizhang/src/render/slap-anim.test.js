// 出掌动画的接线：谁起手、谁只是修正。
//
// 这一套盯的是两件「截图看不出来、跑起来却很别扭」的事：
//
//   · 前摇有画面：sim 一发 `slapStart` 动画就起手，不是等判定结束的 `slap` 才动
//   · 一记掌只起手一次：同一 tick 里 `hit` 排在 `slap` 前面，后到的 `slap` 若再
//     playSlap 一次，slapT 归零 → 整段前摇重放，`hit` 算出来的击退侧也被冲掉
//
// three 的场景图在 node 里是纯 JS；WebGL 上下文起不来，所以渲染器只装配事件那条
// 链路（characters / cameraRig 都是真的，VFX 用探针替身记调用）。

import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { createMatch, getView, step } from '../sim/index.js';
import { GLOVE_BY_ID } from '../data/gloves.js';
import { createCamera } from './camera.js';
import { createCharacters } from './characters.js';
import { QUALITY } from './config.js';
import { YizhangRenderer } from './renderer.js';
import { readView } from './view.js';

const DT = 1 / 60;

/** 程序化贴图要 canvas；材质吃 null，形状与状态照样能验。 */
function fakeTextures() {
  const pair = () => ({ rough: null, normal: null, albedo: null });
  return { cloth: pair(), leather: pair(), metal: pair(), dust: null, ember: null };
}

/**
 * 只装配事件那条链路的渲染器。
 * characters 与 cameraRig 是生产实现，VFX 换成只记调用的替身。
 */
function rigged({ localId = 'p0' } = {}) {
  const scene = new Scene();
  const characters = createCharacters({
    scene,
    quality: QUALITY.low,
    textures: fakeTextures(),
  });
  const strikes = [];
  const r = Object.create(YizhangRenderer.prototype);
  r.characters = characters;
  r.cameraRig = createCamera({});
  r.localId = localId;
  r._tmp = new Vector3();
  r._tmp2 = new Vector3();
  r._tmp3 = new Vector3();
  r.vfx = {
    slap() {},
    heavyImpact() {},
    footDust() {},
    fallTrail() {},
    awakenMotes() {},
    spawnDebris() {},
  };
  r.combatVfx = {
    strike(kind, at, dir, power, opts) {
      strikes.push({ kind, power, whiff: !!opts?.whiff });
    },
  };
  return { r, characters, scene, strikes };
}

/** readEvents 出来的形状（renderer._handleEvent 吃的就是它）。 */
function ev(kind, extra = {}) {
  return {
    kind,
    type: kind,
    actorId: null,
    targetId: null,
    gloveId: null,
    skillId: null,
    tileIndex: null,
    tileId: null,
    x: null,
    y: null,
    z: null,
    yaw: null,
    hits: null,
    power: 1,
    t: 0,
    ...extra,
  };
}

function renderPlayer(id, extra = {}) {
  return {
    id,
    kind: id === 'p0' ? 'human' : 'bot',
    skinId: null,
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    speed: 0,
    alive: true,
    grounded: true,
    invulnT: 0,
    respawnT: 0,
    awakenedT: 0,
    awakened: false,
    meter: 0,
    combo: 0,
    attackPhase: 'idle',
    activeSlot: 0,
    mainId: 'cotton',
    offhandId: 'granite',
    activeGloveId: 'cotton',
    tint: 0xe3c988,
    mainTint: 0xe3c988,
    offTint: 0x7d8a99,
    ...extra,
  };
}

describe('前摇起手：slapStart 驱动动画，slap 只是收尾', () => {
  /**
   * 真 sim 跑一记扇击，逐 tick 把事件喂进渲染器，记下动画进度。
   * 靶子摆在攻方的左前方（局部 -X），这样「击退侧」与「激活槽的默认侧」不同 ——
   * 后到的 `slap` 一旦重置，slapSide 会从 -1 掉回 +1，测就抓得住。
   */
  function runOneSlap() {
    const state = createMatch({ seed: 0x51a9, gloveId: 'cotton', offhandId: 'spring', botCount: 1 });
    const players = [...(state.players instanceof Map ? state.players.values() : state.players)];
    const attacker = players.find((p) => p.id === 'p0');
    const target = players.find((p) => p.id !== 'p0');
    const angle = -0.5; // 左前方，仍在木棉 110° 的判定锥里
    const distance = GLOVE_BY_ID.cotton.slapRange * 0.6;
    Object.assign(attacker, { x: 0, y: 1, z: 0, yaw: 0, vx: 0, vy: 0, vz: 0, activeSlot: 0 });
    Object.assign(target, {
      x: Math.sin(angle) * distance,
      y: 1,
      z: -Math.cos(angle) * distance,
      yaw: Math.PI,
      vx: 0,
      vy: 0,
      vz: 0,
    });

    const { r, characters } = rigged();
    characters.reconcile(readView(getView(state)).players, 'p0');
    const c = characters.get('p0');

    // 木棉：前摇 0.16s、后摇 0.22s、冷却 0.55s —— 30 tick 只放得下一记，
    // 第二记的 slapStart 还没到，「只起手一次」这条才有意义
    const ticks = [];
    let time = 0;
    for (let i = 0; i < 30; i++) {
      step(state, { p0: { slap: true, yaw: 0 } }, DT);
      const v = readView(getView(state));
      characters.reconcile(v.players, v.localId);
      const before = c.slapT;
      for (const e of v.events) r._handleEvent(e);
      ticks.push({
        i,
        // 场上还有一个会还手的 bot，只看 p0 自己动手的那几条
        types: v.events.filter((e) => e.actorId === 'p0').map((e) => e.type),
        slapTBefore: before,
        slapTAfter: c.slapT,
        slapSide: c.slapSide,
      });
      time += DT;
      characters.update(DT, time);
    }
    return { ticks, character: c, rig: r };
  }

  it('slapStart 那一 tick 动画就起手，判定还没到就已经有画面', () => {
    const { ticks } = runOneSlap();
    const startAt = ticks.findIndex((t) => t.types.includes('slapStart'));
    const strikeAt = ticks.findIndex((t) => t.types.includes('slap'));

    expect(startAt).toBeGreaterThanOrEqual(0);
    expect(strikeAt).toBeGreaterThan(startAt);
    // 起手那一 tick 之前动画是停的（slapT < 0），之后就在跑了
    expect(ticks[startAt].slapTBefore).toBeLessThan(0);
    expect(ticks[startAt].slapTAfter).toBe(0);
    // 前摇不是一帧就过去的：判定到达之前已经放了好几帧
    expect(strikeAt - startAt).toBeGreaterThan(3);
    expect(ticks[strikeAt].slapTBefore).toBeGreaterThan(0);
  });

  it('判定那一 tick 不重置：hit + slap 一起到，动画照着前摇的进度往下走', () => {
    const { ticks } = runOneSlap();
    const strike = ticks.find((t) => t.types.includes('slap'));

    // 同一 tick 里 sim 先推 hit 再推 slap —— 这个顺序正是双重 playSlap 的成因
    expect(strike.types).toContain('hit');
    expect(strike.types.indexOf('hit')).toBeLessThan(strike.types.indexOf('slap'));
    // 处理完整批事件，进度一点没动（旧行为是被 playSlap 打回 0）
    expect(strike.slapTAfter).toBe(strike.slapTBefore);
    expect(strike.slapTAfter).toBeGreaterThan(0);
  });

  it('命中算出的击退侧活到最后，不被随后的 slap 冲回激活槽的默认侧', () => {
    const { ticks, character } = runOneSlap();
    const strike = ticks.find((t) => t.types.includes('slap'));

    // 主掌在 slot 0 = 右手（+1）；靶子在左前方，击退侧是 -1
    expect(strike.slapSide).toBe(-1);
    expect(character.slapSide).toBe(-1);
  });

  it('一记掌只起手一次：整段里 slapT 只被推回 0 那么一回', () => {
    const { ticks } = runOneSlap();
    const restarts = ticks.filter((t) => t.slapTAfter === 0 && t.slapTBefore !== 0);
    expect(restarts).toHaveLength(1);
    expect(restarts[0].types).toContain('slapStart');
  });
});

describe('steerSlap：改在飞的那一记，不重起', () => {
  function one() {
    const { characters } = rigged();
    characters.reconcile([renderPlayer('p0')], 'p0');
    return { characters, c: characters.get('p0') };
  }

  it('没有在飞的掌就修不了：返回 false，调用方自己决定要不要起手', () => {
    const { characters, c } = one();
    expect(c.slapT).toBeLessThan(0);
    expect(characters.steerSlap('p0', { side: -1 })).toBe(false);
    expect(c.slapSide).toBe(1); // 没被偷偷改掉
    expect(characters.steerSlap('nobody', { side: -1 })).toBe(false);
  });

  it('修正只动朝向与分量，slapT 原地不动', () => {
    const { characters, c } = one();
    characters.playSlap('p0', 1);
    characters.update(0.1, 0.1);
    const mid = c.slapT;
    expect(mid).toBeGreaterThan(0);

    expect(characters.steerSlap('p0', { side: -1, power: 2 })).toBe(true);
    expect(c.slapT).toBe(mid);
    expect(c.slapSide).toBe(-1);
    expect(c.slapPower).toBe(2);
  });

  it('分量只涨不落：后到的空挥事件压不回命中的力度', () => {
    const { characters, c } = one();
    characters.playSlap('p0', 2.2);
    expect(c.slapPower).toBe(2); // playSlap 自己的上限
    characters.steerSlap('p0', { power: 1 });
    expect(c.slapPower).toBe(2);
    characters.steerSlap('p0', { power: Number.NaN });
    expect(c.slapPower).toBe(2);
  });

  it('只认 ±1 的侧：别的值当作「没说」，保留原来那只手', () => {
    const { characters, c } = one();
    characters.playSlap('p0', 1, -1);
    characters.steerSlap('p0', { side: 0 });
    expect(c.slapSide).toBe(-1);
    characters.steerSlap('p0', {});
    expect(c.slapSide).toBe(-1);
    characters.steerSlap('p0', { side: 1 });
    expect(c.slapSide).toBe(1);
  });
});

describe('没有前摇事件的路子照样起手', () => {
  it('combat 的空挥 / 残影掌直接发 slap：这时才由 slap 起手', () => {
    const { r, characters, strikes } = rigged();
    characters.reconcile([renderPlayer('p0')], 'p0');
    const c = characters.get('p0');

    r._handleEvent(ev('slap', { actorId: 'p0', hits: 0, power: 1.3 }));
    expect(c.slapT).toBe(0); // 起手了
    expect(strikes).toHaveLength(1);
    expect(strikes[0].whiff).toBe(true);
  });

  it('命中事件独自到达（技能命中 / 掉帧漏了前摇）也起手，并且带上击退侧', () => {
    const { r, characters } = rigged();
    characters.reconcile([renderPlayer('p0'), renderPlayer('b0', { x: -2, z: -2 })], 'p0');
    const c = characters.get('p0');

    r._handleEvent(ev('hit', { actorId: 'p0', targetId: 'b0', power: 1.5 }));
    expect(c.slapT).toBe(0);
    expect(c.slapSide).toBe(-1); // 靶子在局部 -X
  });

  it('技能起手之后，紧跟的命中只修正不重放', () => {
    const { r, characters } = rigged();
    characters.reconcile([renderPlayer('p0'), renderPlayer('b0', { x: -2, z: -2 })], 'p0');
    const c = characters.get('p0');

    // sim 推 skill 在前、hit 在后（step.js 的 resolveSkill 分支）
    r._handleEvent(ev('skill', { actorId: 'p0', skillId: 'quake_slam', power: 1.2 }));
    characters.update(0.08, 0.08);
    const mid = c.slapT;
    expect(mid).toBeGreaterThan(0);

    r._handleEvent(ev('hit', { actorId: 'p0', targetId: 'b0', power: 1.5 }));
    expect(c.slapT).toBe(mid);
    expect(c.slapSide).toBe(-1);
  });
});
