// 角色。
//
// 朝向约定（全项目冻结）：**yaw = 0 面向 -Z**，与 src/sim/math.js 的 forwardX/forwardZ
// 以及 three 的 mesh.rotation.y 一致，所以这里直接 rootGroup.rotation.y = player.yaw。
// 模型也照这个方向搭：脸、鞋尖、掌心朝 -Z，识别色的背布片在 +Z，四肢往前摆是
// 正的 rotation.x（绕 X 轴正向把下垂的肢体推向 -Z）。
//
// 剪影优先：胶囊躯干 + 明显偏大的手套，灰度化后依然能一眼读出「谁在挥掌」。
// 但「低面数」不等于「一个塑料 shader 糊全身」（手册 §2-1 / §2-8），所以身上至少分三种材质：
//   皮革  —— 手套背面，哑光底、折痕处微亮、有毛孔法线
//   金属  —— 指节护条与扣件，拉丝各向异性 + 棱角磨亮
//   织物  —— 衣袖、绑带、护腕，粗糙度接近 1，轮廓上有绒毛感
// 识别色只染布料和一道漆条，不去染皮革与金属：右手是主掌色、左手是副掌色、
// 背布片是当前激活的那只 —— 换掌在画面上因此是看得见的。全场只有本地玩家吃满饱和度。
//
// 皮肤（`view.players[].skinId`）决定的是**形**，不是贴图：身高 / 体量 / 肩宽三个比例
// 缩放同一套低面数几何体，再挂一件配件（兜帽 / 肩胄 / 斗篷 / 兽角 / 面具 / 背旗…）。
// 解析在 ./skins.js，那里同时负责「表里查不到的 id」的兜底，所以四个人各带一个
// skinId 时画面上就是四个不同的剪影，而不是四根同样的胶囊。
// 换 skinId 会重建那一个角色（几何比例进了 group.scale，改不了就得重搭），
// 换识别色仍然只改材质。

import {
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Sphere,
  SphereGeometry,
  TorusGeometry,
  Object3D,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BLOOM_LAYER, FALLBACK_TINT, OCCLUDER_LAYER, PALETTE, markOccluder } from './config.js';
import { smoothstep } from './noise.js';
import { resolveSkinLook, skinTable } from './skins.js';
const TAU = Math.PI * 2;
/** 右手（side=+1）拿主掌 slot 0，左手拿副掌 slot 1。 */
const MAIN_SIDE = 1;

/**
 * 出掌曲线的三段（归一到一次出掌的时长，秒）。
 *
 * 命中落在加速段那一小段里，所以这张表是导出的：单测按它取「命中段」的关键帧，
 * 断言那几帧的掌位移是横的。
 */
export const SLAP_PHASE = Object.freeze({
  duration: 0.62,
  windupEnd: 0.34,
  strikeEnd: 0.52,
});

/**
 * 扇是**横抽**，不是上勾。
 *
 * 一巴掌看起来往哪扇，全在下面这几个数上：
 *   · 位移只走肩关节的 yaw（`SLAP_COIL_YAW` / `SLAP_SWEEP_YAW`）。归一进度往前推，
 *     yaw 从正走到负，掌就从角色左侧扫到右侧 —— 跟随镜头里正是屏幕左 → 右。
 *     归一进度两段不等长（前摇 -0.9、跟随 +1.7），要的角度却大致对称（左 49°、
 *     右 58°），所以蓄势与跟随各带一个系数。
 *   · `SLAP_RAISE_PITCH` 只在前摇里把手臂端到胸高，命中段恒定不动 —— 肩的俯仰
 *     一旦在命中段里变，掌就是在「撩」而不是在「抽」。
 *   · `SLAP_ARC_PITCH` 是掌面带的那点弧：正前方最高、两端各低几厘米。命中段的
 *     纵向行程因此只有 ~1.5cm，横向是 ~1.1m，两者差着两个数量级。
 */
const SLAP_COIL_YAW = 0.95;
const SLAP_SWEEP_YAW = 0.54;
const SLAP_RAISE_PITCH = 1.4;
const SLAP_ARC_PITCH = 0.16;
/** 拧腰与扫掠同向：先往左蓄，出掌那下甩到右。 */
const SLAP_TORSO_YAW = 0.26;
/** 出掌时手腕沿手臂长轴滚这么多，把掌面（本地 -Z）转到迎着扫掠方向。 */
const SLAP_PALM_ROLL = -Math.PI / 2;

/** 归一进度 → 肩关节横扫角。正 = 掌在角色左侧，负 = 右侧。 */
function sweepYaw(swing) {
  return -swing * (swing < 0 ? SLAP_COIL_YAW : SLAP_SWEEP_YAW);
}
/** 同时在场的残影上限。分身掌一次最多剥两三个，留出余量就够。 */
const GHOST_CAP = 6;
/**
 * 离焦点多远之外的人不画（米）。
 *
 * 安全区在 z ≈ -120、裂岛在原点，两区相距 120 米：人在走道上时，三个 Bot 还站在
 * 岛上，一转身就有三副完整骨架进视锥 —— 那是 90 来个绘制调用买一撮几个像素高、
 * 还被雾吃掉一半的剪影。裂岛本体已经按阶段整棵关掉（island.setActive），
 * 人也照同一条规矩走。裂岛自己最远才 50 米上下，这条线在场内不会误伤。
 */
const CULL_DISTANCE = 80;
/** 这几种配件自己就盖住了头顶，素帽不必再长出来（也就不进躯干那份烘焙）。 */
const ACCESSORY_HIDES_CAP = new Set(['hood', 'turban']);

/**
 * 把一批「相对同一个父节点不动」的零件按材质烘成几份几何体。
 *
 * 分节还是分节做的 —— 形一点没变；变的是运行时不再一个零件一个 drawcall。
 * 躯干上的皮带扣、指节上的铆钉不会相对躯干/掌移动，那它们就没有理由各自
 * 占一次绘制调用。会动的部件（束带、四肢、掌）仍旧是独立节点。
 *
 * @param {Object3D} scaffold 只用来算变换的脚手架，烘完就丢
 * @returns {Map<string, import('three').BufferGeometry>} 材质键 → 合并后的几何体
 */
function bakeRigid(scaffold) {
  scaffold.updateWorldMatrix(true, true);
  const buckets = new Map();
  scaffold.traverse((o) => {
    if (!o.isMesh) return;
    const key = o.userData.matKey ?? 'cloth';
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(g);
  });
  const out = new Map();
  for (const [key, list] of buckets) {
    if (list.length === 1) {
      out.set(key, list[0]);
      continue;
    }
    const merged = mergeGeometries(list, false);
    for (const g of list) g.dispose();
    if (merged) out.set(key, merged);
  }
  return out;
}

/**
 * 一具角色的包围球（rootGroup 本地坐标，米）。
 *
 * 蒙皮网格的顶点会被骨骼推到哪里，三角形层面上算不出来 —— three 只好按绑定姿势
 * 的包围盒去做视锥剔除，摆臂一挥就会在画面边缘闪。这里直接给一个够大的球：
 * 人最高 ~2.0 米，背旗再高半米，挥掌时手伸到身侧 ~1 米。
 */
const BODY_SPHERE = new Sphere(new Vector3(0, 1.1, 0), 2.6);

/**
 * 角色在辉光通道里的「挡光替身」用的材质。
 *
 * 挡光这件事只关心形，不关心它是布是皮：所以全场角色共用这一份纯黑材质，
 * 一具角色的挡光形状因此收成一个绘制调用，而不是「他身上有几种材质」那么多份。
 */
const OCCLUDER_MAT = new MeshBasicMaterial({ color: 0x000000 });

/**
 * 渲染时哪几份材质合成一份「表面」。
 *
 * 布与暗布、皮与旧皮、三块识别色漆 —— 每一对的材质参数本来就只差一点点，
 * 差的主要是颜色，而颜色可以走顶点色。并完之后一具角色在主通道少三个绘制调用、
 * 在阴影通道再少一个；原来那几份材质仍旧是颜色的持有者与 applyTints 的写入口，
 * 六套皮肤的衣料色、配饰色、每只掌的识别色一个都没有合并。
 *
 * 高档的布是 MeshPhysicalMaterial（多一层织物菲涅尔），并不进来 ——
 * 那一档 clothSurface 是 null，布与暗布照旧各画各的（见 buildMaterials）。
 */
