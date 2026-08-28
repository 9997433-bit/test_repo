// 渲染适配层 · 场景图。
//
// 纯 JS 的保留式场景图：变换、层级、可见性、层掩码全在这里算完，后端
// （./backend.js，Babylon.js 8）只在绘制时把叶子节点的世界矩阵与材质投影过去。
// 这样单测可以在没有 GL 上下文、也没有引擎实例的情况下验形与验姿态。

import { Euler, Matrix4, Quaternion, Vector3 } from './math.js';

let _objectId = 0;

/** 层掩码。项目里只当标记用（辉光 / 遮挡体），不参与相机剔除。 */
export class Layers {
  constructor() {
    this.mask = 1;
  }

  set(channel) {
    this.mask = ((1 << channel) | 0) >>> 0;
  }

  enable(channel) {
    this.mask |= (1 << channel) | 0;
  }

  enableAll() {
    this.mask = 0xffffffff | 0;
  }

  toggle(channel) {
    this.mask ^= (1 << channel) | 0;
  }

  disable(channel) {
    this.mask &= ~((1 << channel) | 0);
  }

  disableAll() {
    this.mask = 0;
  }

  test(layers) {
    return (this.mask & layers.mask) !== 0;
  }

  isEnabled(channel) {
    return (this.mask & ((1 << channel) | 0)) !== 0;
  }
}

const _m1 = new Matrix4();
const _target = new Vector3();
const _position = new Vector3();
const _scale = new Vector3();
const _quaternion = new Quaternion();
const _v1 = new Vector3();
const _axisX = new Vector3(1, 0, 0);
const _axisY = new Vector3(0, 1, 0);
const _axisZ = new Vector3(0, 0, 1);

export class Object3D {
  constructor() {
    this.id = _objectId++;
    this.uuid = `o${this.id}`;
    this.name = '';
    this.type = 'Object3D';
    this.isObject3D = true;

    this.parent = null;
    this.children = [];
    this.up = new Vector3(0, 1, 0);

    this.position = new Vector3();
    this.rotation = new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);

    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.matrixAutoUpdate = true;
    this.matrixWorldNeedsUpdate = false;

