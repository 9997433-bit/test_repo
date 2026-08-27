// 角色剪影与残影的结构单测。
//
// 用户目标是「不要所有人都是同一根胶囊」，那就得有一条能自动跑的判据。截图评审
// 拦不住「换了个 skinId 但画面一模一样」，所以这里断言的是硬事实：
//
//   · 不同 skinId → 不同配件、不同比例（灰度剪影就是靠这两样区分的）
//   · 换 skinId → 那个角色真的重建了（比例进的是 group.scale，改不了只能重搭）
//   · Bot 各带各的 skinId 时，场上不会出现两具一样的身体
//   · `view.combat.ghosts` 有内容 → 场景里真的多出可见的残影网格，空了就全收回
//
// three 的场景图在 node 里是纯 JS，不需要 GL 上下文；程序化贴图要 canvas，
// 所以这里给一份 map 全为 null 的贴图库 —— 材质吃 null，形状与状态照样能验。

import { describe, expect, it } from 'vitest';
import { Scene, Vector3 } from 'three';
import * as sim from '../sim/index.js';
import { GLOVES } from '../data/gloves.js';
import { BOT_PERSONAS } from '../data/bots.js';
import { OCCLUDER_LAYER, QUALITY } from './config.js';
import { createCharacters } from './characters.js';
import { ACCESSORIES, EXTRA_LOOKS, resolveSkinLook, sameLook, skinTable } from './skins.js';
import * as dataModule from '../data/index.js';
import { readView } from './view.js';

/** 程序化贴图要 canvas；材质允许 map 为 null，形状照样能验。 */
function fakeTextures() {
  const pair = () => ({ rough: null, normal: null, albedo: null });
  return { cloth: pair(), leather: pair(), metal: pair(), dust: null, ember: null };
}

function mount(tier = 'high', skins = null) {
  const scene = new Scene();
  const chars = createCharacters({ scene, quality: QUALITY[tier], textures: fakeTextures(), skins });
  return { scene, chars };
}

function player(id, skinId, extra = {}) {
  return {
    id,
    kind: id === 'p0' ? 'human' : 'bot',
    skinId,
    x: 0,
    y: 0,
    z: 0,
    yaw: 0,
    alive: true,
    grounded: true,
    tint: 0xe3c988,
    mainTint: 0xe3c988,
    offTint: 0x7d8a99,
    activeGloveId: 'cotton',
    mainId: 'cotton',
    offhandId: 'granite',
    activeSlot: 0,
    ...extra,
  };
}

/** 一具身体的「形」签名：哪些几何体、各摆在哪、多大。颜色不参与。 */
function silhouette(c) {
  const parts = [];
  const p = new Vector3();
  c.rootGroup.updateMatrixWorld(true);
  c.rootGroup.traverse((o) => {
    if (!o.isMesh) return;
    o.getWorldPosition(p);
    parts.push(
      [
        o.geometry.type,
        o.geometry.parameters ? Object.values(o.geometry.parameters).join('/') : '',
        p.x.toFixed(3),
        p.y.toFixed(3),
        p.z.toFixed(3),
      ].join(':')
    );
  });
  return parts.sort().join('|');
}

