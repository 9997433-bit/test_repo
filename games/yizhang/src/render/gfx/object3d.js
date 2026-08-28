import { Color, Euler, Matrix4, Quaternion, Vector3 } from './math.js';

const _m1 = new Matrix4();
const _q1 = new Quaternion();
const _target = new Vector3();
const _position = new Vector3();
const _scale = new Vector3();
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();

export class Layers {
  constructor() {
    this.mask = 1 | 0;
  }
  set(channel) {
    this.mask = (1 << channel) | 0;
  }
  enable(channel) {
    this.mask |= 1 << channel;
  }
  enableAll() {
    this.mask = 0xffffffff | 0;
  }
  toggle(channel) {
    this.mask ^= 1 << channel;
  }
  disable(channel) {
    this.mask &= ~(1 << channel);
  }
  disableAll() {
    this.mask = 0;
  }
  test(layers) {
    return (this.mask & layers.mask) !== 0;
  }
  isEnabled(channel) {
    return (this.mask & (1 << channel)) !== 0;
  }
}

let _id = 0;

export class Object3D {
  constructor() {
    this.id = ++_id;
    this.uuid = `o${this.id}`;
    this.name = '';
    this.type = 'Object3D';
    this.parent = null;
    this.children = [];
    this.up = Object3D.DEFAULT_UP.clone();
    this.position = new Vector3();
    this.rotation = new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.matrixAutoUpdate = true;
    this.matrixWorldNeedsUpdate = false;
    this.layers = new Layers();
    this.visible = true;
    this.castShadow = false;
    this.receiveShadow = false;
    this.frustumCulled = true;
    this.renderOrder = 0;
    this.userData = {};
    this.isObject3D = true;

    this.rotation._onChangeCallback = () => {
      this.quaternion.setFromEuler(this.rotation, false);
      this.matrixWorldNeedsUpdate = true;
    };
    this.quaternion._onChangeCallback = () => {
      this.rotation.setFromQuaternion(this.quaternion, this.rotation.order, false);
      this.matrixWorldNeedsUpdate = true;
    };
    const dirty = () => {
      this.matrixWorldNeedsUpdate = true;
    };
    this.position._onChangeCallback = dirty;
    this.scale._onChangeCallback = dirty;
  }

  add(...objects) {
    for (const object of objects) {
      if (!object) continue;
      if (object.parent) object.parent.remove(object);
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

  clear() {
    for (const child of this.children) child.parent = null;
    this.children.length = 0;
    return this;
  }

  attach(object) {
    this.updateWorldMatrix(true, false);
    _m1.copy(this.matrixWorld).invert();
    if (object.parent) {
      object.parent.updateWorldMatrix(true, false);
      _m1.multiply(object.parent.matrixWorld);
    }
    object.applyMatrix4(_m1);
    this.add(object);
    object.updateWorldMatrix(false, true);
    return this;
  }

  applyMatrix4(matrix) {
    if (this.matrixAutoUpdate) this.updateMatrix();
    this.matrix.premultiply(matrix);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
    return this;
  }

  applyQuaternion(q) {
    this.quaternion.premultiply(q);
    return this;
  }

  setRotationFromAxisAngle(axis, angle) {
    this.quaternion.setFromAxisAngle(axis, angle);
    return this;
  }

  rotateOnAxis(axis, angle) {
    _q1.setFromAxisAngle(axis, angle);
    this.quaternion.multiply(_q1);
    return this;
  }

  rotateX(angle) {
    return this.rotateOnAxis(_x.set(1, 0, 0), angle);
  }
  rotateY(angle) {
    return this.rotateOnAxis(_x.set(0, 1, 0), angle);
  }
  rotateZ(angle) {
    return this.rotateOnAxis(_x.set(0, 0, 1), angle);
  }

  translateOnAxis(axis, distance) {
    _x.copy(axis).applyQuaternion(this.quaternion);
    this.position.add(_x.multiplyScalar(distance));
    return this;
  }

  lookAt(x, y, z) {
    if (x.isVector3) _target.copy(x);
    else _target.set(x, y, z);
    const parent = this.parent;
    this.updateWorldMatrix(true, false);
    _position.setFromMatrixPosition(this.matrixWorld);
    if (this.isCamera || this.isLight) {
      _m1.lookAt(_position, _target, this.up);
    } else {
      _m1.lookAt(_target, _position, this.up);
    }
    this.quaternion.setFromRotationMatrix(_m1);
    if (parent) {
      _m1.extractRotation(parent.matrixWorld);
      _q1.setFromRotationMatrix(_m1);
      this.quaternion.premultiply(_q1.invert());
    }
    return this;
  }

  getWorldPosition(target) {
    this.updateWorldMatrix(true, false);
    return target.setFromMatrixPosition(this.matrixWorld);
  }

  getWorldQuaternion(target) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_position, target, _scale);
    return target;
  }

