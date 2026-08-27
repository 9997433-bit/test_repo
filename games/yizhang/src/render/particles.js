// 点精灵粒子池。
//
// 打击特效（./vfx.js）与安全区的展示掌 idle 特效（./hub-vfx.js）用的是同一套点精灵：
// 同一份着色器、同一套「JS 侧存模拟数据、GPU 只负责画」的布局。抽在这里是为了让两边
// 共用一条 uPixelScale 的换算（点的大小按后备缓冲高度算，换分辨率时颗粒不会忽大忽小），
// 也避免两份几乎一样的着色器各自漂移。
//
// 约定：粒子是**有纹理、有旋转、会被雾吃掉**的碎屑，不是加法混合的亮点。
// 只有真的高温的东西（余烬）才用 AdditiveBlending，其余一律 NormalBlending。

import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
} from 'three';
import { PALETTE } from './config.js';

export const PARTICLE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aRot;
  attribute vec3 aColor;
  uniform float uPixelScale;
  varying float vAlpha;
  varying float vRot;
  varying vec3 vColor;
  varying float vFog;
  void main() {
    vAlpha = aAlpha;
    vRot = aRot;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = -mv.z;
    vFog = 1.0 - exp(-pow(dist * 0.0065, 2.0));
    gl_PointSize = aSize * uPixelScale / max(dist, 0.4);
    gl_Position = projectionMatrix * mv;
  }
`;

export const PARTICLE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uFogColor;
  uniform float uFogAmount;
  varying float vAlpha;
  varying float vRot;
  varying vec3 vColor;
  varying float vFog;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float s = sin(vRot);
    float c = cos(vRot);
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;
    vec4 tex = texture2D(uMap, uv);
    float a = tex.a * vAlpha;
    if (a < 0.004) discard;
    vec3 col = mix(vColor, uFogColor, vFog * uFogAmount);
    gl_FragColor = vec4(col, a);
  }
`;

/**
 * 一池点精灵。位置/颜色/大小在 GPU 缓冲里，速度/寿命/阻力留在 JS 侧，
 * 于是「有重量、会被拖住、落地摊开」这些事都能在 CPU 上老实地算出来。
 *
 * @param {object}  o
 * @param {import('three').Object3D} o.scene  挂到哪个节点下
 * @param {number}  o.budget    上限颗数（按画质档给）
 * @param {*}       o.texture   精灵贴图
 * @param {*}       o.blending  混合方式
 * @param {boolean} [o.depthWrite=false]
 * @param {number}  [o.renderOrder=3]
 */