describe('皮肤 → 剪影', () => {
  it('兜底表里的每一只皮肤都解析得出比例与配件，配件都在形制表里', () => {
    const table = skinTable(null);
    expect(table.skins.length).toBeGreaterThanOrEqual(6);
    for (const s of table.skins) {
      const look = resolveSkinLook(s.id, table);
      expect(ACCESSORIES, s.id).toContain(look.accessory);
      expect(look.build.height, s.id).toBeGreaterThan(0.8);
      expect(look.build.mass, s.id).toBeGreaterThan(0.7);
    }
    // 七只兜底皮肤的配件不许重样：换皮肤就得换一件看得见的东西
    const kinds = table.skins.map((s) => resolveSkinLook(s.id, table).accessory);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it('Bot 人格自带的 skinId 表里查不到也各有各的形（真表落地前的兜底）', () => {
    const ids = BOT_PERSONAS.map((p) => p.skinId);
    expect(new Set(ids).size).toBe(ids.length);
    const looks = ids.map((id) => resolveSkinLook(id));
    for (const [i, look] of looks.entries()) {
      expect(EXTRA_LOOKS[ids[i]], ids[i]).toBeTruthy();
      expect(look.source, ids[i]).toBe('extra');
    }
    expect(new Set(looks.map((l) => l.accessory)).size).toBe(3);
    expect(new Set(looks.map((l) => l.build.shoulder)).size).toBe(3);
  });

  it('认不出的 id 也不会退回统一胶囊：散列出来的形稳定且互不相同', () => {
    const a = resolveSkinLook('未来的某只皮肤');
    const b = resolveSkinLook('另一只');
    expect(a.source).toBe('synth');
    expect(sameLook(a, resolveSkinLook('未来的某只皮肤'))).toBe(true); // 纯函数，回放对得上
    expect(sameLook(a, b)).toBe(false);
    // 空 id 落到表的默认皮肤，而不是随便散列一个
    expect(resolveSkinLook(null).source).toBe('default');
    expect(resolveSkinLook('').source).toBe('default');
  });

  it('F3 真表（契约枚举）六套各有配件，不走散列，Bot 人格也不掉 EXTRA_LOOKS', () => {
    const table = skinTable(dataModule);
    expect(table.source).toBe('data');
    expect(table.defaultId).toBe('drifter');
    const expected = {
      drifter: 'hood',
      mason: 'sash',
      crane: 'banner',
      reed: 'turban',
      nuo: 'mask',
      wildhorn: 'horns',
    };
    const looks = Object.keys(expected).map((id) => resolveSkinLook(id, table));
    for (const look of looks) {
      expect(look.source, look.id).toBe('data');
      expect(look.accessory, look.id).toBe(expected[look.id]);
      expect(ACCESSORIES).toContain(look.accessory);
      expect(look.cloth, look.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(new Set(looks.map((l) => l.accessory)).size).toBe(6);
    const mason = looks.find((l) => l.id === 'mason');
    const crane = looks.find((l) => l.id === 'crane');
    expect(mason.build.shoulder).toBeGreaterThan(crane.build.shoulder);
    expect(crane.build.height).toBeGreaterThan(mason.build.height);
    for (const id of BOT_PERSONAS.map((p) => p.skinId)) {
      expect(resolveSkinLook(id, table).source, id).toBe('data');
    }
  });
});

describe('角色：不同 skinId 不是同一根胶囊', () => {
  it('两个 skinId 建出来的身体，配件与比例都不一样', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'reed'), player('b0', 'kiln')], 'p0');
    const a = chars.get('p0');
    const b = chars.get('b0');

    expect(a.look.accessory).not.toBe(b.look.accessory);
    expect(a.baseScale.y).not.toBe(b.baseScale.y);
    expect(a.baseScale.x).not.toBe(b.baseScale.x);
    // 肩宽真的落到了肩关节的位置上，不只是记在数据里
    expect(a.arms[0].shoulder.position.x).not.toBeCloseTo(b.arms[0].shoulder.position.x, 4);
    // 整副骨架的「形」签名不同（几何体种类 / 位置 / 尺寸，不含颜色）
    expect(silhouette(a)).not.toBe(silhouette(b));
    chars.dispose();
  });

  it('八种配件各自长出不一样的网格，没有两种共用一副形', () => {
    const { chars } = mount();
    const seen = new Map();
    const table = skinTable(null);
    // 兜底表 + Bot 三只，正好把配件形制表走遍
    const ids = [...table.skins.map((s) => s.id), ...Object.keys(EXTRA_LOOKS)];
    for (const [i, id] of ids.entries()) {
      chars.reconcile([player(`p${i}`, id)], 'none');
      const c = chars.get(`p${i}`);
      expect(c.accessory.length, id).toBeGreaterThan(0);
      seen.set(c.look.accessory, silhouette(c));
    }
    expect(seen.size).toBe(ACCESSORIES.length);
    expect(new Set(seen.values()).size).toBe(seen.size);
    chars.dispose();
  });

  it('换 skinId 会重建那个角色，位置与朝向不丢', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'ash')], 'p0');
    const before = chars.get('p0');
    before.pos.set(3, 0, -4);
    before.yaw = 1.1;
    const beforeAccessory = before.look.accessory;

    chars.reconcile([player('p0', 'dusk')], 'p0');
    const after = chars.get('p0');
    expect(after).not.toBe(before);
    expect(after.look.accessory).not.toBe(beforeAccessory);
    expect(after.skinId).toBe('dusk');
    expect(after.pos.x).toBeCloseTo(3, 6);
    expect(after.yaw).toBeCloseTo(1.1, 6);

    // 没换皮肤的那一帧不许重建：重建一次就掉一次插值状态
    const again = chars.get('p0');
    chars.reconcile([player('p0', 'dusk', { activeGloveId: 'frost' })], 'p0');
    expect(chars.get('p0')).toBe(again);
    chars.dispose();
  });

  it('全场四个人各带各的皮肤：没有两具一样的身体', () => {
    const { chars } = mount();
    chars.reconcile(
      [
        player('p0', 'ash'),
        player('b0', BOT_PERSONAS[0].skinId),
        player('b1', BOT_PERSONAS[1].skinId),
        player('b2', BOT_PERSONAS[2].skinId),
      ],
      'p0'
    );
    const sigs = ['p0', 'b0', 'b1', 'b2'].map((id) => silhouette(chars.get(id)));
    expect(new Set(sigs).size).toBe(4);
    chars.dispose();
  });

  it('本地玩家吃满饱和度，别人降饱和（全画面只有一个饱和峰值）', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'ash'), player('b0', 'ash')], 'p0');
    const hsl = { h: 0, s: 0, l: 0 };
    chars.get('p0').mats.paint.color.getHSL(hsl);
    const local = hsl.s;
    chars.get('b0').mats.paint.color.getHSL(hsl);
    expect(hsl.s).toBeLessThan(local);
    chars.dispose();
  });

  it('缺 skinId 的 view（老 sim / 老存档）照样建得出人', () => {
    const { chars } = mount('low');
    expect(() => chars.reconcile([player('p0', undefined)], 'p0')).not.toThrow();
    expect(chars.get('p0').look.accessory).toBe('wrap');
    chars.dispose();
  });

  it('真表喂进角色后六套剪影互不相同，不是同一根胶囊换色', () => {
    const table = skinTable(dataModule);
    const { chars } = mount('high', table);
    const ids = table.skins.map((s) => s.id);
    chars.reconcile(
      ids.map((id, i) => player(`p${i}`, id)),
      'none'
    );
    const sigs = ids.map((_, i) => silhouette(chars.get(`p${i}`)));
    expect(new Set(sigs).size).toBe(ids.length);
    expect(chars.get('p0').look.accessory).toBe('hood'); // drifter
    expect(chars.get('p1').look.accessory).toBe('sash'); // mason
    chars.dispose();
  });
});

