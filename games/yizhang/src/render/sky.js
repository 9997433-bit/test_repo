// 暮蓝天穹、云海与环境球。
//
// 三层空间（手册 §6.5 / §8.1）：裂岛是中景，脚下的云海是后景，镜头前偶发的尘絮是前景。
// 天穹里能看到那颗低角度的落日 —— 主光「有来源」，而不是凭空来的方向光。

import {
  BackSide,
  Color,
  CubeTexture,
  DoubleSide,
  FogExp2,
  Mesh,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  linearToSrgb,
} from './gfx/index.js';
import { PALETTE } from './config.js';

const SKY_VERT = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(world.xyz - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// 输出线性色：本渲染器把主场景画进 HDR RT，色调映射统一放在合成阶段做。
const SKY_FRAG = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uWarm;
  uniform vec3 uSunColor;
  uniform vec3 uSunDir;
  uniform float uExposure;
  varying vec3 vWorldDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);

    vec3 col = mix(uHorizon, uMid, smoothstep(0.42, 0.62, h));
    col = mix(col, uZenith, smoothstep(0.58, 0.95, h));

    // 落日方位的暖霾：只在地平线附近、只在太阳那一侧
    float sunAmount = max(dot(dir, uSunDir), 0.0);
    float horizonBand = exp(-pow(max(dir.y, -0.35) * 3.4, 2.0));
    col = mix(col, uWarm, pow(sunAmount, 3.0) * horizonBand * 0.85);

    // 太阳本体：小、柔、不过曝，作为主光的可见依据
    col += uSunColor * pow(sunAmount, 220.0) * 1.6;
    col += uSunColor * pow(sunAmount, 14.0) * 0.12 * horizonBand;

    // 地平线下方渐渐并入云海的冷雾
    col = mix(col * 0.72, col, smoothstep(-0.25, 0.05, dir.y));

    // 稀疏的早星，只在天顶，弱到几乎看不见
    vec2 sp = dir.xz / max(abs(dir.y), 0.001);
    float star = step(0.9985, hash21(floor(sp * 240.0)));
    col += vec3(0.55, 0.62, 0.78) * star * smoothstep(0.55, 0.95, h) * 0.5;

    // 抖动，压掉大面积渐变的色带
    float dither = (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col * uExposure + dither, 1.0);
  }
