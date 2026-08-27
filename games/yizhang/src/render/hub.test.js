// 安全区渲染的结构单测。
//
// 这里同样跑**真的** sim（node 里 sim 不碰 three / DOM），把 sim.getView() 原样喂给
// readHub / createHubScene，断言的是那些「肉眼一看就知道错没错、但截图评审不一定拦得住」
// 的硬约束：
//
//   · 手指朝 +Y（这是用户原话里的硬要求）
//   · 8 只掌各有一种可辨的 idle 特效，没有两只共用
//   · focus 座真的抬起来了、主掌与副掌的标记不一样
//   · 传送门 ready 前后是材质在变，且低档不许把门塞进辉光层
//   · phase === 'arena' 时整棵安全区子树关掉（走道不会画进格斗岛）
//
// three 的场景图构造在 node 里是纯 JS，不需要 GL 上下文；程序化贴图要 canvas，
// 所以这里给一份空贴图库 —— 材质允许 map 为 null，形状与状态照样能验。

import { describe, expect, it } from 'vitest';
import { Color, Scene, Vector3 } from 'three';
import * as sim from '../sim/index.js';
import { GLOVES } from '../data/gloves.js';
import { GLOVE_TINT, QUALITY } from './config.js';
import { createHubScene } from './hub.js';
import { IDLE_VFX_KIND, idleVfxKind } from './hub-vfx.js';
import { PALM_SHAPE, createPalmFactory, palmFingerAxis } from './hub-palm.js';
import { readHub, readView } from './view.js';

/** 贴图库的替身：程序化贴图要 canvas，node 里没有，材质吃 null 也照样能建。 */
const NO_TEXTURES = {};

/**
 * 「贴图确实接上了」这类断言需要一个非 null 的贴图。真程序化贴图要 canvas，
 * 这里给一个够 cloneTex（clone / repeat.set / dispose）用的最小替身。
 */
function fakeTex() {
  return {
    repeat: { set() {} },
    needsUpdate: false,
    clone() {
      return fakeTex();
    },
    dispose() {},
  };
}

function fakeTextures() {
  return {
    turbulence: fakeTex(),
    cliff: { rough: fakeTex(), albedo: fakeTex(), normal: fakeTex() },
    crust: { rough: fakeTex(), albedo: fakeTex(), normal: fakeTex() },
  };
}

/** 按材质名找一份材质。名字是比「碰巧有某张贴图」更稳的抓手。 */
function findMaterial(hub, name) {
  let found = null;
  hub.root.traverse((o) => {
    if (o.material?.name === name) found = o.material;
  });
  expect(found, `没找到名为 ${name} 的材质`).toBeTruthy();
  return found;
}

function freshMatch(opts = {}) {
  sim.resetDeps();
  sim.installData({ GLOVES });
  return sim.createMatch({
    seed: 11,
    gloveId: 'granite',
    offhandId: 'meteor',
    botCount: 1,
    unlocked: 'all',
    ...opts,
  });
}

function hubOf(state) {
  return readHub(sim.getView(state));
}

function mount(tier = 'high', state = freshMatch()) {
  const scene = new Scene();
  const hub = createHubScene({ scene, quality: QUALITY[tier], textures: NO_TEXTURES, seed: 7 });
  return { scene, hub, state };
}

function advance(hub, view, frames = 20, dt = 1 / 60) {
  for (let i = 0; i < frames; i++) hub.sync(view, dt, i * dt);
}