describe('角色：按材质合批（L3-10 绘制预算）', () => {
  /** 真会发出绘制调用的东西：可见、且祖先都可见。 */
  function drawables(root) {
    const out = [];
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if (!(o.isMesh || o.isPoints)) return;
      let cur = o;
      while (cur) {
        if (!cur.visible) return;
        cur = cur.parent;
      }
      out.push(o);
    });
    return out;
  }

  it('分节照旧、绘制调用收成「身上有几种材质」那么多份', () => {
    const { chars } = mount('mid');
    chars.reconcile([player('p0', 'crane')], 'p0');
    const c = chars.get('p0');

    // 零件一件没少：躯干烘出来的几份 + 四肢 + 两只掌 + 配件，都还在场景图里
    const parts = [];
    c.rootGroup.traverse((o) => {
      if (o.isMesh && !o.isSkinnedMesh) parts.push(o);
    });
    expect(parts.length).toBeGreaterThanOrEqual(25);

    // 但每帧真正要画的只有合批后的那几份（+ 接地阴影），mid 档预算 120 是给
    // 「4 个人 + 8 座 + 天光 + 特效」分的，一个人不能占掉三分之一
    const live = drawables(c.rootGroup);
    expect(live.length).toBeLessThanOrEqual(14);
    expect(live.filter((o) => o.isSkinnedMesh).length).toBe(live.length - 1);
    // 合批网格用的就是原来那几份材质，没有偷偷换成统一材质
    const mats = new Set(Object.values(c.mats));
    for (const sm of live) {
      if (!sm.isSkinnedMesh || sm.name === 'bloom-occluder') continue;
      expect(mats.has(sm.material)).toBe(true);
    }
    chars.dispose();
  });

  it('每个零件是自己的骨头：动画写节点，合批网格跟着动', () => {
    const { chars } = mount('mid');
    chars.reconcile([player('p0', 'nuo')], 'p0');
    const c = chars.get('p0');
    const bones = c.skinned.skeleton.bones;
    // 会动的关节（掌、束带）都在骨头表里，否则挥掌时它们会钉在绑定姿势上
    expect(bones).toContain(c.arms[0].glove.userData.tassel);
    expect(bones).toContain(c.arms[0].glove.userData.mitt);
    for (const sm of c.skinned.meshes) expect(sm.skeleton).toBe(c.skinned.skeleton);
    chars.dispose();
  });

  it('三块识别色漆共用一份材质，颜色走顶点色，换掌照样看得见', () => {
    const { chars } = mount('mid');
    chars.reconcile(
      [player('p0', 'reed', { tint: 0x63c6b4, mainTint: 0x63c6b4, offTint: 0xc94f43 })],
      'p0'
    );
    const c = chars.get('p0');
    const mesh = c.paintMesh;
    expect(mesh).toBeTruthy();
    expect(mesh.material).toBe(c.mats.paintSurface);
    expect(mesh.material.vertexColors).toBe(true);

    // 背布片 / 主掌漆条 / 副掌漆条，三段各写各的颜色
    const sources = mesh.userData.ranges.map((r) => r.source.userData.tintSource).sort();
    expect(sources).toEqual(['paint', 'paintMain', 'paintOff']);
    const attr = mesh.geometry.attributes.color;
    const readAt = (r) => [attr.getX(r.start), attr.getY(r.start), attr.getZ(r.start)];
    for (const r of mesh.userData.ranges) {
      const want = c.mats[r.source.userData.tintSource].color;
      const got = readAt(r);
      // 顶点属性是 float32，材质颜色是 float64，比到 6 位就够断言「写的是这个色」
      expect(got[0], r.source.userData.tintSource).toBeCloseTo(want.r, 6);
      expect(got[1], r.source.userData.tintSource).toBeCloseTo(want.g, 6);
      expect(got[2], r.source.userData.tintSource).toBeCloseTo(want.b, 6);
    }
    // 副掌暖红、主掌青，两段顶点色分得开 —— 不是三段刷成同一个色
    const off = mesh.userData.ranges.find((r) => r.source.userData.tintSource === 'paintOff');
    const main = mesh.userData.ranges.find((r) => r.source.userData.tintSource === 'paintMain');
    expect(readAt(off)).not.toEqual(readAt(main));

    // 换掌：材质还是同一份，颜色跟着改
    chars.reconcile(
      [player('p0', 'reed', { tint: 0xe07840, mainTint: 0xe07840, offTint: 0xc94f43 })],
      'p0'
    );
    expect(mesh.material).toBe(c.mats.paintSurface);
    expect(readAt(main)[0]).toBeCloseTo(c.mats.paintMain.color.r, 6);
    expect(readAt(main)[2]).toBeCloseTo(c.mats.paintMain.color.b, 6);
    chars.dispose();
  });

  it('辉光挡光走一份纯黑替身：平时不画，只在自发光通道里露面', () => {
    const { chars } = mount('mid');
    chars.reconcile([player('p0', 'mason')], 'p0');
    const c = chars.get('p0');
    const shade = c.skinned.meshes.find((m) => m.name === 'bloom-occluder');
    expect(shade).toBeTruthy();
    expect(shade.visible).toBe(false);
    expect(shade.userData.emissiveOnly).toBe(true);
    expect(shade.layers.isEnabled(OCCLUDER_LAYER)).toBe(true);
    // 本尊不再兼职挡光，否则一具角色要在辉光通道里画三份
    for (const sm of c.skinned.meshes) {
      if (sm === shade) continue;
      expect(sm.layers.isEnabled(OCCLUDER_LAYER)).toBe(false);
    }
    chars.dispose();
  });
});

