// 后端 · 贴图上载。适配层的 Texture 只是「像素来源 + 采样参数」，这里把它变成引擎资源。

import { Constants } from '@babylonjs/core/Engines/constants.js';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture.js';
import { RawCubeTexture } from '@babylonjs/core/Materials/Textures/rawCubeTexture.js';
import { Texture as BTexture } from '@babylonjs/core/Materials/Textures/texture.js';
import { RenderTargetTexture } from '@babylonjs/core/Materials/Textures/renderTargetTexture.js';
import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
} from '../constants.js';

function wrapModeOf(mode) {
  if (mode === RepeatWrapping) return BTexture.WRAP_ADDRESSMODE;
  if (mode === MirroredRepeatWrapping) return BTexture.MIRROR_ADDRESSMODE;
  return BTexture.CLAMP_ADDRESSMODE;
}

function samplingModeOf(tex) {
  const mag = tex.magFilter;
  const min = tex.minFilter;
  if (mag === NearestFilter) {
    return min === LinearFilter || min === NearestFilter
      ? BTexture.NEAREST_NEAREST
      : BTexture.NEAREST_LINEAR_MIPLINEAR;
  }
  if (min === LinearFilter || min === NearestFilter) return BTexture.BILINEAR_SAMPLINGMODE;
  if (min === LinearMipmapNearestFilter) return BTexture.LINEAR_LINEAR_MIPNEAREST;
  if (min === LinearMipmapLinearFilter) return BTexture.TRILINEAR_SAMPLINGMODE;
  return BTexture.TRILINEAR_SAMPLINGMODE;
}

function applyCommon(bt, tex) {
  bt.wrapU = wrapModeOf(tex.wrapS ?? ClampToEdgeWrapping);
  bt.wrapV = wrapModeOf(tex.wrapT ?? ClampToEdgeWrapping);
  bt.uOffset = tex.offset?.x ?? 0;
  bt.vOffset = tex.offset?.y ?? 0;
  bt.uScale = tex.repeat?.x ?? 1;
  bt.vScale = tex.repeat?.y ?? 1;
  bt.wAng = tex.rotation ?? 0;
  bt.anisotropicFilteringLevel = Math.max(1, tex.anisotropy ?? 1);
  bt.gammaSpace = tex.colorSpace === SRGBColorSpace;
  bt.hasAlpha = true;
  bt.name = tex.name || `gfx-tex-${tex.id}`;
  return bt;
}

function canvasOf(image) {
  if (!image) return null;
  if (typeof HTMLCanvasElement !== 'undefined' && image instanceof HTMLCanvasElement) return image;
  if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) return image;
  if (image.getContext && image.width && image.height) return image;
  return null;
}

function createFromCanvas(canvas, tex, scene) {
  const engine = scene.getEngine();
  const internal = engine.createDynamicTexture(
    canvas.width,
    canvas.height,
    tex.generateMipmaps !== false,
    samplingModeOf(tex)
  );
  const bt = new BTexture(null, scene);
  bt._texture = internal;
  internal.incrementReferences();
  engine.updateDynamicTexture(
    internal,
    canvas,
    tex.flipY !== false,
    tex.premultiplyAlpha === true,
    undefined,
    true
  );
  return bt;
}

function createFromData(tex, scene) {
  const w = tex.width ?? tex.image?.width ?? 1;
  const h = tex.height ?? tex.image?.height ?? 1;
  const data = tex.data ?? tex.image?.data ?? new Uint8Array(w * h * 4);
  return new RawTexture(
    data,
    w,
    h,
    Constants.TEXTUREFORMAT_RGBA,
    scene,
    tex.generateMipmaps === true,
    tex.flipY !== false,
    samplingModeOf(tex),
    data instanceof Float32Array ? Constants.TEXTURETYPE_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE
  );
}

function createCube(tex, scene) {
  const faces = tex.faces || [];
  const bt = new RawCubeTexture(
    scene,
    faces,
    tex.size ?? 1,
    Constants.TEXTUREFORMAT_RGBA,
    Constants.TEXTURETYPE_UNSIGNED_BYTE,
    tex.generateMipmaps !== false,
    false,
    BTexture.TRILINEAR_SAMPLINGMODE
  );
  return bt;
}

/**
 * 拿到（必要时创建）一张贴图的引擎资源。`needsUpdate` 会触发重传。
 */
export function resolveTexture(tex, scene) {
  if (!tex) return null;
  if (tex.isRenderTargetTexture && tex.renderTarget) {
    return resolveRenderTarget(tex.renderTarget, scene);
  }

  const canvas = canvasOf(tex.image);
  if (tex._backend && tex.needsUpdate && canvas && tex._backend._texture) {
    scene
      .getEngine()
      .updateDynamicTexture(
        tex._backend._texture,
        canvas,
        tex.flipY !== false,
        tex.premultiplyAlpha === true,
        undefined,
        true
      );
    tex.needsUpdate = false;
  }
  if (tex._backend) {
    applyCommon(tex._backend, tex);
    return tex._backend;
  }

  let bt = null;
  if (tex.isCubeTexture) bt = createCube(tex, scene);
  else if (canvas) bt = createFromCanvas(canvas, tex, scene);
  else if (tex.isDataTexture || tex.data) bt = createFromData(tex, scene);
  else bt = RawTexture.CreateRGBATexture(new Uint8Array([255, 255, 255, 255]), 1, 1, scene, false);

  applyCommon(bt, tex);
  tex.needsUpdate = false;
  tex._backend = bt;
  return bt;
}

/** 离屏目标：按适配层记的尺寸 / 格式建一张引擎侧的 render target。 */
export function resolveRenderTarget(rt, scene) {
  if (rt._backend) return rt._backend;
  const type =
    rt.texture.type === HalfFloatType
      ? Constants.TEXTURETYPE_HALF_FLOAT
      : Constants.TEXTURETYPE_UNSIGNED_BYTE;
  const bt = new RenderTargetTexture(
    `gfx-rt-${rt.id}`,
    { width: rt.width, height: rt.height },
    scene,
    {
      generateMipMaps: false,
      generateDepthBuffer: rt.depthBuffer,
      generateStencilBuffer: rt.stencilBuffer,
      type,
      samplingMode: BTexture.BILINEAR_SAMPLINGMODE,
      format: Constants.TEXTUREFORMAT_RGBA,
    }
  );
  bt.wrapU = BTexture.CLAMP_ADDRESSMODE;
  bt.wrapV = BTexture.CLAMP_ADDRESSMODE;
  bt.gammaSpace = false;
  bt.skipInitialClear = true;
  // 目标由 camera.outputRenderTarget 驱动，不能进 scene 的自动渲染列表
  bt.refreshRate = 0;
  if (rt.samples > 1) {
    try {
      bt.samples = rt.samples;
    } catch {
      /* 硬件不支持就退回单采样 */
    }
  }
  rt._backend = bt;
  rt.texture._backend = bt;
  return bt;
}