describe('readHub：真实 getView → 安全区视图', () => {
  it('phase=hub 时 active，8 座台座的坐标就是 sim 的坐标', () => {
    const state = freshMatch();
    const raw = sim.getView(state);
    const hub = readHub(raw);

    expect(raw.phase).toBe('hub');
    expect(hub.active).toBe(true);
    expect(hub.pedestals.length).toBe(8);
    expect(new Set(hub.pedestals.map((p) => p.gloveId)).size).toBe(8);

    for (const ped of hub.pedestals) {
      const src = raw.hub.pedestals.find((p) => p.gloveId === ped.gloveId);
      expect(ped.x).toBeCloseTo(src.x, 4);
      expect(ped.z).toBeCloseTo(src.z, 4);
      expect(ped.yaw).toBeCloseTo(src.yaw, 4);
      expect(ped.row === 'left' ? ped.x : -ped.x).toBeLessThan(0);
    }
  });

  it('走道与裂岛在水平面上错开：台座离岛心远得不可能误画进格斗岛', () => {
    const state = freshMatch();
    const v = readView(sim.getView(state));
    expect(v.hub.walkway.maxZ).toBeLessThan(-v.arena.radius * 2);
    for (const ped of v.hub.pedestals) {
      expect(Math.hypot(ped.x, ped.z)).toBeGreaterThan(v.arena.radius * 2);
    }
    // 台座横向都落在走道的可走范围里，不会长在墙外
    for (const ped of v.hub.pedestals) {
      expect(Math.abs(ped.x - v.hub.origin.x)).toBeLessThan(v.hub.walkway.halfWidth);
      expect(ped.z).toBeGreaterThan(v.hub.walkway.minZ);
      expect(ped.z).toBeLessThan(v.hub.walkway.maxZ);
    }
  });

  it('phase=arena 时 active=false（安全区一笔都不画）', () => {
    const state = freshMatch();
    sim.enterArena(state);
    const hub = hubOf(state);
    expect(sim.getView(state).phase).toBe('arena');
    expect(hub.active).toBe(false);
  });

  it('focus / 主副掌 / 未解锁都从契约里读得到', () => {
    const state = freshMatch({ unlocked: ['cotton'] });
    const hub = hubOf(state);
    const locked = hub.pedestals.filter((p) => !p.unlocked);
    expect(locked.length).toBeGreaterThan(0);
    expect(hub.pedestals.find((p) => p.gloveId === 'cotton').unlocked).toBe(true);

    // 把人挪到木棉座前面按一次 interact：焦点与主掌槽位都要反映到视图里
    const ped = state.hub.pedestals.find((p) => p.gloveId === 'cotton');
    const me = state.players[0];
    me.x = ped.x + 1.2;
    me.z = ped.z;
    sim.step(state, { p0: { interact: true } }, 1 / 60);

    const after = hubOf(state);
    const cotton = after.pedestals.find((p) => p.gloveId === 'cotton');
    expect(after.focusGloveId).toBe('cotton');
    expect(cotton.focused).toBe(true);
    // 主掌位上已经有磐石（createMatch 带进来的），所以木棉进的是副掌位
    expect(cotton.slot).toBe('off');
    expect(cotton.selected).toBe(true);
    expect(after.offGloveId).toBe('cotton');
    expect(after.pedestals.find((p) => p.gloveId === 'granite').slot).toBe('main');
    expect(after.portal.ready).toBe(true);
  });

  it('残缺 view 不抛错：没有 hub 块时退回不激活', () => {
    expect(() => readHub(null)).not.toThrow();
    expect(readHub(null).active).toBe(false);
    expect(readHub({ phase: 'hub' }).active).toBe(true);
    expect(readHub({ phase: 'hub' }).pedestals).toEqual([]);
    // 没 phase 但带着台座数据（壳层自己拼的片段）照样画
    expect(readHub({ hub: { pedestals: [{ gloveId: 'cotton', x: 1, z: 2 }] } }).active).toBe(true);
  });
});