describe('分身残影', () => {
  it('ghosts 有内容就长出可见的残影网格，空了全收回', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'ash')], 'p0');
    expect(chars.ghostCount).toBe(0);

    const n = chars.syncGhosts([
      { ownerId: 'p0', x: 1, y: 0, z: -2, yaw: 0.5, ttl: 1, ttl0: 1.4, fake: false },
      { ownerId: 'p0', x: -1, y: 0, z: 2, yaw: -0.5, ttl: 0.4, ttl0: 1.4, fake: true },
    ]);
    expect(n).toBe(2);
    expect(chars.ghostCount).toBe(2);

    const visible = [];
    chars.ghostRoot.traverse((o) => {
      if (o.isMesh && o.visible && o.parent.visible) visible.push(o);
    });
    // 一具残影 = 髋 + 躯干 + 头 + 两只手
    expect(visible.length).toBe(10);
    for (const m of visible) {
      expect(m.material.transparent).toBe(true);
      expect(m.material.depthWrite).toBe(false);
      expect(m.material.opacity).toBeGreaterThan(0);
      expect(m.material.opacity).toBeLessThan(0.6); // 半透，不是第二个实体
    }

    chars.syncGhosts([]);
    expect(chars.ghostCount).toBe(0);
    expect(chars.ghostRoot.visible).toBe(false);
    chars.dispose();
  });

  it('残影用本体的体量与 -Z 朝向，寿命越短越淡', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'wildhorn')], 'p0');
    const owner = chars.get('p0');

    chars.syncGhosts([
      { ownerId: 'p0', x: 0, y: 0, z: 0, yaw: 1.2, ttl: 1.4, ttl0: 1.4 },
      { ownerId: 'p0', x: 2, y: 0, z: 0, yaw: 1.2, ttl: 0.2, ttl0: 1.4 },
    ]);
    const fresh = chars.ghostRoot.children[0];
    const dying = chars.ghostRoot.children[1];
    expect(fresh.rotation.y).toBeCloseTo(1.2, 6);
    // 宽肩壮汉的残影也是壮的：比例取自本体
    expect(fresh.scale.x).toBeCloseTo(owner.baseScale.x, 2);
    expect(dying.children[0].material.opacity).toBeLessThan(
      fresh.children[0].material.opacity
    );
    chars.dispose();
  });

  it('残影数量有上限，脏数据不抛错', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'ash')], 'p0');
    const many = Array.from({ length: 30 }, (_, i) => ({
      ownerId: 'p0',
      x: i,
      y: 0,
      z: 0,
      yaw: 0,
      ttl: 1,
      ttl0: 1,
    }));
    expect(chars.syncGhosts(many)).toBeLessThanOrEqual(6);
    expect(() => chars.syncGhosts([null, undefined, {}, 3])).not.toThrow();
    expect(() => chars.syncGhosts(null)).not.toThrow();
    chars.dispose();
  });

  it('真实 sim 的 getView().combat.ghosts 直接喂得进来（空数组也认）', () => {
    sim.resetDeps();
    sim.installData({ GLOVES });
    const state = sim.createMatch({ seed: 5, gloveId: 'afterimage', botCount: 1, phase: 'arena' });
    const v = readView(sim.getView(state));
    expect(Array.isArray(v.ghosts)).toBe(true);

    const { chars } = mount();
    chars.reconcile(v.players, v.localId);
    expect(() => chars.syncGhosts(v.ghosts)).not.toThrow();
    chars.dispose();
    sim.resetDeps();
  });
});
