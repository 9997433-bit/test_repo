import {
  Engine,
  Scene as BScene,
  UniversalCamera,
  FreeCamera,
  Camera,
  Vector3 as BVector3,
  Vector2 as BVector2,
  Color3,
  Color4,
  Matrix as BMatrix,
  Mesh,
  VertexData,
  ShaderMaterial,
  PBRMaterial,
  Material,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  ShadowGenerator,
  RenderTargetTexture,
  Texture,
  DynamicTexture,
  RawTexture,
  Constants,
} from '@babylonjs/core';
import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  DoubleSide,
  FrontSide,
  PCFShadowMap,
  PCFSoftShadowMap,
  RepeatWrapping,
} from './constants.js';
import { Color, Matrix4, Vector2, Vector3 } from './math.js';

const IDENTITY = new Matrix4();

const BNS = {
  Engine,
  Scene: BScene,
  UniversalCamera,
  FreeCamera,
  Camera,
  Vector3: BVector3,
  Vector2: BVector2,
  Color3,
  Color4,
  Matrix: BMatrix,
  Mesh,
  VertexData,
  ShaderMaterial,
  PBRMaterial,
  Material,
  HemisphericLight,
  DirectionalLight,
  PointLight,
  ShadowGenerator,
  RenderTargetTexture,
  Texture,
  DynamicTexture,
  RawTexture,
  Constants,
  EngineAlphaAdd: Engine.ALPHA_ADD,
};

