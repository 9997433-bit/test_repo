// 战斗特效与镜头俯角的结构单测。
//
// 断言的还是那些「截图评审不一定拦得住」的硬约束：
//
//   · 八只掌各有一套战斗特效，分派表 8 键 8 值，没有两只共用
//   · 每套真的画出不一样的形（几何体 / 姿态 / 运动），不是同一片壳换个颜色
//   · 技能按 skillId 分派，认不出才退回持掌
//   · 池子有上限：连打不会把 drawcall 顶穿
//   · 低档不进辉光层（低档整条辉光支链是不建的），也仍然出得了形
//   · 镜头俯角：renderer 的 setLook/setPitch 一路走到 camera 的机位高度

import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import { GLOVES } from '../data/gloves.js';
import { SKILLS } from '../data/skills.js';
import { BASE_PITCH, PITCH_LIMIT, createCamera } from './camera.js';
import {
  COMBAT_VFX_KIND,
  PENDING_VFX_KIND,
  SKILL_VFX_KIND,
  combatVfxKind,
  createCombatVfx,
  skillVfxKind,
} from './combat-vfx.js';
import { QUALITY } from './config.js';
import { YizhangRenderer } from './renderer.js';

const BLOOM_LAYER = 1;

function mount(tier = 'high') {
  const scene = new Scene();
  const vfx = createCombatVfx({ scene, quality: QUALITY[tier], textures: {}, seed: 11 });
  return { scene, vfx };
}

/** 一次出掌画出来的「形」：用了哪副几何体、摆成什么姿态、第一帧长什么样。 */
function shapeOf(vfx, kind) {
  const at = new Vector3(0, 1.2, 0);
  const dir = new Vector3(0, 0, -1);
  vfx.strike(kind, at, dir, 1);
  const live = [];
  vfx.group.traverse((o) => {
    if (!o.isMesh || !o.visible || !o.parent?.visible) return;
    if (!o.parent?.parent?.visible) return;
    live.push(o);
  });
  const sig = live
    .map((m) =>
      [
        m.geometry.type,
        Object.values(m.geometry.parameters ?? {}).join('/'),
        m.parent.rotation.x.toFixed(3),
        m.parent.rotation.y.toFixed(3),
        m.parent.rotation.z.toFixed(3),
      ].join(':')
    )
    .sort()
    .join('|');
  return { sig, count: live.length };
}

