// 展示掌：立在台座上、**手指朝上（+Y）** 的那只掌。
//
// 三条硬约束：
//  1. 手指指向 +Y。掌背朝身后、掌心朝走道中线（台座 group 已经按 sim 的 yaw 转好，
//     这里只需要保证本地 -Z 是掌心方向），所以玩家沿走道走过来看到的是一只立掌。
//  2. 不是方块人手。掌根是压扁的椭球，四指分节且带自然的长短与轻微内扣，
//     拇指从掌侧支出去，腕口有袖箍与识别色漆环 —— 灰度化之后仍读得出是一只手。
//  3. 一只掌只留三份材质（皮革 / 金属 / 识别色漆）。分节做完之后按材质烘成 3 个网格，
//     8 座加起来 24 个 drawcall，不会因为「每根手指一个 Mesh」把绘制调用打爆。
//
// 掌心的包浆、指节的磨亮这些明暗变化写进顶点色，由皮革那一份材质统一吃掉，
// 因此不需要为了「掌心亮一点」再多开一种材质。

import {
  BufferAttribute,
  CapsuleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE } from './config.js';

/** 材质分组键。每只掌最终只有这三个网格。 */
export const PALM_MAT_KEYS = ['leather', 'metal', 'paint'];

/**
 * 每只掌的体格差异。同一套解剖结构改几个比例，8 座摆在一起才不像复制粘贴，
 * 而且「磐石厚重、疾风修长、分身瘦削」这件事不用等特效起来就已经读得到。
 */
export const PALM_SHAPE = {
  cotton: { bulk: 1.04, curl: 0.26, cuff: 1.0, spread: 1.06, thumb: 0.95 },
  granite: { bulk: 1.24, curl: 0.1, cuff: 1.18, spread: 0.92, thumb: 1.1 },
  gale: { bulk: 0.9, curl: 0.3, cuff: 0.86, spread: 1.14, thumb: 0.9 },
  frost: { bulk: 0.98, curl: 0.16, cuff: 1.04, spread: 1.0, thumb: 1.0 },
  spring: { bulk: 1.02, curl: 0.38, cuff: 0.94, spread: 0.96, thumb: 1.05 },
  afterimage: { bulk: 0.88, curl: 0.22, cuff: 0.9, spread: 1.1, thumb: 0.88 },
  magnet: { bulk: 1.1, curl: 0.14, cuff: 1.08, spread: 0.94, thumb: 1.12 },
  meteor: { bulk: 1.16, curl: 0.2, cuff: 1.12, spread: 0.98, thumb: 1.08 },
};

const DEFAULT_SHAPE = { bulk: 1, curl: 0.2, cuff: 1, spread: 1, thumb: 1 };

/** 顶点色是明暗调制，不是固有色：均值压在 1.0 附近，固有色仍旧由材质与贴图给。 */
const TONE = {
  back: 0.94, // 手背：常年朝外，风化最重
  palm: 1.16, // 掌心：抓握包浆，最亮
  finger: 1.02,
  tip: 1.1,
  cuff: 0.86,
  metal: 1.0,
  paint: 1.0,
};

/** tone 可以是一个亮度标量，也可以是一枚 Color（要做冷暖偏移时用）。 */
function tintGeometry(geo, tone) {
  const count = geo.attributes.position.count;
  const arr = new Float32Array(count * 3);
  const r = typeof tone === 'number' ? tone : tone?.r ?? 1;
  const g = typeof tone === 'number' ? tone : tone?.g ?? 1;
  const b = typeof tone === 'number' ? tone : tone?.b ?? 1;
  for (let i = 0; i < count; i++) {
    arr[i * 3] = r;
    arr[i * 3 + 1] = g;
    arr[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new BufferAttribute(arr, 3));
  return geo;
}

/**
 * 把搭好的骨架按材质烘成几份几何体：`mesh.userData.matKey` 决定归哪一份，
 * `mesh.userData.tone` 写进顶点色。骨架只是用来算变换的脚手架 —— 烘完就丢，
 * 运行时不存在这些中间节点，一份材质就是一个 drawcall。
 *
 * @param {import('three').Object3D} root
 * @returns {Map<string, import('three').BufferGeometry>}
 */
export function bakeByMaterial(root) {
  root.updateWorldMatrix(true, true);
  const buckets = new Map();
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const key = obj.userData.matKey ?? 'leather';
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    tintGeometry(geo, obj.userData.tone ?? 1);
    // 多面体（Icosahedron / Octahedron）是非索引的，混进来会让合并整批失败：
    // 补一条顺序索引，顶点数据一个字节都不用动
    if (!geo.index) {
      const n = geo.attributes.position.count;
      const idx = new Array(n);
      for (let i = 0; i < n; i++) idx[i] = i;
      geo.setIndex(idx);
    }
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(geo);
  });

  const out = new Map();
  for (const [key, list] of buckets) {
    const merged = mergeGeometries(list, false);
    for (const g of list) g.dispose();
    if (!merged) continue;
    merged.computeBoundingSphere();
    out.set(key, merged);
  }
  return out;
}

