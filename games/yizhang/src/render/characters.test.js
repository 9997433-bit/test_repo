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
import { CAMERA_SNAP_TELEPORT } from './camera.js';
import { SLAP_PHASE, TELEPORT_DISTANCE, createCharacters } from './characters.js';
import * as tuning from '../data/tuning.js';
import { ACCESSORIES, EXTRA_LOOKS, resolveSkinLook, sameLook, skinTable } from './skins.js';
import * as dataModule from '../data/index.js';
import { readView } from './view.js';

/** 程序化贴图要 canvas；材质允许 map 为 null，形状照样能验。 */
function fakeTextures() {
  const pair = () => ({ rough: null, normal: null, albedo: null });
  return { cloth: pair(), leather: pair(), metal: pair(), dust: null, ember: null };
}

function mount(tier = 'high', skins = null, extra = {}) {
  const scene = new Scene();
  const chars = createCharacters({
    scene,
    quality: QUALITY[tier],
    textures: fakeTextures(),
    skins,
    ...extra,
  });
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
    // 「4 个人 + 8 座 + 天光 + 特效」分的，一个人不能占掉三分之一。
    // 中档并完是：布 / 皮 / 素面 / 金属 / 识别色漆 / 主副两道缝线，加接地阴影。
    const live = drawables(c.rootGroup);
    expect(live.length).toBeLessThanOrEqual(9);
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

  it('布/皮/素面各并成一份，六套皮肤的衣料色仍旧一色一段', () => {
    const { chars } = mount('mid');
    chars.reconcile([player('p0', 'nuo')], 'p0');
    const c = chars.get('p0');

    // 并完之后：布与暗布同一份材质，皮与旧皮同一份，皮肤与配饰同一份
    const clothMesh = c.skinned.byMaterial.get(c.mats.clothSurface);
    const leatherMesh = c.skinned.byMaterial.get(c.mats.leatherSurface);
    const plainMesh = c.skinned.byMaterial.get(c.mats.plainSurface);
    for (const mesh of [clothMesh, leatherMesh, plainMesh]) {
      expect(mesh).toBeTruthy();
      expect(mesh.material.vertexColors).toBe(true);
      // 合并材质自己是白的，颜色全在顶点上，否则会给每一段再乘一层色
      expect(mesh.material.color.getHex()).toBe(0xffffff);
    }
    // 原来那几份材质没被删：它们仍旧是颜色的持有者
    expect(c.skinned.byMaterial.has(c.mats.cloth)).toBe(false);
    expect(c.mats.cloth.color).toBeTruthy();

    const colorAt = (mesh, key) => {
      const r = mesh.userData.ranges.find((x) => x.source.userData.tintSource === key);
      const a = mesh.geometry.attributes.color;
      return r ? [a.getX(r.start), a.getY(r.start), a.getZ(r.start)] : null;
    };
    // 衣料色与滚边色是两段不同的顶点色 —— 并材质不是「把两件衣服刷成一个色」
    const cloth = colorAt(clothMesh, 'cloth');
    const trim = colorAt(clothMesh, 'clothDim');
    expect(cloth).not.toEqual(trim);
    expect(cloth[0]).toBeCloseTo(c.mats.cloth.color.r, 6);
    expect(trim[2]).toBeCloseTo(c.mats.clothDim.color.b, 6);
    // 掌面的旧皮比腰带的皮亮：两段皮也分得开
    expect(colorAt(leatherMesh, 'leather')).not.toEqual(colorAt(leatherMesh, 'leatherWorn'));
    // 骨角 / 面具的配饰本色不会被皮肤色吃掉
    expect(colorAt(plainMesh, 'accent')).not.toEqual(colorAt(plainMesh, 'skin'));
    chars.dispose();
  });

  it('高档的布带织物菲涅尔，所以那一档不并布 —— 换来的画质不往中档塞', () => {
    const { chars } = mount('high');
    chars.reconcile([player('p0', 'nuo')], 'p0');
    const c = chars.get('p0');
    expect(c.mats.clothSurface).toBe(null);
    expect(c.mats.cloth.sheen).toBeGreaterThan(0);
    // 布与暗布在高档各画各的，识别色漆与皮照旧并
    expect(c.skinned.byMaterial.has(c.mats.cloth)).toBe(true);
    expect(c.skinned.byMaterial.has(c.mats.clothDim)).toBe(true);
    expect(c.skinned.byMaterial.has(c.mats.leatherSurface)).toBe(true);
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

describe('扇击：横抽，不是上撩', () => {
  /**
   * 跑完一次出掌，逐帧记下出掌进度、两只掌的世界坐标与拧腰角。
   *
   * 角色站在原点、yaw=0（面向 -Z），所以世界坐标就是角色自身坐标：
   * **+X 是角色的右手边、-X 是左手边**，跟随镜头架在他身后，屏幕右也是 +X。
   */
  function slapTrack(chars, id, side) {
    const c = chars.get(id);
    chars.playSlap(id, 1, side);
    const step = 1 / 120;
    const frames = [];
    const v = new Vector3();
    let time = 0;
    for (let i = 0; i < 200; i++) {
      time += step;
      chars.update(step, time);
      c.rootGroup.updateMatrixWorld(true);
      const hands = {};
      const shoulders = {};
      for (const arm of c.arms) {
        hands[arm.side] = arm.glove.getWorldPosition(v).clone();
        shoulders[arm.side] = arm.shoulder.getWorldPosition(v).clone();
      }
      frames.push({ t: c.slapT, torso: c.body.rotation.y, hands, shoulders });
      if (c.slapT < 0) break;
    }
    return frames;
  }

  /** 命中段 = 加速扫的那 0.18（归一），判定就落在这一段末尾。 */
  function strikeFrames(frames) {
    return frames.filter((f) => f.t >= SLAP_PHASE.windupEnd && f.t <= SLAP_PHASE.strikeEnd);
  }

  function axisTravel(frames, side) {
    let dx = 0;
    let dy = 0;
    let dz = 0;
    for (let i = 1; i < frames.length; i++) {
      const a = frames[i - 1].hands[side];
      const b = frames[i].hands[side];
      dx += Math.abs(b.x - a.x);
      dy += Math.abs(b.y - a.y);
      dz += Math.abs(b.z - a.z);
    }
    return { dx, dy, dz };
  }

  it('命中段掌是横着走的：位移几乎全在角色左右轴上，不是往上撩', () => {
    const { chars } = mount();
    // 三副体型一起验：横扇是骨骼曲线的事，不该只在某一副比例上成立
    for (const skinId of ['nuo', 'crane', 'wildhorn']) {
      chars.reconcile([player('p0', skinId)], 'p0');
      for (const side of [1, -1]) {
        const strike = strikeFrames(slapTrack(chars, 'p0', side));
        const label = `${skinId}/${side}`;
        expect(strike.length, label).toBeGreaterThan(8);

        const head = strike[0];
        const tail = strike[strike.length - 1];
        const from = head.hands[side];
        const to = tail.hands[side];
        // 左 → 右：掌从肩的左边起手（宽肩壮汉是横过胸口，不一定过得了中线），
        // 穿过身前，甩到肩的右边去
        expect(from.x - head.shoulders[side].x, label).toBeLessThan(-0.25);
        expect(to.x - tail.shoulders[side].x, label).toBeGreaterThan(0.25);
        // 纵向几乎不动：命中段整段起伏不到 5 厘米
        expect(Math.abs(to.y - from.y), label).toBeLessThan(0.05);

        const ys = strike.map((f) => f.hands[side].y);
        expect(Math.max(...ys) - Math.min(...ys), label).toBeLessThan(0.08);

        // 主轴是角色的左右轴：净位移里 x 比前后大、比上下大一个数量级以上。
        // 改之前恰好反过来 —— 那时 y 才是最大的一路（净 +0.55m 的上撩）。
        expect(to.x - from.x, label).toBeGreaterThan(0.55);
        expect(to.x - from.x, label).toBeGreaterThan(Math.abs(to.y - from.y) * 8);
        expect(to.x - from.x, label).toBeGreaterThan(Math.abs(to.z - from.z));

        // 逐帧行程同理：横向走过的路是纵向的十倍不止
        const travel = axisTravel(strike, side);
        expect(travel.dx, label).toBeGreaterThan(0.55);
        expect(travel.dx, label).toBeGreaterThan(travel.dy * 10);

        // 一路往右推，中途不折返（折返读出来就是「抡了一圈」）。
        // 收势最后几帧掌已经甩到臂展尽头，弧线开始回卷，那一小段留 1cm 容差。
        const cut = Math.floor(strike.length * 0.8);
        for (let i = 1; i < strike.length; i++) {
          const prev = strike[i - 1].hands[side].x;
          const cur = strike[i].hands[side].x;
          if (i <= cut) expect(cur, `${label}@${i}`).toBeGreaterThan(prev);
          else expect(cur, `${label}@${i}`).toBeGreaterThan(prev - 0.01);
        }
      }
    }
    chars.dispose();
  });

  it('主掌副掌都横扇，方向一致；换手只换哪条胳膊在抽', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'reed')], 'p0');
    const spans = {};
    for (const side of [1, -1]) {
      const strike = strikeFrames(slapTrack(chars, 'p0', side));
      const from = strike[0].hands[side];
      const to = strike[strike.length - 1].hands[side];
      spans[side] = to.x - from.x;
      // 出掌的那只手横过身体中线：起手在左半边，收势在右半边
      expect(from.x, `${side}`).toBeLessThan(0);
      expect(to.x, `${side}`).toBeGreaterThan(0);
      // 拧腰跟着掌走：蓄势朝左（正 yaw），出掌那下甩到右（负 yaw）
      expect(strike[0].torso, `${side}`).toBeGreaterThan(0);
      expect(strike[strike.length - 1].torso, `${side}`).toBeLessThan(0);
    }
    // 两只手的扫掠幅度同量级，不存在「只改了一边」
    expect(spans[1]).toBeGreaterThan(0.5);
    expect(spans[-1]).toBeGreaterThan(0.5);
    expect(Math.abs(spans[1] - spans[-1])).toBeLessThan(Math.min(spans[1], spans[-1]) * 0.6);
    chars.dispose();
  });

  it('横扇没有牺牲够得着：掌仍旧伸到身前半米开外，收势回得干净', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'nuo')], 'p0');
    const frames = slapTrack(chars, 'p0', 1);
    const reach = Math.min(...frames.map((f) => f.hands[1].z));
    // 面向 -Z，所以「够得远」= z 足够负
    expect(reach).toBeLessThan(-0.55);
    // 掌扫过身前时是抬到胸口高度的，不是从脚边捞上来
    const strike = strikeFrames(frames);
    for (const f of strike) {
      expect(f.hands[1].y).toBeGreaterThan(0.95);
      expect(f.hands[1].y).toBeLessThan(1.7);
    }
    // 收完手回到身侧垂着：一次出掌之后姿势不许留在半空
    const c = chars.get('p0');
    expect(c.slapT).toBe(-1);
    for (let i = 0; i < 30; i++) chars.update(1 / 60, 5 + i / 60);
    for (const arm of c.arms) {
      expect(Math.abs(arm.shoulder.rotation.y)).toBeLessThan(0.02);
      expect(Math.abs(arm.shoulder.rotation.x)).toBeLessThan(0.05);
    }
    expect(Math.abs(c.body.rotation.y)).toBeLessThan(0.02);
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