describe('展示掌：手指朝上', () => {
  it('每只掌的四指平均指向都是 +Y', () => {
    const factory = createPalmFactory({ quality: QUALITY.high, textures: NO_TEXTURES });
    for (const glove of GLOVES) {
      const palm = factory.build({ gloveId: glove.id, hand: 1, unlocked: true });
      const axis = palmFingerAxis(palm);
      expect(axis.y, glove.id).toBeGreaterThan(0.9);
      expect(axis.dot(new Vector3(0, 1, 0)), glove.id).toBeGreaterThan(0.9);
      // 指尖确实在掌根上方，且四指长短不一（不是四根一样的棍子）
      const ys = palm.fingers.map((f) => f.tip.y);
      expect(Math.min(...ys), glove.id).toBeGreaterThan(0.2);
      expect(new Set(palm.fingers.map((f) => f.length.toFixed(3))).size).toBeGreaterThan(2);
      palm.dispose();
    }
    factory.dispose();
  });

  it('一只掌只有皮革 / 金属 / 识别色漆三份材质（8 座也就 24 个 drawcall）', () => {
    const factory = createPalmFactory({ quality: QUALITY.high, textures: NO_TEXTURES });
    const palm = factory.build({ gloveId: 'frost', hand: -1, unlocked: true });
    expect(Object.keys(palm.meshes).sort()).toEqual(['leather', 'metal', 'paint']);
    expect(palm.group.children.length).toBe(3);
    // 未解锁：整只掌换成石色材质，识别色也不亮
    palm.setLocked(true);
    for (const mesh of Object.values(palm.meshes)) expect(mesh.material).toBe(factory.locked);
    palm.setLocked(false);
    expect(palm.meshes.paint.material).toBe(palm.paint);
    palm.dispose();
    factory.dispose();
  });

  it('八只掌体格各不相同，左右排是左右手', () => {
    expect(Object.keys(PALM_SHAPE).sort()).toEqual(GLOVES.map((g) => g.id).sort());
    const bulks = new Set(Object.values(PALM_SHAPE).map((s) => s.bulk));
    expect(bulks.size).toBeGreaterThan(4);

    const factory = createPalmFactory({ quality: QUALITY.mid, textures: NO_TEXTURES });
    const right = factory.build({ gloveId: 'cotton', hand: 1, unlocked: true });
    const left = factory.build({ gloveId: 'cotton', hand: -1, unlocked: true });
    // 拇指在掌的两侧：同一只掌镜像过去，指尖的 x 排布应当相反
    expect(Math.sign(right.fingers[0].tip.x)).toBe(-Math.sign(left.fingers[0].tip.x));
    right.dispose();
    left.dispose();
    factory.dispose();
  });
});

describe('idle 特效：一掌一种，认得出是谁', () => {
  it('八只掌各占一种特效，没有两只共用', () => {
    const kinds = GLOVES.map((g) => idleVfxKind(g.id));
    expect(kinds.length).toBe(8);
    expect(new Set(kinds).size).toBe(8);
    expect(Object.keys(IDLE_VFX_KIND).sort()).toEqual(GLOVES.map((g) => g.id).sort());
    expect(IDLE_VFX_KIND.cotton).toBe('fluff');
    expect(IDLE_VFX_KIND.granite).toBe('grit');
    expect(IDLE_VFX_KIND.gale).toBe('streak');
    expect(IDLE_VFX_KIND.frost).toBe('mist');
    expect(IDLE_VFX_KIND.spring).toBe('coil');
    expect(IDLE_VFX_KIND.afterimage).toBe('ghost');
    expect(IDLE_VFX_KIND.magnet).toBe('pull');
    expect(IDLE_VFX_KIND.meteor).toBe('ember');
  });

  it('挂到台座上的特效种类与那只掌对得上，且真的往场景里加了东西', () => {
    const { hub, state } = mount('high');
    advance(hub, hubOf(state), 12);
    expect(hub.pedestals.size).toBe(8);
    for (const [gloveId, rec] of hub.pedestals) {
      expect(rec.effect.kind, gloveId).toBe(IDLE_VFX_KIND[gloveId]);
    }
    // 弹簧掌会把展示掌顶起来：这一路是特效反过来影响摆件的姿态
    const coil = hub.pedestals.get('spring');
    expect(typeof coil.effect.palmOffset).toBe('number');
    hub.dispose();
  });

  it('跑一段时间后粒子池里确实有活着的粒子，且没有超出预算', () => {
    const { hub, state } = mount('high');
    advance(hub, hubOf(state), 180);
    const pools = [];
    hub.root.traverse((o) => {
      if (o.isPoints) pools.push(o);
    });
    expect(pools.length).toBe(2);
    let alive = 0;
    for (const p of pools) {
      const range = p.geometry.drawRange.count;
      alive += range;
      expect(range).toBeLessThanOrEqual(p.geometry.attributes.position.count);
    }
    expect(alive).toBeGreaterThan(0);
    hub.dispose();
  });
});

