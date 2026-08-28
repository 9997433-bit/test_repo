// 渲染层的视图适配单测。
//
// 这里刻意跑**真的** sim（node 里 sim 不碰 three / DOM），断言的是
// 「渲染需要的字段确实来自真实契约」：一旦 sim 改了 view 的形状，这些测试先红。

import { describe, expect, it } from 'vitest';
import * as sim from '../sim/index.js';
import { GLOVES } from '../data/gloves.js';
import { forwardX, forwardZ } from '../sim/math.js';
import { FALLBACK_TINT, GLOVE_TINT } from './config.js';
import {
  DEFAULT_LOCAL_ID,
  eventKind,
  forwardFromYaw,
  gloveTint,
  parseColor,
  pickLocalId,
  readEvents,
  readTiles,
  readView,
} from './view.js';

// 真实掌表 + sim 自带的 combat。
// 这里刻意不 installCombat(src/combat)：那边的 resolveSlap 返回的是数组，
// 而 sim/step.js 读的是 res.hits，接上去一掌都判不中（Round 2 的接线缺口，不归渲染层修）。
// 渲染层两套事件名都认，见下面「sim 与 combat 两套事件名都认得」。
function freshMatch(opts = {}) {
  sim.resetDeps();
  sim.installData({ GLOVES });
  return sim.createMatch({ seed: 3, gloveId: 'granite', offhandId: 'meteor', botCount: 3, ...opts });
}

describe('手套识别色', () => {
  it('镜像表与 src/data/gloves.js 一字不差（全表 12 掌）', () => {
    // P3 收口：生涯 4 掌（cocoon/raven/victor/tumbler）的战斗特效已并进
    // COMBAT_VFX_KIND，兜底色再缺席就等于「新掌打出来是灰的」，镜像补齐到全表。
    expect(Object.keys(GLOVE_TINT)).toHaveLength(12);
    for (const g of GLOVES) {
      expect(GLOVE_TINT[g.id], g.id).toBe(parseColor(g.color));
    }
    expect(Object.keys(GLOVE_TINT).sort()).toEqual(GLOVES.map((g) => g.id).sort());
  });

  it('view 自带的 gloveColor 优先于镜像表', () => {
    expect(gloveTint('cotton', '#123456')).toBe(0x123456);
    expect(gloveTint('cotton', null)).toBe(GLOVE_TINT.cotton);
    expect(gloveTint('nope', 'not-a-color')).toBe(FALLBACK_TINT);
  });

  it('parseColor 收 #rrggbb / rrggbb / 数字', () => {
    expect(parseColor('#e3c988')).toBe(0xe3c988);
    expect(parseColor('e3c988')).toBe(0xe3c988);
    expect(parseColor(0xe3c988)).toBe(0xe3c988);
    expect(parseColor('#fff')).toBeNull();
    expect(parseColor(undefined)).toBeNull();
  });
});

describe('朝向约定', () => {
  it('yaw = 0 面向 -Z，与 sim 的 forwardX/forwardZ 一致', () => {
    const zero = forwardFromYaw(0);
    expect(zero.x).toBeCloseTo(0, 12);
    expect(zero.z).toBeCloseTo(-1, 12);
    for (const yaw of [0, 0.7, -1.3, Math.PI / 2, Math.PI, 2.9]) {
      const f = forwardFromYaw(yaw);
      expect(f.x).toBeCloseTo(forwardX(yaw), 12);
      expect(f.z).toBeCloseTo(forwardZ(yaw), 12);
    }
  });
});

describe('本地玩家', () => {
  const view = { players: [{ id: 'p0', kind: 'human' }, { id: 'b0', kind: 'bot' }] };

  it('缺省是 p0', () => {
    expect(pickLocalId(view)).toBe('p0');
    expect(pickLocalId({ players: [{ id: 'b0', kind: 'bot' }, { id: 'p0', kind: 'bot' }] })).toBe(
      DEFAULT_LOCAL_ID
    );
    expect(readView({}).localId).toBe('p0');
  });

  it('显式 localId 最优先，名单里没有的 id 一律不认', () => {
    expect(pickLocalId(view, { localId: 'b0' })).toBe('b0');
    // main.js 的 SELF_ID 写的是 p1，sim 的名单里根本没有这个人：
    // 无论它从 setFollow 还是构造参数进来，都得落回 p0，否则镜头会跟丢
    expect(pickLocalId(view, { localId: 'p1' })).toBe('p0');
    expect(pickLocalId(view, { followId: 'p1' })).toBe('p0');
    expect(pickLocalId(view, { followId: 'b0' })).toBe('b0');
    expect(pickLocalId({ ...view, localId: 'p1' })).toBe('p0');
  });
});