describe('模型瞬移阈值 TELEPORT_DISTANCE（16 管模型、60 管机位）', () => {
  const DT = 1 / 60;
  /** 局内重生瞬移的上界：2 × arenaRadius（20m）。 */
  const RESPAWN_JUMP = 40;

  /** 把角色搬到 (0,0,z) 再走一帧，返回落点。 */
  function stepTo(chars, z) {
    chars.reconcile([player('p0', 'ash', { z })], 'p0');
    chars.update(DT, 0);
    return chars.get('p0').pos.z;
  }

  it('导出的是那一个数：16，且与机位阈值 60 分工不混（谁也别去凑谁）', () => {
    expect(TELEPORT_DISTANCE).toBe(16);
    // 重生级瞬移（≤ 40m）夹在两个阈值中间：模型必须跳、机位必须不 snap（契约 §14-33）
    expect(TELEPORT_DISTANCE).toBeLessThan(RESPAWN_JUMP);
    expect(CAMERA_SNAP_TELEPORT).toBeGreaterThan(RESPAWN_JUMP);
    expect(TELEPORT_DISTANCE).toBeLessThan(CAMERA_SNAP_TELEPORT);
  });

  it('对照登记表 CHARACTERS.teleportDistance 与本文件同数（表是镜像，实现在这边）', () => {
    // F1 的 CHARACTERS 段并进来之前，先守住同一套镜像模式在 CAMERA 行上成立；
    // 段一落地，这条就变成硬对照——两边不同数当场红。
    const registered = tuning.CHARACTERS?.teleportDistance;
    if (registered === undefined) {
      expect(tuning.CAMERA.snapTeleport).toBe(CAMERA_SNAP_TELEPORT);
      return;
    }
    expect(registered).toBe(TELEPORT_DISTANCE);
  });

  it('过门 / 重生这种整跳直接出现在新位置，不滑步；速度也归零', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'ash')], 'p0');

    // 过门：安全区 z ≈ -120 → 裂岛原点
    expect(stepTo(chars, -120)).toBe(-120);
    expect(chars.get('p0').speed).toBe(0);
    // 重生：40m 也在阈值之上，同样是瞬移
    expect(stepTo(chars, -120 + RESPAWN_JUMP)).toBe(-120 + RESPAWN_JUMP);
    chars.dispose();
  });

  it('阈值以内仍旧是弹簧插值：跳不过去，只走一截', () => {
    const { chars } = mount();
    chars.reconcile([player('p0', 'ash')], 'p0');

    const z = stepTo(chars, -(TELEPORT_DISTANCE - 0.5));
    expect(z).toBeLessThan(0);
    expect(z).toBeGreaterThan(-(TELEPORT_DISTANCE - 0.5)); // 一帧只挪一截，没有跳
    chars.dispose();
  });
});

