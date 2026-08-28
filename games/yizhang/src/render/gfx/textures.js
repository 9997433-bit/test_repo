// 渲染适配层 · 贴图。
//
// 纹理只是「像素来源 + 采样参数」的描述，真正的 GPU 资源在 ./backend.js 里按需创建。
// 程序化贴图（Canvas / 原始字节）在没有 GL 上下文时也建得出来，单测因此不必造假。

import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  UnsignedByteType,
} from './constants.js';
import { Vector2 } from './math.js';

let _textureId = 0;

export class Texture {
  constructor(image = null) {
    this.id = _textureId++;
    this.isTexture = true;
    this.name = '';
    this.image = image;
    this.wrapS = ClampToEdgeWrapping;
    this.wrapT = ClampToEdgeWrapping;
    this.magFilter = LinearFilter;
    this.minFilter = LinearMipmapLinearFilter;
    this.anisotropy = 1;
    this.format = RGBAFormat;
    this.type = UnsignedByteType;
    this.offset = new Vector2(0, 0);
    this.repeat = new Vector2(1, 1);
    this.center = new Vector2(0, 0);
    this.rotation = 0;
    this.flipY = true;
    this.generateMipmaps = true;
    this.premultiplyAlpha = false;
    this.colorSpace = NoColorSpace;
    this.needsUpdate = false;
    this.version = 0;
    this.userData = {};
    /** 后端句柄（Babylon Texture），按渲染器实例缓存。 */
    this._backend = null;
  }

  clone() {
    const t = new Texture(this.image);
    t.wrapS = this.wrapS;
    t.wrapT = this.wrapT;
    t.magFilter = this.magFilter;
    t.minFilter = this.minFilter;
    t.anisotropy = this.anisotropy;
    t.format = this.format;
    t.type = this.type;
    t.offset.copy(this.offset);
    t.repeat.copy(this.repeat);
    t.flipY = this.flipY;
    t.generateMipmaps = this.generateMipmaps;
    t.colorSpace = this.colorSpace;
    t.isCanvasTexture = this.isCanvasTexture;
    t.isDataTexture = this.isDataTexture;
    t.width = this.width;
    t.height = this.height;
    t.data = this.data;
    return t;
  }

  dispose() {
    this._backend?.dispose?.();
    this._backend = null;
  }
}

export class CanvasTexture extends Texture {
  constructor(canvas) {
    super(canvas);
    this.isCanvasTexture = true;
    this.needsUpdate = true;
  }
}

export class DataTexture extends Texture {
  constructor(data = null, width = 1, height = 1, format = RGBAFormat, type = UnsignedByteType) {
    super(null);
    this.isDataTexture = true;
    this.data = data;
    this.width = width;
    this.height = height;
    this.image = { data, width, height };
    this.format = format;
    this.type = type;
    this.magFilter = LinearFilter;
    this.minFilter = LinearFilter;
    this.generateMipmaps = false;
    this.flipY = false;
    this.needsUpdate = true;
  }
}

/** 立方体贴图（天光环境）。渲染层只在 sky.js 里造一份。 */
export class CubeTexture extends Texture {
  constructor(faces = null, size = 1) {
    super(null);
    this.isCubeTexture = true;
    this.faces = faces;
    this.size = size;
    this.wrapS = RepeatWrapping;
    this.wrapT = RepeatWrapping;
    this.generateMipmaps = true;
    this.needsUpdate = true;
  }
}