export function makeParticleSystem({ scene, budget, texture, blending, depthWrite, renderOrder }) {
  const cap = Math.max(1, Math.floor(budget));
  const pos = new Float32Array(cap * 3);
  const size = new Float32Array(cap);
  const alpha = new Float32Array(cap);
  const rot = new Float32Array(cap);
  const color = new Float32Array(cap * 3);

  const geo = new BufferGeometry();
  const posAttr = new Float32BufferAttribute(pos, 3).setUsage(DynamicDrawUsage);
  const sizeAttr = new Float32BufferAttribute(size, 1).setUsage(DynamicDrawUsage);
  const alphaAttr = new Float32BufferAttribute(alpha, 1).setUsage(DynamicDrawUsage);
  const rotAttr = new Float32BufferAttribute(rot, 1).setUsage(DynamicDrawUsage);
  const colorAttr = new Float32BufferAttribute(color, 3).setUsage(DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aSize', sizeAttr);
  geo.setAttribute('aAlpha', alphaAttr);
  geo.setAttribute('aRot', rotAttr);
  geo.setAttribute('aColor', colorAttr);
  geo.setDrawRange(0, 0);

  const mat = new ShaderMaterial({
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true,
    depthWrite: !!depthWrite,
    blending,
    uniforms: {
      uMap: { value: texture },
      uPixelScale: { value: 520 },
      uFogColor: { value: new Color(PALETTE.fog) },
      uFogAmount: { value: blending === AdditiveBlending ? 0.2 : 1.0 },
    },
  });

  const points = new Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = renderOrder ?? 3;
  scene.add(points);

  return {
    points,
    geo,
    mat,
    budget: cap,
    count: 0,
    vel: new Float32Array(cap * 3),
    life: new Float32Array(cap),
    maxLife: new Float32Array(cap),
    spin: new Float32Array(cap),
    grow: new Float32Array(cap),
    drag: new Float32Array(cap),
    baseSize: new Float32Array(cap),
    baseAlpha: new Float32Array(cap),
    arrays: { pos, size, alpha, rot, color },
    attrs: { posAttr, sizeAttr, alphaAttr, rotAttr, colorAttr },
    dispose() {
      scene.remove(points);
      geo.dispose();
      mat.dispose();
    },
  };
}

/** 死掉的那颗和队尾对调再缩短队列：不留空洞，drawRange 永远是紧凑的一段。 */
export function swapRemove(ps, i) {
  const last = ps.count - 1;
  if (i !== last) {
    const a = ps.arrays;
    for (let k = 0; k < 3; k++) {
      a.pos[i * 3 + k] = a.pos[last * 3 + k];
      a.color[i * 3 + k] = a.color[last * 3 + k];
      ps.vel[i * 3 + k] = ps.vel[last * 3 + k];
    }
    a.size[i] = a.size[last];
    a.alpha[i] = a.alpha[last];
    a.rot[i] = a.rot[last];
    ps.life[i] = ps.life[last];
    ps.maxLife[i] = ps.maxLife[last];
    ps.spin[i] = ps.spin[last];
    ps.grow[i] = ps.grow[last];
    ps.drag[i] = ps.drag[last];
    ps.baseSize[i] = ps.baseSize[last];
    ps.baseAlpha[i] = ps.baseAlpha[last];
  }
  ps.count = last;
}

/**
 * 放一颗粒子。超出预算就直接丢掉这一颗 —— 宁可少几粒，也不要为了「都要放出来」
 * 去挤掉正在演的那批（那会让画面看起来在闪）。
 * @returns {number} 这颗粒子的下标，池满时返回 -1
 */
export function emitParticle(ps, x, y, z, o, rand = Math.random) {
  if (ps.count >= ps.budget) return -1;
  const i = ps.count++;
  const a = ps.arrays;
  a.pos[i * 3] = x;
  a.pos[i * 3 + 1] = y;
  a.pos[i * 3 + 2] = z;
  ps.vel[i * 3] = o.vx;
  ps.vel[i * 3 + 1] = o.vy;
  ps.vel[i * 3 + 2] = o.vz;
  ps.life[i] = 0;
  ps.maxLife[i] = o.life;
  ps.spin[i] = o.spin;
  ps.grow[i] = o.grow;
  ps.drag[i] = o.drag;
  ps.baseSize[i] = o.size;
  ps.baseAlpha[i] = o.alpha;
  a.size[i] = o.size;
  a.alpha[i] = o.alpha;
  a.rot[i] = o.rot ?? rand() * Math.PI * 2;
  a.color[i * 3] = o.color.r;
  a.color[i * 3 + 1] = o.color.g;
  a.color[i * 3 + 2] = o.color.b;
  return i;
}

/** 每帧把 CPU 侧改过的属性推给 GPU。 */
export function flushParticles(ps) {
  ps.geo.setDrawRange(0, ps.count);
  if (ps.count > 0) {
    ps.attrs.posAttr.needsUpdate = true;
    ps.attrs.sizeAttr.needsUpdate = true;
    ps.attrs.alphaAttr.needsUpdate = true;
    ps.attrs.rotAttr.needsUpdate = true;
    ps.attrs.colorAttr.needsUpdate = true;
  }
  ps.points.visible = ps.count > 0;
}