describe('呼吸初相：缺省随机，给 seed 才定序', () => {
  const TAU = Math.PI * 2;
  const crowd = [player('p0', 'ash'), player('p1', 'wildhorn'), player('p2', 'ember')];

  function phasesWith(extra) {
    const { chars } = mount('high', null, extra);
    chars.reconcile(crowd, 'p0');
    const out = crowd.map((p) => chars.get(p.id).breathe);
    chars.dispose();
    return out;
  }

  it('不给 seed 时初相照旧取自 Math.random（默认行为没被拿走）', () => {
    // 每次开机一套新相位：两次缺省挂载不会给出同一组数
    expect(phasesWith({})).not.toEqual(phasesWith({}));
    // 而且取的确实是 Math.random —— 把它按住，相位就跟着按住的那个数走
    const real = Math.random;
    Math.random = () => 0.25;
    try {
      for (const b of phasesWith({})) expect(b).toBeCloseTo(0.25 * TAU, 12);
    } finally {
      Math.random = real;
    }
  });

  it('给了 seed 就逐次可复现，换一颗种子换一套相位', () => {
    const a = phasesWith({ seed: 20240501 });
    expect(phasesWith({ seed: 20240501 })).toEqual(a);
    expect(phasesWith({ seed: 7 })).not.toEqual(a);
    // 一屋子人不许齐步呼吸：同一颗种子推出来的相位仍旧各不相同
    expect(new Set(a).size).toBe(a.length);
    for (const b of a) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(TAU);
    }
  });
});
