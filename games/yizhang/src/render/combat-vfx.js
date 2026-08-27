// 战斗特效 · 八掌各一套。
//
// 大厅里每座台座已经有一种认得出的 idle 特效（./hub-vfx.js）。打起来的时候不能又退回
// 「一套通用激波」—— 那等于告诉玩家八只掌其实是同一只。所以这里给每只掌一套**押韵但
// 不复制**的战斗特效：台座上是「这只掌平时在干什么」，打出去是「这只掌打人时发生什么」。
//
//   木棉 cotton    fanwake 絮扇  —— 一整片被掌风推开的软扇面，走后飘着绒絮（台座是缓升的棉絮）
//   磐石 granite   slab    岩楔  —— 一记向前砸出的方楔，落点崩石屑（台座是悬滞的岩屑）
//   疾风 gale      gust    风刃  —— 贴地窜出去的一条薄风刃（台座是绕座的贴地风环）
//   冰霜 frost     rime    霜弧  —— 齐膝铺开的宽霜弧，弧上长出霜针（台座是垂雾与枝晶）
//   弹簧 spring    recoil  簧弹  —— 一涨一缩的双环，弹开的那下把灰掀起来（台座是簧圈蓄放）
//   分身 afterimage phase  错位  —— 两片错开滑走的薄剪影，几乎无声（台座是慢残影）
//   磁掌 magnet    flux    磁弧  —— 向掌心收束的弧线，铁屑被拽进去（台座是铁屑场纹）
//   陨掌 meteor    cinder  陨坑  —— 从上砸下来的一根柱，余烬上升灰下落（台座是碎岩伴星）
//
// 纪律（手册 §10 / ART §13.4 同源）：
//   · 没有一套是「一个纯色球」：形体全部靠噪声撕开，掠射角才显形，中间是空的
//   · 只有余烬用 AdditiveBlending（它真的是热的），其余一律 NormalBlending
//   · 识别色只做点缀：形体混入 ~30%，粒子里不到两成着色，其余走尘 / 岩 / 霜的本色
//   · 低档不靠辉光也读得出：低档砍的是数量与层数，不是「形」——形一直在

import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  RingGeometry,
  ShaderMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import { FALLBACK_TINT, PALETTE } from './config.js';
import { mulberry32 } from './noise.js';
import { emitParticle, flushParticles, makeParticleSystem, swapRemove } from './particles.js';

const BLOOM_LAYER = 1;
const TAU = Math.PI * 2;
const HALF_PI = Math.PI / 2;

/**
 * 掌 id → 战斗特效种类。八只掌各一种，不许共用。
 * 键与 `src/data/gloves.js` 的 GLOVES[].id 一一对应。
 */
export const COMBAT_VFX_KIND = Object.freeze({
  cotton: 'fanwake',
  granite: 'slab',
  gale: 'gust',
  frost: 'rime',
  spring: 'recoil',
  afterimage: 'phase',
  magnet: 'flux',
  meteor: 'cinder',
});

/**
 * 主动技 id → 战斗特效种类（`src/data/skills.js` 的键）。
 * 技能与扇击同源不同量：同一套形，放大、加长、多一层。木棉没有主动技，所以只有七条。
 */
export const SKILL_VFX_KIND = Object.freeze({
  quake_slam: 'slab',
  wind_rush: 'gust',
  frost_arc: 'rime',
  coil_counter: 'recoil',
  phantom_swap: 'phase',
  iron_pull: 'flux',
  sky_fall: 'cinder',
});

/** 认不出的掌（替身掌表 / 以后新增的掌）退回絮扇：至少还是「一片被推开的空气」。 */
export function combatVfxKind(gloveId) {
  return COMBAT_VFX_KIND[gloveId] ?? 'fanwake';
}

/** 技能优先按 skillId 分派，认不出再退回持掌。 */
export function skillVfxKind(skillId, gloveId) {
  return SKILL_VFX_KIND[skillId] ?? combatVfxKind(gloveId);
}

// ---------------------------------------------------------------- 着色器

