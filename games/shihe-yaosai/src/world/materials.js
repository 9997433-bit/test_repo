// Opus-2 世界 · 材质工厂。
// 全程程序化：没有任何外部贴图 / 模型 / CDN 资源。
// PBR 需要环境光照才能让金属不发黑，这里用 RawCubeTexture 现算一张 32² 的渐变天空盒。

import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { RawCubeTexture } from "@babylonjs/core/Materials/Textures/rawCubeTexture.js";
import { Constants } from "@babylonjs/core/Engines/constants.js";

import { PALETTE } from "./constants.js";

/** [r,g,b] -> Color3。 */
export function color3(rgb) {
  return new Color3(rgb[0], rgb[1], rgb[2]);
}

/** 线性插值两个 [r,g,b]。 */
export function mixRgb(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

/** 就地写入 Color3，避免每帧 new。 */
export function setColor(target, rgb) {
  target.r = rgb[0];
  target.g = rgb[1];
  target.b = rgb[2];
  return target;
}

export function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

const CUBE_FACE_BASIS = [
  // +X, -X, +Y, -Y, +Z, -Z：给定 uv 求方向。
  (u, v) => [1, -v, -u],
  (u, v) => [-1, -v, u],
  (u, v) => [u, 1, v],
  (u, v) => [u, -1, -v],
  (u, v) => [u, -v, 1],
  (u, v) => [-u, -v, -1],
];

/**
 * 现算一张低分辨率环境立方图：顶部冷蓝、地平线暗青、底部近黑，
 * 再叠一点主光方向上的暖色，让甲板与炮塔的金属面有可读的反射层次。
 */
export function createProceduralEnvironment(scene, size = 32) {
  const faces = [];
  const sunDir = [-0.52, 0.62, -0.58];
  const sunLen = Math.hypot(sunDir[0], sunDir[1], sunDir[2]);
  sunDir[0] /= sunLen;
  sunDir[1] /= sunLen;
  sunDir[2] /= sunLen;

  for (let face = 0; face < 6; face += 1) {
    const data = new Uint8Array(size * size * 4);
    const basis = CUBE_FACE_BASIS[face];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const u = (2 * (x + 0.5)) / size - 1;
        const v = (2 * (y + 0.5)) / size - 1;
        const dir = basis(u, v);
        const len = Math.hypot(dir[0], dir[1], dir[2]);
        const nx = dir[0] / len;
        const ny = dir[1] / len;
        const nz = dir[2] / len;

        const up = clamp01(ny * 0.5 + 0.5);
        const sky = 0.06 + 0.3 * up * up;
        const horizon = Math.pow(1 - Math.abs(ny), 5) * 0.16;
        const sun = Math.pow(clamp01(nx * sunDir[0] + ny * sunDir[1] + nz * sunDir[2]), 12) * 0.85;

        const r = clamp01(sky * 0.55 + horizon * 1.1 + sun * 1.0);
        const g = clamp01(sky * 0.78 + horizon * 0.95 + sun * 0.78);
        const b = clamp01(sky * 1.15 + horizon * 0.85 + sun * 0.5);

        const o = (y * size + x) * 4;
        data[o] = Math.round(r * 255);
        data[o + 1] = Math.round(g * 255);
        data[o + 2] = Math.round(b * 255);
        data[o + 3] = 255;
      }
    }
    faces.push(data);
  }

  const texture = new RawCubeTexture(
    scene,
    faces,
    size,
    Constants.TEXTUREFORMAT_RGBA,
    Constants.TEXTURETYPE_UNSIGNED_BYTE,
    true,
    false,
    Constants.TEXTURE_TRILINEAR_SAMPLINGMODE
  );
  texture.name = "world-env";
  texture.gammaSpace = false;
  return texture;
}

/** 暗金属：甲板、插座基座、炮塔本体共用的基底。 */
export function createMetal(scene, name, rgb, opts = {}) {
  const mat = new PBRMaterial(name, scene);
  mat.albedoColor = color3(rgb);
  mat.metallic = opts.metallic ?? 0.82;
  mat.roughness = opts.roughness ?? 0.45;
  mat.environmentIntensity = opts.environmentIntensity ?? 1.1;
  mat.emissiveColor = color3(opts.emissive ?? [0, 0, 0]);
  mat.emissiveIntensity = opts.emissiveIntensity ?? 1;
  mat.backFaceCulling = opts.backFaceCulling ?? true;
  mat.ambientColor = color3(opts.ambient ?? [0.03, 0.04, 0.06]);
  return mat;
}

/** 自发光 PBR：星核与炮塔的发光件。 */
export function createEmissive(scene, name, rgb, intensity = 1.4, opts = {}) {
  const mat = new PBRMaterial(name, scene);
  mat.albedoColor = color3(opts.albedo ?? [0.02, 0.02, 0.03]);
  mat.metallic = opts.metallic ?? 0.1;
  mat.roughness = opts.roughness ?? 0.6;
  mat.emissiveColor = color3(rgb);
  mat.emissiveIntensity = intensity;
  mat.environmentIntensity = opts.environmentIntensity ?? 0.4;
  mat.disableLighting = opts.disableLighting ?? false;
  if (opts.alpha !== undefined && opts.alpha < 1) {
    mat.alpha = opts.alpha;
    mat.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
  }
  mat.backFaceCulling = opts.backFaceCulling ?? true;
  return mat;
}

/** 加色发光：轨道导引环、弹道拖影这类纯光带。 */
export function createAdditive(scene, name, rgb, opts = {}) {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.Black();
  mat.specularColor = Color3.Black();
  mat.emissiveColor = color3(rgb);
  mat.disableLighting = true;
  mat.backFaceCulling = false;
  mat.alpha = opts.alpha ?? 1;
  mat.alphaMode = Constants.ALPHA_ADD;
  mat.disableDepthWrite = true;
  mat.freeze?.();
  return mat;
}

/** 纯顶点色的无光照材质：星尘天穹与星点。 */
export function createUnlitVertexColor(scene, name, opts = {}) {
  const mat = new StandardMaterial(name, scene);
  mat.diffuseColor = Color3.White();
  mat.specularColor = Color3.Black();
  mat.emissiveColor = Color3.Black();
  mat.ambientColor = Color3.Black();
  mat.disableLighting = true;
  mat.backFaceCulling = opts.backFaceCulling ?? true;
  if (opts.pointsCloud) {
    mat.pointsCloud = true;
    mat.pointSize = opts.pointSize ?? 2;
  }
  return mat;
}

export const FOG_COLOR = color3(PALETTE.fog);
export const BACKGROUND_COLOR = PALETTE.background;