  getWorldScale(target) {
    this.updateWorldMatrix(true, false);
    this.matrixWorld.decompose(_position, _q1, target);
    return target;
  }

  getWorldDirection(target) {
    this.updateWorldMatrix(true, false);
    const e = this.matrixWorld.elements;
    return target.set(-e[8], -e[9], -e[10]).normalize();
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

  getObjectByName(name) {
    if (this.name === name) return this;
    for (const child of this.children) {
      const hit = child.getObjectByName(name);
      if (hit) return hit;
    }
    return undefined;
  }

  getObjectByProperty(name, value) {
    if (this[name] === value) return this;
    for (const child of this.children) {
      const hit = child.getObjectByProperty(name, value);
      if (hit) return hit;
    }
    return undefined;
  }

  updateMatrix() {
    this.matrix.compose(this.position, this.quaternion, this.scale);
    this.matrixWorldNeedsUpdate = true;
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
    const parent = this.parent;
    if (updateParents === true && parent !== null) parent.updateWorldMatrix(true, false);
    if (this.matrixAutoUpdate) this.updateMatrix();
    if (this.parent === null) this.matrixWorld.copy(this.matrix);
    else this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix);
    if (updateChildren === true) {
      for (const child of this.children) child.updateWorldMatrix(false, true);
    }
  }

  copy(source, recursive = true) {
    this.name = source.name;
    this.up.copy(source.up);
    this.position.copy(source.position);
    this.rotation.copy(source.rotation);
    this.quaternion.copy(source.quaternion);
    this.scale.copy(source.scale);
    this.matrix.copy(source.matrix);
    this.matrixWorld.copy(source.matrixWorld);
    this.matrixAutoUpdate = source.matrixAutoUpdate;
    this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;
    this.layers.mask = source.layers.mask;
    this.visible = source.visible;
    this.castShadow = source.castShadow;
    this.receiveShadow = source.receiveShadow;
    this.frustumCulled = source.frustumCulled;
    this.renderOrder = source.renderOrder;
    this.userData = { ...source.userData };
    if (recursive) {
      for (const child of source.children) this.add(child.clone());
    }
    return this;
  }

  clone(recursive) {
    return new this.constructor().copy(this, recursive);
  }
}

Object3D.DEFAULT_UP = new Vector3(0, 1, 0);

export class Group extends Object3D {
  constructor() {
    super();
    this.type = 'Group';
    this.isGroup = true;
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
  }
}

export class FogExp2 {
  constructor(color, density = 0.00025) {
    this.name = '';
    this.color = color?.isColor ? color.clone() : new Color(color);
    this.density = density;
    this.isFogExp2 = true;
  }
}

export class Clock {
  constructor(autoStart = true) {
    this.autoStart = autoStart;
    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;
    this.running = false;
  }
  start() {
    this.startTime = now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }
  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }
  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }
  getDelta() {
    let diff = 0;
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (this.running) {
      const newTime = now();
      diff = (newTime - this.oldTime) / 1000;
      this.oldTime = newTime;
      this.elapsedTime += diff;
    }
    return diff;
  }
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

void _y;
void _z;
