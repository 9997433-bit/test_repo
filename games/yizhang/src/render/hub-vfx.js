// 展示掌的 idle 特效。
//
// 验收线是「不看名字也知道这是哪一只掌」，所以八种特效各自解释一件不同的物理：
//
//   木棉 cotton    —— 棉絮：大而软的絮团，几乎不受重力，横着飘、慢慢化开
//   磐石 granite   —— 岩屑：几块有体积的碎石悬在掌周绕行，偶尔掉渣
//   疾风 gale      —— 条带：贴着掌面绕圈的风带，头尾都是渐隐的，不是发光圈
//   冰霜 frost     —— 霜雾：往下淌的冷雾 + 台面边沿结出的冰棱
//   弹簧 spring    —— 弹簧弧：一条真的螺旋，压缩—释放，掌随之被顶起来
//   分身 afterimage—— 残影闪：同一只掌的半透复本错位闪现，闪完就淡掉
//   磁掌 magnet    —— 牵引线：从四周收束到掌心的细线，线上有亮段在往里跑
//   陨掌 meteor    —— 余烬：上升的余烬 + 落下的灰 + 台面上没凉透的裂纹
//
// 纪律沿用手册 §10：不要纯色光球、不要发光描边、不要瞬时消失。除了余烬（它真的是热的）
// 一律 NormalBlending；余烬也只有在开了辉光的档位才进辉光通道。

import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  OctahedronGeometry,
  PlaneGeometry,
  ShaderMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { PALETTE } from './config.js';
import { mulberry32 } from './noise.js';
import { emitParticle, flushParticles, makeParticleSystem, swapRemove } from './particles.js';

const BLOOM_LAYER = 1;
const TAU = Math.PI * 2;

/** 掌 id → idle 特效种类。八只掌各一种，不许共用。 */
export const IDLE_VFX_KIND = Object.freeze({
  cotton: 'fluff',
  granite: 'grit',
  gale: 'streak',
  frost: 'mist',
  spring: 'coil',
  afterimage: 'ghost',
  magnet: 'pull',
  meteor: 'ember',
});

/** 认不出的掌（替身掌表 / 以后新增的掌）退回棉絮：至少还是「有东西在飘」。 */
export function idleVfxKind(gloveId) {
  return IDLE_VFX_KIND[gloveId] ?? 'fluff';
}

const STREAK_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 风带：头尾都要渐隐，中段被噪声撕出断续，读起来才是一股掠过的气流而不是一个圈
const STREAK_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float head = smoothstep(0.0, 0.22, vUv.x);
    float tail = 1.0 - smoothstep(0.58, 1.0, vUv.x);
    float n = texture2D(uNoise, vec2(vUv.x * 1.7 - uTime * 0.55, vUv.y * 0.5 + uTime * 0.1)).r;
    float a = head * tail * uOpacity * (0.35 + n * 1.1);
    if (a < 0.006) discard;
    gl_FragColor = vec4(uColor * (0.7 + n * 0.6), clamp(a, 0.0, 1.0));
  }