describe('台座状态：focus 抬起、主副可分', () => {
  it('focus 座抬得比别的座高，识别色漆也更亮', () => {
    const { hub, state } = mount('high');
    const view = hubOf(state);
    advance(hub, view, 30);
    const idleY = hub.pedestals.get('cotton').palm.group.position.y;
    const idlePaint = hub.pedestals.get('cotton').palm.paint.color.clone();

    const focused = {
      ...view,
      focusGloveId: 'cotton',
      pedestals: view.pedestals.map((p) => ({ ...p, focused: p.gloveId === 'cotton' })),
    };
    advance(hub, focused, 60);

    const rec = hub.pedestals.get('cotton');
    expect(rec.palm.group.position.y).toBeGreaterThan(idleY + 0.05);
    expect(rec.palm.paint.color.r + rec.palm.paint.color.g + rec.palm.paint.color.b).toBeGreaterThan(
      idlePaint.r + idlePaint.g + idlePaint.b
    );
    // 没被聚焦的座没有跟着抬
    expect(hub.pedestals.get('frost').palm.group.position.y).toBeLessThan(idleY + 0.05);
    hub.dispose();
  });

  // 回归：焦点漆原先是 identBase.multiplyScalar(boost)。Color 自己不截断，所以在对象里
  // 看不出问题，可一上屏帧缓冲就把 >1 的通道削平 —— 木棉的红会顶到 1.31、冰霜的绿蓝顶到
  // 1.17/1.47，两只都褪成同一种白，八座的识别色就废了。断言「提亮后仍留在可显示范围内」。
  it('漆提亮后不越界：焦点态不会被帧缓冲削顶褪成白色', () => {
    const hsl = { h: 0, s: 0, l: 0 };
    // 木棉（亮金）与冰霜（亮青）是最容易削顶的两只
    for (const gloveId of ['cotton', 'frost']) {
      const { hub, state } = mount('high');
      const view = hubOf(state);
      advance(hub, view, 30);
      const idle = hub.pedestals.get(gloveId).palm.paint.color.clone();

      advance(
        hub,
        {
          ...view,
          focusGloveId: gloveId,
          pedestals: view.pedestals.map((p) => ({ ...p, focused: p.gloveId === gloveId })),
        },
        60
      );

      const lit = hub.pedestals.get(gloveId).palm.paint.color;
      expect(lit.r + lit.g + lit.b).toBeGreaterThan(idle.r + idle.g + idle.b); // 确实更亮
      for (const ch of [lit.r, lit.g, lit.b]) expect(ch).toBeLessThanOrEqual(1);
      lit.getHSL(hsl);
      expect(hsl.s).toBeGreaterThan(0.25); // 还是有色的，不是灰白
      new Color(GLOVE_TINT[gloveId]).getHSL(hsl);
      const baseHue = hsl.h;
      lit.getHSL(hsl);
      expect(Math.abs(hsl.h - baseHue)).toBeLessThan(0.02); // 色相没跑
      hub.dispose();
    }
  });

  it('主掌与副掌的标记不一样：主掌一整圈，副掌只有半圈', () => {
    const { hub, state } = mount('high');
    const view = hubOf(state);
    const picked = {
      ...view,
      mainGloveId: 'granite',
      offGloveId: 'meteor',
      pedestals: view.pedestals.map((p) => ({
        ...p,
        slot: p.gloveId === 'granite' ? 'main' : p.gloveId === 'meteor' ? 'off' : null,
        selected: p.gloveId === 'granite' || p.gloveId === 'meteor',
      })),
    };
    advance(hub, picked, 40);

    const main = hub.pedestals.get('granite');
    const off = hub.pedestals.get('meteor');
    const none = hub.pedestals.get('gale');
    expect(main.mainMark.visible).toBe(true);
    expect(main.offMark.visible).toBe(false);
    expect(off.offMark.visible).toBe(true);
    expect(off.mainMark.visible).toBe(false);
    expect(none.mainMark.visible).toBe(false);
    expect(none.offMark.visible).toBe(false);
    // 两种标记不是同一份几何体：主掌那圈顶点更多（整圈 + 两根立柱）
    expect(main.mainMark.geometry).not.toBe(off.offMark.geometry);
    expect(main.mainMark.geometry.attributes.position.count).toBeGreaterThan(
      off.offMark.geometry.attributes.position.count
    );
    // 主掌抬得比副掌高一点，剪影上就分得出来
    expect(main.palm.group.position.y).toBeGreaterThan(off.palm.group.position.y);
    hub.dispose();
  });

  it('未解锁的掌摆在那儿但整只是石色，特效也压到几乎看不见', () => {
    const state = freshMatch({ unlocked: ['cotton'] });
    const { hub } = mount('high', state);
    advance(hub, hubOf(state), 20);
    const locked = hub.pedestals.get('meteor');
    expect(locked.locked).toBe(true);
    for (const mesh of Object.values(locked.palm.meshes)) {
      expect(mesh.material.name === 'locked' || mesh.material.color.getHex()).toBeTruthy();
    }
    // 石色材质是所有未解锁座共用的那一份
    expect(locked.palm.meshes.leather.material).toBe(hub.pedestals.get('magnet').palm.meshes.leather.material);
    expect(locked.palm.meshes.leather.material).not.toBe(
      hub.pedestals.get('cotton').palm.meshes.leather.material
    );
    hub.dispose();
  });
});