    this.visible = true;
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true;
    this.renderOrder = 0;
    this.layers = new Layers();
    this.userData = {};
  }

  add(...objects) {
    for (const object of objects) {
      if (object === this || !object) continue;
      object.removeFromParent();
      object.parent = this;
      this.children.push(object);
    }
    return this;
  }

  remove(...objects) {
    for (const object of objects) {
      const i = this.children.indexOf(object);
      if (i !== -1) {
        object.parent = null;
        this.children.splice(i, 1);
      }
    }
    return this;
  }

  removeFromParent() {
    this.parent?.remove(this);
    return this;
  }

  clear() {
    return this.remove(...this.children);
  }

  /**
   * 把 object 挂到自己底下，并保持它的世界变换不变。
   */
  attach(object) {
    this.updateWorldMatrix(true, false);
    _m1.copy(this.matrixWorld).invert();
    if (object.parent !== null) {
      object.parent.updateWorldMatrix(true, false);
      _m1.multiply(object.parent.matrixWorld);
    }
    object.applyMatrix4(_m1);
    object.removeFromParent();
    object.parent = this;
    this.children.push(object);
    object.updateWorldMatrix(false, true);
    return this;
  }

  getObjectByName(name) {
    if (this.name === name) return this;
    for (const child of this.children) {
      const found = child.getObjectByName(name);
      if (found) return found;
    }
    return undefined;
  }

  traverse(callback) {
    callback(this);
    for (const child of this.children) child.traverse(callback);
  }

  traverseVisible(callback) {
    if (!this.visible) return;
    callback(this);
    for (const child of this.children) child.traverseVisible(callback);
  }

  traverseAncestors(callback) {
    if (!this.parent) return;
    callback(this.parent);
    this.parent.traverseAncestors(callback);
  }

  applyMatrix4(matrix) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    this.matrix.premultiply(matrix);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
    this.rotation.setFromQuaternion(this.quaternion);
    return this;
  }

  updateMatrix() {
    // 欧拉角是唯一的朝向权威（渲染层从不直接写 quaternion，lookAt 也回写欧拉角）
    this.quaternion.setFromEuler(this.rotation);
    this.matrix.compose(this.position, this.quaternion, this.scale);
    this.matrixWorldNeedsUpdate = true;
    return this;
  }

  updateMatrixWorld(force) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.matrixWorldNeedsUpdate || force) {
      if (this.parent === null) this.matrixWorld.copy(this.matrix);
      else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
      this.matrixWorldNeedsUpdate = false;
      force = true;
    }
    for (const child of this.children) child.updateMatrixWorld(force);
  }

  updateWorldMatrix(updateParents, updateChildren) {
    if (updateParents && this.parent) this.parent.updateWorldMatrix(true, false);
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.parent === null) this.matrixWorld.copy(this.matrix);
    else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    if (updateChildren) for (const child of this.children) child.updateWorldMatrix(false, true);
  }

  getWorldPosition(target = new Vector3()) {
    this.updateWorldMatrix(true, false);
    return target.setFromMatrixPosition(this.matrixWorld);
  }

  getWorldQuaternion(target = new Quaternion()) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_position, target, _scale);
    return target;
  }

  getWorldScale(target = new Vector3()) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_position, _quaternion, target);
    return target;
  }

  /** 世界系里对象自身的 -Z 轴（与 three 一致，也是本项目的「前方」）。 */
  getWorldDirection(target = new Vector3()) {
    this.updateWorldMatrix(true, false);
    const e = this.matrixWorld.elements;
    return target.set(-e[8], -e[9], -e[10]).normalize();
  }

  localToWorld(vector) {
    this.updateWorldMatrix(true, false);
    return vector.applyMatrix4(this.matrixWorld);
  }

  worldToLocal(vector) {
    this.updateWorldMatrix(true, false);
    return vector.applyMatrix4(_m1.copy(this.matrixWorld).invert());
  }

  /**
   * 朝某个点看。相机的取向与普通物体相反（相机看向自己的 -Z）。
   * 结果写回欧拉角，因为本层把欧拉角当朝向权威。
   */
  lookAt(x, y, z) {
    if (x && typeof x === 'object') _target.copy(x);
    else _target.set(x, y, z);
    const parent = this.parent;
    this.updateWorldMatrix(true, false);
    _position.setFromMatrixPosition(this.matrixWorld);
    if (this.isCamera || this.isLight) _m1.lookAt(_position, _target, this.up);
    else _m1.lookAt(_target, _position, this.up);
    this.quaternion.setFromRotationMatrix(_m1);
    if (parent) {
      _m1.extractRotation(parent.matrixWorld);
      _quaternion.setFromRotationMatrix(_m1);
      this.quaternion.premultiply(_quaternion.invert());
    }
    this.rotation.setFromQuaternion(this.quaternion);
    return this;
  }

  /** 绕自身某个轴再转一点。朝向权威仍是欧拉角，所以结果写回欧拉角。 */
  rotateOnAxis(axis, angle) {
    this.quaternion.setFromEuler(this.rotation);
    _quaternion.setFromAxisAngle(axis, angle);
    this.quaternion.multiply(_quaternion);
    this.rotation.setFromQuaternion(this.quaternion);
    return this;
  }

  rotateX(angle) {
    return this.rotateOnAxis(_axisX, angle);
  }

  rotateY(angle) {
    return this.rotateOnAxis(_axisY, angle);
  }

  rotateZ(angle) {
    return this.rotateOnAxis(_axisZ, angle);
  }

  translateOnAxis(axis, distance) {
    this.quaternion.setFromEuler(this.rotation);
    _v1.copy(axis).applyQuaternion(this.quaternion);
    this.position.addScaledVector(_v1, distance);
    return this;
  }

  /** three 的 Object3D 没有资源要收，留一个空壳让调用点统一写。 */
  dispose() {}
}

export class Group extends Object3D {
  constructor() {
    super();
    this.type = 'Group';
    this.isGroup = true;
  }
}

export class FogExp2 {
  constructor(color, density = 0.00025) {
    this.isFogExp2 = true;
    this.name = '';
    this.color = color;
    this.density = density;
  }
}

export class Fog {
  constructor(color, near = 1, far = 1000) {
    this.isFog = true;
    this.color = color;
    this.near = near;
    this.far = far;
  }
}

export class Scene extends Object3D {
  constructor() {
    super();
    this.type = 'Scene';
    this.isScene = true;
    this.background = null;
    this.environment = null;
    this.environmentIntensity = 1;
    this.fog = null;
    this.overrideMaterial = null;
    /** 后端实例（Babylon Scene 包装）。没有渲染器时恒为 null。 */
    this.backend = null;
  }
}
