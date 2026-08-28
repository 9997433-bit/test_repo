// 渲染适配层 · 材质描述。
//
// 这一层只描述「这面看起来是什么」，不持有 GPU 程序。后端按类型映射：
//   MeshStandardMaterial / MeshPhysicalMaterial → Babylon PBRMaterial
//   MeshBasicMaterial                          → Babylon PBRMaterial（无光照分支）
//   ShaderMaterial                             → Babylon ShaderMaterial
// 属性改了就把 version 推一格，后端下一帧同步。

import { FrontSide, NormalBlending } from './constants.js';
import { Color, Vector2 } from './math.js';

let _materialId = 0;

export class Material {
  constructor() {
    this.id = _materialId++;
    this.isMaterial = true;
    this.name = '';
    this.type = 'Material';
    this.visible = true;
    this.transparent = false;
    this.opacity = 1;
    this.alphaTest = 0;
    this.depthTest = true;
    this.depthWrite = true;
    this.side = FrontSide;
    this.blending = NormalBlending;
    this.vertexColors = false;
    this.toneMapped = true;
    this.fog = true;
    this.wireframe = false;
    this.polygonOffset = false;
    this.polygonOffsetFactor = 0;
    this.polygonOffsetUnits = 0;
    this.premultipliedAlpha = false;
    this.userData = {};
    this.version = 0;
    this._needsUpdate = false;
    /** 后端句柄。 */
    this._backend = null;
  }

  get needsUpdate() {
    return this._needsUpdate;
  }

  set needsUpdate(v) {
    this._needsUpdate = !!v;
    if (v) this.version++;
  }

  setValues(values = {}) {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue;
      const current = this[key];
      if (current && current.isColor && !(value && value.isColor)) current.set(value);
      else if (current instanceof Vector2 && value instanceof Vector2) current.copy(value);
      else this[key] = value;
    }
    return this;
  }

  copy(source) {
    for (const key of Object.keys(source)) {
      if (key === 'id' || key === '_backend' || key === 'version') continue;
      const value = source[key];
      const current = this[key];
      if (value && value.isColor) {
        if (current && current.isColor) current.copy(value);
        else this[key] = value.clone();
      } else if (value instanceof Vector2) {
        if (current instanceof Vector2) current.copy(value);
        else this[key] = value.clone();
      } else if (key === 'userData') {
        this.userData = { ...value };
      } else if (key === 'uniforms') {
        this.uniforms = cloneUniforms(value);
      } else if (key === 'defines') {
        this.defines = { ...value };
      } else {
        this[key] = value;
      }
    }
    return this;
  }

  clone() {
    return new this.constructor().copy(this);
  }

  dispose() {
    this._backend?.dispose?.();
    this._backend = null;
  }
}

function cloneUniforms(uniforms) {
  const out = {};
  for (const [key, u] of Object.entries(uniforms || {})) {
    const v = u?.value;
    out[key] = { value: v && v.clone && !v.isTexture ? v.clone() : v };
  }
  return out;
}

export class MeshBasicMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'MeshBasicMaterial';
    this.isMeshBasicMaterial = true;
    this.color = new Color(0xffffff);
    this.map = null;
    this.alphaMap = null;
    this.lightMap = null;
    this.setValues(params);
  }
}

export class MeshStandardMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'MeshStandardMaterial';
    this.isMeshStandardMaterial = true;
    this.color = new Color(0xffffff);
    this.roughness = 1;
    this.metalness = 0;
    this.map = null;
    this.normalMap = null;
    this.normalScale = new Vector2(1, 1);
    this.roughnessMap = null;
    this.metalnessMap = null;
    this.alphaMap = null;
    this.aoMap = null;
    this.aoMapIntensity = 1;
    this.emissive = new Color(0x000000);
    this.emissiveIntensity = 1;
    this.emissiveMap = null;
    this.envMap = null;
    this.envMapIntensity = 1;
    this.flatShading = false;
    this.setValues(params);
  }
}

export class MeshPhysicalMaterial extends MeshStandardMaterial {
  constructor(params = {}) {
    super();
    this.type = 'MeshPhysicalMaterial';
    this.isMeshPhysicalMaterial = true;
    this.clearcoat = 0;
    this.clearcoatRoughness = 0;
    this.sheen = 0;
    this.sheenRoughness = 1;
    this.sheenColor = new Color(0x000000);
    this.transmission = 0;
    this.ior = 1.5;
    this.setValues(params);
  }
}

export class MeshDepthMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'MeshDepthMaterial';
    this.isMeshDepthMaterial = true;
    this.setValues(params);
  }
}

export class LineBasicMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'LineBasicMaterial';
    this.isLineBasicMaterial = true;
    this.color = new Color(0xffffff);
    this.linewidth = 1;
    this.setValues(params);
  }
}

export class PointsMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'PointsMaterial';
    this.isPointsMaterial = true;
    this.color = new Color(0xffffff);
    this.size = 1;
    this.sizeAttenuation = true;
    this.map = null;
    this.setValues(params);
  }
}

/**
 * 自写着色器。GLSL 沿用原本那套内建名（`projectionMatrix` / `modelViewMatrix` /
 * `modelMatrix` / `viewMatrix` / `cameraPosition` / `position` / `normal` / `uv`），
 * 后端在编译前补一段前言把它们接到引擎的同义 uniform 上（见 ./backend.js）。
 */
export class ShaderMaterial extends Material {
  constructor(params = {}) {
    super();
    this.type = 'ShaderMaterial';
    this.isShaderMaterial = true;
    this.uniforms = {};
    this.defines = {};
    this.vertexShader = '';
    this.fragmentShader = '';
    this.glslVersion = null;
    /** 额外的逐实例 / 逐顶点属性名，后端要显式登记。 */
    this.attributes = null;
    this.setValues(params);
  }

  copy(source) {
    super.copy(source);
    this.uniforms = cloneUniforms(source.uniforms);
    this.defines = { ...source.defines };
    this.vertexShader = source.vertexShader;
    this.fragmentShader = source.fragmentShader;
    return this;
  }
}

export class RawShaderMaterial extends ShaderMaterial {
  constructor(params = {}) {
    super(params);
    this.type = 'RawShaderMaterial';
    this.isRawShaderMaterial = true;
  }
}