describe('传送门', () => {
  it('portalReady 是材质在变：门帘 uReady 升上去、凿刻更亮、门口的灯才亮', () => {
    const { hub, state } = mount('high');
    const view = hubOf(state);
    const sealed = {
      ...view,
      portal: { ...view.portal, ready: false },
      mainGloveId: null,
      pedestals: view.pedestals.map((p) => ({ ...p, slot: null, selected: false })),
    };
    advance(hub, sealed, 120);

    const membrane = [];
    hub.root.traverse((o) => {
      if (o.isMesh && o.material?.uniforms?.uReady) membrane.push(o.material);
    });
    expect(membrane.length).toBe(1);
    const mat = membrane[0];
    expect(mat.uniforms.uReady.value).toBeLessThan(0.05);
    expect(hub.portalLight.intensity).toBeLessThan(0.5);
    const sealedRune = hub.getStats();
    expect(sealedRune.portalReady).toBeLessThan(0.05);

    advance(hub, { ...view, portal: { ...view.portal, ready: true } }, 180);
    expect(mat.uniforms.uReady.value).toBeGreaterThan(0.9);
    expect(hub.portalLight.intensity).toBeGreaterThan(6);
    // 门帘始终是半透的材质变化，没有靠把 alpha 拉满糊屏
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);
    hub.dispose();
  });

  it('低档不把门楣凿刻塞进辉光层（低档整条辉光支链是不建的）', () => {
    const BLOOM_LAYER = 1;
    for (const tier of ['high', 'mid', 'low']) {
      const { hub, state } = mount(tier);
      advance(hub, hubOf(state), 5);
      let bloomCount = 0;
      hub.root.traverse((o) => {
        if ((o.isMesh || o.isPoints) && o.layers.isEnabled(BLOOM_LAYER)) bloomCount++;
      });
      if (tier === 'low') expect(bloomCount, tier).toBe(0);
      else expect(bloomCount, tier).toBeGreaterThan(0);
      hub.dispose();
    }
  });

  // 低档没有辉光支链收尾，凿刻若还按高档强度推就会把通道顶满，
  // 门楣与门槛变成两条死白的板 —— 手册里禁的「发光贴片」。峰值必须跟着降。
  it('凿刻的自发光峰值跟着画质走，低档不会被推成一块白板', () => {
    const peak = (tier) => {
      const { hub, state } = mount(tier);
      const view = hubOf(state);
      advance(hub, { ...view, portal: { ...view.portal, ready: true } }, 240);
      const mat = findMaterial(hub, 'hub-rune');
      const v = mat.emissiveIntensity;
      hub.dispose();
      return v;
    };
    const high = peak('high');
    const low = peak('low');
    expect(high).toBeGreaterThan(0.9);
    expect(low).toBeLessThan(high);
    expect(low).toBeGreaterThan(0.3); // 也不能低到「门开了」看不出来
  });

  it('凿刻带自发光贴图：槽里有深有浅，不是一整条均匀的亮带', () => {
    const scene = new Scene();
    const hub = createHubScene({
      scene,
      quality: QUALITY.low,
      textures: fakeTextures(),
      seed: 7,
    });
    advance(hub, hubOf(freshMatch()), 5);
    expect(findMaterial(hub, 'hub-rune').emissiveMap).toBeTruthy();
    hub.dispose();
  });
});