const SURFACE_OF = {
  cloth: 'clothSurface',
  clothDim: 'clothSurface',
  leather: 'leatherSurface',
  leatherWorn: 'leatherSurface',
  skin: 'plainSurface',
  accent: 'plainSurface',
  paint: 'paintSurface',
  paintMain: 'paintSurface',
  paintOff: 'paintSurface',
};

/**
 * 造一个零件网格：材质走 SURFACE_OF 的合并表，颜色的来源键记在 userData 上。
 *
 * @param {import('three').BufferGeometry} geometry
 * @param {Record<string, any>} mats buildMaterials 的产物
 * @param {string} key 这个零件「本来」用的是哪份材质
 */
/** 重组无敌的半透要盖住的那几份材质（含并完的表面，见 SURFACE_OF）。 */
const GHOSTABLE = [
  'cloth',
  'clothDim',
  'clothSurface',
  'leather',
  'leatherWorn',
  'leatherSurface',
  'skin',
  'accent',
  'plainSurface',
];

function matMesh(geometry, mats, key) {
  const material = mats[SURFACE_OF[key]] ?? mats[key];
  const mesh = new Mesh(geometry, material);
  // 顶点色材质要知道这一段该找谁要颜色（见 writePaint）
  if (material.vertexColors) mesh.userData.tintSource = key;
  return mesh;
}

/**
 * 把一具角色身上所有零件按材质合成几份**刚性蒙皮**网格。
 *
 * 分节还是分节做的：髋 / 膝 / 肩 / 腕 / 掌 / 束带每一个都还是场景图里的节点，动画
 * 照旧写它们的 rotation —— 变的只是「谁来画」。每个零件把自己当一根骨头（权重 1，
 * 没有真的蒙皮形变），几何体按材质合并成一份，于是一具角色从 30 来个绘制调用
 * 收成「他身上有几种材质」那么多份。剪影、摆放、比例一个数都没动。
 *
 * 原来的 Mesh 节点留在原地当骨头（`visible = false`）：动画、特效锚点、单测读到的
 * 还是同一批节点，它们只是不再自己画自己。
 *
 * @param {Object3D} rootGroup 角色根节点，蒙皮网格会挂在它下面
 * @param {Set<Object3D>} skip 不参与合并的网格（接地阴影这种要单独开关的）
 * @returns {{meshes: import('three').SkinnedMesh[], skeleton: Skeleton}}
 */
function skinify(rootGroup, skip) {
  rootGroup.updateMatrixWorld(true);
  const toLocal = new Matrix4().copy(rootGroup.matrixWorld).invert();
  const bindPose = new Matrix4();
  const bones = [];
  /** @type {Map<import('three').Material, {geos: any[], cast: boolean, receive: boolean, layers: number, bloomSelf: boolean}>} */
  const buckets = new Map();

  const parts = [];
  rootGroup.traverse((o) => {
    if (o.isMesh && !o.isSkinnedMesh && !skip.has(o)) parts.push(o);
  });
  /** 登记成辉光遮挡体的那几件，另外合成一份纯黑替身（见 OCCLUDER_MAT）。 */
  const occGeos = [];

  for (const mesh of parts) {
    const boneIndex = bones.length;
    bones.push(mesh);

    const g = mesh.geometry.clone();
    g.applyMatrix4(bindPose.multiplyMatrices(toLocal, mesh.matrixWorld));
    const n = g.attributes.position.count;
    const idx = new Uint16Array(n * 4);
    const wgt = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      idx[i * 4] = boneIndex;
      wgt[i * 4] = 1;
    }
    g.setAttribute('skinIndex', new BufferAttribute(idx, 4));
    g.setAttribute('skinWeight', new BufferAttribute(wgt, 4));

    if (mesh.layers.isEnabled(OCCLUDER_LAYER)) occGeos.push(g.clone());

    // 顶点色材质（识别色漆，见 mats.paintSurface）先垫一份白，颜色由 writePaint 写
    if (mesh.material.vertexColors && !g.attributes.color) {
      const white = new Float32Array(n * 3).fill(1);
      g.setAttribute('color', new BufferAttribute(white, 3));
    }

    let b = buckets.get(mesh.material);
    if (!b) {
      b = { geos: [], cast: false, receive: false, layers: 0, bloomSelf: false, verts: 0, ranges: [] };
      buckets.set(mesh.material, b);
    }
    b.ranges.push({ source: mesh, start: b.verts, count: n });
    b.verts += n;
    b.geos.push(g);
    b.cast ||= mesh.castShadow;
    b.receive ||= mesh.receiveShadow;
    // 挡光交给上面那份替身，本尊不必再进辉光通道
    b.layers |= mesh.layers.mask & ~(1 << OCCLUDER_LAYER);
    b.bloomSelf ||= !!mesh.userData.bloomSelf;

    // 节点留着当骨头：动画写的是它的 rotation，特效锚的是它的世界坐标
    mesh.visible = false;
  }

  const skeleton = new Skeleton(bones);
  const meshes = [];
  const byMaterial = new Map();
  for (const [material, b] of buckets) {
    const geometry = b.geos.length === 1 ? b.geos[0] : mergeGeometries(b.geos, false);
    if (!geometry) continue;
    if (b.geos.length > 1) for (const g of b.geos) g.dispose();
    const sm = new SkinnedMesh(geometry, material);
    sm.castShadow = b.cast;
    sm.receiveShadow = b.receive;
    sm.layers.mask = b.layers;
    if (b.bloomSelf) sm.userData.bloomSelf = true;
    // 合并后每个源零件占哪一段顶点：识别色换色时照着这张表改顶点色
    sm.userData.ranges = b.ranges;
    sm.boundingSphere = BODY_SPHERE.clone();
    rootGroup.add(sm);
    sm.bind(skeleton, rootGroup.matrixWorld);
    meshes.push(sm);
    byMaterial.set(material, sm);
  }

  if (occGeos.length > 0) {
    const geometry = occGeos.length === 1 ? occGeos[0] : mergeGeometries(occGeos, false);
    if (occGeos.length > 1) for (const g of occGeos) g.dispose();
    if (geometry) {
      const shade = new SkinnedMesh(geometry, OCCLUDER_MAT);
      shade.name = 'bloom-occluder';
      shade.visible = false;
      shade.userData.emissiveOnly = true;
      shade.boundingSphere = BODY_SPHERE.clone();
      markOccluder(shade);
      rootGroup.add(shade);
      shade.bind(skeleton, rootGroup.matrixWorld);
      meshes.push(shade);
    }
  }
  return { meshes, skeleton, byMaterial };
}

/**
 * 把三块识别色漆的颜色写进合批网格的顶点色。
 *
 * 背布片吃当前激活掌的色、右手漆条吃主掌色、左手吃副掌色 —— 和以前三份材质
 * 各自带一个颜色时一模一样，只是颜色的落点从 uniform 换成了顶点属性。
 * 换掌一帧几十个顶点，比多两个 drawcall 便宜得多。
 */
function writePaint(mesh, mats) {
  const attr = mesh?.geometry?.attributes?.color;
  if (!attr) return;
  for (const r of mesh.userData.ranges) {
    const col = mats[r.source.userData.tintSource]?.color;
    if (!col) continue;
    for (let i = r.start; i < r.start + r.count; i++) attr.setXYZ(i, col.r, col.g, col.b);
  }
  attr.needsUpdate = true;
}

function shortestAngle(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** 非本地角色降饱和：全画面只保留一个饱和度峰值（手册 §5.11）。 */
function identColor(tint, isLocal) {
  const c = new Color(Number.isFinite(tint) ? tint : FALLBACK_TINT);
  if (isLocal) return c;
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return c.setHSL(hsl.h, hsl.s * 0.45, hsl.l * 0.92);
}

/**
 * 皮肤的衣料色。它本来就该比识别色素得多，非本地角色再压一档：
 * 「谁是我」靠饱和度峰值来读，不是靠谁的衣服更花。
 */
function skinColor(hex, isLocal, mix = 0.6) {
  const c = new Color(typeof hex === 'string' ? hex : '#6d7280');
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * (isLocal ? 0.75 : 0.4), hsl.l);
  // 往场景基色收一把：八身衣服再不同也得是同一片暮空底下的
  return c.lerp(new Color(PALETTE.cloth), 1 - mix);
}