describe('真实 getView → 渲染视图', () => {
  it('台面直接来自 arena.tiles，一块不多一块不少', () => {
    const state = freshMatch();
    const v = readView(sim.getView(state));

    expect(v.arena.radius).toBe(state.arena.radius);
    expect(v.arena.tileSize).toBe(state.arena.tileSize);
    expect(v.tiles.length).toBe(state.arena.tiles.length);
    expect(v.tiles.length).toBeGreaterThan(100);

    for (const tile of v.tiles) {
      const src = state.arena.tiles[tile.index];
      expect(tile.x).toBeCloseTo(src.x, 4);
      expect(tile.z).toBeCloseTo(src.z, 4);
      expect(tile.broken).toBe(false);
      // 圆盘里的格子，位置必须落在竞技场半径内
      expect(Math.hypot(tile.x, tile.z)).toBeLessThanOrEqual(state.arena.radius);
    }
    // 渲染层没有「网格外还画着一圈板」的余地：数组多长就画多少块
    expect(new Set(v.tiles.map((t) => t.key)).size).toBe(v.tiles.length);
  });

  it('缺席的格子就是洞：数组里没有的位置渲染层根本不会造出来', () => {
    const state = freshMatch();
    const full = readView(sim.getView(state));
    const raw = sim.getView(state);
    const dropped = raw.arena.tiles.splice(5, 3);
    const holed = readTiles(raw, full.arena);

    expect(holed.length).toBe(full.tiles.length - 3);
    for (const gone of dropped) {
      expect(holed.some((t) => t.index === gone.i)).toBe(false);
    }
  });

  it('打碎一块台面：view 里 broken=true，坐标就是 sim 的坐标', () => {
    const state = freshMatch();
    const victim = state.arena.tiles.find((t) => Math.hypot(t.x, t.z) > 8);
    const res = sim.damageTileAt(state, victim.x, victim.z, 10);
    expect(res.broken).toBe(false);

    const cracked = readView(sim.getView(state)).tiles.find((t) => t.index === victim.i);
    expect(cracked.broken).toBe(false);
    expect(cracked.crack).toBeGreaterThan(0);

    sim.damageTileAt(state, victim.x, victim.z, 999);
    const view = sim.getView(state);
    const hole = readView(view).tiles.find((t) => t.index === victim.i);
    expect(hole.broken).toBe(true);
    expect(hole.crack).toBe(1);
    expect(hole.x).toBeCloseTo(victim.x, 4);
    expect(hole.z).toBeCloseTo(victim.z, 4);
    // 洞的位置与 sim 的落脚判定是同一处
    expect(sim.hasFloorUnder(state, victim.x, victim.z)).toBe(false);

    // 台面事件带得出 tile 下标，渲染层据此定位到同一块
    const breakEvent = readEvents(view).find((e) => e.kind === 'tileBreak');
    expect(breakEvent.tileIndex).toBe(victim.i);
    expect(breakEvent.x).toBeCloseTo(victim.x, 4);
  });

  it('skinId 原样透传：sim 给什么就是什么，没给就是 null', () => {
    const state = freshMatch({ skinId: 'reed', botSkinIds: ['wildhorn', 'crane', 'nuo'] });
    const players = readView(sim.getView(state)).players;
    expect(players.find((p) => p.id === 'p0').skinId).toBe('reed');
    expect(players.filter((p) => p.kind === 'bot').map((p) => p.skinId)).toEqual([
      'wildhorn',
      'crane',
      'nuo',
    ]);
    // 老 sim / 老存档没有这个字段：一律 null，剪影那层自己兜底
    expect(readView(freshMatch()).players.every((p) => p.skinId === null)).toBe(true);
    expect(readView({ players: [{ id: 'p0', skinId: '' }] }).players[0].skinId).toBeNull();
    expect(readView({ players: [{ id: 'p0', skinId: 7 }] }).players[0].skinId).toBeNull();
  });

  it('combat.ghosts 恒可读：没有残影就是空数组，有就带 -Z 空间的 yaw', () => {
    const state = freshMatch({ gloveId: 'afterimage' });
    const raw = sim.getView(state);
    expect(Array.isArray(raw.combat.ghosts)).toBe(true);
    expect(readView(raw).ghosts).toEqual([]);

    const ghosts = readView({
      combat: {
        ghosts: [
          { id: 'g1', ownerId: 'p0', x: 1.5, y: 0, z: -2, yaw: 0.4, ttl: 0.7, ttl0: 1.2, fake: true, gloveId: 'afterimage' },
          { id: 'g2', ownerId: 'p0', x: 'nope', z: 1 },
        ],
      },
    }).ghosts;
    expect(ghosts.length).toBe(1); // 坐标不是数的那条直接丢掉
    expect(ghosts[0]).toMatchObject({ ownerId: 'p0', x: 1.5, z: -2, yaw: 0.4, fake: true });
    expect(ghosts[0].ttl0).toBe(1.2);
    // 没给 ttl0 时退回 ttl：淡出比例算得出来，不会除以 0
    expect(readView({ combat: { ghosts: [{ x: 0, z: 0, ttl: 0.5 }] } }).ghosts[0].ttl0).toBe(0.5);
    expect(readView({}).ghosts).toEqual([]);
    expect(readView({ combat: null }).ghosts).toEqual([]);
  });

  it('玩家字段：位置 / 朝向 / 双掌 / 觉醒 / 无敌都读得到', () => {
    const state = freshMatch();
    const p = state.players[0];
    p.awakenedT = 4;
    p.invulnT = 0.5;
    p.activeSlot = 1;
    const me = readView(sim.getView(state)).players.find((q) => q.id === 'p0');

    expect(me.kind).toBe('human');
    expect(me.x).toBeCloseTo(p.x, 4);
    expect(me.z).toBeCloseTo(p.z, 4);
    expect(me.yaw).toBeCloseTo(p.yaw, 4);
    expect(me.alive).toBe(true);
    expect(me.awakened).toBe(true);
    expect(me.awakenedT).toBe(4);
    expect(me.invulnT).toBe(0.5);
    // 切到副掌：识别色跟着换成副掌的颜色
    expect(me.activeGloveId).toBe('meteor');
    expect(me.mainId).toBe('granite');
    expect(me.offhandId).toBe('meteor');
    expect(me.tint).toBe(GLOVE_TINT.meteor);
    expect(me.mainTint).toBe(GLOVE_TINT.granite);
    expect(me.offTint).toBe(GLOVE_TINT.meteor);
  });

  it('扇击事件：slap / hit 带着 gloveId、命中数与坐标进来', () => {
    const state = freshMatch();
    const [me, foe] = state.players;
    // 把对手摆在正前方（yaw=0 → -Z）
    me.x = 0;
    me.z = 0;
    me.yaw = 0;
    foe.x = 0;
    foe.z = -2;
    foe.invulnT = 0;

    let slap = null;
    let hit = null;
    for (let i = 0; i < 40 && !hit; i++) {
      sim.step(state, { p0: { slap: true, yaw: 0 } }, 1 / 60);
      const events = readEvents(sim.getView(state));
      slap ??= events.find((e) => e.kind === 'slap');
      hit ??= events.find((e) => e.kind === 'hit');
    }

    expect(slap).toBeTruthy();
    expect(slap.actorId).toBe('p0');
    expect(slap.gloveId).toBe('granite');
    expect(slap.hits).toBeGreaterThanOrEqual(0);

    expect(hit).toBeTruthy();
    expect(hit.actorId).toBe('p0');
    expect(hit.targetId).toBe('b0');
    // power 归一到 1 附近，渲染层直接拿它当特效强度
    expect(hit.power).toBeGreaterThan(0.3);
    expect(hit.power).toBeLessThan(2.7);
  });

  it('sim 与 combat 两套事件名都认得', () => {
    expect(eventKind('slapStart')).toBe('swing');
    expect(eventKind('slapWindup')).toBe('swing');
    expect(eventKind('tileBreak')).toBe('tileBreak');
    expect(eventKind('skillCast')).toBe('skill');
    expect(eventKind('meteorImpact')).toBe('heavy');
    expect(eventKind('kill')).toBe('ko');
    expect(eventKind('ko')).toBe('ko');
    expect(eventKind('nonsense')).toBeNull();
  });

  it('tick 一直在推进：渲染层靠它给事件去重', () => {
    const state = freshMatch();
    const before = readView(sim.getView(state)).tick;
    sim.step(state, {}, 1 / 60);
    const after = readView(sim.getView(state)).tick;
    expect(before).toBe(0);
    expect(after).toBeGreaterThan(before);
  });

  it('readView 顺带把阶段与安全区读出来：hub 开局 active，进岛后关掉', () => {
    const state = freshMatch();
    const inHub = readView(sim.getView(state));
    expect(inHub.phase).toBe('hub');
    expect(inHub.hub.active).toBe(true);
    // 走道仍 8 座（GDD §12）：P2 表尾追加的生涯 4 掌不上 3D 台座
    expect(inHub.hub.pedestals.length).toBe(8);
    // 台座的识别色跟手套表一致（渲染层的漆色不是自己编的）
    for (const ped of inHub.hub.pedestals) {
      expect(ped.tint, ped.gloveId).toBe(GLOVE_TINT[ped.gloveId]);
    }
    // 安全区整体挪到裂岛外面：两块空间在水平面上不重叠
    expect(inHub.hub.walkway.maxZ).toBeLessThan(-inHub.arena.radius);
    expect(inHub.hub.portal.z).toBeLessThan(inHub.hub.walkway.maxZ);

    sim.enterArena(state);
    const inArena = readView(sim.getView(state));
    expect(inArena.phase).toBe('arena');
    expect(inArena.hub.active).toBe(false);
    // 裂岛那一份没受影响：台面照旧一块不少
    expect(inArena.tiles.length).toBe(state.arena.tiles.length);
  });

  it('残缺 / 空 view 不抛错', () => {
    expect(() => readView(null)).not.toThrow();
    expect(readView(null).tiles).toEqual([]);
    expect(readView(null).hub.active).toBe(false);
    expect(readView(null).phase).toBeNull();
    expect(readView({ players: [null, { id: 'x' }] }).players.length).toBe(1);
    expect(readView({ arena: { radius: 12 } }).arena.radius).toBe(12);
  });
});