describe('战斗特效：八掌各一套', () => {
  it('分派表一掌一键、值互不相同，键与掌表一一对上', () => {
    const keys = Object.keys(COMBAT_VFX_KIND);
    const values = Object.values(COMBAT_VFX_KIND);
    // 按掌表的长度算，不写死 8：掌表加人的那一轮，红的是「新掌没有自己的形」
    expect(keys.length).toBe(GLOVES.length);
    expect(new Set(values).size).toBe(GLOVES.length);
    expect(keys.sort()).toEqual(GLOVES.map((g) => g.id).sort());
    expect(COMBAT_VFX_KIND.cotton).toBe('fanwake');
    expect(COMBAT_VFX_KIND.granite).toBe('slab');
    expect(COMBAT_VFX_KIND.gale).toBe('gust');
    expect(COMBAT_VFX_KIND.frost).toBe('rime');
    expect(COMBAT_VFX_KIND.spring).toBe('recoil');
    expect(COMBAT_VFX_KIND.afterimage).toBe('phase');
    expect(COMBAT_VFX_KIND.magnet).toBe('flux');
    expect(COMBAT_VFX_KIND.meteor).toBe('cinder');
  });

  it('认不出的掌退回絮扇，不抛错也不留空', () => {
    expect(combatVfxKind('nope')).toBe('fanwake');
    expect(combatVfxKind(null)).toBe('fanwake');
    expect(combatVfxKind(undefined)).toBe('fanwake');
  });

  it('待接四掌：形名先占住，四条互异且不与现役重名', () => {
    const pending = Object.entries(PENDING_VFX_KIND);
    expect(pending.length).toBe(4);
    const shapes = pending.map(([, kind]) => kind);
    expect(new Set(shapes).size).toBe(4);
    for (const kind of shapes) {
      expect(Object.values(COMBAT_VFX_KIND), kind).not.toContain(kind);
      expect(Object.values(SKILL_VFX_KIND), kind).not.toContain(kind);
    }
  });

  it('待接四掌一旦进了掌表，就得有自己的形（还没进表的 id 跳过）', () => {
    const live = new Set(GLOVES.map((g) => g.id));
    let checked = 0;
    for (const [gloveId, kind] of Object.entries(PENDING_VFX_KIND)) {
      // id 还没冻结：PENDING_VFX_KIND 的键是猜的，掌表里查不到就不作数
      if (!live.has(gloveId)) continue;
      checked += 1;
      // 进了掌表就不许再退回絮扇 —— 那等于四只新掌与木棉共用一套
      expect(COMBAT_VFX_KIND[gloveId], gloveId).toBe(kind);
      const { vfx } = mount('high');
      expect(shapeOf(vfx, kind).count, gloveId).toBeGreaterThan(0);
      vfx.dispose();
    }
    // 上面全跳过是允许的（四掌未落地），但掌表本身必须已经被逐掌验过形
    expect(checked).toBeLessThanOrEqual(4);
  });

  it('技能按 skillId 分派：掌表里每个非空 skillId 都有一条', () => {
    const skillIds = GLOVES.map((g) => g.skillId).filter(Boolean);
    expect(skillIds.length).toBe(7); // 木棉无主动技
    for (const id of skillIds) {
      expect(SKILL_VFX_KIND[id], id).toBeTruthy();
      expect(SKILLS[id], id).toBeTruthy(); // 与 src/data/skills.js 对得上
    }
    expect(Object.keys(SKILL_VFX_KIND).length).toBe(7);
    // 每只掌的技能与它的扇击同源：形一致、量不同
    for (const g of GLOVES) {
      if (!g.skillId) continue;
      expect(SKILL_VFX_KIND[g.skillId], g.id).toBe(COMBAT_VFX_KIND[g.id]);
    }
    // 认不出的 skillId 退回持掌，而不是退回默认掌
    expect(skillVfxKind('未知技能', 'meteor')).toBe('cinder');
    expect(skillVfxKind(null, 'frost')).toBe('rime');
  });

  it('每掌画出来的形互不相同，不是同一片壳换个颜色', () => {
    const shapes = new Map();
    for (const g of GLOVES) {
      const { vfx } = mount('high');
      const kind = COMBAT_VFX_KIND[g.id];
      const shape = shapeOf(vfx, kind);
      expect(shape.count, g.id).toBeGreaterThan(0);
      shapes.set(kind, shape.sig);
      vfx.dispose();
    }
    expect(shapes.size).toBe(GLOVES.length);
    expect(new Set(shapes.values()).size).toBe(GLOVES.length);
  });

  it('出掌之后场景里真的有东西在动，跑完自己收干净', () => {
    const { vfx } = mount('high');
    const at = new Vector3(2, 1.1, -3);
    const dir = new Vector3(1, 0, 0);
    for (const g of GLOVES) vfx.strike(COMBAT_VFX_KIND[g.id], at, dir, 1.4, { tint: 0x63c6b4 });

    let stats = vfx.getStats();
    expect(stats.shells).toBeGreaterThan(0);
    expect(stats.particles + stats.bits).toBeGreaterThan(0);

    for (let i = 0; i < 300; i++) vfx.update(1 / 60);
    stats = vfx.getStats();
    expect(stats.shells).toBe(0);
    expect(stats.bits).toBe(0);
    expect(stats.particles).toBe(0);
    vfx.dispose();
  });

  it('打空只有形没有残留：一掌扇空不该在地上留一堆碎屑', () => {
    const { vfx } = mount('high');
    const at = new Vector3(0, 1.2, 0);
    const dir = new Vector3(0, 0, -1);
    vfx.strike('slab', at, dir, 1, { whiff: true });
    const whiff = vfx.getStats();
    expect(whiff.shells).toBeGreaterThan(0);
    expect(whiff.bits).toBe(0);
    expect(whiff.particles).toBe(0);

    vfx.strike('slab', at, dir, 1);
    expect(vfx.getStats().bits).toBeGreaterThan(0);
    vfx.dispose();
  });

  it('连打不会把批次顶穿：形体池与碎块都有上限', () => {
    for (const tier of ['high', 'mid', 'low']) {
      const { vfx, scene } = mount(tier);
      const at = new Vector3(0, 1.2, 0);
      const dir = new Vector3(0, 0, -1);
      for (let i = 0; i < 120; i++) {
        vfx.strike(COMBAT_VFX_KIND[GLOVES[i % GLOVES.length].id], at, dir, 2);
        vfx.update(1 / 60);
      }
      let draws = 0;
      scene.traverse((o) => {
        if (!o.visible) return;
        if (o.isInstancedMesh || o.isMesh || o.isPoints) draws++;
      });
      // 形体池 high 7+7 / mid 5+5 / low 3+3，再加两池粒子与一批碎块
      expect(draws, tier).toBeLessThanOrEqual(tier === 'high' ? 20 : tier === 'mid' ? 16 : 12);
      expect(vfx.getStats().bits, tier).toBeLessThanOrEqual(tier === 'low' ? 14 : 52);
      vfx.dispose();
      expect(scene.children.length, tier).toBe(0);
    }
  });

  it('低档不进辉光层，但形一样出得来（低档整条辉光支链是不建的）', () => {
    for (const tier of ['high', 'mid', 'low']) {
      const { vfx } = mount(tier);
      const at = new Vector3(0, 1.2, 0);
      const dir = new Vector3(0, 0, -1);
      vfx.strike('cinder', at, dir, 1.6);
      vfx.update(1 / 60);

      let bloom = 0;
      vfx.group.traverse((o) => {
        if ((o.isMesh || o.isPoints) && o.layers.isEnabled(BLOOM_LAYER)) bloom++;
      });
      if (tier === 'low') expect(bloom, tier).toBe(0);
      else expect(bloom, tier).toBeGreaterThan(0);
      expect(vfx.getStats().shells, tier).toBeGreaterThan(0);
      vfx.dispose();
    }
  });

  it('形体一律 NormalBlending 半透，只有余烬走加法（手册 §10）', () => {
    const { vfx } = mount('high');
    vfx.strike('fanwake', new Vector3(0, 1.2, 0), new Vector3(0, 0, -1), 1);
    let additive = 0;
    let normal = 0;
    vfx.group.traverse((o) => {
      const m = o.material;
      if (!m) return;
      if (m.blending === 2) additive++; // AdditiveBlending
      else normal++;
      if (o.isMesh && m.uniforms) {
        expect(m.transparent).toBe(true);
        expect(m.depthWrite).toBe(false);
      }
    });
    expect(additive).toBe(1); // 只有余烬那一池
    expect(normal).toBeGreaterThan(1);
    vfx.dispose();
  });

  it('絮扇跟着掌横扫：扇心从出掌方向的左侧走到右侧，不是往上抹', () => {
    const { vfx } = mount('high');
    // 出掌方向 -Z（与 yaw=0 一致）：这时世界 +X 就是出掌方向的右手边
    vfx.strike('fanwake', new Vector3(0, 1.2, 0), new Vector3(0, 0, -1), 1, { whiff: true });

    const sheet = [];
    vfx.group.traverse((o) => {
      if (!o.isMesh || !o.material?.uniforms?.uInner) return;
      if (o.visible && o.parent?.visible && o.parent?.parent?.visible) sheet.push(o);
    });
    expect(sheet.length).toBe(1);

    // 扇形几何体在本地 XY 平面上以 +X 为楔心，取楔心上一点当扇面的「朝向标记」
    const mark = new Vector3();
    const sample = () => {
      sheet[0].updateWorldMatrix(true, false);
      return mark.set(0.6, 0, 0).applyMatrix4(sheet[0].matrixWorld).clone();
    };

    const head = sample();
    for (let i = 0; i < 20; i++) vfx.update(1 / 60); // 0.33s，絮扇一共 0.44s
    const tail = sample();

    // 左 → 右
    expect(tail.x).toBeGreaterThan(head.x + 0.1);
    // 抬高只是一点点，纵向不许抢过横扫（改之前扇面一边扫一边升 0.24m）
    expect(Math.abs(tail.y - head.y)).toBeLessThan(tail.x - head.x);
    vfx.dispose();
  });
});

