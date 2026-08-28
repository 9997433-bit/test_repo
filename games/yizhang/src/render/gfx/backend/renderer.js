// 后端 · 渲染器。适配层唯一真正持有 Babylon.js 实例的地方。
//
// 契约与调用方原本用的那套一致：`setSize` / `setPixelRatio` / `setRenderTarget` /
// `render(scene, camera)` / `clear()`，后期链（../../postfx.js）就是靠这几个方法把
// 「主渲染 → 自发光通道 → 模糊 → 合成」串起来的。
//
// 做法：适配层的场景图是权威，每次 render 把这一棵树里**可见**的叶子摊平投影成引擎
// 网格（世界矩阵直接烘进去，不复刻层级），然后驱动引擎画一趟。同一个引擎场景服务
// 多棵适配层场景（主场景、全屏四边形场景），靠逐帧开关可见性区分。
//
// 坐标系：引擎开右手系，于是两边的 -Z 同为「前方」，sim 的 yaw 约定一个数都不用动。

import '@babylonjs/core/Engines/Extensions/engine.rawTexture.js';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture.js';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js';
import '@babylonjs/core/Meshes/thinInstanceMesh.js';

import { Engine } from '@babylonjs/core/Engines/engine.js';
import { NullEngine } from '@babylonjs/core/Engines/nullEngine.js';
import { Scene as BScene } from '@babylonjs/core/scene.js';
import { Camera as BCamera } from '@babylonjs/core/Cameras/camera.js';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js';
import {
  Matrix as BMatrix,
  Quaternion as BQuaternion,
  Vector3 as BVector3,
} from '@babylonjs/core/Maths/math.vector.js';
import { Mesh as BMesh } from '@babylonjs/core/Meshes/mesh.js';
import { SubMesh } from '@babylonjs/core/Meshes/subMesh.js';
import { Material as BMaterial } from '@babylonjs/core/Materials/material.js';
import { DirectionalLight as BDirectionalLight } from '@babylonjs/core/Lights/directionalLight.js';
import { HemisphericLight as BHemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js';
import { PointLight as BPointLight } from '@babylonjs/core/Lights/pointLight.js';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator.js';
import { Skeleton as BSkeleton } from '@babylonjs/core/Bones/skeleton.js';
import { Bone as BBone } from '@babylonjs/core/Bones/bone.js';

import { PCFSoftShadowMap } from '../constants.js';
import { Matrix4, Quaternion, Vector3 } from '../math.js';
import { resolveGeometry, instancedAttribute } from './geometry.js';
import { resolveMaterial } from './materials.js';
import { resolveRenderTarget, resolveTexture } from './textures.js';

/**
 * three 的光强按「除以 π 的辐照度」定义，Babylon 的按直觉强度定义；同一组数值要
 * 看起来一样，方向光 / 半球光需要这个系数。点光的平方衰减两边一致，另给一档。
 */
const DIRECTIONAL_INTENSITY = 1 / Math.PI;
const POINT_INTENSITY = 1 / (4 * Math.PI);

const _pos = new Vector3();
const _scl = new Vector3();
const _target = new Vector3();
const _quat = new Quaternion();
const _bmin = new BVector3();
const _bmax = new BVector3();

/** 相机：视图 / 投影矩阵由适配层算好后直接灌进来，引擎不再自己推。 */
class GfxCamera extends BCamera {
  constructor(name, scene) {
    super(name, BVector3.Zero(), scene, false);
    this._gfxView = BMatrix.Identity();
    this._gfxProjection = BMatrix.Identity();
  }

  getClassName() {
    return 'GfxCamera';
  }

  _isSynchronizedViewMatrix() {
    return false;
  }

  _getViewMatrix() {
    return this._gfxView;
  }

  getProjectionMatrix() {
    this._refreshFrustumPlanes = true;
    return this._gfxProjection;
  }
}

function renderingGroupOf(renderOrder) {
  if (renderOrder <= -100) return 0;
  if (renderOrder <= 0) return 1;
  if (renderOrder < 3) return 2;
  return 3;
}

export class WebGLRenderer {
  constructor(params = {}) {
    const canvas = params.canvas ?? null;
    this.domElement = canvas;
    this._headless = !canvas || typeof canvas.getContext !== 'function';

    this.engine = this._headless
      ? new NullEngine({ renderWidth: 1, renderHeight: 1, textureSize: 4, deterministicLockstep: false })
      : new Engine(
          canvas,
          !!params.antialias,
          {
            alpha: !!params.alpha,
            stencil: !!params.stencil,
            depth: params.depth !== false,
            preserveDrawingBuffer: !!params.preserveDrawingBuffer,
            powerPreference: params.powerPreference ?? 'high-performance',
            premultipliedAlpha: false,
            failIfMajorPerformanceCaveat: false,
            useHighPrecisionMatrix: true,
          },
          false
        );

    const scene = new BScene(this.engine);
    // 与 sim 同一套右手系：yaw = 0 面向 -Z，迁引擎不许动这个约定
    scene.useRightHandedSystem = true;
    scene.clearColor = new Color4(0, 0, 0, 1);
    scene.autoClear = true;
    scene.autoClearDepthAndStencil = true;
    scene.ambientColor = new Color3(0, 0, 0);
    scene.animationsEnabled = false;
    scene.particlesEnabled = false;
    scene.spritesEnabled = false;
    scene.lensFlaresEnabled = false;
    scene.probesEnabled = false;
    scene.collisionsEnabled = false;
    scene.physicsEnabled = false;
    scene.audioEnabled = false;
    scene.postProcessesEnabled = false;
    scene.constantlyUpdateMeshUnderPointer = false;
    scene.skipPointerMovePicking = true;
    scene.blockMaterialDirtyMechanism = false;
    // 色调映射与 sRGB 编码在合成着色器里手做，材质本身必须输出线性 HDR
    scene.imageProcessingConfiguration.applyByPostProcess = true;
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    scene.imageProcessingConfiguration.exposure = 1;
    scene.imageProcessingConfiguration.contrast = 1;
    this.bscene = scene;

    this.bcamera = new GfxCamera('gfx-camera', scene);
    scene.activeCamera = this.bcamera;

    /** 适配层节点 → 引擎网格。 */
    this._nodes = new Map();
    /** 引擎侧建过的所有网格，逐帧按「这一趟画的是哪棵树」开关。 */
    this._meshes = new Set();
    this._lights = new Map();
    this._skeletons = new Map();
    this._shadowCasters = [];
    this._activeShadow = null;

    this._renderTarget = null;
    this._pixelRatio = 1;
    this._width = 1;
    this._height = 1;
    this._environment = null;

    this.shadowMap = { enabled: false, type: PCFSoftShadowMap, autoUpdate: true, needsUpdate: false };
    this.info = {
      autoReset: true,
      render: { calls: 0, triangles: 0, frame: 0 },
      memory: { geometries: 0, textures: 0 },
      programs: [],
      reset: () => {
        this.info.render.calls = 0;
        this.info.render.triangles = 0;
      },
    };
    this.capabilities = {
      isWebGL2: !this._headless && this.engine.webGLVersion >= 2,
      maxTextureSize: this._headless ? 4096 : this.engine.getCaps().maxTextureSize,
      getMaxAnisotropy: () => (this._headless ? 1 : this.engine.getCaps().maxAnisotropy),
    };
    this.toneMapping = 0;
    this.autoClear = true;
    this.outputColorSpace = '';
  }

  // ---------- 画布 ----------

  setPixelRatio(ratio) {
    this._pixelRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
    this._applySize();
  }

  setSize(width, height) {
    this._width = Math.max(1, Math.floor(width));
    this._height = Math.max(1, Math.floor(height));
    this._applySize();
  }

  _applySize() {
    const w = Math.max(1, Math.floor(this._width * this._pixelRatio));
    const h = Math.max(1, Math.floor(this._height * this._pixelRatio));
    if (this.domElement) {
      this.domElement.width = w;
      this.domElement.height = h;
    }
    this.engine.setSize?.(w, h, true);
    this.engine.resize?.();
  }

  getDrawingBufferSize(target) {
    const w = Math.max(1, Math.floor(this._width * this._pixelRatio));
    const h = Math.max(1, Math.floor(this._height * this._pixelRatio));
    if (target) target.set(w, h);
    return { width: w, height: h };
  }

  getPixelRatio() {
    return this._pixelRatio;
  }

  setClearColor(color, alpha = 1) {
    const hex = typeof color === 'number' ? color : (color?.getHex?.() ?? 0);
    this.bscene.clearColor.set(
      ((hex >> 16) & 255) / 255,
      ((hex >> 8) & 255) / 255,
      (hex & 255) / 255,
      alpha
    );
  }

  /** 清屏由引擎在每趟渲染开头做，这里只记下意图（调用点每次 render 前都会清）。 */
  clear() {}

  setRenderTarget(rt) {
    this._renderTarget = rt ?? null;
    this.bcamera.outputRenderTarget = rt ? resolveRenderTarget(rt, this.bscene) : null;
  }

  getRenderTarget() {
    return this._renderTarget;
  }

  // ---------- 主流程 ----------

  render(scene, camera) {
    if (!scene || !camera) return;
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    this._syncEnvironment(scene);
    this._syncCamera(camera);
    const live = this._syncGraph(scene);
    this._syncLights(scene, live);
    for (const mesh of this._meshes) {
      const wanted = live.has(mesh);
      if (mesh.isEnabled(false) !== wanted) mesh.setEnabled(wanted);
    }

    this.bscene.render(false, false);
    this.info.render.calls += 1;
    this.info.render.triangles += Math.floor(this.bscene.getActiveIndices() / 3);
  }

  _syncCamera(camera) {
    const b = this.bcamera;
    BMatrix.FromArrayToRef(camera.matrixWorldInverse.elements, 0, b._gfxView);
    BMatrix.FromArrayToRef(camera.projectionMatrix.elements, 0, b._gfxProjection);
    const e = camera.matrixWorld.elements;
    b.position.set(e[12], e[13], e[14]);
    b._globalPosition.copyFrom(b.position);
    b.minZ = camera.near ?? 0.1;
    b.maxZ = camera.far ?? 2000;
    b._currentRenderId = -1;
  }

  _syncEnvironment(scene) {
    const fog = scene.fog;
    if (fog && fog.isFogExp2) {
      this.bscene.fogMode = BScene.FOGMODE_EXP2;
      this.bscene.fogDensity = fog.density;
      const c = fog.color;
      if (typeof c === 'number') {
        this.bscene.fogColor.set(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255);
      } else if (c) {
        this.bscene.fogColor.set(c.r, c.g, c.b);
      }
    } else {
      this.bscene.fogMode = BScene.FOGMODE_NONE;
    }

    if (scene.environment !== this._environment) {
      this._environment = scene.environment ?? null;
      this.bscene.environmentTexture = this._environment
        ? resolveTexture(this._environment, this.bscene)
        : null;
    }
    this.bscene.environmentIntensity = scene.environmentIntensity ?? 1;
  }

  // ---------- 场景图 ----------

  _syncGraph(scene) {
    const live = new Set();
    this._shadowCasters.length = 0;
    const walk = (node, parentVisible) => {
      const visible = parentVisible && node.visible !== false;
      if (visible && (node.isMesh || node.isPoints || node.isLine)) {
        const mesh = this._syncMesh(node, scene);
        if (mesh) {
          live.add(mesh);
          if (node.castShadow) this._shadowCasters.push(mesh);
        }
      }
      // 不可见的分支整棵跳过：与调用方原本的可见性语义一致
      if (!visible) return;
      for (const child of node.children) walk(child, true);
    };
    walk(scene, true);
    return live;
  }

  _record(node) {
    let rec = this._nodes.get(node);
    if (!rec) {
      const mesh = new BMesh(node.name || `gfx-${node.id}`, this.bscene);
      mesh.rotationQuaternion = BQuaternion.Identity();
      mesh.isPickable = false;
      mesh.doNotSyncBoundingInfo = false;
      mesh.receiveShadows = false;
      rec = {
        mesh,
        geometry: null,
        material: null,
        drawStart: -1,
        drawCount: -1,
        instanceVersion: -1,
        colorVersion: -1,
        instanceCount: -1,
        skeleton: null,
      };
      this._nodes.set(node, rec);
      this._meshes.add(mesh);
      node._backendMesh = mesh;
    }
    return rec;
  }

  _syncMesh(node, scene) {
    if (!node.geometry || !node.material) return null;
    const rec = this._record(node);
    const mesh = rec.mesh;

    // 变换：世界矩阵直接烘进节点（层级已经在适配层算完）
    node.matrixWorld.decompose(_pos, _quat, _scl);
    mesh.position.set(_pos.x, _pos.y, _pos.z);
    mesh.rotationQuaternion.set(_quat.x, _quat.y, _quat.z, _quat.w);
    mesh.scaling.set(_scl.x, _scl.y, _scl.z);

    const geoRec = resolveGeometry(node.geometry, this.bscene);
    if (rec.geometry !== geoRec.geometry) {
      geoRec.geometry.applyToMesh(mesh);
      rec.geometry = geoRec.geometry;
      rec.drawStart = -1;
    }

    const instanced = !!node.isInstancedMesh;
    if (instanced) this._syncInstances(node, rec, geoRec);
    else if (rec.instanceCount !== 0) {
      mesh.thinInstanceCount = 0;
      rec.instanceCount = 0;
    }

    if (node.isSkinnedMesh) this._syncSkeleton(node, rec);

    const material = Array.isArray(node.material) ? node.material[0] : node.material;
    const bm = resolveMaterial(material, this.bscene, {
      instanced,
      attributes: geoRec.attributeNames,
    });
    mesh.material = bm;
    rec.material = material;

    // 没有索引缓冲的几何（点精灵池、全屏三角形）必须显式声明，否则引擎直接跳过绘制
    mesh.isUnIndexed = !node.geometry.index;

    if (node.isPoints) {
      bm.fillMode = BMaterial.PointFillMode;
    } else if (node.isLineSegments) {
      bm.fillMode = BMaterial.LineListDrawMode;
    } else if (bm.fillMode !== BMaterial.TriangleFillMode) {
      bm.fillMode = BMaterial.TriangleFillMode;
    }

    this._syncDrawRange(node, rec, geoRec);

    mesh.receiveShadows = !!node.receiveShadow;
    mesh.alwaysSelectAsActiveMesh = node.frustumCulled === false;
    mesh.renderingGroupId = renderingGroupOf(node.renderOrder ?? 0);
    mesh.alphaIndex = node.renderOrder ?? 0;
    // 蒙皮网格自带一个手写的包围球（绑定姿势的顶点框不住摆动后的四肢），照搬过来当
    // **局部**包围盒。世界包围盒仍旧交给引擎按世界矩阵刷 —— 冻住它等于把角色的包围盒
    // 永远钉在原点，镜头一离开原点角色就整个被视锥剔掉。
    if (node.boundingSphere) {
      const r = node.boundingSphere.radius;
      const c = node.boundingSphere.center;
      const key = `${c.x},${c.y},${c.z},${r}`;
      if (rec.boundsKey !== key) {
        rec.boundsKey = key;
        _bmin.set(c.x - r, c.y - r, c.z - r);
        _bmax.set(c.x + r, c.y + r, c.z + r);
        mesh.getBoundingInfo().reConstruct(_bmin, _bmax, mesh.getWorldMatrix());
        mesh._updateBoundingInfo();
      }
    }
    return mesh;
  }

  _syncDrawRange(node, rec, geoRec) {
    const geo = node.geometry;
    const mesh = rec.mesh;
    const total = geo.attributes.position?.count ?? 0;
    const indexCount = geo.index ? geo.index.count : total;
    const range = geo.drawRange ?? { start: 0, count: Infinity };
    const start = Math.max(0, range.start | 0);
    const count = Number.isFinite(range.count) ? Math.min(range.count, indexCount - start) : indexCount - start;
    if (rec.drawStart === start && rec.drawCount === count) return;
    rec.drawStart = start;
    rec.drawCount = count;
    // 末位的 addToMesh 必须是 true —— SubMesh 是靠构造时自己挂到 mesh.subMeshes 上的，
    // 不挂就等于这个网格一个可画的子网格都没有，引擎会安静地跳过它。
    mesh.subMeshes = [];
    if (count <= 0) {
      // 空绘制范围：留一个零长度的子网格，本帧什么都不画
      new SubMesh(0, 0, 0, 0, 0, mesh, undefined, false, true);
      return;
    }
    if (geo.index) new SubMesh(0, 0, total, start, count, mesh, undefined, true, true);
    else new SubMesh(0, start, count, start, count, mesh, undefined, true, true);
  }

  _syncInstances(node, rec, geoRec) {
    const mesh = rec.mesh;
    const attr = node.instanceMatrix;
    if (rec.instanceVersion !== attr.version || rec.instanceCount !== node.count) {
      const data =
        attr.array.length === node.count * 16 ? attr.array : attr.array.subarray(0, node.count * 16);
      mesh.thinInstanceSetBuffer('matrix', data, 16, false);
      rec.instanceVersion = attr.version;
      rec.instanceCount = node.count;
    }
    mesh.thinInstanceCount = node.count;
    if (node.instanceColor && rec.colorVersion !== node.instanceColor.version) {
      const src = node.instanceColor.array;
      const rgba = new Float32Array(node.count * 4);
      for (let i = 0; i < node.count; i++) {
        rgba[i * 4] = src[i * 3];
        rgba[i * 4 + 1] = src[i * 3 + 1];
        rgba[i * 4 + 2] = src[i * 3 + 2];
        rgba[i * 4 + 3] = 1;
      }
      mesh.thinInstanceSetBuffer('color', rgba, 4, false);
      rec.colorVersion = node.instanceColor.version;
    }
    for (const name of geoRec.instancedNames) {
      const info = instancedAttribute(node.geometry, name);
      if (!info) continue;
      const key = `__inst_${name}`;
      if (rec[key] === info.version) continue;
      rec[key] = info.version;
      mesh.thinInstanceSetBuffer(name, info.data, info.stride, false);
    }
  }

  // ---------- 刚性蒙皮 ----------

  _syncSkeleton(node, rec) {
    const skeleton = node.skeleton;
    if (!skeleton) return;
    let bk = this._skeletons.get(skeleton);
    if (!bk) {
      const bs = new BSkeleton(`gfx-skel-${this._skeletons.size}`, `gfx-skel-${this._skeletons.size}`, this.bscene);
      const bones = skeleton.bones.map(
        (_, i) => new BBone(`b${i}`, bs, null, BMatrix.Identity(), BMatrix.Identity(), BMatrix.Identity(), i)
      );
      bk = { skeleton: bs, bones, scratch: new Matrix4(), tmp: BMatrix.Identity() };
      this._skeletons.set(skeleton, bk);
    }
    const m = bk.scratch;
    for (let i = 0; i < skeleton.bones.length; i++) {
      const bone = skeleton.bones[i];
      if (!bone) continue;
      // three 的蒙皮式子：bindMatrixInverse · boneWorld · boneInverse · bindMatrix
      m.multiplyMatrices(bone.matrixWorld, skeleton.boneInverses[i]);
      m.multiplyMatrices(node.bindMatrixInverse, m);
      m.multiply(node.bindMatrix);
      BMatrix.FromArrayToRef(m.elements, 0, bk.tmp);
      bk.bones[i].updateMatrix(bk.tmp, false, true);
    }
    rec.mesh.skeleton = bk.skeleton;
    rec.mesh.numBoneInfluencers = 4;
    rec.skeleton = bk.skeleton;
  }

  // ---------- 灯光 ----------

  /**
   * 一帧要渲好几棵适配层场景（主场景、全屏四边形场景），灯只挂在主场景上。
   * 因此回收必须按「这盏灯是哪棵树带来的」算：全屏那趟没有灯，不代表主场景的灯该拆。
   * 拆了会让 PBR 的灯光宏每帧翻一次，着色器永远编译不完 —— 画面就什么都不剩了。
   */
  _syncLights(scene, live) {
    const seen = new Set();
    scene.traverse((node) => {
      if (!node.isLight) return;
      const bl = this._syncLight(node, scene);
      if (bl) seen.add(bl);
    });
    for (const [src, bl] of this._lights) {
      if (bl._gfxOwner !== scene || seen.has(bl)) continue;
      bl.dispose();
      this._lights.delete(src);
    }
    this._syncShadows(live);
  }

  _syncLight(node, owner) {
    let bl = this._lights.get(node);
    if (!bl) {
      if (node.isHemisphereLight) {
        bl = new BHemisphericLight(node.name || 'hemi', new BVector3(0, 1, 0), this.bscene);
      } else if (node.isDirectionalLight) {
        bl = new BDirectionalLight(node.name || 'dir', new BVector3(0, -1, 0), this.bscene);
        bl.autoUpdateExtends = true;
        bl.autoCalcShadowZBounds = false;
      } else if (node.isPointLight) {
        bl = new BPointLight(node.name || 'point', BVector3.Zero(), this.bscene);
      } else if (node.isAmbientLight) {
        bl = new BHemisphericLight(node.name || 'ambient', new BVector3(0, 1, 0), this.bscene);
        bl.groundColor = new Color3(1, 1, 1);
      } else {
        return null;
      }
      bl.falloffType = BPointLight.FALLOFF_PHYSICAL;
      this._lights.set(node, bl);
      node._backend = bl;
    }
    bl._gfxOwner = owner;

    const c = node.color;
    bl.diffuse.set(c.r, c.g, c.b);
    bl.specular.set(c.r, c.g, c.b);

    const wp = node.getWorldPosition(_pos);
    if (bl.position) bl.position.set(wp.x, wp.y, wp.z);

    if (node.isHemisphereLight) {
      bl.intensity = node.intensity * DIRECTIONAL_INTENSITY;
      const g = node.groundColor;
      bl.groundColor.set(g.r, g.g, g.b);
      bl.direction.set(0, 1, 0);
    } else if (node.isDirectionalLight) {
      bl.intensity = node.intensity * DIRECTIONAL_INTENSITY;
      const t = node.target.getWorldPosition(_target);
      bl.direction.set(t.x - wp.x, t.y - wp.y, t.z - wp.z).normalize();
      const cam = node.shadow?.camera;
      if (cam) {
        bl.shadowMinZ = cam.near;
        bl.shadowMaxZ = cam.far;
        bl.orthoLeft = cam.left;
        bl.orthoRight = cam.right;
        bl.orthoTop = cam.top;
        bl.orthoBottom = cam.bottom;
        bl.autoUpdateExtends = false;
      }
    } else if (node.isPointLight) {
      bl.intensity = node.intensity * POINT_INTENSITY;
      bl.range = node.distance > 0 ? node.distance : 0;
    } else {
      bl.intensity = node.intensity * DIRECTIONAL_INTENSITY;
    }

    bl.shadowEnabled = !!node.castShadow && this.shadowMap.enabled;
    if (bl.shadowEnabled && !bl._gfxShadow) this._createShadow(node, bl);
    return bl;
  }

  _createShadow(node, bl) {
    const size = Math.max(256, node.shadow?.mapSize?.x ?? 1024);
    const gen = new ShadowGenerator(size, bl, false);
    gen.bias = Math.abs(node.shadow?.bias ?? 0.001) || 0.001;
    gen.normalBias = node.shadow?.normalBias ?? 0;
    if (this.shadowMap.type === PCFSoftShadowMap) {
      gen.usePercentageCloserFiltering = true;
      gen.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    } else {
      gen.usePoissonSampling = false;
    }
    gen.transparencyShadow = false;
    gen.forceBackFacesOnly = false;
    const map = gen.getShadowMap();
    map.renderList = [];
    // 阴影一帧只烘一次：一帧里主渲染与自发光通道各会 render 一趟
    map.refreshRate = 0;
    bl._gfxShadow = gen;
    this._activeShadow = gen;
  }

  _syncShadows(live) {
    const gen = this._activeShadow;
    if (!gen) return;
    const map = gen.getShadowMap();
    if (!map) return;
    const list = map.renderList;
    list.length = 0;
    for (const mesh of this._shadowCasters) if (live.has(mesh)) list.push(mesh);
    if (this.shadowMap.needsUpdate) {
      map.resetRefreshCounter();
      this.shadowMap.needsUpdate = false;
    }
  }

  // ---------- 收摊 ----------

  compile() {}

  forceContextLoss() {}

  dispose() {
    for (const mesh of this._meshes) mesh.dispose(false, false);
    this._meshes.clear();
    this._nodes.clear();
    for (const [, bl] of this._lights) bl.dispose();
    this._lights.clear();
    this._skeletons.clear();
    this.bscene.dispose();
    this.engine.dispose();
  }
}