function hexOf(color) {
  if (!color) return '#ffffff';
  if (color.isColor) {
    const r = Math.round(Math.min(255, Math.max(0, color.r * 255)));
    const g = Math.round(Math.min(255, Math.max(0, color.g * 255)));
    const b = Math.round(Math.min(255, Math.max(0, color.b * 255)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  if (typeof color === 'number') return `#${(color >>> 0).toString(16).padStart(6, '0')}`;
  return '#ffffff';
}

function wrapVertex(src, extraAttribs) {
  const attribs = extraAttribs
    .map((a) => `attribute ${a.type} ${a.name};`)
    .join('\n');
  return `precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 color;
${attribs}
uniform mat4 world;
uniform mat4 worldView;
uniform mat4 worldViewProjection;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 cameraPosition;
#define modelMatrix world
#define modelViewMatrix worldView
#define projectionMatrix projection
#define viewMatrix view
#define instanceMatrix world
mat3 normalMatrix = mat3(worldView);
${src}`;
}

function wrapFragment(src) {
  return `precision highp float;
uniform vec3 cameraPosition;
${src}`;
}

function parseAttributes(vert) {
  const out = [];
  const re = /attribute\s+(float|vec2|vec3|vec4)\s+(\w+)/g;
  let m;
  while ((m = re.exec(vert))) {
    if (['position', 'normal', 'uv', 'color'].includes(m[2])) continue;
    out.push({ type: m[1], name: m[2] });
  }
  return out;
}

function parseUniforms(src) {
  const names = [];
  const re = /uniform\s+\w+(?:\s*\[\s*\d+\s*\])?\s+(\w+)/g;
  let m;
  while ((m = re.exec(src))) names.push(m[1]);
  return names;
}

function parseSamplers(src) {
  const names = [];
  const re = /uniform\s+sampler2D\s+(\w+)/g;
  let m;
  while ((m = re.exec(src))) names.push(m[1]);
  return names;
}

export class WebGLRenderer {
  constructor(opts = {}) {
    this.domElement = opts.canvas ?? (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    this.autoClear = true;
    this.autoClearColor = true;
    this.autoClearDepth = true;
    this.autoClearStencil = false;
    this.toneMapping = 0;
    this.shadowMap = {
      enabled: false,
      type: PCFShadowMap,
      autoUpdate: true,
      needsUpdate: false,
    };
    this.info = {
      autoReset: true,
      render: { calls: 0, triangles: 0, points: 0, lines: 0, frame: 0 },
      memory: { geometries: 0, textures: 0 },
      programs: [],
      reset: () => {
        this.info.render.calls = 0;
        this.info.render.triangles = 0;
        this.info.render.points = 0;
        this.info.render.lines = 0;
      },
    };
    this._pixelRatio = 1;
    this._width = opts.width ?? this.domElement?.width ?? 1;
    this._height = opts.height ?? this.domElement?.height ?? 1;
    this._clearColor = new Color(0, 0, 0);
    this._clearAlpha = 1;
    this._currentRT = null;
    this._engine = null;
    this._bScene = null;
    this._bCamera = null;
    this._quadScene = null;
    this._quadCamera = null;
    this._meshMap = new Map();
    this._matMap = new WeakMap();
    this._texMap = new WeakMap();
    this._rtMap = new WeakMap();
    this._lights = [];
    this._glow = null;
    this._shadow = null;
    this._shaderId = 0;
    this._babylon = BNS;
    this._boot(opts);
  }

  _boot(opts) {
    const canvas = this.domElement;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    try {
      const engine = new Engine(canvas, false, {
        preserveDrawingBuffer: !!opts.preserveDrawingBuffer,
        stencil: false,
        antialias: false,
        adaptToDeviceRatio: false,
        premultipliedAlpha: false,
        powerPreference: opts.powerPreference ?? 'high-performance',
      }, false);
      engine.disableUniformBuffers = true;
      this._engine = engine;
      const scene = new BScene(engine);
      scene.useRightHandedSystem = true;
      scene.autoClear = false;
      scene.skipPointerMovePicking = true;
      scene.skipPointerDownPicking = true;
      scene.skipPointerUpPicking = true;
      this._bScene = scene;
      this._bCamera = new UniversalCamera('cam', new BVector3(0, 6, 14), scene);
      this._bCamera.minZ = 0.35;
      this._bCamera.maxZ = 1600;
      this._bCamera.fov = (54 * Math.PI) / 180;
      scene.activeCamera = this._bCamera;
      this._quadScene = new BScene(engine);
      this._quadScene.useRightHandedSystem = true;
      this._quadScene.autoClear = false;
      this._quadCamera = new FreeCamera('ortho', new BVector3(0, 0, 1), this._quadScene);
      this._quadCamera.mode = Camera.ORTHOGRAPHIC_CAMERA;
      this._quadScene.activeCamera = this._quadCamera;
      this._hemi = new HemisphericLight('hemi', new BVector3(0, 1, 0), scene);
      this._hemi.intensity = 0.2;
      this.setSize(this._width, this._height, false);
    } catch (err) {
      console.warn('[yizhang] Babylon.js 引擎启动失败', err);
      this._engine = null;
    }
  }

  getDrawingBufferSize(target) {
    const w = Math.max(1, Math.floor((this._engine?.getRenderWidth?.() ?? this._width * this._pixelRatio) || 1));
    const h = Math.max(1, Math.floor((this._engine?.getRenderHeight?.() ?? this._height * this._pixelRatio) || 1));
    return (target ?? new Vector2()).set(w, h);
  }

  setPixelRatio(ratio) {
    this._pixelRatio = ratio || 1;
    if (this._engine) this._engine.setHardwareScalingLevel(1 / this._pixelRatio);
  }

  setSize(width, height, updateStyle) {
    this._width = Math.max(1, Math.floor(width || 1));
    this._height = Math.max(1, Math.floor(height || 1));
    const canvas = this.domElement;
    if (canvas) {
      canvas.width = Math.floor(this._width * this._pixelRatio);
      canvas.height = Math.floor(this._height * this._pixelRatio);
      if (updateStyle !== false && canvas.style) {
        canvas.style.width = `${this._width}px`;
        canvas.style.height = `${this._height}px`;
      }
    }
    this._engine?.resize();
  }

  setClearColor(color, alpha = 1) {
    if (typeof color === 'number') this._clearColor.setHex(color);
    else if (color?.isColor) this._clearColor.copy(color);
    this._clearAlpha = alpha;
    this._bScene?.clearColor && (this._bScene.clearColor = this._toBColor(this._clearColor, alpha));
  }

  clear(color = true, depth = true) {
    const B = this._babylon;
    const engine = this._engine;
    if (!engine || !B) return;
    if (color) {
      const c = this._clearColor;
      engine.clear(new B.Color4(c.r, c.g, c.b, this._clearAlpha), true, depth, false);
    } else if (depth) {
      engine.clear(new B.Color4(0, 0, 0, 0), false, true, false);
    }
  }

  setRenderTarget(rt) {
    this._currentRT = rt || null;
  }

  _toBColor(color, a = 1) {
    const B = this._babylon;
    if (!B) return null;
    if (!color) return new B.Color4(0, 0, 0, a);
    if (color.isColor) return new B.Color4(color.r, color.g, color.b, a);
    const c = new Color(color);
    return new B.Color4(c.r, c.g, c.b, a);
  }

  _ensureRT(rt) {
    const B = this._babylon;
    if (!rt || !B || !this._engine) return null;
    let rec = this._rtMap.get(rt);
    const w = Math.max(1, rt.width | 0);
    const h = Math.max(1, rt.height | 0);
    if (!rec || rec.w !== w || rec.h !== h) {
      rec?.tex?.dispose();
      const tex = new B.RenderTargetTexture(
        `rt${w}x${h}`,
        { width: w, height: h },
        this._bScene,
        false,
        true,
        B.Constants.TEXTURETYPE_HALF_FLOAT,
        false,
        B.Texture.BILINEAR_SAMPLINGMODE,
        false,
        false
      );
      rec = { tex, w, h };
      this._rtMap.set(rt, rec);
      rt._babylon = tex;
    }
    return rec.tex;
  }

  _gfxTexture(tex) {
    if (!tex) return null;
    if (tex._babylon) return tex._babylon;
    const rec = tex.isRenderTargetTexture ? this._rtMap.get(tex) : null;
    if (rec) return rec.tex;
    return this._uploadTexture(tex);
  }

  _uploadTexture(tex) {
    const B = this._babylon;
    if (!tex || !B || !this._bScene) return null;
    let btex = this._texMap.get(tex);
    if (btex) return btex;
    const wrap = tex.wrapS === RepeatWrapping ? B.Texture.WRAP_ADDRESSMODE : B.Texture.CLAMP_ADDRESSMODE;
    const img = tex.image;
    try {
      if (img && (img instanceof HTMLCanvasElement || img instanceof OffscreenCanvas || img.getContext)) {
        btex = new B.DynamicTexture(`c${tex.uuid}`, img, this._bScene, true);
        btex.update(false);
      } else if (img?.data && img.width) {
        btex = B.RawTexture.CreateRGBATexture(
          img.data,
          img.width,
          img.height,
          this._bScene,
          true,
          false,
          B.Texture.BILINEAR_SAMPLINGMODE
        );
      } else {
        return null;
      }
      btex.wrapU = wrap;
      btex.wrapV = wrap;
      this._texMap.set(tex, btex);
      tex._babylon = btex;
      return btex;
    } catch {
      return null;
    }
  }

  _syncCamera(camera) {
    const B = this._babylon;
    const bcam = this._bCamera;
    if (!B || !bcam || !camera) return;
    camera.updateMatrixWorld(true);
    const p = camera.position;
    bcam.position.set(p.x, p.y, p.z);
    const dir = new Vector3();
    camera.getWorldDirection(dir);
    bcam.setTarget(new B.Vector3(p.x + dir.x, p.y + dir.y, p.z + dir.z));
    bcam.upVector.set(camera.up.x, camera.up.y, camera.up.z);
    if (camera.isPerspectiveCamera) {
      bcam.mode = B.Camera.PERSPECTIVE_CAMERA;
      bcam.fov = (camera.fov * Math.PI) / 180;
      bcam.minZ = camera.near;
      bcam.maxZ = camera.far;
    }
    const e = camera.matrixWorld.elements;
    // 滚转：从矩阵提取 up，已通过 lookAt+rotateZ 写进 matrixWorld
    bcam.upVector.set(e[4], e[5], e[6]);
  }

  _shaderMaterial(mat, scene) {
    const B = this._babylon;
    let rec = this._matMap.get(mat);
    if (rec) return rec;
    const extra = parseAttributes(mat.vertexShader || '');
    const vert = wrapVertex(mat.vertexShader || 'void main(){ gl_Position = worldViewProjection * vec4(position,1.0); }', extra);
    const frag = wrapFragment(mat.fragmentShader || 'void main(){ gl_FragColor = vec4(1.0); }');
    const uniforms = [...new Set([...parseUniforms(vert), ...parseUniforms(frag), 'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'cameraPosition'])];
    const samplers = [...new Set([...parseSamplers(vert), ...parseSamplers(frag)])];
    const attrs = ['position', 'normal', 'uv', 'color', ...extra.map((a) => a.name)];
    const name = `sm${++this._shaderId}`;
    const shader = new B.ShaderMaterial(
      name,
      scene,
      { vertexSource: vert, fragmentSource: frag },
      {
        attributes: attrs,
        uniforms,
        samplers,
        needAlphaBlending: mat.transparent || mat.blending === AdditiveBlending,
        needAlphaTesting: true,
      }
    );
    shader.backFaceCulling = mat.side === FrontSide;
    shader.cullBackFaces = mat.side !== BackSide;
    if (mat.side === DoubleSide) shader.backFaceCulling = false;
    shader.disableDepthWrite = mat.depthWrite === false;
    rec = { shader, extra, samplers };
    this._matMap.set(mat, rec);
    return rec;
  }

  _pushUniforms(mat, rec, camera) {
    const shader = rec.shader;
    if (!shader || !mat.uniforms) return;
    if (camera) {
      const p = camera.position;
      shader.setVector3('cameraPosition', new this._babylon.Vector3(p.x, p.y, p.z));
    }
    for (const [k, u] of Object.entries(mat.uniforms)) {
      const v = u?.value;
      if (v == null) continue;
      if (v.isColor) shader.setColor3(k, new this._babylon.Color3(v.r, v.g, v.b));
      else if (v.isVector2) shader.setVector2(k, new this._babylon.Vector2(v.x, v.y));
      else if (v.isVector3) shader.setVector3(k, new this._babylon.Vector3(v.x, v.y, v.z));
      else if (typeof v === 'number') shader.setFloat(k, v);
      else if (typeof v === 'boolean') shader.setInt(k, v ? 1 : 0);
      else if (v.isTexture || v.isRenderTargetTexture || v.image || v._babylon) {
        const t = this._gfxTexture(v);
        if (t) shader.setTexture(k, t);
      }
    }
  }

  _pbrMaterial(mat) {
    const B = this._babylon;
    let rec = this._matMap.get(mat);
    if (rec) {
      this._updatePbr(rec, mat);
      return rec;
    }
    const pbr = new B.PBRMaterial(`p${mat.uuid}`, this._bScene);
    pbr.metallicF0Factor = 0.5;
    rec = { pbr };
    this._matMap.set(mat, rec);
    this._updatePbr(rec, mat);
    return rec;
  }

  _updatePbr(rec, mat) {
    const pbr = rec.pbr;
    const c = mat.color ?? { r: 1, g: 1, b: 1 };
    pbr.albedoColor = new this._babylon.Color3(c.r, c.g, c.b);
    pbr.roughness = mat.roughness ?? (mat.isMeshBasicMaterial ? 1 : 0.6);
    pbr.metallic = mat.metalness ?? 0;
    if (mat.emissive) {
      pbr.emissiveColor = new this._babylon.Color3(mat.emissive.r, mat.emissive.g, mat.emissive.b);
      pbr.emissiveIntensity = mat.emissiveIntensity ?? 1;
    }
    if (mat.isMeshBasicMaterial) {
      pbr.unlit = true;
      pbr.emissiveColor = pbr.albedoColor;
      pbr.emissiveIntensity = 1;
    }
    pbr.alpha = mat.opacity ?? 1;
    pbr.transparencyMode = mat.transparent ? this._babylon.Material.MATERIAL_ALPHABLEND : this._babylon.Material.MATERIAL_OPAQUE;
    pbr.backFaceCulling = mat.side === FrontSide;
    if (mat.side === DoubleSide) pbr.backFaceCulling = false;
    pbr.disableDepthWrite = mat.depthWrite === false;
    if (mat.blending === AdditiveBlending) {
      pbr.alphaMode = this._babylon.Engine.ALPHA_ADD;
      pbr.transparencyMode = this._babylon.Material.MATERIAL_ALPHABLEND;
    }
    const map = this._uploadTexture(mat.map);
    if (map) pbr.albedoTexture = map;
    const nrm = this._uploadTexture(mat.normalMap);
    if (nrm) pbr.bumpTexture = nrm;
    const rough = this._uploadTexture(mat.roughnessMap);
    if (rough) pbr.metallicTexture = rough;
    if (mat.vertexColors) pbr.useVertexColor = true;
    if (mat.isMeshPhysicalMaterial && mat.sheen) {
      pbr.sheen.isEnabled = true;
      pbr.sheen.intensity = mat.sheen;
    }
  }

  _geometryData(geo, skinned) {
    const posAttr = geo.attributes.position;
    if (!posAttr) return null;
    let positions = posAttr.array;
    if (skinned?.skeleton) {
      positions = this._skinPositions(geo, skinned);
    }
    const nrm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    const col = geo.attributes.color;
    const index = geo.index;
    return {
      positions: positions instanceof Float32Array ? positions : new Float32Array(positions),
      normals: nrm ? (nrm.array instanceof Float32Array ? nrm.array : new Float32Array(nrm.array)) : null,
      uvs: uv ? (uv.array instanceof Float32Array ? uv.array : new Float32Array(uv.array)) : null,
      colors: col ? (col.array instanceof Float32Array ? col.array : new Float32Array(col.array)) : null,
      indices: index ? Array.from(index.array ?? index) : null,
    };
  }

  _skinPositions(geo, mesh) {
    mesh.skeleton.update();
    const pos = geo.attributes.position;
    const idx = geo.attributes.skinIndex;
    const wgt = geo.attributes.skinWeight;
    const out = new Float32Array(pos.array.length);
    if (!idx || !wgt) {
      out.set(pos.array);
      return out;
    }
    const bones = mesh.skeleton.boneMatrices;
    const bind = mesh.bindMatrix?.elements ?? IDENTITY.elements;
    const bindInv = mesh.bindMatrixInverse?.elements ?? IDENTITY.elements;
    const tmp = new Vector3();
    const tmp2 = new Vector3();
    const apply = (el, v, t) => {
      const x = v.x;
      const y = v.y;
      const z = v.z;
      const w = el[3] * x + el[7] * y + el[11] * z + el[15] || 1;
      t.set(
        (el[0] * x + el[4] * y + el[8] * z + el[12]) / w,
        (el[1] * x + el[5] * y + el[9] * z + el[13]) / w,
        (el[2] * x + el[6] * y + el[10] * z + el[14]) / w
      );
    };
    for (let i = 0; i < pos.count; i++) {
      tmp.fromArray(pos.array, i * 3);
      apply(bind, tmp, tmp2);
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (let k = 0; k < 4; k++) {
        const wt = wgt.array[i * 4 + k];
        if (!(wt > 0)) continue;
        const bi = idx.array[i * 4 + k] | 0;
        const off = bi * 16;
        const be = bones.subarray(off, off + 16);
        apply(be, tmp2, tmp);
        sx += tmp.x * wt;
        sy += tmp.y * wt;
        sz += tmp.z * wt;
      }
      tmp.set(sx, sy, sz);
      apply(bindInv, tmp, tmp2);
      out[i * 3] = tmp2.x;
      out[i * 3 + 1] = tmp2.y;
      out[i * 3 + 2] = tmp2.z;
    }
    return out;
  }

  _syncMesh(obj, visible) {
    const B = this._babylon;
    const scene = this._bScene;
    if (!B || !scene) return;
    let rec = this._meshMap.get(obj);
    const geo = obj.geometry;
    if (!geo || !visible) {
      if (rec?.mesh) rec.mesh.setEnabled(false);
      return;
    }
    if (!rec) {
      const data = this._geometryData(geo, obj.isSkinnedMesh ? obj : null);
      if (!data) return;
      const mesh = new B.Mesh(obj.name || `m${obj.id}`, scene);
      const vd = new B.VertexData();
      vd.positions = Array.from(data.positions);
      if (data.normals) vd.normals = Array.from(data.normals);
      if (data.uvs) vd.uvs = Array.from(data.uvs);
      if (data.colors) vd.colors = Array.from(data.colors);
      if (data.indices) vd.indices = data.indices;
      vd.applyToMesh(mesh, true);
      if (obj.isPoints) {
        mesh.material && (mesh.material.fillMode = B.Material.PointFillMode);
      }
      rec = { mesh, geo, lastCount: obj.count };
      this._meshMap.set(obj, rec);
    }
    const mesh = rec.mesh;
    mesh.setEnabled(true);
    obj.updateWorldMatrix(true, false);
    const e = obj.matrixWorld.elements;
    const bm = B.Matrix.FromArray([
      e[0], e[1], e[2], e[3],
      e[4], e[5], e[6], e[7],
      e[8], e[9], e[10], e[11],
      e[12], e[13], e[14], e[15],
    ]);
    mesh.setPreTransformMatrix(bm);
    mesh.receiveShadows = !!obj.receiveShadow;
    if (this.shadowMap.enabled && obj.castShadow && this._shadow) this._shadow.addShadowCaster(mesh, false);

    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (mat?.isShaderMaterial) {
      const sr = this._shaderMaterial(mat, scene);
      mesh.material = sr.shader;
      if (obj.isPoints) sr.shader.pointsCloud = true;
      this._pushUniforms(mat, sr, this._lastCamera);
      for (const a of sr.extra) {
        const attr = geo.attributes[a.name];
        if (attr) mesh.setVerticesData(a.name, Array.from(attr.array), true, attr.itemSize);
      }
    } else if (mat) {
      const pr = this._pbrMaterial(mat);
      mesh.material = pr.pbr;
    }
    if (obj.isInstancedMesh) {
      const n = obj.count | 0;
      const arr = obj.instanceMatrix?.array;
      if (arr && n > 0) {
        const mats = new Float32Array(n * 16);
        mats.set(arr.subarray(0, n * 16));
        mesh.thinInstanceSetBuffer('matrix', mats, 16);
        mesh.thinInstanceCount = n;
      }
    }
    if (geo.drawRange && Number.isFinite(geo.drawRange.count) && geo.drawRange.count !== Infinity) {
      // 点精灵用 drawRange 截断
      const start = geo.drawRange.start || 0;
      const count = geo.drawRange.count;
      if (obj.isPoints) mesh.unIndexed = true;
      mesh.subMeshes = mesh.subMeshes || [];
    }
    void FrontSide;
    void LinearFilter;
    void ClampToEdgeWrapping;
    void PCFSoftShadowMap;
  }

  _syncLights(scene) {
    const B = this._babylon;
    if (!B || !this._bScene) return;
    let i = 0;
    scene.traverse((o) => {
      if (!o.isLight) return;
      let L = this._lights[i];
      if (o.isDirectionalLight) {
        if (!L || L.kind !== 'dir') {
          L?.dispose?.();
          L = new B.DirectionalLight(`d${i}`, new B.Vector3(-1, -1, -1), this._bScene);
          L.kind = 'dir';
          this._lights[i] = L;
        }
        o.updateWorldMatrix(true, false);
        const p = o.position;
        const t = o.target.position;
        L.position.set(p.x, p.y, p.z);
        L.setDirectionToTarget(new B.Vector3(t.x, t.y, t.z));
        L.intensity = o.intensity * 0.3;
        L.diffuse = this._toBColor(o.color, 1).toLinearSpace?.() ?? new B.Color3(o.color.r, o.color.g, o.color.b);
        if (this.shadowMap.enabled && o.castShadow && !this._shadow) {
          this._shadow = new B.ShadowGenerator(o.shadow?.mapSize?.x || 1024, L);
          this._shadow.usePercentageCloserFiltering = this.shadowMap.type === PCFSoftShadowMap;
        }
      } else if (o.isHemisphereLight) {
        this._hemi.intensity = o.intensity * 0.6;
        this._hemi.diffuse = new B.Color3(o.color.r, o.color.g, o.color.b);
        this._hemi.groundColor = new B.Color3(o.groundColor.r, o.groundColor.g, o.groundColor.b);
      } else if (o.isPointLight) {
        if (!L || L.kind !== 'pt') {
          L?.dispose?.();
          L = new B.PointLight(`p${i}`, new B.Vector3(0, 0, 0), this._bScene);
          L.kind = 'pt';
          this._lights[i] = L;
        }
        L.position.set(o.position.x, o.position.y, o.position.z);
        L.intensity = o.intensity * 0.05;
        L.range = o.distance || 20;
        L.diffuse = new B.Color3(o.color.r, o.color.g, o.color.b);
      }
      i++;
    });
  }

  _syncFog(scene) {
    const B = this._babylon;
    if (!B || !this._bScene) return;
    if (scene.fog?.isFogExp2) {
      this._bScene.fogMode = B.Scene.FOGMODE_EXP2;
      this._bScene.fogDensity = scene.fog.density;
      const c = scene.fog.color;
      this._bScene.fogColor = new B.Color3(c.r, c.g, c.b);
    } else {
      this._bScene.fogMode = B.Scene.FOGMODE_NONE;
    }
  }

  render(scene, camera) {
    if (this.info.autoReset) this.info.reset();
    this.info.render.frame++;
    if (!this._engine || !this._babylon) return;
    this._lastCamera = camera;
    const B = this._babylon;
    const engine = this._engine;
    const rt = this._currentRT ? this._ensureRT(this._currentRT) : null;

    if (camera?.isOrthographicCamera) {
      this._renderQuad(scene, camera, rt);
      return;
    }

    if (!scene) return;
    scene.updateMatrixWorld(true);
    this._syncCamera(camera);
    this._syncLights(scene);
    this._syncFog(scene);
    const seen = new Set();
    scene.traverse((o) => {
      if (o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.isPoints || o.isLine || o.isLineSegments) {
        let vis = o.visible;
        let p = o.parent;
        while (vis && p) {
          vis = vis && p.visible;
          p = p.parent;
        }
        this._syncMesh(o, vis);
        seen.add(o);
      }
    });
    for (const [obj, rec] of this._meshMap) {
      if (!seen.has(obj) && rec.mesh) rec.mesh.setEnabled(false);
    }

    this.info.render.calls = this._bScene.meshes.filter((m) => m.isEnabled()).length;
    this.info.render.triangles = this.info.render.calls * 100;
    this.info.memory.geometries = this._meshMap.size;
    this.info.programs = this.info.programs.length ? this.info.programs : [{}];

    if (rt) {
      rt.renderList = this._bScene.meshes;
      rt.activeCamera = this._bCamera;
      rt.render(false);
    } else {
      this._bScene.autoClear = this.autoClear;
      this._bScene.render(false);
    }
    void engine;
    void IDENTITY;
    void hexOf;
  }

  _renderQuad(scene, camera, rt) {
    const B = this._babylon;
    if (!B) return;
    let quad = scene.children.find((c) => c.isMesh);
    if (!quad) {
      scene.traverse((o) => {
        if (!quad && o.isMesh) quad = o;
      });
    }
    if (!quad) return;
    const mat = quad.material;
    if (!mat?.isShaderMaterial) return;
    const rec = this._shaderMaterial(mat, this._quadScene);
    this._pushUniforms(mat, rec, camera);
    let mesh = this._quadMesh;
    if (!mesh) {
      mesh = new Mesh('q', this._quadScene);
      const vd = new VertexData();
      vd.positions = [-1, -1, 0, 3, -1, 0, -1, 3, 0];
      vd.uvs = [0, 0, 2, 0, 0, 2];
      vd.indices = [0, 1, 2];
      vd.applyToMesh(mesh, true);
      this._quadMesh = mesh;
    }
    mesh.material = rec.shader;
    if (rt) {
      this._quadScene.incrementRenderId();
      this._engine.bindFramebuffer(rt.getInternalTexture());
      this._quadScene.render();
      this._engine.unBindFramebuffer(rt.getInternalTexture());
    } else {
      this._quadScene.render();
    }
  }

  compile() {}

  resetState() {}

  forceContextLoss() {
    this._engine?.dispose();
    this._engine = null;
  }

  dispose() {
    this._glow?.dispose();
    this._shadow?.dispose();
    for (const rec of this._meshMap.values()) rec.mesh?.dispose();
    this._meshMap.clear();
    this._engine?.dispose();
    this._engine = null;
    this._bScene = null;
  }
}