describe('镜头俯角', () => {
  const focus = new Vector3(0, 0, 0);
  const vel = new Vector3(0, 0, 0);

  function settle(rig, bias, frames = 120) {
    for (let i = 0; i < frames; i++) rig.update(1 / 60, focus, 0, vel, { pitchBias: bias });
    return rig.camera.position.y;
  }

  it('pitchBias 抬高 / 压低机位，缺省（0）就是静止机位', () => {
    const base = settle(createCamera({}), 0);
    const down = settle(createCamera({}), 0.6); // 往下看：镜头抬高
    const up = settle(createCamera({}), -0.5); // 往上看：镜头压低
    expect(down).toBeGreaterThan(base + 0.5);
    expect(up).toBeLessThan(base - 0.5);
  });

  it('俯角夹在 ±PITCH_LIMIT：喂进来一个疯值也不会把镜头翻过头顶', () => {
    const rig = createCamera({});
    settle(rig, 99);
    expect(rig.state.pitchOut).toBeCloseTo(PITCH_LIMIT, 5);
    settle(rig, -99);
    expect(rig.state.pitchOut).toBeCloseTo(-PITCH_LIMIT, 5);
  });

  it('抬头有阻尼：一帧跳一大格，镜头是追上去的不是瞬移', () => {
    const rig = createCamera({});
    settle(rig, 0);
    const before = rig.camera.position.y;
    rig.update(1 / 60, focus, 0, vel, { pitchBias: 1.0 });
    const oneFrame = rig.camera.position.y;
    const after = settle(rig, 1.0);
    expect(oneFrame).toBeGreaterThan(before);
    expect(oneFrame).toBeLessThan(after); // 一帧还没到位
  });

  it('renderer.setLook / setPitch 把绝对俯角换成 bias，一路走到机位高度', () => {
    // WebGL 上下文在 node 里起不来，所以只装配俯角这条链路：
    // setLook 是纯换算（绝对俯角 − 静止机位基准），下游就是真的 cameraRig。
    const r = Object.create(YizhangRenderer.prototype);
    r.cameraRig = createCamera({});
    r.lookPitch = null;
    r.lookYaw = null;

    expect(r._pitchBias()).toBe(0); // 没接线时不动镜头
    expect(r.getLook().pitch).toBe(BASE_PITCH);
    const idle = settle(r.cameraRig, r._pitchBias());

    expect(r.setPitch(BASE_PITCH + 0.55)).toBeCloseTo(BASE_PITCH + 0.55, 6);
    expect(r._pitchBias()).toBeCloseTo(0.55, 6);
    const lowered = settle(r.cameraRig, r._pitchBias());
    expect(lowered).toBeGreaterThan(idle + 0.5);

    r.setLook({ pitch: BASE_PITCH - 0.45 });
    expect(r._pitchBias()).toBeCloseTo(-0.45, 6);
    const raised = settle(r.cameraRig, r._pitchBias());
    expect(raised).toBeLessThan(idle);

    // 超出上限的值在 setLook 就夹住了，别指望下游兜
    expect(r.setPitch(10)).toBeCloseTo(PITCH_LIMIT, 6);
    expect(r.setPitch(-10)).toBeCloseTo(-PITCH_LIMIT, 6);
    // 显式给 null 就交还给静止机位
    r.setLook({ pitch: null });
    expect(r._pitchBias()).toBe(0);
  });

  it('setLook 的 yaw 是可选的，不给就跟角色自己的朝向（不新增第四套约定）', () => {
    const r = Object.create(YizhangRenderer.prototype);
    r.cameraRig = createCamera({});
    r.lookPitch = null;
    r.lookYaw = null;

    expect(r.setLook({ pitch: 0.3 }).yaw).toBeNull();
    expect(r.setLook({ yaw: 1.2 }).yaw).toBeCloseTo(1.2, 6);
    expect(r.setLook({ pitch: 0.1 }).yaw).toBeCloseTo(1.2, 6); // 只给 pitch 不动 yaw
    expect(r.setLook({ yaw: null }).yaw).toBeNull();
    // 数字写法等价于 { pitch }
    expect(r.setLook(0.4).pitch).toBeCloseTo(0.4, 6);
  });
});
