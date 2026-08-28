// 打击特效。
//
// 手册 §10 的三条禁令是这个文件的地基：不要纯色光球、不要加法混合糊屏、不要瞬时消失。
// 所以一次扇击拆成四件事：
//   1. 激波壳   —— 被压缩的空气与扬尘，菲涅尔驱动的薄壳，法线混合而不是加法
//   2. 地面压环 —— 贴地扩散的扬尘环，说明压力波打到了地面
//   3. 尘埃残留 —— 有重量、有阻力、会下沉、会慢慢散，事后还在飘
//   4. 事后痕迹 —— 重击留下裂纹贴花与几粒余烬，打完不是「什么都没发生」
// 只有余烬用 additive（它真的是高温），其余全部 NormalBlending。

import {
  AdditiveBlending,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from './gfx.js';
import { PALETTE } from './config.js';
import { mulberry32 } from './noise.js';
import { emitParticle, flushParticles, makeParticleSystem, swapRemove } from './particles.js';

const BLOOM_LAYER = 1;

const SHOCK_VERT = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SHOCK_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uColorLit;
  uniform vec3 uColorDark;
  uniform float uLife;
  uniform float uOpacity;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec2 vUv;
  void main() {
    // 菲涅尔：只有掠射角的壳面可见，中间是空的，读起来才是「一层被压缩的空气」
    float fres = 1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir)));
    fres = pow(clamp(fres, 0.0, 1.0), 2.6);

    // 湍流把完美球壳撕开成絮状
    float n = texture2D(uNoise, vUv * 2.4 + vec2(uLife * 0.35, uLife * -0.2)).r;
    float n2 = texture2D(uNoise, vUv * 5.1 - vec2(uLife * 0.6, 0.0)).r;
    float turb = n * 0.65 + n2 * 0.35;

    // 湍流把壳撕出缺口：完整闭合的球壳就是「光球」，正是要避免的东西
    float shell = fres * smoothstep(0.25, 0.8, turb) * (0.4 + turb * 0.8);
    float fade = (1.0 - uLife) * (1.0 - uLife);
    float alpha = shell * fade * uOpacity;
    if (alpha < 0.004) discard;

    vec3 col = mix(uColorDark, uColorLit, clamp(turb * 1.3 - uLife * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

const RING_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RING_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uColor;
  uniform float uLife;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float band = smoothstep(0.55, 0.92, r) * (1.0 - smoothstep(0.94, 1.02, r));
    float n = texture2D(uNoise, vUv * 3.0 + vec2(uLife * 0.2, 0.0)).r;
    float n2 = texture2D(uNoise, vUv * 7.0 - vec2(0.0, uLife * 0.3)).r;
    float alpha = band * (0.25 + n * 0.9 * n2 * 1.6) * (1.0 - uLife) * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
  }
`;

export function createVfx({ scene, quality, textures, seed = 4242 }) {
  const rand = mulberry32(seed);
  const group = new Group();
  group.name = 'vfx';
  scene.add(group);

  const dust = makeParticleSystem({
    scene: group,
    budget: quality.dustBudget,
    texture: textures.dust,
    blending: NormalBlending,
    depthWrite: false,
    renderOrder: 3,
  });

  const embers = makeParticleSystem({
    scene: group,
    budget: quality.emberBudget,
    texture: textures.ember,
    blending: AdditiveBlending,
    depthWrite: false,
    renderOrder: 4,
  });
  embers.points.layers.enable(BLOOM_LAYER);
  embers.points.userData.bloomSelf = true;

  const dustDark = new Color(PALETTE.grime).lerp(new Color(PALETTE.rockBody), 0.4);
  const dustLit = new Color(PALETTE.rockTop).lerp(new Color(PALETTE.keyLight), 0.28);
  const emberHot = new Color(0xfff0cf);
  const emberCool = new Color(PALETTE.crackDeep);
  const tmpColor = new Color();

  function emit(ps, x, y, z, opts) {
    emitParticle(ps, x, y, z, opts, rand);
  }

  function emitDust(x, y, z, count, spread, upward, scale = 1) {
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.6);
      tmpColor.copy(dustDark).lerp(dustLit, rand() * 0.85);
      emit(dust, x + (rand() - 0.5) * 0.25, y + rand() * 0.2, z + (rand() - 0.5) * 0.25, {
        vx: Math.cos(a) * r * spread,
        vy: upward * (0.35 + rand() * 0.9),
        vz: Math.sin(a) * r * spread,
        life: 0.9 + rand() * 1.7,
        spin: (rand() - 0.5) * 1.4,
        grow: (1.6 + rand() * 2.2) * scale,
        drag: 1.9 + rand() * 1.4,
        size: (0.5 + rand() * 0.9) * scale,
        alpha: 0.3 + rand() * 0.3,
        color: tmpColor,
      });
    }
  }

  function emitEmbers(x, y, z, count, power) {
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const up = 1.5 + rand() * 3.5;
      tmpColor.copy(emberHot);
      emit(embers, x, y, z, {
        vx: Math.cos(a) * (1 + rand() * 2.4) * power,
        vy: up,
        vz: Math.sin(a) * (1 + rand() * 2.4) * power,
        life: 0.7 + rand() * 1.1,
        spin: 0,
        grow: -0.5,
        drag: 0.6,
        size: 0.06 + rand() * 0.09,
        alpha: 0.9,
        color: tmpColor,
      });
    }
  }

  // ---------- 激波壳与地面压环 ----------
  const shockGeo = new SphereGeometry(1, 20, 14);
  const ringGeo = new RingGeometry(0.05, 1, 40, 1);
  const shocks = [];
  const rings = [];

  function makeShock() {
    const mat = new ShaderMaterial({
      vertexShader: SHOCK_VERT,
      fragmentShader: SHOCK_FRAG,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: NormalBlending,
      uniforms: {
        uNoise: { value: textures.turbulence },
        uColorLit: { value: new Color(PALETTE.rockTop).lerp(new Color(PALETTE.keyLight), 0.35) },
        uColorDark: { value: new Color(PALETTE.fog).lerp(new Color(PALETTE.grime), 0.35) },
        uLife: { value: 0 },
        uOpacity: { value: 0.9 },
      },
    });
    const mesh = new Mesh(shockGeo, mat);
    mesh.visible = false;
    mesh.renderOrder = 2;
    group.add(mesh);
    const rec = { mesh, mat, t: -1, dur: 0.3, scale: new Vector3(1, 1, 1) };
    shocks.push(rec);
    return rec;
  }

  function makeRing() {
    const mat = new ShaderMaterial({
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: NormalBlending,
      uniforms: {
        uNoise: { value: textures.turbulence },
        uColor: { value: new Color(PALETTE.rockTop).lerp(new Color(PALETTE.keyLight), 0.2) },
        uLife: { value: 0 },
        uOpacity: { value: 0.6 },
      },
    });
    const mesh = new Mesh(ringGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    mesh.renderOrder = 2;
    group.add(mesh);
    const rec = { mesh, mat, t: -1, dur: 0.55, radius: 3 };
    rings.push(rec);
    return rec;
  }

  const shockPool = Array.from({ length: quality.shockRings + 2 }, makeShock);
  const ringPool = Array.from({ length: quality.shockRings + 1 }, makeRing);

  function grabShock() {
    return shockPool.find((s) => s.t < 0) ?? shockPool[0];
  }
  function grabRing() {
    return ringPool.find((s) => s.t < 0) ?? ringPool[0];
  }

  // ---------- 碎屑 ----------
  const debrisGeo = new IcosahedronGeometry(0.16, 0);
  const debrisMat = new MeshStandardMaterial({
    color: new Color(0x655d52),
    roughness: 0.98,
    metalness: 0,
    flatShading: true,
    envMapIntensity: 0.15,
  });
  const debrisMesh = new InstancedMesh(debrisGeo, debrisMat, quality.debrisBudget);
  debrisMesh.instanceMatrix.setUsage(DynamicDrawUsage);
  debrisMesh.castShadow = quality.shadows;
  debrisMesh.frustumCulled = false;
  debrisMesh.count = 0;
  group.add(debrisMesh);
  const debris = [];
  const dummy = new Object3D();

  // ---------- 地面裂纹贴花（事后痕迹） ----------
  const decalGeo = new PlaneGeometry(1, 1);
  const decals = [];
  let decalCursor = 0;
  for (let i = 0; i < quality.decalBudget; i++) {
    const mat = new MeshBasicMaterial({
      map: textures.crack,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const mesh = new Mesh(decalGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    mesh.renderOrder = 2;
    // 刻意不进辉光通道：贴花是地面的「裂开」，热量归岛心裂缝网络管。
    // 让平铺的分叉纹路吃辉光会在画面里炸出四芒星，正是手册 §10 点名的廉价信号。
    group.add(mesh);
    decals.push({ mesh, mat, t: -1, hold: 0 });
  }

  function addCrackDecal(x, z, scale, strength) {
    if (decals.length === 0) return;
    const d = decals[decalCursor % decals.length];
    decalCursor++;
    d.mesh.position.set(x, 0.016, z);
    d.mesh.rotation.z = rand() * Math.PI * 2;
    d.mesh.scale.setScalar(scale);
    d.mesh.visible = true;
    d.t = 0;
    d.peak = 0.24 + strength * 0.2;
  }

  const up = new Vector3(0, 1, 0);
  const tmpDir = new Vector3();
  let ambientAcc = 0;

  const api = {
    group,

    /** 一次扇击命中。dir 是击退方向，power 大致 0.5~2。 */
    slap(pos, dir, power = 1) {
      const p = Math.max(0.35, Math.min(2.2, power));
      tmpDir.copy(dir ?? up);
      tmpDir.y = 0;
      if (tmpDir.lengthSq() < 1e-5) tmpDir.set(0, 0, 1);
      tmpDir.normalize();

      const s = grabShock();
      s.t = 0;
      s.dur = 0.26 + p * 0.09;
      s.mesh.position.copy(pos);
      s.mesh.visible = true;
      s.mesh.lookAt(pos.x + tmpDir.x, pos.y, pos.z + tmpDir.z);
      // 压扁成一个顺着掌风方向的透镜，而不是完美的球
      s.scale.set(0.85 * p, 0.6 * p, 0.36 * p);
      s.mat.uniforms.uOpacity.value = 0.38 + p * 0.14;

      emitDust(
        pos.x + tmpDir.x * 0.3,
        pos.y,
        pos.z + tmpDir.z * 0.3,
        Math.round(15 * p * (quality.name === 'low' ? 0.4 : 1)),
        2.6 * p,
        0.8,
        0.8 + p * 0.2
      );
      if (quality.name !== 'low') emitEmbers(pos.x, pos.y, pos.z, Math.round(3 * p), 0.6);
    },

    /** 重击 / 砸地：加一圈贴地压环、碎屑与裂纹残留。 */
    heavyImpact(pos, power = 1, opts = {}) {
      const p = Math.max(0.5, Math.min(2.5, power));
      api.slap(pos, opts.dir ?? up, p);

      const r = grabRing();
      r.t = 0;
      r.dur = 0.5 + p * 0.15;
      r.radius = 2.4 * p;
      r.mesh.position.set(pos.x, 0.05, pos.z);
      r.mesh.visible = true;

      emitDust(pos.x, 0.1, pos.z, Math.round(22 * p * (quality.name === 'low' ? 0.35 : 1)), 4.2 * p, 0.5, 1.3);
      emitEmbers(pos.x, 0.2, pos.z, Math.round(6 * p * (quality.name === 'low' ? 0.3 : 1)), 1.0);
      api.spawnDebris(pos, p);
      if (opts.crack !== false) addCrackDecal(pos.x, pos.z, 1.9 + p * 1.1, Math.min(1, p / 2));
    },

    spawnDebris(pos, power) {
      const wanted = Math.round(quality.debrisPerBurst * Math.min(1.6, power));
      for (let i = 0; i < wanted; i++) {
        if (debris.length >= quality.debrisBudget) break;
        const a = rand() * Math.PI * 2;
        const sp = (1.5 + rand() * 4) * power;
        debris.push({
          p: new Vector3(pos.x + (rand() - 0.5) * 0.5, pos.y + 0.15, pos.z + (rand() - 0.5) * 0.5),
          v: new Vector3(Math.cos(a) * sp * 0.6, 3 + rand() * 4.5, Math.sin(a) * sp * 0.6),
          rot: new Vector3(rand() * 6, rand() * 6, rand() * 6),
          spin: new Vector3((rand() - 0.5) * 9, (rand() - 0.5) * 9, (rand() - 0.5) * 9),
          scale: 0.32 + rand() * 0.7,
          life: 0,
          maxLife: 2.0 + rand() * 1.2,
        });
      }
    },

    /** 脚步扬尘：只有走得够快才有，且贴地、量少。 */
    footDust(x, y, z, speed) {
      if (!quality.footDust) return;
      if (speed < 3.2) return;
      emitDust(x, y + 0.06, z, 1, 0.6, 0.25, 0.55);
    },

    /** 掉出岛外：留一串下坠的尘尾。 */
    fallTrail(x, y, z) {
      emitDust(x, y, z, 1, 0.5, -0.4, 0.9);
    },

    /**
     * 环境浮尘。裂缝一直在往上冒热气，台面一直在掉渣，所以空气里本来就该有东西。
     * 它同时充当构图的前景层：偶尔有一两粒尘从镜头前飘过，画面立刻有了纵深。
     */
    ambientDrift(dt, focus) {
      if (quality.name === 'low') return;
      ambientAcc += dt;
      const interval = quality.name === 'high' ? 0.16 : 0.34;
      while (ambientAcc > interval) {
        ambientAcc -= interval;
        const a = rand() * Math.PI * 2;
        const r = 2 + rand() * 13;
        tmpColor.copy(dustDark).lerp(dustLit, rand() * 0.7);
        emit(dust, focus.x + Math.cos(a) * r, 0.3 + rand() * 4.5, focus.z + Math.sin(a) * r, {
          vx: (rand() - 0.5) * 0.25,
          vy: 0.18 + rand() * 0.3,
          vz: (rand() - 0.5) * 0.25,
          life: 4 + rand() * 4,
          spin: (rand() - 0.5) * 0.3,
          grow: 0.5,
          drag: 0.25,
          size: 0.16 + rand() * 0.3,
          alpha: 0.05 + rand() * 0.07,
          color: tmpColor,
        });
      }
    },

    /** 觉醒：手套周围少量上升的余烬，说明「掌意」是热的。 */
    awakenMotes(x, y, z) {
      if (quality.name === 'low') return;
      if (rand() > 0.35) return;
      emitEmbers(x, y, z, 1, 0.25);
    },

    crack(x, z, scale = 4, strength = 1) {
      addCrackDecal(x, z, scale, strength);
    },

    update(dt, time) {
      void time;
      // --- 粒子 ---
      for (const ps of [dust, embers]) {
        const a = ps.arrays;
        const isEmber = ps === embers;
        for (let i = ps.count - 1; i >= 0; i--) {
          ps.life[i] += dt;
          const t = ps.life[i] / ps.maxLife[i];
          if (t >= 1) {
            swapRemove(ps, i);
            continue;
          }
          const dragK = Math.exp(-ps.drag[i] * dt);
          ps.vel[i * 3] *= dragK;
          ps.vel[i * 3 + 2] *= dragK;
          // 尘埃有浮力也有重量：先被顶起来，然后慢慢沉下去
          ps.vel[i * 3 + 1] = isEmber
            ? ps.vel[i * 3 + 1] * dragK - 2.2 * dt
            : (ps.vel[i * 3 + 1] - 1.1 * dt) * dragK;
          a.pos[i * 3] += ps.vel[i * 3] * dt;
          a.pos[i * 3 + 1] += ps.vel[i * 3 + 1] * dt;
          a.pos[i * 3 + 2] += ps.vel[i * 3 + 2] * dt;
          if (!isEmber && a.pos[i * 3 + 1] < 0.04 && ps.vel[i * 3 + 1] < 0) {
            // 落地不是消失，是贴地摊开
            a.pos[i * 3 + 1] = 0.04;
            ps.vel[i * 3 + 1] = 0;
            ps.vel[i * 3] *= 0.86;
            ps.vel[i * 3 + 2] *= 0.86;
          }
          a.rot[i] += ps.spin[i] * dt;
          a.size[i] = ps.baseSize[i] + ps.grow[i] * t;
          if (isEmber) {
            // 余烬从白热冷却到暗红，靠变色 + 缩小消失，而不是直接 pop
            tmpColor.copy(emberHot).lerp(emberCool, Math.min(1, t * 1.5));
            a.color[i * 3] = tmpColor.r;
            a.color[i * 3 + 1] = tmpColor.g;
            a.color[i * 3 + 2] = tmpColor.b;
            a.alpha[i] = ps.baseAlpha[i] * (1 - t * t);
          } else {
            const fadeIn = Math.min(1, t / 0.12);
            a.alpha[i] = ps.baseAlpha[i] * fadeIn * (1 - t) * (1 - t * 0.4);
          }
        }
        flushParticles(ps);
      }

      // --- 激波壳 ---
      for (const s of shocks) {
        if (s.t < 0) continue;
        s.t += dt / s.dur;
        if (s.t >= 1) {
          s.t = -1;
          s.mesh.visible = false;
          continue;
        }
        const e = 1 - Math.pow(1 - s.t, 2.4);
        const k = 0.45 + e * 2.2;
        s.mesh.scale.set(s.scale.x * k, s.scale.y * k, s.scale.z * k * (1 + e * 1.4));
        s.mat.uniforms.uLife.value = s.t;
      }

      for (const r of rings) {
        if (r.t < 0) continue;
        r.t += dt / r.dur;
        if (r.t >= 1) {
          r.t = -1;
          r.mesh.visible = false;
          continue;
        }
        const e = 1 - Math.pow(1 - r.t, 2.6);
        r.mesh.scale.setScalar(0.4 + e * r.radius);
        r.mat.uniforms.uLife.value = r.t;
      }

      // --- 碎屑 ---
      if (debris.length > 0) {
        const merged = quality.mergedDebris;
        for (let i = debris.length - 1; i >= 0; i--) {
          const d = debris[i];
          d.life += dt;
          if (d.life >= d.maxLife) {
            debris.splice(i, 1);
            continue;
          }
          d.v.y -= 22 * dt;
          d.p.addScaledVector(d.v, dt);
          if (d.p.y < 0.08) {
            d.p.y = 0.08;
            d.v.y *= -0.32;
            d.v.x *= 0.62;
            d.v.z *= 0.62;
            d.spin.multiplyScalar(0.5);
          }
          if (!merged) {
            d.rot.x += d.spin.x * dt;
            d.rot.y += d.spin.y * dt;
            d.rot.z += d.spin.z * dt;
          }
        }
        debrisMesh.count = Math.min(debris.length, quality.debrisBudget);
        for (let i = 0; i < debrisMesh.count; i++) {
          const d = debris[i];
          dummy.position.copy(d.p);
          // 低档：碎屑合批成一批不再逐块翻滚的石渣，只保留抛物线与缩放淡出
          dummy.rotation.set(d.rot.x, d.rot.y, d.rot.z);
          const fade = 1 - Math.max(0, (d.life - d.maxLife * 0.7) / (d.maxLife * 0.3));
          dummy.scale.setScalar(d.scale * fade);
          dummy.updateMatrix();
          debrisMesh.setMatrixAt(i, dummy.matrix);
        }
        debrisMesh.instanceMatrix.needsUpdate = true;
        debrisMesh.visible = debrisMesh.count > 0;
      } else if (debrisMesh.count !== 0) {
        debrisMesh.count = 0;
        debrisMesh.visible = false;
      }

      // --- 裂纹贴花：淡入后长时间留着，最后才慢慢被灰掩盖 ---
      for (const d of decals) {
        if (d.t < 0) continue;
        d.t += dt;
        const fadeIn = Math.min(1, d.t / 0.18);
        const fadeOut = d.t > 9 ? Math.max(0, 1 - (d.t - 9) / 6) : 1;
        d.mat.opacity = (d.peak ?? 0.8) * fadeIn * fadeOut;
        if (fadeOut <= 0) {
          d.t = -1;
          d.mesh.visible = false;
        }
      }
    },

    setPixelScale(v) {
      dust.mat.uniforms.uPixelScale.value = v;
      embers.mat.uniforms.uPixelScale.value = v;
    },

    dispose() {
      dust.dispose();
      embers.dispose();
      shockGeo.dispose();
      ringGeo.dispose();
      for (const s of shocks) s.mat.dispose();
      for (const r of rings) r.mat.dispose();
      for (const d of decals) d.mat.dispose();
      decalGeo.dispose();
      debrisGeo.dispose();
      debrisMat.dispose();
      scene.remove(group);
    },
  };

  return api;
}