/**
 * 一只掌的解剖骨架。返回 { root, fingers }，fingers 记录每根手指在**掌本地坐标**里的
 * 指尖位置与指向，供单测断言「手指确实朝 +Y」。
 *
 * @param {object} o
 * @param {number} o.hand  +1 右手（右排），-1 左手（左排）
 */
function buildSkeleton({ hand, shape, quality }) {
  // 展示掌是**摆件**：玩家会走到跟前看，但它不做动画、不参与判定。
  // 分段数比角色身上的手套再收一档，8 座加起来才不会比一整座裂岛还贵。
  const seg = Math.max(5, Math.min(9, quality.capsuleSegments - 3));
  const s = { ...DEFAULT_SHAPE, ...shape };
  const root = new Object3D();
  const born = [];

  const add = (parent, geo, matKey, tone) => {
    const mesh = new Mesh(geo, null);
    mesh.userData.matKey = matKey;
    mesh.userData.tone = tone;
    parent.add(mesh);
    born.push(geo);
    return mesh;
  };

  const bulk = s.bulk;

  // ---- 腕口：袖箍 + 识别色漆环 ----
  const cuffH = 0.22 * s.cuff;
  const cuff = add(
    root,
    new CylinderGeometry(0.15 * bulk, 0.19 * bulk, cuffH, seg + 2, 1, false),
    'leather',
    TONE.cuff
  );
  cuff.position.y = -0.36;

  const band = add(root, new TorusGeometry(0.163 * bulk, 0.026, 4, seg + 6), 'paint', TONE.paint);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.3;

  const strap = add(root, new TorusGeometry(0.172 * bulk, 0.017, 4, seg + 6), 'leather', TONE.cuff);
  strap.rotation.x = Math.PI / 2;
  strap.position.y = -0.42;

  // ---- 掌根：压扁的椭球，掌心（-Z）一侧另贴一层磨亮的皮 ----
  const backGeo = new SphereGeometry(0.2, seg + 3, seg + 1);
  const back = add(root, backGeo, 'leather', TONE.back);
  back.position.y = -0.05;
  back.scale.set(1.04 * bulk, 1.12 * bulk, 0.56 * bulk);

  const palm = add(root, new SphereGeometry(0.2, seg + 2, seg), 'leather', TONE.palm);
  palm.position.set(0, -0.06, -0.055 * bulk);
  palm.scale.set(0.86 * bulk, 0.94 * bulk, 0.3 * bulk);

  // 掌根外侧的小鱼际：手不是一个对称的球
  const thenar = add(root, new SphereGeometry(0.2, seg, seg - 1), 'leather', TONE.palm * 0.98);
  thenar.position.set(hand * 0.11 * bulk, -0.16, -0.02);
  thenar.scale.set(0.42 * bulk, 0.46 * bulk, 0.3 * bulk);

  // ---- 指节护条与铆钉（金属） ----
  const knuckle = add(root, new TorusGeometry(0.17 * bulk, 0.026, 5, seg + 6, Math.PI * 1.1), 'metal', TONE.metal);
  knuckle.rotation.set(0, 0, Math.PI * 0.96);
  knuckle.position.set(0, 0.1, -0.02);

  for (let i = 0; i < 2; i++) {
    const stud = add(root, new SphereGeometry(0.028, 5, 4), 'metal', TONE.metal);
    stud.position.set(hand * (0.07 - i * 0.14) * bulk, -0.2, -0.06);
  }

  // ---- 掌背的识别色漆条：斜着刷过手背，是漆不是发光贴片 ----
  const stripe = add(root, new SphereGeometry(0.2, seg, seg - 1), 'paint', TONE.paint);
  stripe.position.set(0, -0.04, 0.075 * bulk);
  stripe.scale.set(0.5 * bulk, 0.2 * bulk, 0.1 * bulk);
  stripe.rotation.z = hand * 0.3;

  // ---- 四指：分两节，指尖轻微内扣（朝掌心 -Z 方向卷） ----
  // 顺序从拇指侧数起：食、中、无名、小指
  const lengths = [0.2, 0.225, 0.2, 0.155];
  const radii = [0.045, 0.047, 0.043, 0.037];
  const fingers = [];
  for (let i = 0; i < 4; i++) {
    const len = lengths[i] * bulk;
    const rad = radii[i] * bulk;
    const px = hand * (0.108 - i * 0.072) * s.spread * bulk;

    const joint = new Object3D();
    joint.position.set(px, 0.1 * bulk, -0.01);
    // 四指微微呈扇形张开，且整体向掌心方向内扣一点点
    joint.rotation.z = -hand * (i - 1.5) * 0.07;
    joint.rotation.x = -s.curl * 0.5;
    root.add(joint);

    const p1 = add(joint, new CapsuleGeometry(rad, len * 0.62, 2, seg), 'leather', TONE.finger);
    p1.position.y = len * 0.31 + rad * 0.4;

    const mid = new Object3D();
    mid.position.y = len * 0.62 + rad * 0.5;
    mid.rotation.x = -s.curl;
    joint.add(mid);

    const p2 = add(mid, new CapsuleGeometry(rad * 0.88, len * 0.44, 2, seg), 'leather', TONE.finger);
    p2.position.y = len * 0.22;

    const tip = add(mid, new SphereGeometry(rad * 0.92, seg, seg - 2), 'leather', TONE.tip);
    tip.position.y = len * 0.44 + rad * 0.2;
    tip.scale.set(1, 1.08, 0.92);

    // 指根的指节包：手指不是插在球上的四根棍子
    const kn = add(joint, new SphereGeometry(rad * 1.16, seg, seg - 2), 'leather', TONE.finger);
    kn.position.y = rad * 0.2;

    fingers.push({ joint, tipObj: tip, length: len });
  }

  // ---- 拇指：从掌侧斜着支出去，同样朝上 ----
  const thumbRoot = new Object3D();
  thumbRoot.position.set(hand * 0.17 * bulk, -0.16, -0.035);
  thumbRoot.rotation.z = -hand * 0.62;
  thumbRoot.rotation.x = -0.16;
  root.add(thumbRoot);

  const thumb1 = add(
    thumbRoot,
    new CapsuleGeometry(0.05 * bulk * s.thumb, 0.11 * bulk, 2, seg),
    'leather',
    TONE.finger
  );
  thumb1.position.y = 0.07 * bulk;

  const thumbMid = new Object3D();
  thumbMid.position.y = 0.15 * bulk;
  thumbMid.rotation.z = hand * 0.34;
  thumbRoot.add(thumbMid);

  const thumb2 = add(
    thumbMid,
    new CapsuleGeometry(0.045 * bulk * s.thumb, 0.09 * bulk, 2, seg),
    'leather',
    TONE.finger
  );
  thumb2.position.y = 0.055 * bulk;

  const thumbTip = add(thumbMid, new SphereGeometry(0.047 * bulk * s.thumb, seg, seg - 2), 'leather', TONE.tip);
  thumbTip.position.y = 0.115 * bulk;

  return { root, fingers, thumbTip, born };
}

