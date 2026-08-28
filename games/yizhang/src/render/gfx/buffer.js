import { Box3, Matrix3, Matrix4, Sphere, Vector3 } from './math.js';
import { DynamicDrawUsage, StaticDrawUsage } from './constants.js';

export class BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    this.array = array;
    this.itemSize = itemSize;
    this.count = array ? Math.floor(array.length / itemSize) : 0;
    this.normalized = normalized;
    this.usage = StaticDrawUsage;
    this.needsUpdate = false;
    this.isBufferAttribute = true;
  }
  setUsage(usage) {
    this.usage = usage;
    return this;
  }
  getX(i) {
    return this.array[i * this.itemSize];
  }
  getY(i) {
    return this.array[i * this.itemSize + 1];
  }
  getZ(i) {
    return this.array[i * this.itemSize + 2];
  }
  getW(i) {
    return this.array[i * this.itemSize + 3];
  }
  setX(i, x) {
    this.array[i * this.itemSize] = x;
    return this;
  }
  setY(i, y) {
    this.array[i * this.itemSize + 1] = y;
    return this;
  }
  setZ(i, z) {
    this.array[i * this.itemSize + 2] = z;
    return this;
  }
  setW(i, w) {
    this.array[i * this.itemSize + 3] = w;
    return this;
  }
  setXY(i, x, y) {
    const o = i * this.itemSize;
    this.array[o] = x;
    this.array[o + 1] = y;
    return this;
  }
  setXYZ(i, x, y, z) {
    const o = i * this.itemSize;
    this.array[o] = x;
    this.array[o + 1] = y;
    this.array[o + 2] = z;
    return this;
  }
  setXYZW(i, x, y, z, w) {
    const o = i * this.itemSize;
    this.array[o] = x;
    this.array[o + 1] = y;
    this.array[o + 2] = z;
    this.array[o + 3] = w;
    return this;
  }
  copy(src) {
    this.array = src.array.slice ? src.array.slice() : new src.array.constructor(src.array);
    this.itemSize = src.itemSize;
    this.count = src.count;
    this.normalized = src.normalized;
    this.usage = src.usage;
    return this;
  }
  clone() {
    const Ctor = this.constructor;
    const attr = new Ctor(this.array.slice ? this.array.slice() : new this.array.constructor(this.array), this.itemSize, this.normalized);
    attr.usage = this.usage;
    return attr;
  }
}

export class Float32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized) {
    super(array instanceof Float32Array ? array : new Float32Array(array), itemSize, normalized);
  }
}

export class InstancedBufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized, meshPerAttribute = 1) {
    super(array, itemSize, normalized);
    this.meshPerAttribute = meshPerAttribute;
    this.isInstancedBufferAttribute = true;
  }
}