`;

const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const CLOUD_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uLit;
  uniform vec3 uShadow;
  uniform vec3 uSunDir;
  uniform float uTime;
  uniform float uDensity;
  uniform float uScale;
  uniform float uOpacity;
  uniform vec3 uHaze;
  uniform float uFadeNear;
  uniform float uFadeFar;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vec2 p = vUv * uScale;
    float a = texture2D(uNoise, p + vec2(uTime * 0.004, uTime * 0.0016)).r;
    float b = texture2D(uNoise, p * 2.13 - vec2(uTime * 0.0027, 0.0)).r;
    float c = texture2D(uNoise, p * 0.47 + vec2(0.0, uTime * 0.0009)).r;
    float d = a * 0.5 + b * 0.28 + c * 0.42;

    float mask = smoothstep(uDensity + 0.22, uDensity - 0.08, 1.0 - d);
    // 边缘化开，避免看见平面的直边
    float radial = 1.0 - smoothstep(0.30, 0.5, length(vUv - 0.5));
    float alpha = mask * radial * uOpacity;

    // 距离雾。水平的云板被平视时会在地平线上叠成一堵发白的墙，把暮蓝全洗掉；
    // 让远端的云溶进大气色并把不透明度收掉，云海才是「散开的」而不是「一块板」。
    float dist = length(vWorld - cameraPosition);
    float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);
    alpha *= fade;
    if (alpha < 0.004) discard;

    // 朝太阳一侧的云被打亮，背光侧留冷蓝，云才有体积
    vec3 toSun = normalize(vec3(uSunDir.x, 0.0, uSunDir.z));
    float facing = dot(normalize(vec3(vWorld.x, 0.0, vWorld.z) + 0.0001), toSun) * 0.5 + 0.5;
    vec3 col = mix(uShadow, uLit, facing * 0.75 + d * 0.25);
    col = mix(col, uHaze, smoothstep(uFadeNear * 0.35, uFadeFar, dist) * 0.9);
    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * 环境球。取值与 SKY_FRAG 同一套渐变（天顶 / 中天 / 地平 / 暖霾 + 落日盘），只是
 * 在 CPU 上逐方向算一遍烘成立方图 —— 粗糙度响应与天光颜色因此天然一致，而且不必
 * 为了拿一张 IBL 先把天空整个渲一遍。
 *
 * 输出走 sRGB 编码：8 位通道存线性值会在暮色这种低亮度区段肉眼可见地断层。
 */
function bakeSkyEnvironment(sunDir, size = 32) {
  const zenith = new Color(PALETTE.skyZenith);
  const mid = new Color(PALETTE.skyMid);
  const horizon = new Color(PALETTE.skyHorizon);
  const warm = new Color(PALETTE.skyWarm);
  const sun = new Color(PALETTE.sunDisc);
  const sx = sunDir.x;
  const sy = sunDir.y;
  const sz = sunDir.z;

  const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  // 立方图六面的方向约定（+X, -X, +Y, -Y, +Z, -Z）
  const dirOf = (face, s, t) => {
    switch (face) {
      case 0: return [1, -t, -s];
      case 1: return [-1, -t, s];
      case 2: return [s, 1, t];
      case 3: return [s, -1, -t];
      case 4: return [s, -t, 1];
      default: return [-s, -t, -1];
    }
  };

  const faces = [];
  for (let f = 0; f < 6; f++) {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const s = (2 * (x + 0.5)) / size - 1;
        const t = (2 * (y + 0.5)) / size - 1;
        const d = dirOf(f, s, t);
        const len = Math.hypot(d[0], d[1], d[2]) || 1;
        const dx = d[0] / len;
        const dy = d[1] / len;
        const dz = d[2] / len;

        const h = Math.min(1, Math.max(0, dy * 0.5 + 0.5));
        const a = smoothstep(0.42, 0.62, h);
        const b = smoothstep(0.58, 0.95, h);
        let r = lerp(lerp(horizon.r, mid.r, a), zenith.r, b);
        let g = lerp(lerp(horizon.g, mid.g, a), zenith.g, b);
        let bl = lerp(lerp(horizon.b, mid.b, a), zenith.b, b);

        const sunAmount = Math.max(0, dx * sx + dy * sy + dz * sz);
        const band = Math.exp(-Math.pow(Math.max(dy, -0.35) * 3.4, 2));
        const warmth = Math.pow(sunAmount, 3) * band * 0.85;
        r = lerp(r, warm.r, warmth);
        g = lerp(g, warm.g, warmth);
        bl = lerp(bl, warm.b, warmth);

        const disc = Math.pow(sunAmount, 220) * 1.6 + Math.pow(sunAmount, 14) * 0.12 * band;
        r += sun.r * disc;
        g += sun.g * disc;
        bl += sun.b * disc;

        const below = smoothstep(-0.25, 0.05, dy);
        r = lerp(r * 0.72, r, below);
        g = lerp(g * 0.72, g, below);
        bl = lerp(bl * 0.72, bl, below);

        const o = (y * size + x) * 4;
        data[o] = Math.round(Math.min(1, Math.max(0, linearToSrgb(r))) * 255);
        data[o + 1] = Math.round(Math.min(1, Math.max(0, linearToSrgb(g))) * 255);
        data[o + 2] = Math.round(Math.min(1, Math.max(0, linearToSrgb(bl))) * 255);
        data[o + 3] = 255;
      }
    }
    faces.push(data);
  }

  const tex = new CubeTexture(faces, size);
  tex.colorSpace = SRGBColorSpace;
  tex.name = 'sky-environment';
  return tex;
}

export function createSky({ scene, quality, textures, sunDir }) {
  const skyGeo = new SphereGeometry(900, 32, 20);
  const skyMat = new ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uZenith: { value: new Color(PALETTE.skyZenith) },
      uMid: { value: new Color(PALETTE.skyMid) },
      uHorizon: { value: new Color(PALETTE.skyHorizon) },
      uWarm: { value: new Color(PALETTE.skyWarm) },
      uSunColor: { value: new Color(PALETTE.sunDisc) },
      uSunDir: { value: sunDir.clone().normalize() },
      uExposure: { value: 1.0 },
    },
  });
  const skyMesh = new Mesh(skyGeo, skyMat);
  skyMesh.name = 'sky';
  skyMesh.frustumCulled = false;
  skyMesh.renderOrder = -1000;

  // 环境球：与天穹同源的一张立方图（见 bakeSkyEnvironment）
  const envTexture = bakeSkyEnvironment(sunDir.clone().normalize(), quality.name === 'low' ? 16 : 32);

  scene.add(skyMesh);
  scene.environment = envTexture;
  scene.environmentIntensity = 0.45;
  scene.fog = new FogExp2(new Color(PALETTE.fog).getHex(), 0.0065);

  // 云海：岛下方的水平层，慢速漂移，给悬浮感与后景
  const clouds = [];
  const layerDefs = [
    { y: -34, size: 900, density: 0.46, scale: 2.6, opacity: 0.5, fadeNear: 260, fadeFar: 1100 },
    { y: -70, size: 1500, density: 0.52, scale: 1.7, opacity: 0.42, fadeNear: 460, fadeFar: 1900 },
    { y: -120, size: 2400, density: 0.6, scale: 1.15, opacity: 0.4, fadeNear: 780, fadeFar: 3000 },
  ].slice(0, quality.cloudLayers);

  for (const def of layerDefs) {
    const mat = new ShaderMaterial({
      vertexShader: CLOUD_VERT,
      fragmentShader: CLOUD_FRAG,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      fog: false,
      uniforms: {
        uNoise: { value: textures.turbulence },
        uLit: { value: new Color(PALETTE.cloudLit) },
        uShadow: { value: new Color(PALETTE.cloudShadow) },
        uSunDir: { value: sunDir.clone().normalize() },
        uTime: { value: 0 },
        uDensity: { value: def.density },
        uScale: { value: def.scale },
        uOpacity: { value: def.opacity },
        uHaze: { value: new Color(PALETTE.fog).lerp(new Color(PALETTE.skyHorizon), 0.5) },
        uFadeNear: { value: def.fadeNear },
        uFadeFar: { value: def.fadeFar },
      },
    });
    const mesh = new Mesh(new PlaneGeometry(def.size, def.size, 1, 1), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = def.y;
    mesh.renderOrder = -900;
    mesh.frustumCulled = false;
    scene.add(mesh);
    clouds.push(mesh);
  }

  return {
    skyMesh,
    clouds,
    envTexture,
    update(time, cameraPos) {
      skyMesh.position.copy(cameraPos);
      for (const c of clouds) {
        c.material.uniforms.uTime.value = time;
        c.position.x = cameraPos.x * 0.35;
        c.position.z = cameraPos.z * 0.35;
      }
    },
    dispose() {
      scene.remove(skyMesh);
      skyGeo.dispose();
      skyMat.dispose();
      for (const c of clouds) {
        scene.remove(c);
        c.geometry.dispose();
        c.material.dispose();
      }
      envTexture.dispose();
      scene.environment = null;
      scene.fog = null;
    },
  };
}

export const SUN_DIRECTION = new Vector3(-0.58, 0.42, 0.38).normalize();
