import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  DoubleSide,
  FrontSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoBlending,
  NoColorSpace,
  NormalBlending,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from './constants.js';
import { Color, Vector2 } from './math.js';

export class Material {
  constructor() {
    this.type = 'Material';
    this.name = '';
    this.uuid = `m${Math.random().toString(36).slice(2)}`;
    this.opacity = 1;
    this.transparent = false;
    this.blending = NormalBlending;
    this.side = FrontSide;
    this.depthTest = true;
    this.depthWrite = true;
    this.colorWrite = true;
    this.vertexColors = false;
    this.toneMapped = true;
    this.fog = true;
    this.visible = true;
    this.needsUpdate = false;
    this.userData = {};
    this.isMaterial = true;
    this.defines = {};
    this.alphaTest = 0;
    this.premultipliedAlpha = false;
    this.dithering = false;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(source) {
    for (const k of Object.keys(source)) {
      if (k === 'uuid') continue;
      const v = source[k];
      if (v?.isColor) this[k] = v.clone();
      else if (v?.isVector2 || v?.isVector3) this[k] = v.clone();
      else if (v && typeof v === 'object' && v.value !== undefined) {
        this[k] = { value: v.value?.clone?.() ?? v.value };
      } else if (k === 'defines') this[k] = { ...v };
      else this[k] = v;
    }
    return this;
  }
  dispose() {}
}

export class MeshBasicMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'MeshBasicMaterial';
    this.isMeshBasicMaterial = true;
    this.color = new Color(params.color ?? 0xffffff);
    this.map = params.map ?? null;
    this.wireframe = false;
    this.combine = 0;
    Object.assign(this, params);
    if (params.color != null && !params.color.isColor) this.color = new Color(params.color);
  }
}

export class MeshStandardMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'MeshStandardMaterial';
    this.isMeshStandardMaterial = true;
    this.color = new Color(params.color ?? 0xffffff);
    this.roughness = params.roughness ?? 1;
    this.metalness = params.metalness ?? 0;
    this.map = params.map ?? null;
    this.normalMap = params.normalMap ?? null;
    this.roughnessMap = params.roughnessMap ?? null;
    this.metalnessMap = params.metalnessMap ?? null;
    this.emissive = new Color(params.emissive ?? 0x000000);
    this.emissiveIntensity = params.emissiveIntensity ?? 1;
    this.emissiveMap = params.emissiveMap ?? null;
    this.envMap = params.envMap ?? null;
    this.envMapIntensity = params.envMapIntensity ?? 1;
    this.normalScale = params.normalScale?.clone?.() ?? new Vector2(1, 1);
    this.flatShading = false;
    this.wireframe = false;
    Object.assign(this, params);
    if (params.color != null && !params.color.isColor) this.color = new Color(params.color);
    if (params.emissive != null && !params.emissive.isColor) this.emissive = new Color(params.emissive);
  }
}

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  constructor(params = {}) {
    super(params);
    this.type = 'MeshPhysicalMaterial';
    this.isMeshPhysicalMaterial = true;
    this.sheen = params.sheen ?? 0;
    this.sheenColor = new Color(params.sheenColor ?? 0x000000);
    this.sheenRoughness = params.sheenRoughness ?? 1;
    this.clearcoat = params.clearcoat ?? 0;
    this.clearcoatRoughness = params.clearcoatRoughness ?? 0;
    this.transmission = params.transmission ?? 0;
    this.thickness = params.thickness ?? 0;
    this.ior = params.ior ?? 1.5;
    this.specularIntensity = params.specularIntensity ?? 1;
    this.specularColor = new Color(params.specularColor ?? 0xffffff);
    if (params.sheenColor != null && !params.sheenColor.isColor) this.sheenColor = new Color(params.sheenColor);
  }
}

export class LineBasicMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'LineBasicMaterial';
    this.isLineBasicMaterial = true;
    this.color = new Color(params.color ?? 0xffffff);
    this.linewidth = params.linewidth ?? 1;
    Object.assign(this, params);
    if (params.color != null && !params.color.isColor) this.color = new Color(params.color);
  }
}

export class ShaderMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'ShaderMaterial';
    this.isShaderMaterial = true;
    this.vertexShader = params.vertexShader ?? '';
    this.fragmentShader = params.fragmentShader ?? '';
    this.uniforms = params.uniforms ?? {};
    this.defines = params.defines ?? {};
    this.extensions = params.extensions ?? {};
    this.glslVersion = params.glslVersion ?? null;
    this.lights = params.lights ?? false;
    this.clipping = false;
    this.defaultAttributeValues = {
      color: [1, 1, 1],
      uv: [0, 0],
      uv2: [0, 0],
    };
    Object.assign(this, params);
    if (!this.uniforms) this.uniforms = {};
    if (!this.defines) this.defines = {};
  }
  copy(source) {
    super.copy(source);
    this.vertexShader = source.vertexShader;
    this.fragmentShader = source.fragmentShader;
    this.uniforms = { ...source.uniforms };
    this.defines = { ...source.defines };
    return this;
  }
}