/**
 * 展示掌工厂。皮革与金属两份材质由所有掌共用（换的是几何体不是材质），
 * 识别色漆每掌一份 —— 它要跟着 focus / 选中状态单独变亮。
 */
export function createPalmFactory({ quality, textures }) {
  const shared = [];
  const keep = (x) => {
    shared.push(x);
    return x;
  };

  const leather = keep(
    new MeshStandardMaterial({
      color: new Color(PALETTE.leather),
      map: null,
      roughnessMap: textures?.leather?.rough ?? null,
      normalMap: quality.normalMaps ? textures?.leather?.normal ?? null : null,
      normalScale: new Vector2(0.85, 0.85),
      roughness: 0.8,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.45,
    })
  );

  const metal = keep(
    new MeshStandardMaterial({
      color: new Color(PALETTE.metal),
      roughnessMap: textures?.metal?.rough ?? null,
      normalMap: quality.normalMaps ? textures?.metal?.normal ?? null : null,
      normalScale: new Vector2(0.5, 0.5),
      roughness: 0.44,
      metalness: 0.9,
      vertexColors: true,
      envMapIntensity: 0.9,
    })
  );

  // 未解锁：同一副掌，蒙着一层灰。不是变暗的皮革，是「还没被人用过的石模」，
  // 所以粗糙度顶满、金属度归零、识别色漆也一并压成石色。
  const locked = keep(
    new MeshStandardMaterial({
      color: new Color(PALETTE.rockBody).lerp(new Color(PALETTE.grime), 0.35),
      roughnessMap: textures?.leather?.rough ?? null,
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.22,
    })
  );

  return {
    leather,
    metal,
    locked,

    /**
     * @param {object} o
     * @param {string} o.gloveId
     * @param {number} o.hand      +1 右手 / -1 左手
     * @param {Color}  o.ident     识别色
     * @param {boolean} o.unlocked
     */
    build({ gloveId, hand = 1, ident, unlocked = true }) {
      const { root, fingers, born } = buildSkeleton({
        hand,
        shape: PALM_SHAPE[gloveId],
        quality,
      });
      const baked = bakeByMaterial(root);
      for (const g of born) g.dispose();

      const paint = new MeshStandardMaterial({
        color: (ident ?? new Color(0xffffff)).clone(),
        roughnessMap: textures?.cloth?.rough ?? null,
        normalMap: quality.normalMaps ? textures?.cloth?.normal ?? null : null,
        normalScale: new Vector2(0.35, 0.35),
        roughness: 0.82,
        metalness: 0,
        vertexColors: true,
        envMapIntensity: 0.3,
      });

      const group = new Group();
      group.name = `palm:${gloveId}`;
      const meshes = {};
      for (const key of PALM_MAT_KEYS) {
        const geo = baked.get(key);
        if (!geo) continue;
        const mat = !unlocked ? locked : key === 'metal' ? metal : key === 'paint' ? paint : leather;
        const mesh = new Mesh(geo, mat);
        mesh.castShadow = quality.shadows;
        mesh.receiveShadow = false;
        group.add(mesh);
        meshes[key] = mesh;
      }

      // 单测与特效都要知道「手指指到哪儿」：记下掌本地坐标里的指尖与指向
      root.updateWorldMatrix(true, true);
      const fingerInfo = fingers.map((f) => {
        const tip = new Vector3();
        f.tipObj.getWorldPosition(tip);
        const base = new Vector3();
        f.joint.getWorldPosition(base);
        return {
          tip,
          base,
          dir: tip.clone().sub(base).normalize(),
          length: f.length,
        };
      });

      group.userData = {
        gloveId,
        hand,
        paint,
        meshes,
        fingers: fingerInfo,
        // 分身的残影要复刻同一只掌，所以把皮革那份几何体的引用留出来
        handGeometry: baked.get('leather') ?? null,
      };

      return {
        group,
        paint,
        meshes,
        fingers: fingerInfo,
        setLocked(flag) {
          for (const [key, mesh] of Object.entries(meshes)) {
            mesh.material = flag ? locked : key === 'metal' ? metal : key === 'paint' ? paint : leather;
          }
        },
        dispose() {
          for (const mesh of Object.values(meshes)) mesh.geometry.dispose();
          paint.dispose();
        },
      };
    },

    dispose() {
      for (const m of shared) m.dispose?.();
    },
  };
}

/**
 * 手指的平均指向（掌本地坐标）。单测用它断言「手指朝上」这条硬约束。
 * @param {{fingers: Array<{dir: Vector3}>}} palm
 */
export function palmFingerAxis(palm) {
  const dir = new Vector3();
  const list = palm?.fingers ?? palm?.userData?.fingers ?? [];
  for (const f of list) dir.add(f.dir);
  return list.length ? dir.divideScalar(list.length).normalize() : dir.set(0, 0, 0);
}