export function createCharacters({ scene, quality, textures, skins = null }) {
  // 皮肤表取一次就够：`src/data/skins.js` 落地后 resolveSkins 自己改吃真表
  const table = skins || skinTable(null);
  const root = new Group();
  root.name = 'characters';
  scene.add(root);

  const shared = [];
  const keep = (x) => {
    shared.push(x);
    return x;
  };

  const seg = quality.capsuleSegments;
  const geo = {
    torso: keep(new CapsuleGeometry(0.3, 0.44, Math.max(3, seg / 2), seg)),
    hips: keep(new CapsuleGeometry(0.26, 0.16, 3, seg)),
    thigh: keep(new CapsuleGeometry(0.15, 0.34, 3, Math.max(5, seg - 2))),
    shin: keep(new CapsuleGeometry(0.12, 0.3, 3, Math.max(5, seg - 2))),
    foot: keep(new BoxGeometry(0.19, 0.11, 0.34)),
    upperArm: keep(new CapsuleGeometry(0.1, 0.26, 3, Math.max(5, seg - 2))),
    head: keep(new SphereGeometry(0.22, seg + 2, seg)),
    hood: keep(new SphereGeometry(0.245, seg + 2, seg, 0, TAU, 0, Math.PI * 0.62)),
    collar: keep(new CylinderGeometry(0.24, 0.31, 0.16, seg + 2, 1, true)),
    strapChest: keep(new BoxGeometry(0.1, 0.62, 0.035)),
    buckle: keep(new BoxGeometry(0.09, 0.07, 0.05)),
    backPanel: keep(new BoxGeometry(0.29, 0.4, 0.04)),
    mitt: keep(new SphereGeometry(0.34, seg + 3, seg + 1)),
    knuckle: keep(new TorusGeometry(0.3, 0.045, 5, seg + 4, Math.PI * 1.05)),
    stud: keep(new BoxGeometry(0.07, 0.06, 0.055)),
    cuff: keep(new CylinderGeometry(0.19, 0.24, 0.22, seg + 2)),
    tassel: keep(new BoxGeometry(0.045, 0.2, 0.02)),
    seam: keep(new TorusGeometry(0.318, 0.014, 4, seg + 6, Math.PI * 1.35)),
    contact: keep(new CircleGeometry(0.62, 16)),

    // ---- 配件。每一件都要在灰度剪影里读得出，所以都是有厚度的形，不是贴片 ----
    cap: keep(new SphereGeometry(0.235, seg + 2, seg, 0, TAU, 0, Math.PI * 0.36)),
    hoodDeep: keep(new SphereGeometry(0.28, seg + 2, seg, 0, TAU, 0, Math.PI * 0.72)),
    cowl: keep(new CylinderGeometry(0.31, 0.2, 0.22, seg + 2, 1, true)),
    horn: keep(new ConeGeometry(0.062, 0.36, Math.max(4, seg - 4))),
    // 面具是一块**弯**的板：开口朝 -Z 的部分圆柱，正面看有弧度，侧面看有厚度
    maskShell: keep(
      new CylinderGeometry(0.21, 0.18, 0.3, Math.max(6, seg), 1, true, Math.PI - 0.95, 1.9)
    ),
    brow: keep(new BoxGeometry(0.3, 0.045, 0.05)),
    plate: keep(new BoxGeometry(0.27, 0.055, 0.25)),
    cloakSheet: keep(new BoxGeometry(0.52, 0.98, 0.05)),
    pole: keep(new CylinderGeometry(0.022, 0.018, 1.15, 5)),
    flag: keep(new BoxGeometry(0.26, 0.74, 0.018)),
    turbanRing: keep(new TorusGeometry(0.2, 0.078, 5, seg + 4)),
    sashBand: keep(new BoxGeometry(0.17, 0.9, 0.05)),
    wrapBand: keep(new CylinderGeometry(0.118, 0.118, 0.14, seg)),
    bracerShell: keep(new CylinderGeometry(0.16, 0.135, 0.32, seg + 1)),
  };

  // 掌背上的金属件：一圈护条 + 三颗铆钉。它们相对掌永远不动，而且每只掌、每个人
  // 都是同一份摆法，所以整个渲染层只烘这一份，8 只手共用。
  geo.gloveMetal = keep(
    (() => {
      const scaffold = new Object3D();
      const knuckle = new Mesh(geo.knuckle, null);
      knuckle.userData.matKey = 'metal';
      knuckle.rotation.set(Math.PI * 0.5, Math.PI, Math.PI * 0.02);
      knuckle.position.set(0, 0.02, -0.06);
      scaffold.add(knuckle);
      for (let i = 0; i < 3; i++) {
        const stud = new Mesh(geo.stud, null);
        stud.userData.matKey = 'metal';
        const a = -0.5 + i * 0.5;
        stud.position.set(Math.sin(a) * 0.28, 0.16, -Math.cos(a) * 0.26);
        stud.rotation.y = -a;
        scaffold.add(stud);
      }
      return bakeRigid(scaffold).get('metal');
    })()
  );

  // 接地阴影：低画质关了实时阴影后，角色仍然要「踩在地上」而不是浮着
  const contactMat = keep(
    new MeshBasicMaterial({ color: 0x0d1017, transparent: true, opacity: 0.32, depthWrite: false })
  );

  function makePaint(ident, vertexColors = false) {
    // 识别色是「染过的粗布」，不是「喷了漆的塑料板」。给它布的织纹与法线、
    // 把粗糙度推到接近全漫反射，否则背板会在跟随镜头里烧成一张白纸。
    return new MeshStandardMaterial({
      color: ident,
      vertexColors,
      // 织物只做了粗糙度与法线，没有 albedo：颜色就是识别色本身
      roughnessMap: textures.cloth.rough,
      normalMap: quality.normalMaps ? textures.cloth.normal : null,
      normalScale: new Vector2(0.4, 0.4),
      roughness: 0.86,
      metalness: 0,
      envMapIntensity: 0.28,
    });
  }

  function makeSeam() {
    // 觉醒时才亮的缝线。平时 emissiveIntensity = 0，绝不做常亮描边。
    return new MeshStandardMaterial({
      color: 0x120c08,
      roughness: 0.5,
      metalness: 0.2,
      emissive: new Color(PALETTE.crackCore),
      emissiveIntensity: 0,
      toneMapped: true,
    });
  }

  function buildMaterials(tints, isLocal, look) {
    const ident = identColor(tints.active, isLocal);
    const identMain = identColor(tints.main, isLocal);
    const identOff = identColor(tints.off, isLocal);

    const clothOpts = {
      // 只借一点识别色的色相，明度仍然由布本身决定，否则浅色手套会把整身衣服洗白
      color: skinColor(look.cloth, isLocal).lerp(ident, 0.12),
      roughness: 0.96,
      metalness: 0,
      roughnessMap: textures.cloth.rough,
      normalMap: textures.cloth.normal,
      normalScale: new Vector2(0.5, 0.5),
      envMapIntensity: 0.35,
    };
    const cloth = quality.sheenCloth
      ? new MeshPhysicalMaterial({
          ...clothOpts,
          // 织物菲涅尔：轮廓边缘一圈绒毛感的亮边。给多了就变成塑料雨衣。
          sheen: 0.3,
          sheenRoughness: 0.9,
          sheenColor: new Color(0x7d8797),
        })
      : new MeshStandardMaterial(clothOpts);

    const clothDim = new MeshStandardMaterial({
      color: skinColor(look.trim, isLocal, 0.7).lerp(new Color(PALETTE.clothDim), 0.45),
      roughness: 0.98,
      metalness: 0,
      roughnessMap: textures.cloth.rough,
      normalMap: textures.cloth.normal,
      normalScale: new Vector2(0.4, 0.4),
      envMapIntensity: 0.3,
    });

    const leather = new MeshStandardMaterial({
      color: new Color(PALETTE.leather),
      roughness: 0.78,
      metalness: 0,
      roughnessMap: textures.leather.rough,
      normalMap: textures.leather.normal,
      normalScale: new Vector2(0.9, 0.9),
      envMapIntensity: 0.5,
    });

    const leatherWorn = new MeshStandardMaterial({
      color: new Color(PALETTE.leatherWorn),
      roughness: 0.62,
      metalness: 0,
      roughnessMap: textures.leather.rough,
      normalMap: textures.leather.normal,
      normalScale: new Vector2(0.7, 0.7),
      envMapIntensity: 0.6,
    });

    const metal = new MeshStandardMaterial({
      color: new Color(PALETTE.metal),
      roughness: 0.42,
      metalness: 0.92,
      roughnessMap: textures.metal.rough,
      normalMap: textures.metal.normal,
      normalScale: new Vector2(0.5, 0.5),
      envMapIntensity: 1.0,
    });

    const skin = new MeshStandardMaterial({
      color: new Color(PALETTE.skin),
      roughness: 0.66,
      metalness: 0,
      envMapIntensity: 0.4,
    });

    // 配件上的一点点「这一身自己的颜色」：骨角、面具底、旗面。
    // 它不是识别色 —— 识别色只归手套与背布片，配件抢不走那个峰值。
    const accent = new MeshStandardMaterial({
      color: skinColor(look.accent, isLocal, 0.72),
      roughness: 0.72,
      metalness: 0,
      envMapIntensity: 0.45,
    });

    // 布与暗布真正上场的那一份：粗糙度 0.96/0.98、法线强度 0.5/0.4、环境光 0.35/0.3
    // 取中间值，颜色改走顶点色。这两个数差在肉眼与 1024 的阴影贴图之下都读不出来，
    // 少掉的是一具角色一个主通道 drawcall 加一个阴影 drawcall。
    // 高档的布带 sheen，是另一种材质，不能这么并 —— 那一档留 null，照旧两份。
    const clothSurface = quality.sheenCloth
      ? null
      : new MeshStandardMaterial({
          color: 0xffffff,
          vertexColors: true,
          roughness: 0.97,
          metalness: 0,
          roughnessMap: textures.cloth.rough,
          normalMap: textures.cloth.normal,
          normalScale: new Vector2(0.45, 0.45),
          envMapIntensity: 0.33,
        });

    // 旧皮（掌面）比皮（腰带 / 靴 / 护腕）亮一档，取靠掌那一头的粗糙度：
    // 画面上掌是主角，腰带只是配料。
    const leatherSurface = new MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.68,
      metalness: 0,
      roughnessMap: textures.leather.rough,
      normalMap: textures.leather.normal,
      normalScale: new Vector2(0.8, 0.8),
      envMapIntensity: 0.56,
    });

    // 皮肤与配饰本色是全身仅有的两份不带贴图的材质，差的是颜色与 0.06 的粗糙度。
    // 骨角、面具底、旗面照旧是「这一身自己的颜色」，只是不再自己占一个 drawcall。
    const plainSurface = new MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.69,
      metalness: 0,
      envMapIntensity: 0.42,
    });

    return {
      cloth,
      clothDim,
      clothSurface,
      leather,
      leatherWorn,
      leatherSurface,
      metal,
      skin,
      accent,
      plainSurface,
      paint: makePaint(ident),
      paintMain: makePaint(identMain),
      paintOff: makePaint(identOff),
      // 三块漆（背布片 = 当前激活掌、右手主掌漆条、左手副掌漆条）的材质参数
      // 一字不差，差的只是颜色。所以渲染时共用这一份，各自的颜色写进顶点色
      // （见 writePaint）—— 上面那三份仍旧是颜色的持有者与 applyTints 的写入口，
      // 只是不再各占一个 drawcall。换掌在画面上照样是看得见的。
      paintSurface: makePaint(0xffffff, true),
      seamMain: makeSeam(),
      seamOff: makeSeam(),
      ident,
    };
  }

  /**
   * side: +1 右手（主掌），-1 左手（副掌）。掌心与指节朝 -Z（正前方）。
   * stripeMat 是漆条颜色的来源键（`paintMain` / `paintOff`，见 mats.paintSurface）。
   */
  function buildGlove(mats, side, stripeMat, seamMat) {
    const g = new Group();
    const mitt = matMesh(geo.mitt, mats, 'leather');
    mitt.scale.set(1.0, 0.86, 1.16);
    mitt.castShadow = quality.shadows;
    g.add(mitt);

    // 掌心一侧用磨得更亮的皮：抓握的地方才会包浆
    const palm = matMesh(geo.mitt, mats, 'leatherWorn');
    palm.scale.set(0.86, 0.6, 0.9);
    palm.position.set(0, -0.13, -0.06);
    g.add(palm);

    // 护条与三颗铆钉合成一份（见 geo.gloveMetal）：形没变，四个 drawcall 变一个
    const knuckle = matMesh(geo.gloveMetal, mats, 'metal');
    // 掌的影子由 mitt 那一份给全了，金属件只是贴在它表面的一层
    knuckle.castShadow = quality.shadows && quality.propShadows;
    g.add(knuckle);

    // 识别色只出现在这一道漆条上：右手主掌色、左手副掌色
    const stripe = matMesh(geo.stud, mats, stripeMat);
    stripe.scale.set(3.4, 0.55, 1.2);
    stripe.position.set(0, 0.07, 0.24);
    g.add(stripe);

    const cuff = matMesh(geo.cuff, mats, 'cloth');
    cuff.position.set(0, 0.3, 0.02);
    cuff.rotation.x = -0.15;
    cuff.castShadow = quality.shadows && quality.propShadows;
    g.add(cuff);

    // 垂下来的束带：受重力，说明配饰有重量
    const tassel = matMesh(geo.tassel, mats, 'clothDim');
    tassel.position.set(side * 0.14, 0.26, 0.14);
    g.add(tassel);

    const seam = new Mesh(geo.seam, seamMat);
    seam.rotation.set(Math.PI * 0.5, Math.PI, Math.PI * 0.32);
    seam.position.set(0, -0.02, -0.02);
    seam.layers.enable(BLOOM_LAYER);
    seam.userData.bloomSelf = true;
    g.add(seam);

    g.userData = { tassel, seam, mitt, stripe };
    return g;
  }

  /**
   * 挂一件配件。
   *
   * 每一件都只用已有的共享几何体，所以「多一种皮肤」不会多一批 geometry；
   * 区分度来自它挂在哪、朝哪、多大。返回值只是为了 dispose 时好回收。
   *
   * @param {string} kind ./skins.js 的 ACCESSORIES 之一
   */
  function addAccessory(kind, parts) {
    const { body, arms, mats } = parts;
    const made = [];
    const put = (mesh, parent) => {
      // 配件在中档不投影：一顶帽子 / 一对角 / 一片肩甲的影子，在 1024 的贴图上
      // 落不到一个纹素，却每件都要在阴影 pass 里占一个 drawcall
      mesh.castShadow = quality.shadows && quality.propShadows;
      (parent ?? body).add(mesh);
      made.push(mesh);
      return mesh;
    };

    switch (kind) {
      case 'hood': {
        // 兜帽压得很低：帽沿盖过眉骨，转身时才露半张脸。
        // 素帽在 ACCESSORY_HIDES_CAP 里就已经不长了，这里不必再关一次。
        const hood = put(matMesh(geo.hoodDeep, mats, 'cloth'));
        hood.position.set(0, 1.82, 0.03);
        hood.rotation.x = 0.2;
        hood.scale.set(1.06, 1.12, 1.12);
        const cowl = put(matMesh(geo.cowl, mats, 'clothDim'));
        cowl.position.y = 1.62;
        break;
      }

      case 'turban': {
        const ring = put(matMesh(geo.turbanRing, mats, 'cloth'));
        ring.position.y = 1.86;
        ring.rotation.x = Math.PI / 2 + 0.12;
        ring.scale.set(1.12, 1.12, 0.86);
        const knot = put(matMesh(geo.cap, mats, 'cloth'));
        knot.position.y = 1.92;
        knot.scale.set(0.94, 0.7, 0.94);
        // 垂在脑后的尾巾：走路时它会甩，说明头上包的是布不是盔
        const tail = put(matMesh(geo.tassel, mats, 'clothDim'));
        tail.position.set(0.05, 1.68, 0.2);
        tail.scale.set(1.7, 1.5, 1.6);
        break;
      }

      case 'horns': {
        // 兽角朝两侧后翻：正面剪影变宽，侧面剪影多出两道折线
        for (const side of [-1, 1]) {
          const horn = put(matMesh(geo.horn, mats, 'accent'));
          horn.position.set(side * 0.17, 1.9, 0.02);
          horn.rotation.set(-0.5, 0, side * -0.75);
          const tip = put(matMesh(geo.horn, mats, 'accent'));
          tip.position.set(side * 0.3, 2.02, 0.16);
          tip.rotation.set(-1.15, 0, side * -1.1);
          tip.scale.setScalar(0.72);
        }
        break;
      }

      case 'mask': {
        const shell = put(matMesh(geo.maskShell, mats, 'accent'));
        shell.position.set(0, 1.79, -0.04);
        shell.scale.set(1.06, 1.12, 1.06);
        const brow = put(matMesh(geo.brow, mats, 'clothDim'));
        brow.position.set(0, 1.9, -0.19);
        brow.rotation.x = 0.22;
        break;
      }

      case 'pauldron': {
        // 片状薄甲一层层错开：肩线抬高，上半身读起来更方
        for (const arm of arms) {
          for (let i = 0; i < 3; i++) {
            const plate = put(matMesh(geo.plate, mats, 'metal'), arm.shoulder);
            plate.position.set(arm.side * (0.02 + i * 0.035), 0.06 - i * 0.075, 0);
            plate.rotation.z = arm.side * (0.18 + i * 0.16);
            plate.scale.setScalar(1 - i * 0.12);
          }
        }
        break;
      }

      case 'cloak': {
        // 一整片垂到膝弯，下摆被岛风扯开：转身时它慢半拍
        const sheet = put(matMesh(geo.cloakSheet, mats, 'cloth'));
        sheet.position.set(0, 1.06, 0.31);
        sheet.rotation.x = -0.07;
        sheet.scale.set(1, 1, 1);
        const hemLeft = put(matMesh(geo.cloakSheet, mats, 'clothDim'));
        hemLeft.position.set(-0.2, 0.62, 0.3);
        hemLeft.rotation.set(-0.16, 0.24, 0.08);
        hemLeft.scale.set(0.42, 0.5, 0.8);
        const hemRight = put(matMesh(geo.cloakSheet, mats, 'clothDim'));
        hemRight.position.set(0.2, 0.62, 0.3);
        hemRight.rotation.set(-0.16, -0.24, -0.08);
        hemRight.scale.set(0.42, 0.5, 0.8);
        break;
      }

      case 'banner': {
        // 背旗：瘦高的人再插一根杆，远处只看轮廓也知道是谁在绕边走
        const pole = put(matMesh(geo.pole, mats, 'leather'));
        pole.position.set(-0.12, 1.62, 0.34);
        pole.rotation.z = 0.16;
        const flag = put(matMesh(geo.flag, mats, 'accent'));
        flag.position.set(-0.26, 1.86, 0.36);
        flag.rotation.z = 0.16;
        const clasp = put(matMesh(geo.buckle, mats, 'metal'));
        clasp.position.set(-0.06, 1.3, 0.33);
        break;
      }

      case 'sash': {
        const band = put(matMesh(geo.sashBand, mats, 'accent'));
        band.position.set(-0.05, 1.24, -0.28);
        band.rotation.z = 0.42;
        const knot = put(matMesh(geo.buckle, mats, 'leather'));
        knot.position.set(-0.22, 0.94, -0.24);
        const tail = put(matMesh(geo.tassel, mats, 'clothDim'));
        tail.position.set(-0.24, 0.78, -0.2);
        tail.scale.set(1.6, 2.2, 1.6);
        break;
      }

      case 'bracer': {
        // 厚护臂：小臂加粗一圈，挥掌时最先扫过视野的就是它
        for (const arm of arms) {
          const shell = put(matMesh(geo.bracerShell, mats, 'leatherWorn'), arm.wrist);
          shell.position.y = -0.04;
          const rim = put(matMesh(geo.wrapBand, mats, 'metal'), arm.wrist);
          rim.position.y = -0.19;
          rim.scale.set(1.35, 0.42, 1.35);
        }
        break;
      }

      case 'wrap':
      default: {
        // 最素的一档：旧布条缠小臂，腰上再绕一圈。它不该抢戏，但也不能什么都没有。
        for (const arm of arms) {
          const band = put(matMesh(geo.wrapBand, mats, 'clothDim'), arm.wrist);
          band.position.y = -0.02;
          band.scale.set(1.08, 1.5, 1.08);
        }
        const waist = put(matMesh(geo.turbanRing, mats, 'clothDim'));
        waist.position.y = 0.92;
        waist.rotation.x = Math.PI / 2;
        waist.scale.set(1.32, 1.32, 0.5);
        break;
      }
    }
    return made;
  }

  function buildBody(tints, isLocal, look) {
    const mats = buildMaterials(tints, isLocal, look);
    const rootGroup = new Group();

    const body = new Group();
    // 皮肤的三个比例全部落在这一层：脚底仍然贴地（子件都从 y=0 往上搭），
    // 所以高矮胖瘦换来换去，人都还站在台面上
    const build = look.build;
    body.scale.set(build.mass, build.height, build.mass);
    rootGroup.add(body);

    // ---- 躯干这一段全是「相对身体不动」的零件：分节照做，最后按材质烘成几份 ----
    //
    // 髋 / 躯干 / 皮带 / 带扣 / 领口 / 背布底 / 背布识别色 / 头 / 素帽，一共九件，
    // 九种摆法一件不少；但它们之间没有任何相对运动，所以没有理由各占一次绘制调用。
    // 烘完剩六份（布 / 暗布 / 皮 / 金属 / 识别色 / 皮肤），一份材质一个 drawcall。
    // 会动的东西 —— 四肢、掌、束带、配件 —— 仍旧各是各的节点。
    const shoulderScaleX = 0.82 + build.shoulder * 0.18;
    const hideCap = ACCESSORY_HIDES_CAP.has(look.accessory);
    const scaffold = new Object3D();
    const piece = (geometry, matKey, place) => {
      const m = new Mesh(geometry, null);
      m.userData.matKey = matKey;
      place?.(m);
      scaffold.add(m);
      return m;
    };

    piece(geo.hips, 'clothDim', (m) => {
      m.position.y = 0.86;
    });
    // 肩宽单独一档：躯干只加宽不加高，宽肩与瘦长在正面剪影上立刻分得开
    piece(geo.torso, 'cloth', (m) => {
      m.position.y = 1.24;
      m.scale.x = shoulderScaleX;
    });
    // 胸前皮带把布压出褶：配饰要压变下面的织物
    piece(geo.strapChest, 'leather', (m) => {
      m.position.set(0.06, 1.26, -0.27);
      m.rotation.z = -0.24;
    });
    piece(geo.buckle, 'metal', (m) => {
      m.position.set(0.12, 1.06, -0.3);
    });
    piece(geo.collar, 'clothDim', (m) => {
      m.position.y = 1.58;
      m.scale.set(shoulderScaleX, 1, 1);
    });
    // 背上的掌印布片：跟随镜头看到的是后背，识别色必须在这里能读到。
    // 先垫一块更大的暗色底布再压识别色，边上就留出一圈缝线般的暗边 ——
    // 少了这一圈，纯色方块会像一张贴在背上的白纸。
    piece(geo.backPanel, 'clothDim', (m) => {
      m.position.set(0, 1.26, 0.305);
      m.rotation.x = -0.06;
      m.scale.set(1.22, 1.16, 0.6);
    });
    piece(geo.backPanel, 'paint', (m) => {
      m.position.set(0, 1.26, 0.315);
      m.rotation.x = -0.06;
    });
    piece(geo.head, 'skin', (m) => {
      m.position.y = 1.79;
    });
    // 素帽是所有人的底：兜帽 / 头巾这类真的盖住头顶的配件就不长它
    if (!hideCap) {
      piece(geo.cap, 'cloth', (m) => {
        m.position.y = 1.8;
        m.rotation.x = 0.16;
      });
    }

    const bakedBody = bakeRigid(scaffold);
    const bodyParts = [];
    // 躯干 / 髋 / 头挡在光前面时是真的挡得住：把带着它们的那几份登记成辉光遮挡体，
    // 人站在传送门口或破洞边上时，光不会从身上透出来
    const OCCLUDES = new Set(['cloth', 'clothDim', 'skin']);
    // 大件投影，贴在身上的小件（皮带扣、背布片）中档不单独投影
    const CASTS = new Set(['cloth', 'clothDim', 'skin']);
    for (const [key, geometry] of bakedBody) {
      const mesh = matMesh(geometry, mats, key);
      mesh.castShadow = quality.shadows && (CASTS.has(key) || quality.propShadows);
      if (key === 'cloth') mesh.receiveShadow = quality.shadows;
      if (OCCLUDES.has(key)) markOccluder(mesh);
      body.add(mesh);
      bodyParts.push(mesh);
    }

    const legs = [];
    for (const side of [-1, 1]) {
      const hip = new Group();
      hip.position.set(side * 0.16, 0.84, 0);
      body.add(hip);
      const thigh = matMesh(geo.thigh, mats, 'clothDim');
      thigh.position.y = -0.24;
      thigh.castShadow = quality.shadows;
      hip.add(thigh);
      const knee = new Group();
      knee.position.y = -0.46;
      hip.add(knee);
      const shin = matMesh(geo.shin, mats, 'clothDim');
      shin.position.y = -0.2;
      shin.castShadow = quality.shadows;
      knee.add(shin);
      const foot = matMesh(geo.foot, mats, 'leather');
      foot.position.set(0, -0.38, -0.06);
      knee.add(foot);
      legs.push({ hip, knee, side });
    }

    const arms = [];
    for (const side of [-1, 1]) {
      const isMain = side === MAIN_SIDE;
      const shoulder = new Group();
      // YXZ：先绕 Z 把手臂抬离身侧，再绕 X 端到胸前，最后绕 Y 横扫。
      // 默认的 XYZ 序会让「横扫」发生在「端平」之前 —— 那时手臂还垂着，绕 Y 只是
      // 拧了一下胳膊，掌根本不横移，剩下能出位移的就只有绕 X 的上撩。
      shoulder.rotation.order = 'YXZ';
      shoulder.position.set(side * 0.33 * build.shoulder, 1.46, 0);
      body.add(shoulder);
      const upper = matMesh(geo.upperArm, mats, 'cloth');
      upper.position.y = -0.2;
      upper.castShadow = quality.shadows;
      shoulder.add(upper);
      const wrist = new Group();
      wrist.position.y = -0.46;
      shoulder.add(wrist);
      const glove = buildGlove(
        mats,
        side,
        isMain ? 'paintMain' : 'paintOff',
        isMain ? mats.seamMain : mats.seamOff
      );
      glove.position.y = -0.22;
      wrist.add(glove);
      arms.push({ shoulder, wrist, glove, side, slot: isMain ? 0 : 1, roll: 0 });
    }

    const accessory = addAccessory(look.accessory, { body, arms, mats });

    const contact = new Mesh(geo.contact, contactMat.clone());
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.renderOrder = 1;
    // 体量大的人影子也大：接地阴影跟着剪影走，胖瘦才不会「脚下都是同一个圆」
    contact.scale.setScalar(0.86 + build.mass * 0.18);
    rootGroup.add(contact);

    // 分节搭完了，最后按材质合成几份刚性蒙皮网格（见 skinify）。
    // 接地阴影是单独开关的半透片，不进这一份。
    const skinned = skinify(rootGroup, new Set([contact]));
    // 合批后走顶点色的那几份（识别色漆 / 布 / 皮）：颜色从各自的来源材质写进顶点
    const tinted = skinned.meshes.filter((m) => m.material.vertexColors);
    for (const m of tinted) writePaint(m, mats);
    const paintMesh = skinned.byMaterial.get(mats.paintSurface) ?? null;

    return {
      rootGroup,
      paintMesh,
      tinted,
      body,
      mats,
      legs,
      arms,
      skinned,
      // 躯干那一段烘成的几份网格：换角色时要连同这几份几何体一起回收
      bodyParts,
      contact,
      look,
      accessory,
      baseScale: { x: build.mass, y: build.height, z: build.mass },
      contactScale: 0.86 + build.mass * 0.18,
    };
  }

  const chars = new Map();
  const tmpVec = new Vector3();

  function tintsOf(p) {
    return {
      active: p.tint,
      main: p.mainTint ?? p.tint,
      off: p.offTint ?? p.tint,
    };
  }

  function applyTints(c, p) {
    const isLocal = c.isLocal;
    const ident = identColor(p.tint, isLocal);
    c.mats.paint.color.copy(ident);
    c.mats.paintMain.color.copy(identColor(p.mainTint ?? p.tint, isLocal));
    c.mats.paintOff.color.copy(identColor(p.offTint ?? p.tint, isLocal));
    c.mats.cloth.color.copy(skinColor(c.look.cloth, isLocal)).lerp(ident, 0.12);
    // 并成一份的那几面（漆 / 布 / 皮）颜色落在顶点色上，改完要重写一遍（见 writePaint）
    for (const m of c.tinted) writePaint(m, c.mats);
    c.activeGloveId = p.activeGloveId;
    c.mainId = p.mainId;
    c.offhandId = p.offhandId;
  }

  function spawn(player, isLocal) {
    const look = resolveSkinLook(player.skinId, table);
    const built = buildBody(tintsOf(player), isLocal, look);
    root.add(built.rootGroup);
    const c = {
      id: player.id,
      ...built,
      isLocal,
      skinId: player.skinId ?? null,
      activeGloveId: player.activeGloveId,
      mainId: player.mainId,
      offhandId: player.offhandId,
      activeSlot: player.activeSlot ?? 0,
      pos: new Vector3(player.x ?? 0, player.y ?? 0, player.z ?? 0),
      prev: new Vector3(player.x ?? 0, player.y ?? 0, player.z ?? 0),
      yaw: player.yaw ?? 0,
      speed: 0,
      stride: 0,
      slapT: -1,
      slapSide: MAIN_SIDE,
      slapPower: 1,
      hitT: -1,
      awaken: 0,
      breathe: Math.random() * TAU,
    };
    chars.set(player.id, c);
    return c;
  }

  function disposeChar(c) {
    root.remove(c.rootGroup);
    for (const key of Object.keys(c.mats)) {
      c.mats[key]?.dispose?.();
    }
    // 躯干那几份是这个角色自己烘的（肩宽、有没有素帽都写死在顶点里），跟着他一起走
    for (const mesh of c.bodyParts) mesh.geometry.dispose();
    // 合并出来的蒙皮网格同理：一具角色一份
    for (const mesh of c.skinned.meshes) mesh.geometry.dispose();
    c.skinned.skeleton.dispose();
    c.contact.material.dispose();
  }

  // ------------------------------------------------------------------ 残影

  const ghostRoot = new Group();
  ghostRoot.name = 'ghosts';
  ghostRoot.visible = false;
  root.add(ghostRoot);

  const ghostPool = [];
  let liveGhosts = 0;
  const UNIT_SCALE = { x: 1, y: 1, z: 1 };
  const GHOST_BASE = new Color(0x2b3040);
  const FALLBACK_GHOST = new Color(FALLBACK_TINT);

  /**
   * 一具残影。躯干 / 头 / 两只手就够读出「是个人形」，不复刻配件与腿：
   * 残影是印在空气里的动作，本来就该比本体少一层信息。
   */
  function makeGhost() {
    const mat = new MeshStandardMaterial({
      color: GHOST_BASE.clone(),
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      envMapIntensity: 0.2,
    });
    const g = new Group();
    const add = (geometry, y) => {
      const m = new Mesh(geometry, mat);
      m.position.y = y;
      g.add(m);
      return m;
    };
    add(geo.hips, 0.86);
    add(geo.torso, 1.24);
    add(geo.head, 1.79);
    for (const side of [-1, 1]) {
      const hand = new Mesh(geo.mitt, mat);
      hand.position.set(side * 0.38, 1.02, -0.1);
      hand.scale.set(0.88, 0.74, 1.02);
      g.add(hand);
    }
    g.visible = false;
    g.renderOrder = 2;
    ghostRoot.add(g);
    const rec = { group: g, mat };
    ghostPool.push(rec);
    return rec;
  }

  return {
    root,
    chars,

    get(id) {
      return chars.get(id);
    },

    /** 由 sync 调用：新增/移除角色，更新目标状态。插值与动画在 update 里做。 */
    reconcile(players, localId) {
      const seen = new Set();
      for (const p of players) {
        if (!p || p.id == null) continue;
        seen.add(p.id);
        let c = chars.get(p.id);
        const isLocal = p.id === localId;
        const skinId = p.skinId ?? null;
        // 每帧只比一个字符串：剪影是 skinId 的纯函数（./skins.js），
        // 没变就不必再解析一遍，更不必重建
        if (c && (c.skinId !== skinId || c.isLocal !== isLocal)) {
          // 换皮肤：比例进了 group.scale、配件是真的网格，只能拆掉重搭。
          // 换饱和度档（本地玩家易主）同理 —— 材质是按 isLocal 烘出来的。
          const keep = { pos: c.pos.clone(), prev: c.prev.clone(), yaw: c.yaw, speed: c.speed };
          disposeChar(c);
          chars.delete(p.id);
          c = spawn(p, isLocal);
          c.pos.copy(keep.pos);
          c.prev.copy(keep.prev);
          c.yaw = keep.yaw;
          c.speed = keep.speed;
        } else if (!c) {
          c = spawn(p, isLocal);
        } else if (
          p.activeGloveId !== c.activeGloveId ||
          p.mainId !== c.mainId ||
          p.offhandId !== c.offhandId
        ) {
          // 换掌 / 换槽：只换识别色，不重建整套材质
          applyTints(c, p);
        }
        c.activeSlot = p.activeSlot ?? 0;
        c.target = p;
      }
      for (const [id, c] of chars) {
        if (!seen.has(id)) {
          disposeChar(c);
          chars.delete(id);
        }
      }
    },

    /** 掌击动画：前摇把身体拧回去，出掌时躯干跟着转，收掌有余势。 */
    playSlap(id, power = 1, side = null) {
      const c = chars.get(id);
      if (!c) return;
      c.slapT = 0;
      c.slapPower = Math.max(0.35, Math.min(2, power));
      // 出的是哪只手由激活槽决定；事件带了方向时再按方向修正
      c.slapSide = side ?? (c.activeSlot === 0 ? MAIN_SIDE : -MAIN_SIDE);
    },

    /** 被击中：一帧压扁 + 顺冲击方向的形变，卖出接触感。 */
    playHit(id, dir, power = 1) {
      const c = chars.get(id);
      if (!c) return;
      c.hitT = 0;
      c.hitPower = Math.max(0.3, Math.min(2.4, power));
      c.hitDir = dir ? tmpVec.copy(dir).normalize().clone() : new Vector3(0, 0, 1);
    },

    /**
     * @param {number} dt
     * @param {number} time
     * @param {{x:number,z:number}} [focus] 镜头焦点。给了就按 CULL_DISTANCE 做距离剔除。
     */
    update(dt, time, focus = null) {
      for (const c of chars.values()) {
        const p = c.target;
        if (!p) continue;

        const alive = p.alive !== false;
        // 距离剔除：另一个区里的人不画（见 CULL_DISTANCE）。本地玩家永远画 ——
        // 镜头就架在他身上，第一帧焦点还没跟上时不能把主角剔掉。
        const far =
          !c.isLocal &&
          focus != null &&
          Math.hypot((p.x ?? 0) - focus.x, (p.z ?? 0) - focus.z) > CULL_DISTANCE;
        c.rootGroup.visible = alive && !far;
        if (far) {
          // 不画也要跟位：回到范围内时人要在他该在的地方，不能从上一帧的位置滑过来
          c.pos.set(p.x ?? 0, p.y ?? 0, p.z ?? 0);
          c.prev.copy(c.pos);
          c.rootGroup.position.copy(c.pos);
          c.yaw = p.yaw ?? c.yaw;
          c.rootGroup.rotation.y = c.yaw;
          continue;
        }
        if (!alive) continue;

        // 位置插值：sim 是 60Hz 定步，渲染可能更快，直接跟随会有台阶感
        c.prev.copy(c.pos);
        c.pos.x = damp(c.pos.x, p.x ?? 0, 22, dt);
        c.pos.y = damp(c.pos.y, p.y ?? 0, 24, dt);
        c.pos.z = damp(c.pos.z, p.z ?? 0, 22, dt);
        c.rootGroup.position.copy(c.pos);

        const dx = c.pos.x - c.prev.x;
        const dz = c.pos.z - c.prev.z;
        const inst = Math.hypot(dx, dz) / Math.max(dt, 1e-4);
        c.speed = damp(c.speed, inst, 9, dt);

        c.yaw += shortestAngle(c.yaw, p.yaw ?? 0) * Math.min(1, dt * 16);
        c.rootGroup.rotation.y = c.yaw;

        // 走路：步幅随速度，落地时躯干下沉，惯性让上身滞后
        c.stride += c.speed * dt * 2.1;
        const gait = Math.min(1, c.speed / 7);
        const bob = Math.sin(c.stride * 2) * 0.035 * gait;
        const sway = Math.sin(c.stride) * 0.05 * gait;
        c.breathe += dt * 1.3;

        c.body.position.y = bob + Math.sin(c.breathe) * 0.008;
        c.body.rotation.z = -sway * 0.5;
        // 跑起来上身前倾：朝 -Z 前倾就是负的 rotation.x
        c.body.rotation.x = -gait * 0.11 - Math.sin(c.stride * 2 + 1) * 0.015;

        for (const leg of c.legs) {
          const phase = c.stride + (leg.side > 0 ? Math.PI : 0);
          leg.hip.rotation.x = Math.sin(phase) * 0.62 * gait;
          // 膝盖只能往后弯：朝 -Z 站立时后方是 +Z，也就是负的 rotation.x
          leg.knee.rotation.x = -Math.max(0, -Math.sin(phase - 0.6)) * 0.85 * gait;
        }

        // 出掌曲线：0~0.34 前摇（掌横过胸前蓄到角色左侧），0.34~0.52 加速横抽
        // （左 → 右），之后收掌。两条曲线分工写死：
        //   swing —— 归一进度，唯一驱动横扫角的量（见 sweepYaw）
        //   raise —— 把手臂端到胸高的包络。命中段恒为 1，所以那一段没有纵向行程
        let slapSwing = 0;
        let slapRaise = 0;
        if (c.slapT >= 0) {
          c.slapT += dt / (SLAP_PHASE.duration / c.slapPower);
          const t = c.slapT;
          if (t >= 1) {
            c.slapT = -1;
          } else if (t < SLAP_PHASE.windupEnd) {
            const k = t / SLAP_PHASE.windupEnd;
            slapSwing = -0.9 * smoothstep(0, 1, k);
            // 抬手在前摇的前四分之三就到位，剩下那段是纯粹的横向蓄势：
            // 「抬手」与「横扫」混在一起读出来就是一记上撩
            slapRaise = smoothstep(0, 1, clamp01(k / 0.75));
          } else if (t < SLAP_PHASE.strikeEnd) {
            const k = (t - SLAP_PHASE.windupEnd) / (SLAP_PHASE.strikeEnd - SLAP_PHASE.windupEnd);
            slapSwing = -0.9 + 2.6 * smoothstep(0, 1, k);
            slapRaise = 1;
          } else {
            const k = (t - SLAP_PHASE.strikeEnd) / (1 - SLAP_PHASE.strikeEnd);
            const fall = 1 - smoothstep(0, 1, k);
            slapSwing = 1.7 * fall;
            slapRaise = fall;
          }
        }
        // 拧腰跟着掌走：蓄势时肩线转向左，出掌那下甩回右。与出的是哪只手无关 ——
        // 两只掌扇的都是同一个方向，腰没有理由反着拧。
        c.body.rotation.y = -slapSwing * SLAP_TORSO_YAW;

        for (const arm of c.arms) {
          const phase = c.stride + (arm.side > 0 ? 0 : Math.PI);
          const walk = Math.sin(phase) * 0.5 * gait;
          const isSwingArm = arm.side === c.slapSide;
          // 出掌的那只手横抽，另一只反向小幅平衡；左右手扇的都是「左 → 右」，
          // 换手只换哪条胳膊在抽，不换扫掠方向
          const swing = isSwingArm ? slapSwing : slapSwing * -0.3;
          const raise = isSwingArm ? slapRaise : slapRaise * 0.24;
          const sweep = sweepYaw(swing);
          // 掌心走的是一段浅弧：正前方最高，两端各低几厘米
          const arc = SLAP_ARC_PITCH * (Math.cos(sweep) - 1);
          // 摆臂仍旧是「往 -Z 送」的正 rotation.x；出掌那份俯仰只负责把手端起来
          arm.shoulder.rotation.x = walk + raise * (SLAP_RAISE_PITCH + arc);
          arm.shoulder.rotation.z = arm.side * (0.16 + raise * 0.1);
          // 横扫：命中段的位移全部由这一路给
          arm.shoulder.rotation.y = sweep;
          arm.wrist.rotation.x = 0.28 + Math.abs(walk) * 0.4 - raise * 0.34;
          // 掌面迎着扫掠方向。滚过去的过程慢半拍，收势时掌还在往前带 ——
          // 这一路只转不移（腕的 Y 轴就是手臂长轴），不参与位移
          arm.roll = damp(arm.roll, SLAP_PALM_ROLL * raise, 16, dt);
          arm.wrist.rotation.y = arm.roll;
          // 束带滞后于手：布料二次运动。横扇的时候它往扫掠的反方向甩
          const tassel = arm.glove.userData.tassel;
          tassel.rotation.x = damp(tassel.rotation.x, raise * 0.45 + gait * 0.3, 12, dt);
          tassel.rotation.z = damp(tassel.rotation.z, -arm.side * 0.2 + sweep * 0.6, 10, dt);
        }

        // 受击压扁：只有 3~4 帧，靠形变而不是闪红。
        // 压的是「在皮肤比例之上」的形变，收回去也要收回那份比例，不能归 1。
        const bs = c.baseScale;
        if (c.hitT >= 0) {
          c.hitT += dt / 0.26;
          if (c.hitT >= 1) {
            c.hitT = -1;
            c.body.scale.set(bs.x, bs.y, bs.z);
          } else {
            const k = Math.sin(c.hitT * Math.PI);
            const s = 1 + k * 0.16 * c.hitPower;
            c.body.scale.set(bs.x * s, bs.y * (1 - k * 0.13 * c.hitPower), bs.z * s * 0.94);
            c.body.rotation.x -= k * 0.22 * c.hitPower;
          }
        }

        // 觉醒：手套缝线里的暖光升起来，是「掌意」而不是发光描边。
        // 激活的那只手更亮，于是「现在用的是哪只掌」不用 HUD 也读得出来。
        const awakenTarget = (p.awakenedT ?? 0) > 0 ? 1 : 0;
        c.awaken = damp(c.awaken, awakenTarget, 5, dt);
        const pulse = 0.72 + 0.28 * Math.sin(time * 6.2);
        const activeMain = c.activeSlot === 0;
        c.mats.seamMain.emissiveIntensity = c.awaken * (activeMain ? 2.6 : 0.5) * pulse;
        c.mats.seamOff.emissiveIntensity = c.awaken * (activeMain ? 0.5 : 2.6) * pulse;
        // 识别色漆在觉醒时透一点暖 —— 上场的是合并后的 paintSurface，
        // paint 那一份只剩下「背布片的颜色」这个身份，所以两边都写
        c.mats.paint.emissive.setHex(PALETTE.crackCore);
        c.mats.paint.emissiveIntensity = c.awaken * 0.35 * pulse;
        c.mats.paintSurface.emissive.setHex(PALETTE.crackCore);
        c.mats.paintSurface.emissiveIntensity = c.awaken * 0.35 * pulse;

        // 重组无敌：不闪烁，改用「还没完全凝实」的半透
        const invuln = (p.invulnT ?? 0) > 0;
        const ghost = invuln ? 0.55 + 0.2 * Math.sin(time * 9) : 1;
        // 真正上场的是并完的 clothSurface / leatherSurface（高档 clothSurface 是 null，
        // 布与暗布各画各的），两边都写：材质表怎么并，半透都得跟着走
        for (const key of GHOSTABLE) {
          const m = c.mats[key];
          if (!m) continue;
          const wantTransparent = ghost < 0.999;
          if (m.transparent !== wantTransparent) {
            m.transparent = wantTransparent;
            m.needsUpdate = true;
          }
          m.opacity = ghost;
        }

        // 接地阴影跟着离地高度衰减
        const h = Math.max(0, c.pos.y);
        c.contact.position.y = 0.02 - c.pos.y;
        const fade = 1 - Math.min(1, h / 3.2);
        c.contact.material.opacity = 0.34 * fade * fade * ghost;
        c.contact.scale.setScalar(c.contactScale * (1 + h * 0.22));
        c.contact.visible = c.pos.y > -1.5 && fade > 0.02;
      }
    },

    // ------------------------------------------------------------ 分身残影

    ghostRoot,
    get ghostCount() {
      return liveGhosts;
    },

    /**
     * 画 `view.combat.ghosts`。
     *
     * 残影是「动作历史」，不是发光的复制人：同一副剪影、同一个体量，只是半透、
     * 去饱和、边缘随寿命散开。yaw 已经由 sim 转进 -Z 空间（combat-bridge 的
     * ghostsView 扣掉了 combat 的朝向偏移），所以这里直接给 rotation.y。
     *
     * @param {Array<{ownerId?:string,x:number,y:number,z:number,yaw:number,
     *                ttl:number,ttl0?:number,fake?:boolean}>} list
     */
    syncGhosts(list) {
      const arr = Array.isArray(list) ? list : [];
      let n = 0;
      for (const gh of arr) {
        if (!gh || typeof gh !== 'object') continue;
        if (n >= GHOST_CAP) break;
        const rec = ghostPool[n] ?? makeGhost();
        n++;

        const owner = gh.ownerId != null ? chars.get(gh.ownerId) : null;
        const ttl = Number.isFinite(gh.ttl) ? gh.ttl : 0;
        const ttl0 = Number.isFinite(gh.ttl0) && gh.ttl0 > 0 ? gh.ttl0 : Math.max(ttl, 1e-3);
        const k = clamp01(ttl / ttl0); // 1 = 刚剥离，0 = 散尽

        rec.group.visible = true;
        rec.group.position.set(gh.x ?? 0, gh.y ?? 0, gh.z ?? 0);
        rec.group.rotation.y = gh.yaw ?? 0;
        const b = owner?.baseScale ?? UNIT_SCALE;
        // 越淡越松：散开的过程里整体轻微涨大，读起来是「化掉」不是「关掉」
        const spread = 1 + (1 - k) * 0.07;
        rec.group.scale.set(b.x * spread, b.y * spread, b.z * spread);

        const tint = owner ? owner.mats.paint.color : FALLBACK_GHOST;
        rec.mat.color.copy(GHOST_BASE).lerp(tint, 0.28);
        // 假掌（会假挥的诱饵）比纯残影实一点：真假之间要留得出破绽
        rec.mat.opacity = (gh.fake ? 0.46 : 0.3) * k * (0.5 + 0.5 * k);
      }
      for (let i = n; i < ghostPool.length; i++) ghostPool[i].group.visible = false;
      liveGhosts = n;
      ghostRoot.visible = n > 0;
      return n;
    },

    dispose() {
      for (const c of chars.values()) disposeChar(c);
      chars.clear();
      for (const g of ghostPool) g.mat.dispose();
      ghostPool.length = 0;
      liveGhosts = 0;
      scene.remove(root);
      for (const g of shared) g.dispose?.();
      contactMat.dispose();
    },
  };
}