describe('阶段切换与资源', () => {
  it('phase=arena 时整棵安全区子树关掉，回 hub 再打开', () => {
    const { hub, state } = mount('high');
    advance(hub, hubOf(state), 10);
    expect(hub.root.visible).toBe(true);
    expect(hub.visible).toBe(true);

    sim.enterArena(state);
    hub.sync(hubOf(state), 1 / 60, 1);
    expect(hub.root.visible).toBe(false);
    expect(hub.visible).toBe(false);
    expect(hub.portalLight.intensity).toBe(0);

    sim.enterHub(state);
    hub.sync(hubOf(state), 1 / 60, 2);
    expect(hub.root.visible).toBe(true);
    hub.dispose();
  });

  it('三档都能建起来、跑得动、拆得干净', () => {
    for (const tier of ['high', 'mid', 'low']) {
      const scene = new Scene();
      const state = freshMatch();
      const hub = createHubScene({ scene, quality: QUALITY[tier], textures: NO_TEXTURES, seed: 3 });
      advance(hub, hubOf(state), 40);
      expect(hub.getStats().pedestals, tier).toBe(8);
      hub.dispose();
      // 走道、台座、特效、门口那盏灯都从场景里摘干净
      expect(scene.children.length, tier).toBe(0);
    }
  });

  // hub.js 头部按项列了绘制调用预算，实测 49。那份清单只有被盯着才不会过期：
  // 这里把上限钉死，免得以后「再加一个小网格」或者哪只掌没合批悄悄把预算涨上去。
  it('安全区子树的绘制调用维持在预算内（8 座全开、主副都选上）', () => {
    const { hub, state } = mount('high');
    const view = hubOf(state);
    advance(
      hub,
      {
        ...view,
        mainGloveId: 'granite',
        offGloveId: 'meteor',
        pedestals: view.pedestals.map((p) => ({
          ...p,
          slot: p.gloveId === 'granite' ? 'main' : p.gloveId === 'meteor' ? 'off' : null,
          selected: p.gloveId === 'granite' || p.gloveId === 'meteor',
        })),
      },
      60
    );

    let draws = 0;
    hub.root.traverse((o) => {
      if (!o.visible) return;
      // 实例网格 8 座只算一次 —— 合批的意义就在这儿
      if (o.isInstancedMesh || o.isMesh || o.isPoints || o.isLine) draws++;
    });
    expect(draws).toBeGreaterThan(24); // 8 掌 ×3 份材质，低于这个数说明掌没建全
    expect(draws).toBeLessThanOrEqual(52); // 实测 49，留一点余量
    hub.dispose();
  });

  it('台座数量变少（替身掌表）时多余的座会被回收', () => {
    sim.resetDeps();
    sim.installData({ GLOVES: GLOVES.slice(0, 3) });
    const state = sim.createMatch({ seed: 2, gloveId: 'cotton', botCount: 0, unlocked: 'all' });
    const { hub } = mount('mid', state);
    advance(hub, hubOf(state), 10);
    expect(hub.pedestals.size).toBe(3);
    hub.dispose();
    sim.resetDeps();
  });
});