`;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 大厅的粒子池。
 *
 * 与打击特效那一池分开：那边的粒子是「被打出来的」，有重力有落地堆积；
 * 这边的粒子是「一直在的」，需要横向摆动与自定义重力（棉絮往上飘、灰往下落）。
 */
function makeHubPool({ root, budget, texture, blending, renderOrder, rand }) {
  const ps = makeParticleSystem({
    scene: root,
    budget,
    texture,
    blending,
    depthWrite: false,
    renderOrder,
  });
  const cap = ps.budget;
  const grav = new Float32Array(cap);
  const swayAmp = new Float32Array(cap);
  const swayFreq = new Float32Array(cap);
  const swayPhase = new Float32Array(cap);
  const extra = [grav, swayAmp, swayFreq, swayPhase];

  return {
    ps,
    emit(x, y, z, o) {
      const i = emitParticle(ps, x, y, z, o, rand);
      if (i < 0) return -1;
      grav[i] = o.gravity ?? 0;
      swayAmp[i] = o.sway ?? 0;
      swayFreq[i] = o.swayFreq ?? 1.2;
      swayPhase[i] = rand() * TAU;
      return i;
    },
    update(dt, time, cool) {
      const a = ps.arrays;
      for (let i = ps.count - 1; i >= 0; i--) {
        ps.life[i] += dt;
        const t = ps.life[i] / ps.maxLife[i];
        if (t >= 1) {
          const last = ps.count - 1;
          if (i !== last) for (const arr of extra) arr[i] = arr[last];
          swapRemove(ps, i);
          continue;
        }
        const dragK = Math.exp(-ps.drag[i] * dt);
        ps.vel[i * 3] *= dragK;
        ps.vel[i * 3 + 2] *= dragK;
        ps.vel[i * 3 + 1] = ps.vel[i * 3 + 1] * dragK + grav[i] * dt;
        const sway = swayAmp[i];
        a.pos[i * 3] += (ps.vel[i * 3] + Math.sin(time * swayFreq[i] + swayPhase[i]) * sway) * dt;
        a.pos[i * 3 + 1] += ps.vel[i * 3 + 1] * dt;
        a.pos[i * 3 + 2] += (ps.vel[i * 3 + 2] + Math.cos(time * swayFreq[i] * 0.83 + swayPhase[i]) * sway) * dt;
        a.rot[i] += ps.spin[i] * dt;
        a.size[i] = ps.baseSize[i] + ps.grow[i] * t;
        const fadeIn = Math.min(1, t / 0.16);
        const fadeOut = 1 - Math.max(0, (t - 0.55) / 0.45);
        a.alpha[i] = ps.baseAlpha[i] * fadeIn * fadeOut * fadeOut;
        if (cool) {
          // 余烬：白热 → 暗红，靠变色与缩小退场，不是直接消失
          const c = cool(t);
          a.color[i * 3] = c.r;
          a.color[i * 3 + 1] = c.g;
          a.color[i * 3 + 2] = c.b;
        }
      }
      flushParticles(ps);
    },
    setPixelScale(v) {
      ps.mat.uniforms.uPixelScale.value = v;
    },
    dispose() {
      ps.dispose();
    },
  };
}

/**
 * @param {object} o
 * @param {Group} o.root      挂载点（安全区的根节点，世界变换是单位阵）
 * @param {object} o.quality
 * @param {object} o.textures
 * @param {number} [o.seed]
 */
export function createHubVfx({ root, quality, textures, seed = 20240501 }) {
  const rand = mulberry32(seed + 733);
  const low = quality.name === 'low';
  const rate = low ? 0.45 : quality.name === 'mid' ? 0.75 : 1;

  const group = new Group();
  group.name = 'hub-vfx';
  root.add(group);

  const soft = makeHubPool({
    root: group,
    budget: Math.max(48, Math.round(quality.dustBudget * 0.42)),
    texture: textures?.dust ?? null,
    blending: NormalBlending,
    renderOrder: 3,
    rand,
  });

  const embers = makeHubPool({
    root: group,
    budget: Math.max(16, Math.round(quality.emberBudget * 0.5)),
    texture: textures?.ember ?? null,
    blending: AdditiveBlending,
    renderOrder: 4,
    rand,
  });
  if (quality.bloom) {
    // 低档整条辉光支链是不建的，这里也就不该把余烬塞进那一层
    embers.ps.points.layers.enable(BLOOM_LAYER);
    embers.ps.points.userData.bloomSelf = true;
  }

  const emberHot = new Color(0xfff1d2);
  const emberCool = new Color(PALETTE.crackDeep);
  const ashColor = new Color(PALETTE.grime).lerp(new Color(PALETTE.rockBody), 0.35);
  const tmpColor = new Color();
  const coolCurve = (t) => tmpColor.copy(emberHot).lerp(emberCool, Math.min(1, t * 1.4));

  const shared = [];
  const keep = (x) => {
    shared.push(x);
    return x;
  };
  const chipGeo = keep(new IcosahedronGeometry(0.055, 0));
  const crystalGeo = keep(new OctahedronGeometry(0.09, 0));
  const ringGeo = keep(new TorusGeometry(0.34, 0.012, 4, 28));
  const decalGeo = keep(new PlaneGeometry(1, 1));

  // ---------------------------------------------------------------- 各掌特效

  /** 木棉：棉絮。大、软、几乎不落，横着荡开。 */
  function makeFluff(ctx) {
    const color = ctx.tint.clone().lerp(new Color(0xfff4dd), 0.55);
    let acc = 0;
    return {
      kind: 'fluff',
      update(c) {
        acc += c.dt * c.intensity * rate;
        const interval = 0.2;
        while (acc > interval) {
          acc -= interval;
          const a = rand() * TAU;
          const r = 0.15 + rand() * 0.45;
          soft.emit(
            c.anchor.x + Math.cos(a) * r,
            c.anchor.y - 0.15 + rand() * 0.5,
            c.anchor.z + Math.sin(a) * r,
            {
              vx: (rand() - 0.5) * 0.16,
              vy: 0.05 + rand() * 0.12,
              vz: (rand() - 0.5) * 0.16,
              life: 3.2 + rand() * 2.4,
              spin: (rand() - 0.5) * 0.5,
              grow: 0.4 + rand() * 0.5,
              drag: 0.5,
              size: 0.22 + rand() * 0.26,
              alpha: 0.2 + rand() * 0.16,
              gravity: 0.02,
              sway: 0.16 + rand() * 0.18,
              swayFreq: 0.5 + rand() * 0.7,
              color,
            }
          );
        }
      },
      dispose() {},
    };
  }

  /** 磐石：岩屑。有体积、有自转，绕着掌慢慢巡游，偶尔掉一点石粉。 */
  function makeGrit(ctx) {
    const count = low ? 4 : quality.name === 'mid' ? 6 : 8;
    const mat = new MeshStandardMaterial({
      color: new Color(PALETTE.rockBody).lerp(ctx.tint, 0.3),
      roughness: 0.98,
      metalness: 0,
      flatShading: true,
      envMapIntensity: 0.2,
    });
    const mesh = new InstancedMesh(chipGeo, mat, count);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.castShadow = quality.shadows;
    mesh.frustumCulled = false;
    ctx.host.add(mesh);

    const chips = Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * TAU + rand() * 0.4,
      radius: 0.3 + rand() * 0.34,
      height: -0.1 + rand() * 0.55,
      speed: 0.25 + rand() * 0.35,
      bob: rand() * TAU,
      scale: 0.6 + rand() * 0.9,
      spin: new Vector3(rand() * 2, rand() * 2, rand() * 2),
    }));
    const dummy = new Object3D();
    let acc = 0;

    return {
      kind: 'grit',
      update(c) {
        for (let i = 0; i < chips.length; i++) {
          const ch = chips[i];
          ch.angle += ch.speed * c.dt * (0.4 + c.intensity * 0.6);
          const y = ch.height + Math.sin(c.time * 0.7 + ch.bob) * 0.06;
          dummy.position.set(
            Math.cos(ch.angle) * ch.radius,
            c.localPalmY + y,
            Math.sin(ch.angle) * ch.radius
          );
          dummy.rotation.set(
            ch.spin.x + c.time * 0.5,
            ch.spin.y + c.time * 0.35,
            ch.spin.z + c.time * 0.28
          );
          dummy.scale.setScalar(ch.scale * (0.7 + c.intensity * 0.4));
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;

        acc += c.dt * c.intensity * rate;
        if (acc > 0.55) {
          acc = 0;
          const ch = chips[Math.floor(rand() * chips.length)];
          soft.emit(
            c.anchor.x + Math.cos(ch.angle) * ch.radius,
            c.anchor.y + ch.height,
            c.anchor.z + Math.sin(ch.angle) * ch.radius,
            {
              vx: (rand() - 0.5) * 0.1,
              vy: -0.1,
              vz: (rand() - 0.5) * 0.1,
              life: 1.4 + rand() * 1.1,
              spin: (rand() - 0.5) * 1.2,
              grow: 0.35,
              drag: 1.1,
              size: 0.09 + rand() * 0.1,
              alpha: 0.24,
              gravity: -0.55,
              sway: 0.03,
              color: ashColor,
            }
          );
        }
      },
      dispose() {
        ctx.host.remove(mesh);
        mesh.dispose();
        mat.dispose();
      },
    };
  }

  /** 疾风：条带。三条绕掌的风带，各自转速与倾角不同，头尾渐隐。 */
  function makeStreak(ctx) {
    const bands = [];
    const n = low ? 2 : 3;
    for (let i = 0; i < n; i++) {
      const geo = new TorusGeometry(0.36 + i * 0.09, 0.016, 3, 30, Math.PI * (1.05 + rand() * 0.35));
      const mat = new ShaderMaterial({
        vertexShader: STREAK_VERT,
        fragmentShader: STREAK_FRAG,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: NormalBlending,
        uniforms: {
          uNoise: { value: textures?.turbulence ?? null },
          uColor: { value: ctx.tint.clone().lerp(new Color(0xdff7f0), 0.35) },
          uOpacity: { value: 0.55 },
          uTime: { value: 0 },
        },
      });
      const mesh = new Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2 + (rand() - 0.5) * 0.5;
      mesh.renderOrder = 2;
      ctx.host.add(mesh);
      bands.push({ mesh, mat, geo, speed: 1.1 + i * 0.55, tilt: (rand() - 0.5) * 0.4, lift: i * 0.16 });
    }
    let acc = 0;

    return {
      kind: 'streak',
      update(c) {
        for (const b of bands) {
          b.mesh.position.y = c.localPalmY - 0.1 + b.lift;
          b.mesh.rotation.y += b.speed * c.dt * (0.5 + c.intensity * 0.8);
          b.mesh.rotation.z = Math.sin(c.time * 0.8 + b.lift * 6) * 0.18 + b.tilt;
          b.mat.uniforms.uTime.value = c.time;
          b.mat.uniforms.uOpacity.value = 0.32 + c.intensity * 0.42;
        }
        acc += c.dt * c.intensity * rate;
        if (acc > 0.22) {
          acc = 0;
          const a = rand() * TAU;
          const r = 0.42;
          // 掠过的碎屑：沿切线飞，寿命短，说明风是有方向的
          soft.emit(c.anchor.x + Math.cos(a) * r, c.anchor.y + (rand() - 0.4) * 0.4, c.anchor.z + Math.sin(a) * r, {
            vx: -Math.sin(a) * 2.2,
            vy: 0.1,
            vz: Math.cos(a) * 2.2,
            life: 0.5 + rand() * 0.35,
            spin: 2.5,
            grow: 0.1,
            drag: 1.6,
            size: 0.07 + rand() * 0.06,
            alpha: 0.3,
            gravity: 0,
            sway: 0,
            color: ctx.tint.clone().lerp(new Color(0xffffff), 0.4),
          });
        }
      },
      dispose() {
        for (const b of bands) {
          ctx.host.remove(b.mesh);
          b.geo.dispose();
          b.mat.dispose();
        }
      },
    };
  }

  /** 冰霜：霜雾往下淌，台座边沿结出冰棱。 */
  function makeMist(ctx) {
    const iceMat = new MeshStandardMaterial({
      color: ctx.tint.clone().lerp(new Color(0xffffff), 0.35),
      roughness: 0.18,
      metalness: 0,
      transparent: true,
      opacity: 0.72,
      envMapIntensity: 1.1,
      flatShading: true,
    });
    const shards = [];
    const count = low ? 3 : 5;
    for (let i = 0; i < count; i++) {
      const m = new Mesh(crystalGeo, iceMat);
      const a = (i / count) * TAU + rand() * 0.5;
      // 高度要等第一帧拿到台帽的高度才知道，先把角度与体态定下来
      m.userData.angle = a;
      m.userData.radius = 0.4 + rand() * 0.12;
      m.rotation.set(rand() * 0.5, rand() * TAU, rand() * 0.6);
      m.scale.set(0.7 + rand() * 0.6, 1.2 + rand() * 0.9, 0.7 + rand() * 0.5);
      m.castShadow = quality.shadows;
      ctx.host.add(m);
      shards.push(m);
    }
    const mistColor = ctx.tint.clone().lerp(new Color(0xeaf6ff), 0.5);
    let acc = 0;
    let placed = false;

    return {
      kind: 'mist',
      update(c) {
        if (!placed) {
          placed = true;
          // 冰棱从台帽边沿长出来，不是浮在半空的碎片
          for (const m of shards) {
            const a = m.userData.angle;
            m.position.set(
              Math.cos(a) * m.userData.radius,
              c.pedestalTopY + 0.04,
              Math.sin(a) * m.userData.radius
            );
          }
        }
        // 冰棱不动，只让通透度随呼吸微变：静物也要有生命
        iceMat.opacity = 0.5 + 0.22 * Math.sin(c.time * 0.9) * c.intensity;
        acc += c.dt * c.intensity * rate;
        const interval = 0.16;
        while (acc > interval) {
          acc -= interval;
          const a = rand() * TAU;
          const r = 0.1 + rand() * 0.45;
          // 冷空气比周围重：雾从掌口溢出后往台座外沿淌下去
          soft.emit(c.anchor.x + Math.cos(a) * r, c.anchor.y - 0.05 + rand() * 0.35, c.anchor.z + Math.sin(a) * r, {
            vx: Math.cos(a) * 0.22,
            vy: -0.08,
            vz: Math.sin(a) * 0.22,
            life: 2.2 + rand() * 1.6,
            spin: (rand() - 0.5) * 0.4,
            grow: 0.7 + rand() * 0.6,
            drag: 1.3,
            size: 0.2 + rand() * 0.3,
            alpha: 0.14 + rand() * 0.12,
            gravity: -0.16,
            sway: 0.05,
            swayFreq: 0.4,
            color: mistColor,
          });
        }
      },
      dispose() {
        for (const m of shards) ctx.host.remove(m);
        iceMat.dispose();
      },
    };
  }

  /** 弹簧：一条真的螺旋。压缩到底再弹开，掌被顶起来一截。 */
  function makeCoil(ctx) {
    const pts = [];
    const turns = 3.2;
    const steps = low ? 28 : 52;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = t * TAU * turns;
      const r = 0.26 - t * 0.06;
      pts.push(new Vector3(Math.cos(a) * r, t * 0.46, Math.sin(a) * r));
    }
    const curve = new CatmullRomCurve3(pts);
    const geo = new TubeGeometry(curve, low ? 40 : 84, 0.022, 5, false);
    const mat = new MeshStandardMaterial({
      color: ctx.tint.clone().lerp(new Color(PALETTE.metalWarm), 0.4),
      roughness: 0.36,
      metalness: 0.85,
      envMapIntensity: 0.9,
    });
    const mesh = new Mesh(geo, mat);
    mesh.castShadow = quality.shadows;
    ctx.host.add(mesh);

    const ringMat = new MeshBasicMaterial({
      color: ctx.tint.clone().lerp(new Color(0xffffff), 0.25),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ctx.host.add(ring);

    let phase = 0;
    let ringT = -1;
    const effect = {
      kind: 'coil',
      palmOffset: 0,
      update(c) {
        phase += c.dt * (0.75 + c.intensity * 0.55);
        const cycle = phase % 1;
        // 前 62% 慢慢压下去，后 38% 弹回来：蓄力慢、释放快
        const squash = cycle < 0.62 ? Math.pow(cycle / 0.62, 1.6) : 1 - Math.pow((cycle - 0.62) / 0.38, 0.55);
        mesh.scale.y = 1 - squash * 0.42;
        mesh.position.y = c.localPalmY - 0.62;
        mesh.rotation.y = phase * 1.4;
        effect.palmOffset = (1 - squash) * 0.09 * c.intensity;

        if (cycle > 0.62 && ringT < 0) ringT = 0;
        if (ringT >= 0) {
          ringT += c.dt * 2.6;
          if (ringT >= 1) {
            ringT = -1;
            ringMat.opacity = 0;
            ring.visible = false;
          } else {
            ring.visible = true;
            ring.position.y = c.localPalmY - 0.66;
            ring.scale.setScalar(0.5 + ringT * 1.5);
            ringMat.opacity = 0.4 * (1 - ringT) * c.intensity;
          }
        }
      },
      dispose() {
        ctx.host.remove(mesh);
        ctx.host.remove(ring);
        geo.dispose();
        mat.dispose();
        ringMat.dispose();
      },
    };
    return effect;
  }

  /** 分身：同一只掌的半透复本错位闪现。复刻的是真几何体，不是一团紫雾。 */
  function makeGhost(ctx) {
    const geo = ctx.handGeometry;
    const count = low ? 1 : 2;
    const ghosts = [];
    for (let i = 0; i < count; i++) {
      const mat = new MeshStandardMaterial({
        color: ctx.tint.clone().lerp(new Color(0x2a2338), 0.35),
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        envMapIntensity: 0.3,
      });
      const mesh = geo ? new Mesh(geo, mat) : new Object3D();
      mesh.renderOrder = 2;
      ctx.host.add(mesh);
      ghosts.push({ mesh, mat, t: -1, dx: 0, dz: 0, yaw: 0 });
    }
    let acc = 0.4;
    let turn = 0;

    return {
      kind: 'ghost',
      update(c) {
        acc += c.dt * c.intensity;
        if (acc > 1.15) {
          acc = 0;
          const g = ghosts[turn % ghosts.length];
          turn++;
          const a = rand() * TAU;
          const r = 0.22 + rand() * 0.2;
          g.dx = Math.cos(a) * r;
          g.dz = Math.sin(a) * r;
          g.yaw = (rand() - 0.5) * 0.7;
          g.t = 0;
        }
        for (const g of ghosts) {
          if (g.t < 0) {
            g.mesh.visible = false;
            continue;
          }
          g.t += c.dt / 0.7;
          if (g.t >= 1) {
            g.t = -1;
            g.mesh.visible = false;
            continue;
          }
          // 闪出来时是错开的，淡掉的过程里往本体收回去
          const k = 1 - g.t;
          g.mesh.visible = true;
          g.mesh.position.set(g.dx * k, c.localPalmY + 0.04 * (1 - k), g.dz * k);
          g.mesh.rotation.y = g.yaw * k;
          g.mesh.scale.setScalar(0.96 + 0.06 * g.t);
          g.mat.opacity = 0.42 * k * k * c.intensity;
        }
      },
      dispose() {
        for (const g of ghosts) {
          ctx.host.remove(g.mesh);
          g.mat.dispose();
        }
      },
    };
  }

  /** 磁掌：牵引线。线上有亮段往掌心跑，铁屑顺着线被吸进去。 */
  function makePull(ctx) {
    const lines = low ? 6 : 10;
    const segs = 8;
    const verts = lines * segs * 2;
    const pos = new Float32Array(verts * 3);
    const col = new Float32Array(verts * 4);
    const paths = [];

    for (let l = 0; l < lines; l++) {
      const a = (l / lines) * TAU + rand() * 0.25;
      const r0 = 0.95 + rand() * 0.35;
      const bow = 0.25 + rand() * 0.3;
      paths.push({ a, r0, bow, speed: 0.55 + rand() * 0.5, offset: rand() });
    }

    const geo = new BufferGeometry();
    const posAttr = new BufferAttribute(pos, 3).setUsage(DynamicDrawUsage);
    const colAttr = new BufferAttribute(col, 4).setUsage(DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('color', colAttr);

    const mat = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
    });
    const mesh = new LineSegments(geo, mat);
    mesh.frustumCulled = false;
    ctx.host.add(mesh);

    const base = ctx.tint.clone().lerp(new Color(0xffd6c2), 0.25);
    let acc = 0;

    return {
      kind: 'pull',
      update(c) {
        let v = 0;
        for (const p of paths) {
          const spin = c.time * 0.18;
          for (let s = 0; s < segs; s++) {
            for (let e = 0; e < 2; e++) {
              const t = (s + e) / segs;
              // 从外圈向掌心收束，中间拱起来一点，线才有张力
              const r = p.r0 * (1 - t);
              const ang = p.a + spin + t * 0.9;
              const y = lerp(0.04, c.localPalmY, t) + Math.sin(t * Math.PI) * p.bow;
              pos[v * 3] = Math.cos(ang) * r;
              pos[v * 3 + 1] = y;
              pos[v * 3 + 2] = Math.sin(ang) * r;

              // 亮段：一个沿着线往里跑的高斯包
              const head = (c.time * p.speed + p.offset) % 1;
              const d = Math.abs(t - head);
              const pulse = Math.exp(-(d * d) / 0.012);
              const fade = 0.18 + 0.5 * t;
              col[v * 4] = base.r * (0.6 + pulse * 0.8);
              col[v * 4 + 1] = base.g * (0.6 + pulse * 0.8);
              col[v * 4 + 2] = base.b * (0.6 + pulse * 0.8);
              col[v * 4 + 3] = (fade * 0.5 + pulse * 0.55) * c.intensity;
              v++;
            }
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        acc += c.dt * c.intensity * rate;
        if (acc > 0.3) {
          acc = 0;
          const p = paths[Math.floor(rand() * paths.length)];
          const ang = p.a + c.time * 0.18;
          // 铁屑：初速度直接指向掌心，看得出是被拽进去的
          const sx = Math.cos(ang) * p.r0;
          const sz = Math.sin(ang) * p.r0;
          soft.emit(c.anchor.x + sx, c.anchor.y - 0.3, c.anchor.z + sz, {
            vx: -sx * 1.5,
            vy: 0.55,
            vz: -sz * 1.5,
            life: 0.75 + rand() * 0.3,
            spin: 3,
            grow: -0.03,
            drag: 0.4,
            size: 0.06 + rand() * 0.05,
            alpha: 0.55,
            gravity: 0.2,
            sway: 0,
            color: base,
          });
        }
      },
      dispose() {
        ctx.host.remove(mesh);
        geo.dispose();
        mat.dispose();
      },
    };
  }

  /** 陨掌：余烬上升、灰烬下落、台座上还有没凉透的裂纹。 */
  function makeEmber(ctx) {
    const decalMat = new MeshBasicMaterial({
      map: textures?.crack ?? null,
      color: new Color(PALETTE.crackCore),
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const decal = new Mesh(decalGeo, decalMat);
    decal.rotation.x = -Math.PI / 2;
    decal.scale.setScalar(1.05);
    decal.renderOrder = 2;
    ctx.host.add(decal);

    let acc = 0;
    let ashAcc = 0;
    return {
      kind: 'ember',
      update(c) {
        decal.position.y = c.pedestalTopY + 0.012;
        decalMat.opacity = (0.18 + 0.14 * Math.sin(c.time * 1.6)) * c.intensity;

        acc += c.dt * c.intensity * rate;
        while (acc > 0.14) {
          acc -= 0.14;
          const a = rand() * TAU;
          const r = rand() * 0.3;
          embers.emit(c.anchor.x + Math.cos(a) * r, c.anchor.y - 0.25 + rand() * 0.3, c.anchor.z + Math.sin(a) * r, {
            vx: (rand() - 0.5) * 0.24,
            vy: 0.5 + rand() * 0.55,
            vz: (rand() - 0.5) * 0.24,
            life: 1.1 + rand() * 0.9,
            spin: 0,
            grow: -0.04,
            drag: 0.35,
            size: 0.05 + rand() * 0.06,
            alpha: 0.85,
            gravity: 0.25,
            sway: 0.12,
            swayFreq: 1.6,
            color: emberHot,
          });
        }

        ashAcc += c.dt * c.intensity * rate;
        if (ashAcc > 0.5) {
          ashAcc = 0;
          const a = rand() * TAU;
          soft.emit(c.anchor.x + Math.cos(a) * 0.4, c.anchor.y + 0.5, c.anchor.z + Math.sin(a) * 0.4, {
            vx: (rand() - 0.5) * 0.1,
            vy: -0.06,
            vz: (rand() - 0.5) * 0.1,
            life: 2.4 + rand() * 1.4,
            spin: (rand() - 0.5) * 1.2,
            grow: 0.25,
            drag: 0.9,
            size: 0.07 + rand() * 0.07,
            alpha: 0.3,
            gravity: -0.22,
            sway: 0.1,
            color: ashColor,
          });
        }
      },
      dispose() {
        ctx.host.remove(decal);
        decalMat.dispose();
      },
    };
  }

  const FACTORY = {
    fluff: makeFluff,
    grit: makeGrit,
    streak: makeStreak,
    mist: makeMist,
    coil: makeCoil,
    ghost: makeGhost,
    pull: makePull,
    ember: makeEmber,
  };

  return {
    group,

    /**
     * 给一座台座挂上它那只掌的 idle 特效。
     * @param {object} o
     * @param {string} o.gloveId
     * @param {Group}  o.host          台座节点（特效的网格挂它下面，跟着台座走）
     * @param {Color}  o.tint          识别色
     * @param {*}      [o.handGeometry] 掌的皮革几何体（分身残影要复刻）
     */
    attach({ gloveId, host, tint, handGeometry }) {
      const kind = idleVfxKind(gloveId);
      const ctx = { gloveId, host, tint: tint ?? new Color(0xffffff), handGeometry };
      const effect = FACTORY[kind](ctx);
      effect.gloveId = gloveId;
      return effect;
    },

    /** 传送门那边也要往同一池里放尘，省得为门再开一套粒子系统。 */
    emitSoft(x, y, z, o) {
      return soft.emit(x, y, z, o);
    },

    emitEmber(x, y, z, o) {
      return embers.emit(x, y, z, o);
    },

    /** 一帧一次，粒子池统一推进（每座特效自己 update 只负责「放什么」）。 */
    update(dt, time) {
      soft.update(dt, time, null);
      embers.update(dt, time, coolCurve);
    },

    setPixelScale(v) {
      soft.setPixelScale(v);
      embers.setPixelScale(v);
    },

    dispose() {
      soft.dispose();
      embers.dispose();
      for (const g of shared) g.dispose?.();
      root.remove(group);
    },
  };
}
