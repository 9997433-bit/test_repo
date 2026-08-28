// 后端 · 材质映射。
//
//   MeshStandardMaterial / MeshPhysicalMaterial → PBRMaterial
//   MeshBasicMaterial / LineBasicMaterial       → PBRMaterial（unlit）
//   ShaderMaterial / RawShaderMaterial          → Babylon ShaderMaterial（前言见 ./glsl.js）
//
// 色彩纪律：适配层的 Color 一律是线性值，PBRMaterial 的 albedo/emissive 同样按线性理解，
// 所以两边直接对拷。色调映射与 sRGB 编码全部留到后期合成着色器里做，因此这里把引擎的
// image processing 挪到「后处理阶段」，材质本身输出线性 HDR。

import { Constants } from '@babylonjs/core/Engines/constants.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Material as BMaterial } from '@babylonjs/core/Materials/material.js';
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.js';
import { PBRMaterial } from '@babylonjs/core/Materials/PBR/pbrMaterial.js';
import { ShaderMaterial as BShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial.js';
import { Vector2 as BVector2 } from '@babylonjs/core/Maths/math.vector.js';
import { Vector3 as BVector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Vector4 as BVector4 } from '@babylonjs/core/Maths/math.vector.js';
import { Matrix as BMatrix } from '@babylonjs/core/Maths/math.vector.js';

import {
  AdditiveBlending,
  BackSide,
  DoubleSide,
  MultiplyBlending,
  NoBlending,
  SubtractiveBlending,
} from '../constants.js';
import { translateShader, usesInstanceMatrix } from './glsl.js';
import { resolveTexture } from './textures.js';

/** 同时点亮的灯：主光 + 天空补光 + 边缘光 + 裂缝两盏 + 安全区门光，留一点余量。 */
const MAX_LIGHTS = 8;

function alphaModeOf(blending) {
  switch (blending) {
    case AdditiveBlending:
      return Constants.ALPHA_ADD;
    case SubtractiveBlending:
      return Constants.ALPHA_SUBTRACT;
    case MultiplyBlending:
      return Constants.ALPHA_MULTIPLY;
    default:
      return Constants.ALPHA_COMBINE;
  }
}

function applyCommonState(bm, src) {
  bm.backFaceCulling = src.side !== DoubleSide;
  bm.sideOrientation =
    src.side === BackSide ? BMaterial.ClockWiseSideOrientation : BMaterial.CounterClockWiseSideOrientation;
  bm.alpha = src.opacity ?? 1;
  bm.alphaMode = alphaModeOf(src.blending);
  bm.disableDepthWrite = src.depthWrite === false;
  bm.depthFunction = src.depthTest === false ? Constants.ALWAYS : 0;
  bm.zOffset = src.polygonOffset ? src.polygonOffsetFactor : 0;
  bm.zOffsetUnits = src.polygonOffset ? src.polygonOffsetUnits : 0;
  bm.wireframe = !!src.wireframe;
  bm.fogEnabled = src.fog !== false;
  bm.separateCullingPass = false;
  if (src.blending === NoBlending) bm.alphaMode = Constants.ALPHA_DISABLE;
}

/**
 * 材质扩展：原本靠改写内建着色器片段做的两件事（岩壳的宏观磨损、贴花的逐实例淡入）
 * 在这里变成引擎的材质插件。描述是中立的 —— 调用方只说「往哪个阶段插什么」。
 */
class GfxExtensionPlugin extends MaterialPluginBase {
  constructor(material, ext, resolve) {
    const define = `GFX_${String(ext.key).toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    // 登记要等到字段都摆好再做：_addPlugin 会当场回调 getCustomCode，
    // 而那时候 super() 还没返回，this._ext 还是 undefined。
    super(material, `gfx-${ext.key}`, 210, { [define]: true }, false);
    this._ext = ext;
    this._define = define;
    this._resolve = resolve;
    this._pluginManager._addPlugin(this);
    this._enable(true);
  }

  getClassName() {
    return 'GfxExtensionPlugin';
  }

  prepareDefines(defines) {
    defines[this._define] = true;
  }

  getAttributes(attributes) {
    for (const a of this._ext.attributes ?? []) if (!attributes.includes(a)) attributes.push(a);
  }

  getSamplers(samplers) {
    for (const name of Object.keys(this._ext.samplers ?? {})) samplers.push(name);
  }

  getUniforms() {
    const ubo = Object.keys(this._ext.floats ?? {}).map((name) => ({
      name,
      size: 1,
      type: 'float',
    }));
    return { ubo };
  }

  bindForSubMesh(uniformBuffer) {
    for (const [name, value] of Object.entries(this._ext.floats ?? {})) {
      uniformBuffer.updateFloat(name, typeof value === 'function' ? value() : value);
    }
    for (const [name, tex] of Object.entries(this._ext.samplers ?? {})) {
      const bt = this._resolve(typeof tex === 'function' ? tex() : tex);
      if (bt) uniformBuffer.setTexture(name, bt);
    }
  }

  getCustomCode(shaderType) {
    const ext = this._ext;
    if (shaderType === 'vertex') {
      const out = {};
      if (ext.vertexDefinitions) out.CUSTOM_VERTEX_DEFINITIONS = ext.vertexDefinitions;
      if (ext.vertexMainBegin) out.CUSTOM_VERTEX_MAIN_BEGIN = ext.vertexMainBegin;
      if (ext.vertexWorldPos) out.CUSTOM_VERTEX_UPDATE_WORLDPOS = ext.vertexWorldPos;
      return out;
    }
    // getSamplers 只是把名字登记进绑定表，GLSL 里的声明得插件自己写。
    const declarations = Object.keys(ext.samplers ?? {})
      .map((name) => `uniform sampler2D ${name};`)
      .join('\n');
    const out = {};
    const defs = [declarations, ext.fragmentDefinitions].filter(Boolean).join('\n');
    if (defs) out.CUSTOM_FRAGMENT_DEFINITIONS = defs;
    if (ext.fragmentAlpha) out.CUSTOM_FRAGMENT_UPDATE_ALPHA = ext.fragmentAlpha;
    if (ext.fragmentBeforeLights) out.CUSTOM_FRAGMENT_BEFORE_LIGHTS = ext.fragmentBeforeLights;
    return out;
  }
}

function buildPbr(src, scene, ctx) {
  const bm = new PBRMaterial(src.name || `gfx-mat-${src.id}`, scene);
  bm.maxSimultaneousLights = MAX_LIGHTS;
  bm.usePhysicalLightFalloff = true;
  bm.useRadianceOverAlpha = false;
  bm.useSpecularOverAlpha = false;
  bm.forceIrradianceInFragment = false;
  if (src.extension) new GfxExtensionPlugin(bm, src.extension, (t) => resolveTexture(t, scene));
  return bm;
}

function syncPbr(bm, src, scene) {
  const unlit = !!(src.isMeshBasicMaterial || src.isLineBasicMaterial || src.isPointsMaterial);
  bm.unlit = unlit;

  const c = src.color;
  if (c) bm.albedoColor.set(c.r, c.g, c.b);
  bm.metallic = unlit ? 0 : (src.metalness ?? 0);
  bm.roughness = unlit ? 1 : (src.roughness ?? 1);
  bm.albedoTexture = resolveTexture(src.map, scene);
  bm.environmentIntensity = src.envMapIntensity ?? 1;

  if (!unlit) {
    bm.bumpTexture = resolveTexture(src.normalMap, scene);
    if (bm.bumpTexture) {
      bm.bumpTexture.level = src.normalScale?.x ?? 1;
      bm.invertNormalMapY = true;
    }
    const rough = resolveTexture(src.roughnessMap, scene);
    const metal = resolveTexture(src.metalnessMap, scene);
    bm.metallicTexture = rough || metal;
    // three 的粗糙度走 G 通道、金属度走 B 通道，与引擎默认的组合贴图一致
    bm.useRoughnessFromMetallicTextureGreen = !!rough;
    bm.useRoughnessFromMetallicTextureAlpha = false;
    bm.useMetallnessFromMetallicTextureBlue = !!metal;
    bm.ambientTexture = resolveTexture(src.aoMap, scene);
    if (bm.ambientTexture) bm.ambientTextureStrength = src.aoMapIntensity ?? 1;
    const e = src.emissive;
    if (e) bm.emissiveColor.set(e.r, e.g, e.b);
    bm.emissiveIntensity = src.emissiveIntensity ?? 1;
    bm.emissiveTexture = resolveTexture(src.emissiveMap, scene);
  } else {
    bm.emissiveColor.set(0, 0, 0);
  }

  const opacityTex = resolveTexture(src.alphaMap, scene);
  bm.opacityTexture = opacityTex;
  if (opacityTex) opacityTex.getAlphaFromRGB = true;

  applyCommonState(bm, src);
  const blended = src.transparent || (src.opacity ?? 1) < 1;
  bm.useAlphaFromAlbedoTexture = !!(src.transparent && bm.albedoTexture);
  if (src.alphaTest > 0) {
    bm.alphaCutOff = src.alphaTest;
    bm.transparencyMode = blended
      ? PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND
      : PBRMaterial.PBRMATERIAL_ALPHATEST;
  } else {
    bm.transparencyMode = blended
      ? PBRMaterial.PBRMATERIAL_ALPHABLEND
      : PBRMaterial.PBRMATERIAL_OPAQUE;
  }
  if (src.clearcoat > 0) {
    bm.clearCoat.isEnabled = true;
    bm.clearCoat.intensity = src.clearcoat;
    bm.clearCoat.roughness = src.clearcoatRoughness ?? 0;
  }
  return bm;
}

function uniformValueOf(value) {
  if (value == null) return null;
  if (value.isColor) return new Color3(value.r, value.g, value.b);
  if (value.isVector2) return new BVector2(value.x, value.y);
  if (value.isVector3) return new BVector3(value.x, value.y, value.z);
  if (value.isVector4) return new BVector4(value.x, value.y, value.z, value.w);
  if (value.isMatrix4) return BMatrix.FromArray(value.elements);
  return value;
}

// 分派不出去的 uniform 曾经是静悄悄丢掉的，着色器那边就读到一片 0 —— 表现是「颜色全黑」
// 之类离原因很远的症状，很难追。认不出来就喊一声，每个名字只喊一次。
const warnedUniforms = new Set();

function applyUniform(bm, name, value, scene) {
  if (value == null) return;
  if (value.isTexture) {
    const bt = resolveTexture(value, scene);
    if (bt) bm.setTexture(name, bt);
    return;
  }
  if (typeof value === 'number') return bm.setFloat(name, value);
  if (typeof value === 'boolean') return bm.setFloat(name, value ? 1 : 0);
  if (value.isColor) return bm.setColor3(name, uniformValueOf(value));
  if (value.isVector2) return bm.setVector2(name, uniformValueOf(value));
  if (value.isVector3) return bm.setVector3(name, uniformValueOf(value));
  if (value.isVector4) return bm.setVector4(name, uniformValueOf(value));
  if (value.isMatrix4) return bm.setMatrix(name, uniformValueOf(value));
  if (Array.isArray(value) && typeof value[0] === 'number') return bm.setFloats(name, value);

  const key = `${bm.name}.${name}`;
  if (!warnedUniforms.has(key)) {
    warnedUniforms.add(key);
    console.warn(`[gfx] uniform "${name}" 的取值分派不出去，着色器会读到 0：`, value);
  }
}

function buildShaderMaterial(src, scene, ctx) {
  const instanced =
    usesInstanceMatrix(src.vertexShader) || !!ctx?.instanced || !!src.userData?.instanced;
  const translated = translateShader({
    vertexShader: src.vertexShader,
    fragmentShader: src.fragmentShader,
    defines: src.defines,
    uniforms: src.uniforms,
    instanced,
  });
  const extraAttributes = ctx?.attributes ?? [];
  const attributes = [...new Set([...translated.attributes, ...extraAttributes])];
  const bm = new BShaderMaterial(
    src.name || `gfx-shader-${src.id}`,
    scene,
    { vertexSource: translated.vertexSource, fragmentSource: translated.fragmentSource },
    {
      attributes,
      uniforms: translated.uniforms,
      samplers: translated.samplers,
      needAlphaBlending: !!src.transparent,
      needAlphaTesting: (src.alphaTest ?? 0) > 0,
      shaderLanguage: 0,
    }
  );
  bm._gfxInstanced = instanced;
  return bm;
}

function syncShaderMaterial(bm, src, scene) {
  for (const [name, u] of Object.entries(src.uniforms ?? {})) applyUniform(bm, name, u?.value, scene);
  applyCommonState(bm, src);
  bm.needAlphaBlendingForMesh = () => !!src.transparent || (src.opacity ?? 1) < 1;
  return bm;
}

/**
 * 拿到（必要时创建）一份材质的引擎资源，并把这一帧的属性同步过去。
 *
 * @param {object} src 适配层材质
 * @param {*} scene    引擎场景
 * @param {object} ctx 绘制上下文（是否实例化、额外顶点属性），影响首次编译
 */
export function resolveMaterial(src, scene, ctx = {}) {
  if (!src) return null;
  let entry = src._backend;
  const wantsInstancing = !!ctx.instanced;
  if (entry && src.isShaderMaterial && entry._gfxInstanced !== wantsInstancing) {
    entry.dispose();
    entry = null;
  }
  if (!entry) {
    entry = src.isShaderMaterial ? buildShaderMaterial(src, scene, ctx) : buildPbr(src, scene, ctx);
    src._backend = entry;
    entry._gfxVersion = -1;
  }
  if (src.isShaderMaterial) syncShaderMaterial(entry, src, scene);
  else syncPbr(entry, src, scene);
  return entry;
}