export class BufferGeometry {
  constructor() {
    this.type = 'BufferGeometry';
    this.isBufferGeometry = true;
    this.attributes = {};
    this.index = null;
    this.groups = [];
    this.drawRange = { start: 0, count: Infinity };
    this.boundingBox = null;
    this.boundingSphere = null;
    this.parameters = undefined;
    this.uuid = `g${Math.random().toString(36).slice(2)}`;
    this.name = '';
    this.userData = {};
  }
  setAttribute(name, attr) {
    this.attributes[name] = attr;
    return this;
  }
  getAttribute(name) {
    return this.attributes[name];
  }
  deleteAttribute(name) {
    delete this.attributes[name];
    return this;
  }
  hasAttribute(name) {
    return this.attributes[name] != null;
  }
  setIndex(index) {
    if (Array.isArray(index)) {
      const max = index.reduce((a, b) => (b > a ? b : a), 0);
      this.index = new BufferAttribute(max > 65535 ? new Uint32Array(index) : new Uint16Array(index), 1);
    } else {
      this.index = index;
    }
    return this;
  }
  setDrawRange(start, count) {
    this.drawRange.start = start;
    this.drawRange.count = count;
    return this;
  }
  addGroup(start, count, materialIndex = 0) {
    this.groups.push({ start, count, materialIndex });
    return this;
  }
  computeBoundingBox() {
    if (!this.boundingBox) this.boundingBox = new Box3();
    const pos = this.attributes.position;
    if (pos) this.boundingBox.setFromBufferAttribute(pos);
    return this;
  }
  computeBoundingSphere() {
    this.computeBoundingBox();
    if (!this.boundingSphere) this.boundingSphere = new Sphere();
    const box = this.boundingBox;
    box.getCenter(this.boundingSphere.center);
    this.boundingSphere.radius = this.boundingSphere.center.distanceTo(box.max);
    return this;
  }
  computeVertexNormals() {
    const pos = this.attributes.position;
    if (!pos) return this;
    const normals = new Float32Array(pos.array.length);
    const pA = new Vector3();
    const pB = new Vector3();
    const pC = new Vector3();
    const cb = new Vector3();
    const ab = new Vector3();
    const index = this.index;
    const add = (ia, ib, ic) => {
      pA.fromArray(pos.array, ia * 3);
      pB.fromArray(pos.array, ib * 3);
      pC.fromArray(pos.array, ic * 3);
      cb.subVectors(pC, pB);
      ab.subVectors(pA, pB);
      cb.cross(ab);
      normals[ia * 3] += cb.x;
      normals[ia * 3 + 1] += cb.y;
      normals[ia * 3 + 2] += cb.z;
      normals[ib * 3] += cb.x;
      normals[ib * 3 + 1] += cb.y;
      normals[ib * 3 + 2] += cb.z;
      normals[ic * 3] += cb.x;
      normals[ic * 3 + 1] += cb.y;
      normals[ic * 3 + 2] += cb.z;
    };
    if (index) {
      for (let i = 0; i < index.count; i += 3) add(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    } else {
      for (let i = 0; i < pos.count; i += 3) add(i, i + 1, i + 2);
    }
    const attr = new BufferAttribute(normals, 3);
    for (let i = 0; i < attr.count; i++) {
      pA.fromArray(normals, i * 3);
      pA.normalize();
      attr.setXYZ(i, pA.x, pA.y, pA.z);
    }
    this.setAttribute('normal', attr);
    return this;
  }
  applyMatrix4(matrix) {
    const pos = this.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        _p.fromArray(pos.array, i * 3).applyMatrix4(matrix);
        pos.setXYZ(i, _p.x, _p.y, _p.z);
      }
      pos.needsUpdate = true;
    }
    const nrm = this.attributes.normal;
    if (nrm) {
      const nmat = _nmat.getNormalMatrix(matrix);
      for (let i = 0; i < nrm.count; i++) {
        _p.fromArray(nrm.array, i * 3).applyMatrix3(nmat).normalize();
        nrm.setXYZ(i, _p.x, _p.y, _p.z);
      }
      nrm.needsUpdate = true;
    }
    if (this.boundingBox) this.computeBoundingBox();
    if (this.boundingSphere) this.computeBoundingSphere();
    return this;
  }
  rotateX(angle) {
    return this.applyMatrix4(_m.makeRotationX(angle));
  }
  rotateY(angle) {
    return this.applyMatrix4(_m.makeRotationY(angle));
  }
  rotateZ(angle) {
    return this.applyMatrix4(_m.makeRotationZ(angle));
  }
  translate(x, y, z) {
    return this.applyMatrix4(_m.makeTranslation(x, y, z));
  }
  scale(x, y, z) {
    return this.applyMatrix4(_m.makeScale(x, y, z));
  }
  lookAt(v) {
    _obj.lookAt(v);
    _obj.updateMatrix();
    return this.applyMatrix4(_obj.matrix);
  }
  clone() {
    const g = new BufferGeometry();
    g.type = this.type;
    g.parameters = this.parameters ? { ...this.parameters } : undefined;
    if (this.index) g.index = this.index.clone();
    for (const key of Object.keys(this.attributes)) g.attributes[key] = this.attributes[key].clone();
    g.groups = this.groups.map((x) => ({ ...x }));
    g.drawRange = { ...this.drawRange };
    return g;
  }
  copy(source) {
    const c = source.clone();
    this.type = c.type;
    this.parameters = c.parameters;
    this.index = c.index;
    this.attributes = c.attributes;
    this.groups = c.groups;
    this.drawRange = c.drawRange;
    return this;
  }
  dispose() {
    this.attributes = {};
    this.index = null;
  }
}

const _p = new Vector3();
const _m = new Matrix4();
const _nmat = new Matrix3();
const _obj = {
  matrix: new Matrix4(),
  lookAt(v) {
    this.matrix.lookAt(new Vector3(), v, new Vector3(0, 1, 0));
  },
  updateMatrix() {},
};

void DynamicDrawUsage;

export function mergeGeometries(geometries, useGroups = false) {
  const list = geometries.filter(Boolean);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0].clone();
  const out = new BufferGeometry();
  out.type = 'BufferGeometry';
  const names = new Set();
  for (const g of list) for (const k of Object.keys(g.attributes)) names.add(k);
  const merged = {};
  for (const name of names) {
    const itemSize = list.find((g) => g.attributes[name])?.attributes[name].itemSize ?? 3;
    const total = list.reduce((n, g) => n + (g.attributes[name]?.count ?? 0), 0);
    merged[name] = new Float32Array(total * itemSize);
  }
  let indexCount = 0;
  let hasIndex = list.every((g) => g.index);
  for (const g of list) {
    if (g.index) indexCount += g.index.count;
    else indexCount += g.attributes.position.count;
  }
  const index = new Uint32Array(indexCount);
  let vOff = 0;
  let iOff = 0;
  let groupStart = 0;
  for (let gi = 0; gi < list.length; gi++) {
    const g = list[gi];
    const count = g.attributes.position.count;
    for (const name of names) {
      const attr = g.attributes[name];
      const dst = merged[name];
      const size = attr ? attr.itemSize : 3;
      for (let i = 0; i < count; i++) {
        for (let k = 0; k < size; k++) {
          dst[(vOff + i) * size + k] = attr ? attr.array[i * size + k] : 0;
        }
      }
    }
    if (hasIndex && g.index) {
      for (let i = 0; i < g.index.count; i++) index[iOff++] = g.index.array[i] + vOff;
    } else {
      hasIndex = true;
      for (let i = 0; i < count; i++) index[iOff++] = vOff + i;
    }
    if (useGroups) out.addGroup(groupStart, (hasIndex ? (g.index ? g.index.count : count) : count), gi);
    groupStart = iOff;
    vOff += count;
  }
  for (const name of names) {
    const itemSize = list.find((g) => g.attributes[name])?.attributes[name].itemSize ?? 3;
    out.setAttribute(name, new BufferAttribute(merged[name], itemSize));
  }
  out.setIndex(new BufferAttribute(index, 1));
  return out;
}