const SHEET_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 扇面 / 弧片：uv 是平面投影，所以半径与角度在片元里自己算。
// 环带靠噪声撕出缺口 —— 一片完整不透的扇形就是「贴纸」，正是要避开的东西。
const SHEET_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uColorLit;
  uniform vec3 uColorDark;
  uniform float uLife;
  uniform float uOpacity;
  uniform float uTear;
  uniform float uFlow;
  uniform float uInner;
  varying vec2 vUv;
  void main() {
    vec2 d = vUv - 0.5;
    float r = length(d) * 2.0;
    float ang = atan(d.y, d.x);
    // 内外沿都渐隐：中间那圈才是「被推开的空气」，边界不许有硬线
    float band = smoothstep(uInner, uInner + 0.24, r) * (1.0 - smoothstep(0.78, 1.0, r));
    float n = texture2D(uNoise, vec2(ang * 0.16 + uLife * uFlow, r * 0.9 - uLife * 0.3)).r;
    float n2 = texture2D(uNoise, vec2(ang * 0.42 - uLife * uFlow * 0.6, r * 2.3)).r;
    float turb = n * 0.65 + n2 * 0.35;
    float tear = smoothstep(uTear, uTear + 0.3, turb);
    float fade = (1.0 - uLife) * (1.0 - uLife);
    float a = band * tear * fade * uOpacity * (0.4 + turb * 1.0);
    if (a < 0.005) discard;
    vec3 col = mix(uColorDark, uColorLit, clamp(turb * 1.35 - uLife * 0.35, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

// 环 / 柱 / 楔：uv.x 沿着扫掠方向，uv.y 横跨截面。uSweep > 0 时形体是「被一阵掠过」，
// 整条同时亮起来会读成一根发光管。
const BAND_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uColorLit;
  uniform vec3 uColorDark;
  uniform float uLife;
  uniform float uOpacity;
  uniform float uTear;
  uniform float uFlow;
  uniform float uSweep;
  varying vec2 vUv;
  void main() {
    float across = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.84, 1.0, vUv.y));
    float n = texture2D(uNoise, vec2(vUv.x * 1.6 - uLife * uFlow, vUv.y * 1.2 + uLife * 0.2)).r;
    float n2 = texture2D(uNoise, vec2(vUv.x * 4.2 + uLife * 0.3, vUv.y * 2.6)).r;
    float turb = n * 0.62 + n2 * 0.38;
    float head = uLife * 1.35 - 0.15;
    float sweep = mix(1.0, smoothstep(head - 0.5, head, vUv.x) * (1.0 - smoothstep(head, head + 0.55, vUv.x)), uSweep);
    float tear = smoothstep(uTear, uTear + 0.3, turb);
    float fade = (1.0 - uLife) * (1.0 - uLife);
    float a = across * sweep * tear * fade * uOpacity * (0.4 + turb * 1.0);
    if (a < 0.005) discard;
    vec3 col = mix(uColorDark, uColorLit, clamp(turb * 1.3 - uLife * 0.3, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 识别色只做点缀：往场景本色里兑一点，绝不整片染成掌色。 */
function accentOf(base, tint, amount) {
  return base.clone().lerp(tint, amount);
}

/**
 * @param {object} o
 * @param {import('three').Object3D} o.scene
 * @param {object} o.quality
 * @param {object} o.textures
 * @param {number} [o.seed]
 */
export function createCombatVfx({ scene, quality, textures, seed = 90210 }) {
  const rand = mulberry32(seed + 4409);
  const low = quality.name === 'low';
  const mid = quality.name === 'mid';
  const rate = low ? 0.4 : mid ? 0.72 : 1;

  const group = new Group();
  group.name = 'combat-vfx';
  scene.add(group);

  // ---------------------------------------------------------- 粒子与碎块

  const soft = makeParticleSystem({
    scene: group,
    budget: Math.max(64, Math.round(quality.dustBudget * 0.4)),
    texture: textures?.dust ?? null,
    blending: NormalBlending,
    depthWrite: false,
    renderOrder: 3,
  });

  const sparks = makeParticleSystem({
    scene: group,
    budget: Math.max(16, Math.round(quality.emberBudget * 0.45)),
    texture: textures?.ember ?? null,
    blending: AdditiveBlending,
    depthWrite: false,
    renderOrder: 4,
  });
  if (quality.bloom) {
    // 低档整条辉光支链不建，那就别把余烬塞进那一层
    sparks.points.layers.enable(BLOOM_LAYER);
    sparks.points.userData.bloomSelf = true;
  }

  const softGrav = new Float32Array(soft.budget);
  const sparkGrav = new Float32Array(sparks.budget);

  function emitSoft(x, y, z, o) {
    const i = emitParticle(soft, x, y, z, o, rand);
    if (i >= 0) softGrav[i] = o.gravity ?? -1.1;
    return i;
  }

  function emitSpark(x, y, z, o) {
    const i = emitParticle(sparks, x, y, z, o, rand);
    if (i >= 0) sparkGrav[i] = o.gravity ?? -2.2;
    return i;
  }

  function stepPool(ps, grav, dt, cool) {
    const a = ps.arrays;
    for (let i = ps.count - 1; i >= 0; i--) {
      ps.life[i] += dt;
      const t = ps.life[i] / ps.maxLife[i];
      if (t >= 1) {
        const last = ps.count - 1;
        if (i !== last) grav[i] = grav[last];
        swapRemove(ps, i);
        continue;
      }
      const dragK = Math.exp(-ps.drag[i] * dt);
      ps.vel[i * 3] *= dragK;
      ps.vel[i * 3 + 2] *= dragK;
      ps.vel[i * 3 + 1] = ps.vel[i * 3 + 1] * dragK + grav[i] * dt;
      a.pos[i * 3] += ps.vel[i * 3] * dt;
      a.pos[i * 3 + 1] += ps.vel[i * 3 + 1] * dt;
      a.pos[i * 3 + 2] += ps.vel[i * 3 + 2] * dt;
      if (!cool && a.pos[i * 3 + 1] < 0.04 && ps.vel[i * 3 + 1] < 0) {
        // 落地不是消失，是贴地摊开
        a.pos[i * 3 + 1] = 0.04;
        ps.vel[i * 3 + 1] = 0;
        ps.vel[i * 3] *= 0.84;
        ps.vel[i * 3 + 2] *= 0.84;
      }
      a.rot[i] += ps.spin[i] * dt;
      a.size[i] = ps.baseSize[i] + ps.grow[i] * t;
      if (cool) {
        const c = cool(t);
        a.color[i * 3] = c.r;
        a.color[i * 3 + 1] = c.g;
        a.color[i * 3 + 2] = c.b;
        a.alpha[i] = ps.baseAlpha[i] * (1 - t * t);
      } else {
        const fadeIn = Math.min(1, t / 0.1);
        a.alpha[i] = ps.baseAlpha[i] * fadeIn * (1 - t) * (1 - t * 0.35);
      }
    }
    flushParticles(ps);
  }

  // 碎块：石屑 / 铁屑 / 霜针共用一份实例网格，靠**运动与比例**区分而不是各开一份几何。
  const bitsBudget = low ? 14 : mid ? 30 : 52;
  const bitGeo = new IcosahedronGeometry(0.075, 0);
  const bitMat = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.94,
    metalness: 0.05,
    flatShading: true,
    envMapIntensity: 0.25,
    vertexColors: false,
  });
  const bitsMesh = new InstancedMesh(bitGeo, bitMat, bitsBudget);
  bitsMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  bitsMesh.castShadow = quality.shadows;
  bitsMesh.frustumCulled = false;
  bitsMesh.count = 0;
  group.add(bitsMesh);
  const bits = [];
  const dummy = new Object3D();
  const tmpColor = new Color();

  function spawnBit(o) {
    if (bits.length >= bitsBudget) return null;
    const b = {
      p: new Vector3(o.x, o.y, o.z),
      v: new Vector3(o.vx ?? 0, o.vy ?? 0, o.vz ?? 0),
      target: o.target ? o.target.clone() : null,
      rot: new Vector3(rand() * TAU, rand() * TAU, rand() * TAU),
      spin: new Vector3((rand() - 0.5) * 8, (rand() - 0.5) * 8, (rand() - 0.5) * 8),
      sx: o.sx ?? 1,
      sy: o.sy ?? 1,
      mode: o.mode ?? 'scatter',
      life: 0,
      maxLife: o.life ?? 1.4,
      color: (o.color ?? tmpColor.set(PALETTE.rockBody)).clone(),
    };
    bits.push(b);
    return b;
  }

  function stepBits(dt) {
    if (bits.length === 0) {
      if (bitsMesh.count !== 0) {
        bitsMesh.count = 0;
        bitsMesh.visible = false;
      }
      return;
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.life += dt;
      if (b.life >= b.maxLife) {
        bits.splice(i, 1);
        continue;
      }
      if (b.mode === 'converge' && b.target) {
        // 被拽进去的铁屑：越近越快，末段几乎是直线扑进掌心
        const k = Math.min(1, dt * 7.5);
        b.p.lerp(b.target, k);
        b.spin.multiplyScalar(1 + dt * 2);
      } else if (b.mode === 'rise') {
        // 霜针：从台面长出来，长完就停在那儿慢慢化掉
        b.p.y += b.v.y * dt;
        b.v.y *= Math.exp(-6 * dt);
      } else {
        b.v.y -= 20 * dt;
        b.p.addScaledVector(b.v, dt);
        if (b.p.y < 0.06) {
          b.p.y = 0.06;
          b.v.y *= -0.3;
          b.v.x *= 0.6;
          b.v.z *= 0.6;
          b.spin.multiplyScalar(0.5);
        }
        b.rot.x += b.spin.x * dt;
        b.rot.y += b.spin.y * dt;
        b.rot.z += b.spin.z * dt;
      }
    }
    const n = Math.min(bits.length, bitsBudget);
    for (let i = 0; i < n; i++) {
      const b = bits[i];
      const t = b.life / b.maxLife;
      const fade = 1 - Math.max(0, (t - 0.62) / 0.38);
      const grow = b.mode === 'rise' ? Math.min(1, t / 0.22) : 1;
      dummy.position.copy(b.p);
      dummy.rotation.set(b.rot.x, b.rot.y, b.rot.z);
      dummy.scale.set(b.sx * fade, b.sy * fade * grow, b.sx * fade);
      dummy.updateMatrix();
      bitsMesh.setMatrixAt(i, dummy.matrix);
      bitsMesh.setColorAt(i, b.color);
    }
    bitsMesh.count = n;
    bitsMesh.visible = n > 0;
    bitsMesh.instanceMatrix.needsUpdate = true;
    if (bitsMesh.instanceColor) bitsMesh.instanceColor.needsUpdate = true;
  }

  // ---------------------------------------------------------------- 形体池

  const sheetGeo = {
    fanwake: new RingGeometry(0.22, 1, 22, 1, -1.15, 2.3),
    gust: new RingGeometry(0.62, 1, 26, 1, -0.36, 0.72),
    rime: new RingGeometry(0.4, 1, 30, 1, -1.65, 3.3),
    phase: new RingGeometry(0.55, 1, 18, 1, -0.85, 1.7),
  };
  const bandGeo = {
    // 楔：钝头朝前（+Y 那端半径大），砸出去像一块方料而不是一根钉子
    slab: new CylinderGeometry(0.9, 0.06, 1.05, 4, 1, true),
    recoil: new TorusGeometry(0.72, 0.055, 4, 26),
    flux: new TorusGeometry(0.92, 0.04, 3, 30, Math.PI * 1.45),
    cinder: new ConeGeometry(0.6, 1.6, 10, 1, true),
  };
  const allGeo = [...Object.values(sheetGeo), ...Object.values(bandGeo)];

  const poolSize = low ? 3 : mid ? 5 : 7;
  const defaultGeo = sheetGeo.fanwake;

  function makeShell(frag) {
    const mat = new ShaderMaterial({
      vertexShader: SHEET_VERT,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: NormalBlending,
      uniforms: {
        uNoise: { value: textures?.turbulence ?? null },
        uColorLit: { value: new Color(PALETTE.rockTop) },
        uColorDark: { value: new Color(PALETTE.fog) },
        uLife: { value: 0 },
        uOpacity: { value: 0.6 },
        uTear: { value: 0.24 },
        uFlow: { value: 0.5 },
        uInner: { value: 0.2 },
        uSweep: { value: 0 },
      },
    });
    // holder（跟着落点与朝向）→ orient（每种掌固定的姿态）→ mesh（逐帧的缩放与位移）
    const holder = new Group();
    const orient = new Group();
    // YXZ：先绕 Z 滚（选弧段 / 转方料），再绕 X 放平，最后绕 Y 对准出掌方向。
    // 用默认的 XYZ 序会让「放平」发生在「对准」之后，扇面就会立起来朝天。
    orient.rotation.order = 'YXZ';
    const mesh = new Mesh(defaultGeo, mat);
    orient.add(mesh);
    holder.add(orient);
    holder.visible = false;
    holder.renderOrder = 2;
    group.add(holder);
    return { holder, orient, mesh, mat, t: -1, dur: 0.3, spec: null, power: 1, phase: 0 };
  }

  const sheets = Array.from({ length: poolSize }, () => {
    const rec = makeShell(SHEET_FRAG);
    rec.family = 'sheet';
    return rec;
  });
  const bands = Array.from({ length: poolSize }, () => {
    const rec = makeShell(BAND_FRAG);
    rec.family = 'band';
    return rec;
  });

  // ---------------------------------------------------------------- 配方表

  const dustDark = new Color(PALETTE.grime).lerp(new Color(PALETTE.rockBody), 0.45);
  const dustLit = new Color(PALETTE.rockTop).lerp(new Color(PALETTE.keyLight), 0.25);
  const rockColor = new Color(PALETTE.rockBody);
  const emberHot = new Color(0xfff0cf);
  const emberCool = new Color(PALETTE.crackDeep);
  const coolCurve = (t) => tmpColor.copy(emberHot).lerp(emberCool, Math.min(1, t * 1.5));
  const scratch = new Color();

  function softColor(tint, amount) {
    return scratch.copy(dustDark).lerp(dustLit, 0.25 + rand() * 0.6).lerp(tint, amount);
  }

  /**
   * 一次扇击 / 技能放多少粒子。低档砍量不砍形：形体一直在，只是身边的碎屑少一半。
   */
  function budget(n, power) {
    return Math.max(1, Math.round(n * rate * clamp(power, 0.4, 2)));
  }

  /**
   * 八套配方。每一条只描述三件事：形体怎么摆、怎么动、身边掉什么。
   *
   * ctx = { at:Vector3, dir:Vector3(水平单位), tint:Color, power:number, skill:boolean }
   */
  const SPEC = {
    /** 木棉：一整片被推开的软扇面，走后飘着绒絮。 */
    fanwake: {
      family: 'sheet',
      geo: 'fanwake',
      dur: 0.44,
      shells: 1,
      uniforms: { uTear: 0.16, uFlow: 0.35, uInner: 0.2, uOpacity: 0.44 },
      color: (tint) => ({
        lit: accentOf(new Color(0xfff2dd), tint, 0.3),
        dark: accentOf(new Color(PALETTE.fog), tint, 0.15),
      }),
      pose(rec) {
        // 略微前倾的横扇：从人身后看过去是一整片扫过去的面，不是一条线
        rec.orient.rotation.set(-HALF_PI + 0.34, HALF_PI, 0);
      },
      animate(rec, t, p) {
        const e = 1 - Math.pow(1 - t, 2.2);
        const k = (0.72 + e * 1.15) * p;
        rec.mesh.scale.set(k, k, k);
        rec.holder.position.y = rec.baseY + e * 0.24;
        rec.orient.rotation.z = -0.28 + e * 0.5;
      },
      burst(ctx) {
        // 棉絮：大、软、几乎不落，被掌风带出去一段就慢慢化开
        for (let i = 0; i < budget(7, ctx.power); i++) {
          const a = (rand() - 0.5) * 1.9;
          const s = Math.sin(a);
          const c = Math.cos(a);
          const dx = ctx.dir.x * c - ctx.dir.z * s;
          const dz = ctx.dir.x * s + ctx.dir.z * c;
          emitSoft(ctx.at.x + dx * 0.5, ctx.at.y + (rand() - 0.4) * 0.4, ctx.at.z + dz * 0.5, {
            vx: dx * (1 + rand()),
            vy: 0.25 + rand() * 0.4,
            vz: dz * (1 + rand()),
            life: 1.5 + rand() * 1.4,
            spin: (rand() - 0.5) * 0.6,
            grow: 0.9 + rand() * 0.7,
            drag: 1.6,
            size: 0.24 + rand() * 0.24,
            alpha: 0.18 + rand() * 0.14,
            gravity: 0.04,
            color: i % 5 === 0 ? scratch.copy(ctx.tint) : softColor(ctx.tint, 0.05),
          });
        }
      },
    },

    /** 磐石：一记向前砸出的方楔，落点崩石屑。 */
    slab: {
      family: 'band',
      geo: 'slab',
      dur: 0.32,
      shells: 1,
      uniforms: { uTear: 0.3, uFlow: 0.2, uSweep: 0, uOpacity: 0.6 },
      color: (tint) => ({
        lit: accentOf(new Color(PALETTE.rockFresh), tint, 0.28),
        dark: accentOf(new Color(PALETTE.rockDeep), tint, 0.12),
      }),
      pose(rec) {
        // 方料侧着立：菱形截面比正方更方，剪影上「厚」得出来
        rec.orient.rotation.set(-HALF_PI, 0, Math.PI * 0.25);
      },
      animate(rec, t, p) {
        // 前 40% 猛地推出去，之后停在那儿散掉：重掌的节奏是「砸完就杵着」
        const punch = t < 0.4 ? Math.pow(t / 0.4, 0.55) : 1;
        // 放平之后网格的局部 +Y 就是出掌方向
        rec.mesh.position.y = punch * 0.95 * p;
        const w = (0.55 + punch * 0.75) * p;
        rec.mesh.scale.set(w, 0.9 + punch * 0.45, w);
      },
      burst(ctx) {
        for (let i = 0; i < budget(4, ctx.power); i++) {
          const a = rand() * TAU;
          const sp = (2 + rand() * 3.4) * ctx.power;
          spawnBit({
            x: ctx.at.x + ctx.dir.x * 0.6,
            y: Math.max(0.15, ctx.at.y - 0.3),
            z: ctx.at.z + ctx.dir.z * 0.6,
            vx: Math.cos(a) * sp * 0.5 + ctx.dir.x * sp * 0.5,
            vy: 2.5 + rand() * 3.5,
            vz: Math.sin(a) * sp * 0.5 + ctx.dir.z * sp * 0.5,
            sx: 0.7 + rand() * 0.8,
            sy: 0.7 + rand() * 0.8,
            life: 1.1 + rand() * 0.8,
            color: scratch.copy(rockColor).lerp(ctx.tint, 0.14),
          });
        }
        for (let i = 0; i < budget(8, ctx.power); i++) {
          const a = rand() * TAU;
          emitSoft(ctx.at.x + ctx.dir.x * 0.7, 0.1 + rand() * 0.3, ctx.at.z + ctx.dir.z * 0.7, {
            vx: Math.cos(a) * 2.6 * ctx.power,
            vy: 0.5 + rand() * 0.7,
            vz: Math.sin(a) * 2.6 * ctx.power,
            life: 1.1 + rand() * 1.1,
            spin: (rand() - 0.5) * 1.6,
            grow: 2 + rand() * 1.6,
            drag: 2.4,
            size: 0.3 + rand() * 0.4,
            alpha: 0.26 + rand() * 0.2,
            gravity: -0.9,
            color: softColor(ctx.tint, 0.04),
          });
        }
      },
    },

    /** 疾风：贴地窜出去的一条薄风刃。 */
    gust: {
      family: 'sheet',
      geo: 'gust',
      dur: 0.34,
      shells: 1,
      uniforms: { uTear: 0.2, uFlow: 1.5, uInner: 0.55, uOpacity: 0.5 },
      color: (tint) => ({
        lit: accentOf(new Color(0xe6f4ef), tint, 0.34),
        dark: accentOf(new Color(PALETTE.fog), tint, 0.2),
      }),
      pose(rec) {
        // 贴着地面走：几乎放平，只留一点仰角，读起来是掠地而不是划空
        rec.orient.rotation.set(-HALF_PI + 0.1, HALF_PI, 0);
        rec.baseY = Math.min(rec.baseY, 0.8);
        rec.holder.position.y = rec.baseY;
      },
      animate(rec, t, p) {
        const e = Math.pow(t, 0.55);
        rec.holder.position.x = rec.baseX + rec.dirX * e * 3.2 * p;
        rec.holder.position.z = rec.baseZ + rec.dirZ * e * 3.2 * p;
        rec.holder.position.y = rec.baseY - e * 0.28;
        const k = (0.85 + e * 0.9) * p;
        rec.mesh.scale.set(k, k, 1);
      },
      burst(ctx) {
        for (let i = 0; i < budget(6, ctx.power); i++) {
          const side = rand() < 0.5 ? -1 : 1;
          const px = -ctx.dir.z * side * (0.2 + rand() * 0.6);
          const pz = ctx.dir.x * side * (0.2 + rand() * 0.6);
          emitSoft(ctx.at.x + px, 0.12 + rand() * 0.5, ctx.at.z + pz, {
            vx: ctx.dir.x * (5 + rand() * 4) + px,
            vy: 0.15 + rand() * 0.25,
            vz: ctx.dir.z * (5 + rand() * 4) + pz,
            life: 0.42 + rand() * 0.3,
            spin: 3,
            grow: 0.5,
            drag: 2.2,
            size: 0.1 + rand() * 0.12,
            alpha: 0.3,
            gravity: -0.2,
            color: i % 6 === 0 ? scratch.copy(ctx.tint) : softColor(ctx.tint, 0.06),
          });
        }
      },
    },

    /** 冰霜：齐膝铺开的宽霜弧，弧上长出霜针。 */
    rime: {
      family: 'sheet',
      geo: 'rime',
      dur: 0.62,
      shells: 1,
      uniforms: { uTear: 0.14, uFlow: 0.22, uInner: 0.36, uOpacity: 0.4 },
      color: (tint) => ({
        lit: accentOf(new Color(0xeaf6ff), tint, 0.38),
        dark: accentOf(new Color(PALETTE.cloudShadow), tint, 0.18),
      }),
      pose(rec) {
        // 齐膝铺开：完全放平，冷空气比周围重，它是淌开的不是炸开的
        rec.orient.rotation.set(-HALF_PI, HALF_PI, 0);
        rec.baseY = 0.42;
        rec.holder.position.y = rec.baseY;
      },
      animate(rec, t, p) {
        const e = 1 - Math.pow(1 - t, 3);
        const k = (0.7 + e * 1.5) * p;
        rec.mesh.scale.set(k, k, k);
      },
      burst(ctx) {
        // 霜针从台面长出来：位置在弧上，长完停住慢慢化掉
        for (let i = 0; i < budget(3, ctx.power); i++) {
          const a = (rand() - 0.5) * 2.6;
          const s = Math.sin(a);
          const c = Math.cos(a);
          const r = 0.9 + rand() * 0.9;
          spawnBit({
            x: ctx.at.x + (ctx.dir.x * c - ctx.dir.z * s) * r,
            y: 0.06,
            z: ctx.at.z + (ctx.dir.x * s + ctx.dir.z * c) * r,
            vy: 1.6 + rand(),
            sx: 0.42 + rand() * 0.25,
            sy: 2.1 + rand() * 1.6,
            mode: 'rise',
            life: 1.5 + rand() * 1.2,
            color: scratch.set(0xcfe6f2).lerp(ctx.tint, 0.3),
          });
        }
        for (let i = 0; i < budget(6, ctx.power); i++) {
          const a = rand() * TAU;
          emitSoft(ctx.at.x + Math.cos(a) * 0.6, 0.3 + rand() * 0.5, ctx.at.z + Math.sin(a) * 0.6, {
            vx: Math.cos(a) * 0.8,
            vy: -0.12,
            vz: Math.sin(a) * 0.8,
            life: 1.8 + rand() * 1.4,
            spin: (rand() - 0.5) * 0.3,
            grow: 1.1 + rand() * 0.8,
            drag: 1.5,
            size: 0.26 + rand() * 0.3,
            alpha: 0.13 + rand() * 0.1,
            gravity: -0.18,
            color: scratch.set(0xdcecf6).lerp(dustDark, 0.4),
          });
        }
      },
    },

    /** 弹簧：一涨一缩的双环，弹开那下把灰掀起来。 */
    recoil: {
      family: 'band',
      geo: 'recoil',
      dur: 0.4,
      shells: 2,
      uniforms: { uTear: 0.22, uFlow: 0.8, uSweep: 0, uOpacity: 0.5 },
      color: (tint) => ({
        lit: accentOf(new Color(PALETTE.metalWarm), tint, 0.34),
        dark: accentOf(new Color(PALETTE.rockDeep), tint, 0.1),
      }),
      pose(rec) {
        rec.orient.rotation.set(-HALF_PI, 0, 0);
      },
      animate(rec, t, p) {
        // 外环炸开、内环反向缩回：反制掌的读数就是「一去一回」
        const out = rec.phase === 0;
        const e = out ? 1 - Math.pow(1 - t, 2.6) : Math.pow(t, 1.9);
        const k = (out ? 0.4 + e * 1.5 : 1.7 - e * 1.35) * p;
        rec.mesh.scale.set(k, k, 1);
        rec.mesh.rotation.z = t * (out ? 4.5 : -6.5);
        rec.holder.position.y = rec.baseY + (out ? e * 0.1 : -e * 0.15);
      },
      burst(ctx) {
        for (let i = 0; i < budget(7, ctx.power); i++) {
          const a = rand() * TAU;
          emitSoft(ctx.at.x + Math.cos(a) * 0.35, 0.08 + rand() * 0.2, ctx.at.z + Math.sin(a) * 0.35, {
            vx: Math.cos(a) * (2.8 + rand() * 2),
            vy: 1.1 + rand() * 1.2,
            vz: Math.sin(a) * (2.8 + rand() * 2),
            life: 0.8 + rand() * 0.7,
            spin: (rand() - 0.5) * 2,
            grow: 1.2,
            drag: 2.8,
            size: 0.16 + rand() * 0.18,
            alpha: 0.24,
            gravity: -1.4,
            color: softColor(ctx.tint, 0.05),
          });
        }
        if (!low) {
          for (let i = 0; i < budget(2, ctx.power); i++) {
            const a = rand() * TAU;
            emitSpark(ctx.at.x, ctx.at.y, ctx.at.z, {
              vx: Math.cos(a) * 2.4,
              vy: 1.8 + rand() * 2,
              vz: Math.sin(a) * 2.4,
              life: 0.4 + rand() * 0.3,
              spin: 0,
              grow: -0.03,
              drag: 0.7,
              size: 0.05 + rand() * 0.04,
              alpha: 0.8,
              gravity: -3,
              color: emberHot,
            });
          }
        }
      },
    },

    /** 分身：两片错开滑走的薄剪影，几乎无声。 */
    phase: {
      family: 'sheet',
      geo: 'phase',
      dur: 0.5,
      shells: 2,
      uniforms: { uTear: 0.1, uFlow: 0.12, uInner: 0.52, uOpacity: 0.28 },
      color: (tint) => ({
        lit: accentOf(new Color(0x9aa0b8), tint, 0.42),
        dark: accentOf(new Color(0x272134), tint, 0.16),
      }),
      pose(rec) {
        // 竖着的一片：它读的是「刚才那个人站过的地方」，所以是人形立面而不是地面波
        rec.orient.rotation.set(0, 0, HALF_PI);
      },
      animate(rec, t, p) {
        const side = rec.phase === 0 ? 1 : -1;
        const e = 1 - Math.pow(1 - t, 2);
        // 往两侧滑开，越滑越淡：真假之间的破绽就在这段位移里
        rec.holder.position.x = rec.baseX - rec.dirZ * side * e * 1.15 * p;
        rec.holder.position.z = rec.baseZ + rec.dirX * side * e * 1.15 * p;
        const k = (1 + e * 0.25) * p;
        rec.mesh.scale.set(k, k, k);
      },
      burst(ctx) {
        for (let i = 0; i < budget(3, ctx.power); i++) {
          const a = rand() * TAU;
          emitSoft(ctx.at.x + Math.cos(a) * 0.5, ctx.at.y + (rand() - 0.5) * 0.6, ctx.at.z + Math.sin(a) * 0.5, {
            vx: Math.cos(a) * 0.5,
            vy: 0.1,
            vz: Math.sin(a) * 0.5,
            life: 0.9 + rand() * 0.6,
            spin: (rand() - 0.5) * 0.8,
            grow: 0.5,
            drag: 1.8,
            size: 0.14 + rand() * 0.12,
            alpha: 0.14,
            gravity: -0.3,
            color: scratch.set(0x3a3448).lerp(ctx.tint, 0.25),
          });
        }
      },
    },

    /** 磁掌：向掌心收束的弧线，铁屑被拽进去。 */
    flux: {
      family: 'band',
      geo: 'flux',
      dur: 0.42,
      shells: 2,
      uniforms: { uTear: 0.18, uFlow: 1.8, uSweep: 1, uOpacity: 0.5 },
      color: (tint) => ({
        lit: accentOf(new Color(0xffd6c2), tint, 0.42),
        dark: accentOf(new Color(PALETTE.rockDeep), tint, 0.14),
      }),
      pose(rec) {
        rec.orient.rotation.set(-HALF_PI + (rec.phase === 0 ? 0.25 : -0.3), 0, rec.phase * 1.3);
      },
      animate(rec, t, p) {
        // 收束：弧从外圈缩回掌心，一边缩一边转，读得出「被拉过来」
        const e = 1 - Math.pow(1 - t, 2.2);
        const k = (1.7 - e * 1.25) * p;
        rec.mesh.scale.set(k, k, k);
        rec.mesh.rotation.z = t * 3.4 * (rec.phase === 0 ? 1 : -1);
      },
      burst(ctx) {
        const target = new Vector3(ctx.at.x, ctx.at.y, ctx.at.z);
        for (let i = 0; i < budget(5, ctx.power); i++) {
          const a = rand() * TAU;
          const r = 1.4 + rand() * 1.1;
          spawnBit({
            x: ctx.at.x + Math.cos(a) * r,
            y: 0.1 + rand() * 0.8,
            z: ctx.at.z + Math.sin(a) * r,
            target,
            mode: 'converge',
            sx: 0.45 + rand() * 0.3,
            sy: 0.45 + rand() * 0.3,
            life: 0.5 + rand() * 0.3,
            color: scratch.copy(rockColor).lerp(ctx.tint, 0.4),
          });
        }
        for (let i = 0; i < budget(4, ctx.power); i++) {
          const a = rand() * TAU;
          const r = 1.2 + rand() * 0.9;
          const sx = Math.cos(a) * r;
          const sz = Math.sin(a) * r;
          emitSoft(ctx.at.x + sx, 0.15 + rand() * 0.6, ctx.at.z + sz, {
            vx: -sx * 2.4,
            vy: 0.4,
            vz: -sz * 2.4,
            life: 0.5 + rand() * 0.3,
            spin: 3,
            grow: -0.04,
            drag: 0.5,
            size: 0.08 + rand() * 0.07,
            alpha: 0.42,
            gravity: 0.2,
            color: softColor(ctx.tint, 0.18),
          });
        }
      },
    },

    /** 陨掌：从上砸下来的一根柱，余烬上升灰下落。 */
    cinder: {
      family: 'band',
      geo: 'cinder',
      dur: 0.46,
      shells: 1,
      uniforms: { uTear: 0.24, uFlow: 0.9, uSweep: 0, uOpacity: 0.55 },
      color: (tint) => ({
        lit: accentOf(new Color(PALETTE.crackCore), tint, 0.3),
        dark: accentOf(new Color(PALETTE.grime), tint, 0.12),
      }),
      pose(rec) {
        rec.orient.rotation.set(0, 0, 0);
      },
      animate(rec, t, p) {
        // 先砸下来，再摊成一圈：陨掌的读数是「从上面来的」
        const fall = Math.min(1, t / 0.34);
        const e = 1 - Math.pow(1 - fall, 2.6);
        rec.holder.position.y = rec.baseY + (1 - e) * 2.4;
        const spread = t < 0.34 ? 0 : (t - 0.34) / 0.66;
        rec.mesh.scale.set((0.8 + spread * 1.5) * p, (1 - spread * 0.72) * p, (0.8 + spread * 1.5) * p);
      },
      burst(ctx) {
        for (let i = 0; i < budget(4, ctx.power); i++) {
          const a = rand() * TAU;
          emitSpark(ctx.at.x + Math.cos(a) * 0.3, Math.max(0.1, ctx.at.y - 0.4), ctx.at.z + Math.sin(a) * 0.3, {
            vx: Math.cos(a) * (1.4 + rand() * 2),
            vy: 2.2 + rand() * 3,
            vz: Math.sin(a) * (1.4 + rand() * 2),
            life: 0.7 + rand() * 0.8,
            spin: 0,
            grow: -0.04,
            drag: 0.5,
            size: 0.06 + rand() * 0.06,
            alpha: 0.9,
            gravity: -2.4,
            color: emberHot,
          });
        }
        for (let i = 0; i < budget(3, ctx.power); i++) {
          const a = rand() * TAU;
          const sp = (1.5 + rand() * 3) * ctx.power;
          spawnBit({
            x: ctx.at.x,
            y: Math.max(0.15, ctx.at.y - 0.3),
            z: ctx.at.z,
            vx: Math.cos(a) * sp,
            vy: 3 + rand() * 3,
            vz: Math.sin(a) * sp,
            sx: 0.6 + rand() * 0.7,
            sy: 0.6 + rand() * 0.7,
            life: 1.2 + rand() * 0.8,
            color: scratch.copy(rockColor).lerp(new Color(PALETTE.crackDeep), 0.25),
          });
        }
        for (let i = 0; i < budget(5, ctx.power); i++) {
          const a = rand() * TAU;
          emitSoft(ctx.at.x + Math.cos(a) * 0.5, 0.1 + rand() * 0.4, ctx.at.z + Math.sin(a) * 0.5, {
            vx: Math.cos(a) * 2.2,
            vy: 0.7 + rand() * 0.6,
            vz: Math.sin(a) * 2.2,
            life: 1.4 + rand() * 1.2,
            spin: (rand() - 0.5) * 1.4,
            grow: 1.8,
            drag: 2,
            size: 0.24 + rand() * 0.3,
            alpha: 0.24,
            gravity: -0.8,
            color: softColor(ctx.tint, 0.06),
          });
        }
      },
    },
  };

  /** 分派表就是配方表的键集合：八只掌 → 八套配方，任何时候都对得上。 */
  const KINDS = Object.freeze(Object.keys(SPEC));

  // ---------------------------------------------------------------- 播放

  const tmpDir = new Vector3();
  const tmpTint = new Color();

  function grab(family) {
    const pool = family === 'sheet' ? sheets : bands;
    return pool.find((r) => r.t < 0) ?? pool[0];
  }

  function geometryOf(spec) {
    return spec.family === 'sheet' ? sheetGeo[spec.geo] : bandGeo[spec.geo];
  }

  function play(spec, phase, ctx) {
    const rec = grab(spec.family);
    rec.t = 0;
    rec.dur = spec.dur * (ctx.skill ? 1.35 : 1);
    rec.spec = spec;
    rec.phase = phase;
    rec.power = ctx.power;

    // 换掌只是换几何体引用：池位固定，切掌不新增批次
    rec.mesh.geometry = geometryOf(spec);

    rec.holder.visible = true;
    rec.holder.position.copy(ctx.at);
    rec.holder.rotation.set(0, Math.atan2(-ctx.dir.x, -ctx.dir.z), 0);
    rec.baseX = ctx.at.x;
    rec.baseY = ctx.at.y;
    rec.baseZ = ctx.at.z;
    rec.dirX = ctx.dir.x;
    rec.dirZ = ctx.dir.z;
    rec.mesh.position.set(0, 0, 0);
    rec.mesh.rotation.set(0, 0, 0);
    rec.mesh.scale.set(1, 1, 1);
    rec.orient.position.set(0, 0, 0);
    spec.pose(rec);

    const cols = spec.color(ctx.tint);
    rec.mat.uniforms.uColorLit.value.copy(cols.lit);
    rec.mat.uniforms.uColorDark.value.copy(cols.dark);
    rec.mat.uniforms.uLife.value = 0;
    for (const [key, value] of Object.entries(spec.uniforms)) {
      if (rec.mat.uniforms[key]) rec.mat.uniforms[key].value = value;
    }
    rec.mat.uniforms.uOpacity.value =
      (spec.uniforms.uOpacity ?? 0.5) * (ctx.whiff ? 0.6 : 1) * (ctx.skill ? 1.15 : 1);
    spec.animate(rec, 0, ctx.power);
  }

  const api = {
    group,
    kinds: KINDS,

    /**
     * 放一次掌的特效。
     *
     * @param {string} kind   COMBAT_VFX_KIND / SKILL_VFX_KIND 的值
     * @param {Vector3} at    落点（大致是掌心或命中点）
     * @param {Vector3} dir   水平方向（击退方向 / 出掌方向）
     * @param {number} power  0.4~2.4，来自 view 的归一击退
     * @param {object} [opts] { tint:number|Color, skill:boolean, whiff:boolean }
     */
    strike(kind, at, dir, power = 1, opts = {}) {
      const spec = SPEC[kind] ?? SPEC.fanwake;
      const p = clamp(power, 0.4, 2.4);
      tmpDir.copy(dir ?? tmpDir.set(0, 0, -1));
      tmpDir.y = 0;
      if (tmpDir.lengthSq() < 1e-6) tmpDir.set(0, 0, -1);
      tmpDir.normalize();
      const tint =
        opts.tint instanceof Color
          ? tmpTint.copy(opts.tint)
          : tmpTint.set(Number.isFinite(opts.tint) ? opts.tint : FALLBACK_TINT);

      const ctx = {
        at,
        dir: tmpDir,
        tint,
        power: p * (opts.skill ? 1.25 : 1),
        skill: !!opts.skill,
        whiff: !!opts.whiff,
      };

      const shells = low ? 1 : spec.shells;
      for (let i = 0; i < shells; i++) play(spec, i, ctx);
      // 打空只有形没有残留：一掌扇空不该在地上留一堆碎屑
      if (!opts.whiff) spec.burst(ctx);
      return spec;
    },

    update(dt) {
      for (const rec of sheets) stepShell(rec, dt);
      for (const rec of bands) stepShell(rec, dt);
      stepPool(soft, softGrav, dt, null);
      stepPool(sparks, sparkGrav, dt, coolCurve);
      stepBits(dt);
    },

    setPixelScale(v) {
      soft.mat.uniforms.uPixelScale.value = v;
      sparks.mat.uniforms.uPixelScale.value = v;
    },

    getStats() {
      return {
        shells: sheets.concat(bands).filter((r) => r.t >= 0).length,
        bits: bits.length,
        particles: soft.count + sparks.count,
      };
    },

    dispose() {
      soft.dispose();
      sparks.dispose();
      for (const rec of [...sheets, ...bands]) {
        rec.mat.dispose();
        group.remove(rec.holder);
      }
      for (const g of allGeo) g.dispose();
      bitGeo.dispose();
      bitMat.dispose();
      bits.length = 0;
      scene.remove(group);
    },
  };

  function stepShell(rec, dt) {
    if (rec.t < 0) return;
    rec.t += dt / rec.dur;
    if (rec.t >= 1) {
      rec.t = -1;
      rec.holder.visible = false;
      return;
    }
    rec.mat.uniforms.uLife.value = rec.t;
    rec.spec.animate(rec, rec.t, rec.power);
  }

  return api;
}
