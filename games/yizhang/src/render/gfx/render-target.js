// 渲染适配层 · 离屏目标。
//
// 只描述「多大、什么格式、要不要深度/MSAA」，真正的 framebuffer 由后端按需建。
// 后期链（../postfx.js）拿着它的 `.texture` 当采样源，所以这里要给出一个纹理壳。

import { LinearFilter, NoColorSpace, RGBAFormat, UnsignedByteType } from './constants.js';
import { Texture } from './textures.js';

let _rtId = 0;

export class WebGLRenderTarget {
  constructor(width = 1, height = 1, options = {}) {
    this.id = _rtId++;
    this.isWebGLRenderTarget = true;
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.depthBuffer = options.depthBuffer !== false;
    this.stencilBuffer = !!options.stencilBuffer;
    this.samples = options.samples ?? 0;

    const texture = new Texture(null);
    texture.isRenderTargetTexture = true;
    texture.format = options.format ?? RGBAFormat;
    texture.type = options.type ?? UnsignedByteType;
    texture.minFilter = options.minFilter ?? LinearFilter;
    texture.magFilter = options.magFilter ?? LinearFilter;
    texture.colorSpace = options.colorSpace ?? NoColorSpace;
    texture.generateMipmaps = !!options.generateMipmaps;
    texture.flipY = false;
    texture.renderTarget = this;
    this.texture = texture;

    /** 后端句柄（Babylon RenderTargetTexture）。 */
    this._backend = null;
    this._backendKey = null;
  }

  setSize(width, height) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    if (w === this.width && h === this.height) return this;
    this.width = w;
    this.height = h;
    // 尺寸变了就把后端资源作废，下一帧重建
    this._backend?.dispose?.();
    this._backend = null;
    return this;
  }

  dispose() {
    this._backend?.dispose?.();
    this._backend = null;
    this.texture._backend = null;
  }
}