export class RawShaderMaterial extends ShaderMaterial {
  constructor(params = {}) {
    super(params);
    this.isRawShaderMaterial = true;
    this.type = 'RawShaderMaterial';
  }
}

export class Texture {
  constructor(image = null) {
    this.isTexture = true;
    this.image = image;
    this.source = { data: image };
    this.uuid = `t${Math.random().toString(36).slice(2)}`;
    this.name = '';
    this.mapping = 300;
    this.wrapS = ClampToEdgeWrapping;
    this.wrapT = ClampToEdgeWrapping;
    this.magFilter = LinearFilter;
    this.minFilter = LinearMipmapLinearFilter;
    this.anisotropy = 1;
    this.format = RGBAFormat;
    this.type = UnsignedByteType;
    this.colorSpace = SRGBColorSpace;
    this.repeat = new Vector2(1, 1);
    this.offset = new Vector2(0, 0);
    this.center = new Vector2(0, 0);
    this.rotation = 0;
    this.matrixAutoUpdate = true;
    this.generateMipmaps = true;
    this.premultiplyAlpha = false;
    this.flipY = true;
    this.unpackAlignment = 4;
    this.needsUpdate = false;
    this.userData = {};
    this.version = 0;
  }
  clone() {
    const t = new this.constructor();
    t.copy(this);
    return t;
  }
  copy(source) {
    this.image = source.image;
    this.source = source.source;
    this.wrapS = source.wrapS;
    this.wrapT = source.wrapT;
    this.magFilter = source.magFilter;
    this.minFilter = source.minFilter;
    this.anisotropy = source.anisotropy;
    this.format = source.format;
    this.type = source.type;
    this.colorSpace = source.colorSpace;
    this.repeat.copy(source.repeat);
    this.offset.copy(source.offset);
    this.generateMipmaps = source.generateMipmaps;
    this.flipY = source.flipY;
    return this;
  }
  dispose() {}
}

export class CanvasTexture extends Texture {
  constructor(canvas) {
    super(canvas);
    this.isCanvasTexture = true;
    this.needsUpdate = true;
  }
}

export class DataTexture extends Texture {
  constructor(data, width, height, format = RGBAFormat, type = UnsignedByteType) {
    super({ data, width, height });
    this.isDataTexture = true;
    this.format = format;
    this.type = type;
    this.colorSpace = NoColorSpace;
    this.generateMipmaps = false;
    this.flipY = false;
    this.needsUpdate = true;
    this.image = { data, width, height };
  }
}

export class WebGLRenderTarget {
  constructor(width = 1, height = 1, options = {}) {
    this.width = width;
    this.height = height;
    this.depth = 1;
    this.scissor = { set() {} };
    this.viewport = { set() {} };
    this.texture = new Texture();
    this.texture.isRenderTargetTexture = true;
    this.texture.image = { width, height, depth: 1 };
    this.texture.minFilter = options.minFilter ?? LinearFilter;
    this.texture.magFilter = options.magFilter ?? LinearFilter;
    this.texture.generateMipmaps = options.generateMipmaps ?? false;
    this.texture.type = options.type ?? UnsignedByteType;
    this.texture.format = options.format ?? RGBAFormat;
    this.texture.colorSpace = options.colorSpace ?? NoColorSpace;
    this.depthBuffer = options.depthBuffer !== false;
    this.stencilBuffer = !!options.stencilBuffer;
    this.isWebGLRenderTarget = true;
  }
  setSize(width, height) {
    this.width = width;
    this.height = height;
    this.texture.image.width = width;
    this.texture.image.height = height;
  }
  dispose() {}
}

export class PMREMGenerator {
  constructor(renderer) {
    this.renderer = renderer;
  }
  compileEquirectangularShader() {}
  fromScene() {
    const rt = new WebGLRenderTarget(16, 16);
    rt.texture.mapping = 301;
    return rt;
  }
  fromEquirectangular(tex) {
    const rt = new WebGLRenderTarget(16, 16);
    rt.texture = tex;
    return rt;
  }
  dispose() {}
}

void AdditiveBlending;
void BackSide;
void DoubleSide;
void NoBlending;
void RepeatWrapping;
