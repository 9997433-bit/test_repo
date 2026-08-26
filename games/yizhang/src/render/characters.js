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

import {
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { FALLBACK_TINT, PALETTE } from './config.js';
import { smoothstep } from './noise.js';

const BLOOM_LAYER = 1;
const TAU = Math.PI * 2;
/** 右手（side=+1）拿主掌 slot 0，左手拿副掌 slot 1。 */
const MAIN_SIDE = 1;

function shortestAngle(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** 非本地角色降饱和：全画面只保留一个饱和度峰值（手册 §5.11）。 */
function identColor(tint, isLocal) {
  const c = new Color(Number.isFinite(tint) ? tint : FALLBACK_TINT);
  if (isLocal) return c;
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return c.setHSL(hsl.h, hsl.s * 0.45, hsl.l * 0.92);
}

export function createCharacters({ scene, quality, textures }) {
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
  };

  // 接地阴影：低画质关了实时阴影后，角色仍然要「踩在地上」而不是浮着
  const contactMat = keep(
    new MeshBasicMaterial({ color: 0x0d1017, transparent: true, opacity: 0.32, depthWrite: false })
  );

  function makePaint(ident) {
    // 识别色是「染过的粗布」，不是「喷了漆的塑料板」。给它布的织纹与法线、
    // 把粗糙度推到接近全漫反射，否则背板会在跟随镜头里烧成一张白纸。
    return new MeshStandardMaterial({
      color: ident,
      map: textures.cloth.albedo,
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

  function buildMaterials(tints, isLocal) {
    const ident = identColor(tints.active, isLocal);
    const identMain = identColor(tints.main, isLocal);
    const identOff = identColor(tints.off, isLocal);

    const clothOpts = {
      // 只借一点识别色的色相，明度仍然由布本身决定，否则浅色手套会把整身衣服洗白
      color: new Color(PALETTE.cloth).lerp(ident, 0.12),
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
      color: new Color(PALETTE.clothDim),
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

    return {
      cloth,
      clothDim,
      leather,
      leatherWorn,
      metal,
      skin,
      paint: makePaint(ident),
      paintMain: makePaint(identMain),
      paintOff: makePaint(identOff),
      seamMain: makeSeam(),
      seamOff: makeSeam(),
      ident,
    };
  }

  /** side: +1 右手（主掌），-1 左手（副掌）。掌心与指节朝 -Z（正前方）。 */
  function buildGlove(mats, side, stripeMat, seamMat) {
    const g = new Group();
    const mitt = new Mesh(geo.mitt, mats.leather);
    mitt.scale.set(1.0, 0.86, 1.16);
    mitt.castShadow = quality.shadows;
    g.add(mitt);

    // 掌心一侧用磨得更亮的皮：抓握的地方才会包浆
    const palm = new Mesh(geo.mitt, mats.leatherWorn);
    palm.scale.set(0.86, 0.6, 0.9);
    palm.position.set(0, -0.13, -0.06);
    g.add(palm);

    const knuckle = new Mesh(geo.knuckle, mats.metal);
    knuckle.rotation.set(Math.PI * 0.5, Math.PI, Math.PI * 0.02);
    knuckle.position.set(0, 0.02, -0.06);
    knuckle.castShadow = quality.shadows;
    g.add(knuckle);

    for (let i = 0; i < 3; i++) {
      const stud = new Mesh(geo.stud, mats.metal);
      const a = -0.5 + i * 0.5;
      stud.position.set(Math.sin(a) * 0.28, 0.16, -Math.cos(a) * 0.26);
      stud.rotation.y = -a;
      g.add(stud);
    }

    // 识别色只出现在这一道漆条上：右手主掌色、左手副掌色
    const stripe = new Mesh(geo.stud, stripeMat);
    stripe.scale.set(3.4, 0.55, 1.2);
    stripe.position.set(0, 0.07, 0.24);
    g.add(stripe);

    const cuff = new Mesh(geo.cuff, mats.cloth);
    cuff.position.set(0, 0.3, 0.02);
    cuff.rotation.x = -0.15;
    cuff.castShadow = quality.shadows;
    g.add(cuff);

    // 垂下来的束带：受重力，说明配饰有重量
    const tassel = new Mesh(geo.tassel, mats.clothDim);
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

  function buildBody(tints, isLocal) {
    const mats = buildMaterials(tints, isLocal);
    const rootGroup = new Group();

    const body = new Group();
    rootGroup.add(body);

    const hips = new Mesh(geo.hips, mats.clothDim);
    hips.position.y = 0.86;
    hips.castShadow = quality.shadows;
    body.add(hips);

    const torso = new Mesh(geo.torso, mats.cloth);
    torso.position.y = 1.24;
    torso.castShadow = quality.shadows;
    torso.receiveShadow = quality.shadows;
    body.add(torso);

    // 胸前皮带把布压出褶：配饰要压变下面的织物
    const strap = new Mesh(geo.strapChest, mats.leather);
    strap.position.set(0.06, 1.26, -0.27);
    strap.rotation.z = -0.24;
    body.add(strap);
    const buckle = new Mesh(geo.buckle, mats.metal);
    buckle.position.set(0.12, 1.06, -0.3);
    body.add(buckle);

    const collar = new Mesh(geo.collar, mats.clothDim);
    collar.position.y = 1.58;
    body.add(collar);

    // 背上的掌印布片：跟随镜头看到的是后背，识别色必须在这里能读到。
    // 先垫一块更大的暗色底布再压识别色，边上就留出一圈缝线般的暗边 ——
    // 少了这一圈，纯色方块会像一张贴在背上的白纸。
    const backing = new Mesh(geo.backPanel, mats.clothDim);
    backing.position.set(0, 1.26, 0.305);
    backing.rotation.x = -0.06;
    backing.scale.set(1.22, 1.16, 0.6);
    body.add(backing);

    const backPanel = new Mesh(geo.backPanel, mats.paint);
    backPanel.position.set(0, 1.26, 0.315);
    backPanel.rotation.x = -0.06;
    backPanel.castShadow = quality.shadows;
    body.add(backPanel);

    const head = new Mesh(geo.head, mats.skin);
    head.position.y = 1.79;
    head.castShadow = quality.shadows;
    body.add(head);

    const hood = new Mesh(geo.hood, mats.cloth);
    hood.position.y = 1.8;
    hood.rotation.x = 0.16;
    hood.castShadow = quality.shadows;
    body.add(hood);

    const legs = [];
    for (const side of [-1, 1]) {
      const hip = new Group();
      hip.position.set(side * 0.16, 0.84, 0);
      body.add(hip);
      const thigh = new Mesh(geo.thigh, mats.clothDim);
      thigh.position.y = -0.24;
      thigh.castShadow = quality.shadows;
      hip.add(thigh);
      const knee = new Group();
      knee.position.y = -0.46;
      hip.add(knee);
      const shin = new Mesh(geo.shin, mats.clothDim);
      shin.position.y = -0.2;
      shin.castShadow = quality.shadows;
      knee.add(shin);
      const foot = new Mesh(geo.foot, mats.leather);
      foot.position.set(0, -0.38, -0.06);
      knee.add(foot);
      legs.push({ hip, knee, side });
    }

    const arms = [];
    for (const side of [-1, 1]) {
      const isMain = side === MAIN_SIDE;
      const shoulder = new Group();
      shoulder.position.set(side * 0.33, 1.46, 0);
      body.add(shoulder);
      const upper = new Mesh(geo.upperArm, mats.cloth);
      upper.position.y = -0.2;
      upper.castShadow = quality.shadows;
      shoulder.add(upper);
      const wrist = new Group();
      wrist.position.y = -0.46;
      shoulder.add(wrist);
      const glove = buildGlove(
        mats,
        side,
        isMain ? mats.paintMain : mats.paintOff,
        isMain ? mats.seamMain : mats.seamOff
      );
      glove.position.y = -0.22;
      wrist.add(glove);
      arms.push({ shoulder, wrist, glove, side, slot: isMain ? 0 : 1 });
    }

    const contact = new Mesh(geo.contact, contactMat.clone());
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.02;
    contact.renderOrder = 1;
    rootGroup.add(contact);

    return { rootGroup, body, mats, legs, arms, head, hood, torso, contact };
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
    c.mats.cloth.color.copy(new Color(PALETTE.cloth)).lerp(ident, 0.12);
    c.activeGloveId = p.activeGloveId;
    c.mainId = p.mainId;
    c.offhandId = p.offhandId;
  }

  function spawn(player, isLocal) {
    const built = buildBody(tintsOf(player), isLocal);
    root.add(built.rootGroup);
    const c = {
      id: player.id,
      ...built,
      isLocal,
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
    c.contact.material.dispose();
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
        if (!c) {
          c = spawn(p, p.id === localId);
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

    update(dt, time) {
      for (const c of chars.values()) {
        const p = c.target;
        if (!p) continue;

        const alive = p.alive !== false;
        c.rootGroup.visible = alive;
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

        // 出掌曲线：0~0.34 前摇（反向蓄），0.34~0.52 加速扫，之后收掌
        let slapSwing = 0;
        let slapTorso = 0;
        if (c.slapT >= 0) {
          c.slapT += dt / (0.62 / c.slapPower);
          const t = c.slapT;
          if (t >= 1) {
            c.slapT = -1;
          } else if (t < 0.34) {
            const k = t / 0.34;
            slapSwing = -0.9 * smoothstep(0, 1, k);
            slapTorso = -0.34 * smoothstep(0, 1, k);
          } else if (t < 0.52) {
            const k = (t - 0.34) / 0.18;
            slapSwing = -0.9 + 2.6 * smoothstep(0, 1, k);
            slapTorso = -0.34 + 0.72 * smoothstep(0, 1, k);
          } else {
            const k = (t - 0.52) / 0.48;
            slapSwing = 1.7 * (1 - smoothstep(0, 1, k));
            slapTorso = 0.38 * (1 - smoothstep(0, 1, k));
          }
        }
        c.body.rotation.y = slapTorso * c.slapSide;

        for (const arm of c.arms) {
          const phase = c.stride + (arm.side > 0 ? 0 : Math.PI);
          const walk = Math.sin(phase) * 0.5 * gait;
          const isSwingArm = arm.side === c.slapSide;
          const swing = isSwingArm ? slapSwing : slapSwing * -0.22;
          // 摆臂与挥掌都是「往 -Z 送」，所以是正的 rotation.x
          arm.shoulder.rotation.x = walk + swing * 0.55;
          arm.shoulder.rotation.z = arm.side * (0.16 + Math.abs(swing) * 0.42);
          arm.shoulder.rotation.y = arm.side * swing * 0.9;
          arm.wrist.rotation.x = 0.28 + Math.abs(walk) * 0.4 - swing * 0.5;
          // 束带滞后于手：布料二次运动
          const tassel = arm.glove.userData.tassel;
          tassel.rotation.x = damp(tassel.rotation.x, swing * 0.8 + gait * 0.3, 12, dt);
          tassel.rotation.z = damp(tassel.rotation.z, -arm.side * 0.2 - swing * 0.3, 10, dt);
        }

        // 受击压扁：只有 3~4 帧，靠形变而不是闪红
        if (c.hitT >= 0) {
          c.hitT += dt / 0.26;
          if (c.hitT >= 1) {
            c.hitT = -1;
            c.body.scale.set(1, 1, 1);
          } else {
            const k = Math.sin(c.hitT * Math.PI);
            const s = 1 + k * 0.16 * c.hitPower;
            c.body.scale.set(s, 1 - k * 0.13 * c.hitPower, s * 0.94);
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
        c.mats.paint.emissive.setHex(PALETTE.crackCore);
        c.mats.paint.emissiveIntensity = c.awaken * 0.35 * pulse;

        // 重组无敌：不闪烁，改用「还没完全凝实」的半透
        const invuln = (p.invulnT ?? 0) > 0;
        const ghost = invuln ? 0.55 + 0.2 * Math.sin(time * 9) : 1;
        for (const key of ['cloth', 'clothDim', 'leather', 'leatherWorn', 'skin']) {
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
        c.contact.scale.setScalar(1 + h * 0.22);
        c.contact.visible = c.pos.y > -1.5 && fade > 0.02;
      }
    },

    dispose() {
      for (const c of chars.values()) disposeChar(c);
      chars.clear();
      scene.remove(root);
      for (const g of shared) g.dispose?.();
      contactMat.dispose();
    },
  };
}
