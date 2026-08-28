// 渲染适配层 · 几何体。
//
// 属性缓冲与图元生成器都是纯 JS：形状在这里长出来，后端只把 position / normal /
// uv / color 等数组塞进 Babylon 的 VertexData。生成器沿用项目原本那套参数化
// （`type` 与 `parameters` 也一并保留，单测按它们比对剪影签名）。

import { StaticDrawUsage } from './constants.js';
import { Box3, Sphere, Vector2, Vector3 } from './math.js';

let _geometryId = 0;

export class BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    this.isBufferAttribute = true;
    this.array = array;
    this.itemSize = itemSize;
    this.count = array === undefined ? 0 : array.length / itemSize;
    this.normalized = normalized;
    this.usage = StaticDrawUsage;
    this.version = 0;
    this._needsUpdate = false;
  }

  /** 置真就把版本推一格，后端下一帧照着重传（与调用方原本的写法一致）。 */
  get needsUpdate() {
    return this._needsUpdate;
  }

  set needsUpdate(v) {
    this._needsUpdate = !!v;
    if (v) this.version++;
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

  copyAt(i, attribute, j) {
    for (let k = 0; k < this.itemSize; k++) {
      this.array[i * this.itemSize + k] = attribute.array[j * attribute.itemSize + k];
    }
    return this;
  }

  clone() {
    const c = new BufferAttribute(this.array.slice(), this.itemSize, this.normalized);
    c.usage = this.usage;
    return c;
  }
}

export class Float32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    super(array instanceof Float32Array ? array : new Float32Array(array), itemSize, normalized);
  }
}

export class Uint16BufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    super(array instanceof Uint16Array ? array : new Uint16Array(array), itemSize, normalized);
  }
}

export class Uint32BufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized = false) {
    super(array instanceof Uint32Array ? array : new Uint32Array(array), itemSize, normalized);
  }
}

export class InstancedBufferAttribute extends BufferAttribute {
  constructor(array, itemSize, normalized = false, meshPerAttribute = 1) {
    super(array, itemSize, normalized);
    this.isInstancedBufferAttribute = true;
    this.meshPerAttribute = meshPerAttribute;
  }
}

const _vA = new Vector3();
const _vB = new Vector3();
const _vC = new Vector3();
const _cb = new Vector3();
const _ab = new Vector3();
const _box = new Box3();

export class BufferGeometry {
  constructor() {
    this.id = _geometryId++;
    this.isBufferGeometry = true;
    this.type = 'BufferGeometry';
    this.name = '';
    this.attributes = {};
    this.index = null;
    this.groups = [];
    this.boundingBox = null;
    this.boundingSphere = null;
    this.drawRange = { start: 0, count: Infinity };
    this.userData = {};
    /** 后端资源缓存（Babylon VertexData / Mesh 复用）。 */
    this._backend = null;
    this._version = 0;
  }

  setAttribute(name, attribute) {
    this.attributes[name] = attribute;
    this._version++;
    return this;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  deleteAttribute(name) {
    delete this.attributes[name];
    this._version++;
    return this;
  }

  hasAttribute(name) {
    return this.attributes[name] !== undefined;
  }

  setIndex(index) {
    if (Array.isArray(index)) {
      const max = index.length > 0 ? Math.max(...index) : 0;
      const Arr = max > 65535 ? Uint32Array : Uint16Array;
      this.index = new BufferAttribute(new Arr(index), 1);
    } else {
      this.index = index;
    }
    this._version++;
    return this;
  }

  getIndex() {
    return this.index;
  }

  addGroup(start, count, materialIndex = 0) {
    this.groups.push({ start, count, materialIndex });
  }

  clearGroups() {
    this.groups = [];
  }

  setDrawRange(start, count) {
    this.drawRange.start = start;
    this.drawRange.count = count;
  }

  applyMatrix4(matrix) {
    const position = this.attributes.position;
    if (position) {
      for (let i = 0; i < position.count; i++) {
        _vA.set(position.getX(i), position.getY(i), position.getZ(i)).applyMatrix4(matrix);
        position.setXYZ(i, _vA.x, _vA.y, _vA.z);
      }
      position.needsUpdate = true;
    }
    const normal = this.attributes.normal;
    if (normal) {
      for (let i = 0; i < normal.count; i++) {
        _vA.set(normal.getX(i), normal.getY(i), normal.getZ(i)).transformDirection(matrix);
        normal.setXYZ(i, _vA.x, _vA.y, _vA.z);
      }
      normal.needsUpdate = true;
    }
    this.boundingBox = null;
    this.boundingSphere = null;
    this._version++;
    return this;
  }

  translate(x, y, z) {
    const position = this.attributes.position;
    if (!position) return this;
    for (let i = 0; i < position.count; i++) {
      position.setXYZ(i, position.getX(i) + x, position.getY(i) + y, position.getZ(i) + z);
    }
    position.needsUpdate = true;
    this.boundingBox = null;
    this.boundingSphere = null;
    this._version++;
    return this;
  }

  scale(x, y, z) {
    const position = this.attributes.position;
    if (!position) return this;
    for (let i = 0; i < position.count; i++) {
      position.setXYZ(i, position.getX(i) * x, position.getY(i) * y, position.getZ(i) * z);
    }
    position.needsUpdate = true;
    this.boundingBox = null;
    this.boundingSphere = null;
    this._version++;
    return this;
  }

  rotateX(angle) {
    return this._rotate(angle, 'x');
  }

  rotateY(angle) {
    return this._rotate(angle, 'y');
  }

  rotateZ(angle) {
    return this._rotate(angle, 'z');
  }

  _rotate(angle, axis) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const spin = (attr) => {
      if (!attr) return;
      for (let i = 0; i < attr.count; i++) {
        const x = attr.getX(i);
        const y = attr.getY(i);
        const z = attr.getZ(i);
        if (axis === 'x') attr.setXYZ(i, x, y * c - z * s, y * s + z * c);
        else if (axis === 'y') attr.setXYZ(i, x * c + z * s, y, -x * s + z * c);
        else attr.setXYZ(i, x * c - y * s, x * s + y * c, z);
      }
      attr.needsUpdate = true;
    };
    spin(this.attributes.position);
    spin(this.attributes.normal);
    this.boundingBox = null;
    this.boundingSphere = null;
    this._version++;
    return this;
  }

  computeBoundingBox() {
    if (!this.boundingBox) this.boundingBox = new Box3();
    this.boundingBox.makeEmpty();
    const position = this.attributes.position;
    if (!position) return;
    for (let i = 0; i < position.count; i++) {
      this.boundingBox.expandByPoint(_vA.set(position.getX(i), position.getY(i), position.getZ(i)));
    }
  }

  computeBoundingSphere() {
    if (!this.boundingSphere) this.boundingSphere = new Sphere();
    const position = this.attributes.position;
    if (!position) {
      this.boundingSphere.set(new Vector3(), 0);
      return;
    }
    _box.makeEmpty();
    for (let i = 0; i < position.count; i++) {
      _box.expandByPoint(_vA.set(position.getX(i), position.getY(i), position.getZ(i)));
    }
    _box.getCenter(this.boundingSphere.center);
    let maxSq = 0;
    for (let i = 0; i < position.count; i++) {
      _vA.set(position.getX(i), position.getY(i), position.getZ(i));
      maxSq = Math.max(maxSq, this.boundingSphere.center.distanceToSquared(_vA));
    }
    this.boundingSphere.radius = Math.sqrt(maxSq);
  }

  computeVertexNormals() {
    const position = this.attributes.position;
    if (!position) return;
    let normal = this.attributes.normal;
    if (!normal) {
      normal = new BufferAttribute(new Float32Array(position.count * 3), 3);
      this.setAttribute('normal', normal);
    } else {
      normal.array.fill(0);
    }
    const index = this.index;
    const tri = (a, b, c) => {
      _vA.set(position.getX(a), position.getY(a), position.getZ(a));
      _vB.set(position.getX(b), position.getY(b), position.getZ(b));
      _vC.set(position.getX(c), position.getY(c), position.getZ(c));
      _cb.subVectors(_vC, _vB);
      _ab.subVectors(_vA, _vB);
      _cb.cross(_ab);
      for (const i of [a, b, c]) {
        normal.setXYZ(i, normal.getX(i) + _cb.x, normal.getY(i) + _cb.y, normal.getZ(i) + _cb.z);
      }
    };
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        tri(index.getX(i), index.getX(i + 1), index.getX(i + 2));
      }
    } else {
      for (let i = 0; i < position.count; i += 3) tri(i, i + 1, i + 2);
    }
    for (let i = 0; i < normal.count; i++) {
      _vA.set(normal.getX(i), normal.getY(i), normal.getZ(i)).normalize();
      normal.setXYZ(i, _vA.x, _vA.y, _vA.z);
    }
    normal.needsUpdate = true;
    this._version++;
  }

  toNonIndexed() {
    if (!this.index) return this;
    const out = new BufferGeometry();
    const index = this.index;
    for (const [name, attr] of Object.entries(this.attributes)) {
      if (attr.isInstancedBufferAttribute) continue;
      const Arr = attr.array.constructor;
      const arr = new Arr(index.count * attr.itemSize);
      for (let i = 0; i < index.count; i++) {
        const src = index.getX(i) * attr.itemSize;
        for (let k = 0; k < attr.itemSize; k++) arr[i * attr.itemSize + k] = attr.array[src + k];
      }
      out.setAttribute(name, new BufferAttribute(arr, attr.itemSize, attr.normalized));
    }
    out.type = this.type;
    out.parameters = this.parameters;
    return out;
  }

  clone() {
    const out = new BufferGeometry();
    out.type = this.type;
    if (this.parameters) out.parameters = { ...this.parameters };
    for (const [name, attr] of Object.entries(this.attributes)) out.setAttribute(name, attr.clone());
    if (this.index) out.setIndex(this.index.clone());
    out.groups = this.groups.map((g) => ({ ...g }));
    if (this.boundingSphere) out.boundingSphere = this.boundingSphere.clone();
    return out;
  }

  dispose() {
    this._backend?.dispose?.();
    this._backend = null;
  }
}

// -------------------------------------------------------------- 图元生成器

function build(type, parameters, positions, normals, uvs, indices) {
  const g = new BufferGeometry();
  g.type = type;
  g.parameters = parameters;
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  if (indices) g.setIndex(indices);
  return g;
}

export class PlaneGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    this.type = 'PlaneGeometry';
    this.parameters = { width, height, widthSegments, heightSegments };
    const halfW = width / 2;
    const halfH = height / 2;
    const gx = Math.floor(widthSegments);
    const gy = Math.floor(heightSegments);
    const segW = width / gx;
    const segH = height / gy;
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    for (let iy = 0; iy <= gy; iy++) {
      const y = iy * segH - halfH;
      for (let ix = 0; ix <= gx; ix++) {
        const x = ix * segW - halfW;
        vertices.push(x, -y, 0);
        normals.push(0, 0, 1);
        uvs.push(ix / gx, 1 - iy / gy);
      }
    }
    for (let iy = 0; iy < gy; iy++) {
      for (let ix = 0; ix < gx; ix++) {
        const a = ix + (gx + 1) * iy;
        const b = ix + (gx + 1) * (iy + 1);
        const c = ix + 1 + (gx + 1) * (iy + 1);
        const d = ix + 1 + (gx + 1) * iy;
        indices.push(a, b, d, b, c, d);
      }
    }
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

export class BoxGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    super();
    this.type = 'BoxGeometry';
    this.parameters = { width, height, depth, widthSegments, heightSegments, depthSegments };
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    let numberOfVertices = 0;
    const ws = Math.floor(widthSegments);
    const hs = Math.floor(heightSegments);
    const ds = Math.floor(depthSegments);

    const buildPlane = (u, v, w, udir, vdir, planeWidth, planeHeight, planeDepth, gridX, gridY) => {
      const segmentWidth = planeWidth / gridX;
      const segmentHeight = planeHeight / gridY;
      const widthHalf = planeWidth / 2;
      const heightHalf = planeHeight / 2;
      const depthHalf = planeDepth / 2;
      const gridX1 = gridX + 1;
      const gridY1 = gridY + 1;
      let vertexCounter = 0;
      const vector = new Vector3();
      for (let iy = 0; iy < gridY1; iy++) {
        const y = iy * segmentHeight - heightHalf;
        for (let ix = 0; ix < gridX1; ix++) {
          const x = ix * segmentWidth - widthHalf;
          vector[u] = x * udir;
          vector[v] = y * vdir;
          vector[w] = depthHalf;
          vertices.push(vector.x, vector.y, vector.z);
          vector[u] = 0;
          vector[v] = 0;
          vector[w] = planeDepth > 0 ? 1 : -1;
          normals.push(vector.x, vector.y, vector.z);
          uvs.push(ix / gridX, 1 - iy / gridY);
          vertexCounter += 1;
        }
      }
      for (let iy = 0; iy < gridY; iy++) {
        for (let ix = 0; ix < gridX; ix++) {
          const a = numberOfVertices + ix + gridX1 * iy;
          const b = numberOfVertices + ix + gridX1 * (iy + 1);
          const c = numberOfVertices + (ix + 1) + gridX1 * (iy + 1);
          const d = numberOfVertices + (ix + 1) + gridX1 * iy;
          indices.push(a, b, d, b, c, d);
        }
      }
      numberOfVertices += vertexCounter;
    };

    buildPlane('z', 'y', 'x', -1, -1, depth, height, width, ds, hs);
    buildPlane('z', 'y', 'x', 1, -1, depth, height, -width, ds, hs);
    buildPlane('x', 'z', 'y', 1, 1, width, depth, height, ws, ds);
    buildPlane('x', 'z', 'y', 1, -1, width, depth, -height, ws, ds);
    buildPlane('x', 'y', 'z', 1, -1, width, height, depth, ws, hs);
    buildPlane('x', 'y', 'z', -1, -1, width, height, -depth, ws, hs);

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

export class SphereGeometry extends BufferGeometry {
  constructor(
    radius = 1,
    widthSegments = 32,
    heightSegments = 16,
    phiStart = 0,
    phiLength = Math.PI * 2,
    thetaStart = 0,
    thetaLength = Math.PI
  ) {
    super();
    this.type = 'SphereGeometry';
    this.parameters = { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength };
    const ws = Math.max(3, Math.floor(widthSegments));
    const hs = Math.max(2, Math.floor(heightSegments));
    const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI);
    let index = 0;
    const grid = [];
    const vertex = new Vector3();
    const normal = new Vector3();
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    for (let iy = 0; iy <= hs; iy++) {
      const verticesRow = [];
      const v = iy / hs;
      let uOffset = 0;
      if (iy === 0 && thetaStart === 0) uOffset = 0.5 / ws;
      else if (iy === hs && thetaEnd === Math.PI) uOffset = -0.5 / ws;
      for (let ix = 0; ix <= ws; ix++) {
        const u = ix / ws;
        vertex.x = -radius * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
        vertex.y = radius * Math.cos(thetaStart + v * thetaLength);
        vertex.z = radius * Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength);
        vertices.push(vertex.x, vertex.y, vertex.z);
        normal.copy(vertex).normalize();
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(u + uOffset, 1 - v);
        verticesRow.push(index++);
      }
      grid.push(verticesRow);
    }
    for (let iy = 0; iy < hs; iy++) {
      for (let ix = 0; ix < ws; ix++) {
        const a = grid[iy][ix + 1];
        const b = grid[iy][ix];
        const c = grid[iy + 1][ix];
        const d = grid[iy + 1][ix + 1];
        if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
        if (iy !== hs - 1 || thetaEnd < Math.PI) indices.push(b, c, d);
      }
    }
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

export class CylinderGeometry extends BufferGeometry {
  constructor(
    radiusTop = 1,
    radiusBottom = 1,
    height = 1,
    radialSegments = 32,
    heightSegments = 1,
    openEnded = false,
    thetaStart = 0,
    thetaLength = Math.PI * 2
  ) {
    super();
    this.type = 'CylinderGeometry';
    this.parameters = {
      radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength,
    };
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    const rs = Math.floor(radialSegments);
    const hs = Math.floor(heightSegments);
    let index = 0;
    const indexArray = [];
    const halfHeight = height / 2;

    const generateTorso = () => {
      const normal = new Vector3();
      const vertex = new Vector3();
      const slope = (radiusBottom - radiusTop) / height;
      for (let y = 0; y <= hs; y++) {
        const indexRow = [];
        const v = y / hs;
        const radius = v * (radiusBottom - radiusTop) + radiusTop;
        for (let x = 0; x <= rs; x++) {
          const u = x / rs;
          const theta = u * thetaLength + thetaStart;
          const sinTheta = Math.sin(theta);
          const cosTheta = Math.cos(theta);
          vertex.x = radius * sinTheta;
          vertex.y = -v * height + halfHeight;
          vertex.z = radius * cosTheta;
          vertices.push(vertex.x, vertex.y, vertex.z);
          normal.set(sinTheta, slope, cosTheta).normalize();
          normals.push(normal.x, normal.y, normal.z);
          uvs.push(u, 1 - v);
          indexRow.push(index++);
        }
        indexArray.push(indexRow);
      }
      for (let x = 0; x < rs; x++) {
        for (let y = 0; y < hs; y++) {
          const a = indexArray[y][x];
          const b = indexArray[y + 1][x];
          const c = indexArray[y + 1][x + 1];
          const d = indexArray[y][x + 1];
          if (radiusTop > 0 || y !== 0) indices.push(a, b, d);
          if (radiusBottom > 0 || y !== hs - 1) indices.push(b, c, d);
        }
      }
    };

    const generateCap = (top) => {
      const centerIndexStart = index;
      const uv = new Vector2();
      const vertex = new Vector3();
      const radius = top === true ? radiusTop : radiusBottom;
      const sign = top === true ? 1 : -1;
      for (let x = 1; x <= rs; x++) {
        vertices.push(0, halfHeight * sign, 0);
        normals.push(0, sign, 0);
        uvs.push(0.5, 0.5);
        index++;
      }
      const centerIndexEnd = index;
      for (let x = 0; x <= rs; x++) {
        const u = x / rs;
        const theta = u * thetaLength + thetaStart;
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        vertex.x = radius * sinTheta;
        vertex.y = halfHeight * sign;
        vertex.z = radius * cosTheta;
        vertices.push(vertex.x, vertex.y, vertex.z);
        normals.push(0, sign, 0);
        uv.x = cosTheta * 0.5 + 0.5;
        uv.y = sinTheta * 0.5 * sign + 0.5;
        uvs.push(uv.x, uv.y);
        index++;
      }
      for (let x = 0; x < rs; x++) {
        const c = centerIndexStart + x;
        const i = centerIndexEnd + x;
        if (top === true) indices.push(i, i + 1, c);
        else indices.push(i + 1, i, c);
      }
    };

    generateTorso();
    if (openEnded === false) {
      if (radiusTop > 0) generateCap(true);
      if (radiusBottom > 0) generateCap(false);
    }
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

export class ConeGeometry extends CylinderGeometry {
  constructor(radius = 1, height = 1, radialSegments = 32, heightSegments = 1, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
    super(0, radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);
    this.type = 'ConeGeometry';
    this.parameters = { radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength };
  }
}

export class CircleGeometry extends BufferGeometry {
  constructor(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    super();
    this.type = 'CircleGeometry';
    this.parameters = { radius, segments, thetaStart, thetaLength };
    const seg = Math.max(3, Math.floor(segments));
    const indices = [];
    const vertices = [0, 0, 0];
    const normals = [0, 0, 1];
    const uvs = [0.5, 0.5];
    for (let s = 0, i = 3; s <= seg; s++, i += 3) {
      const segment = thetaStart + (s / seg) * thetaLength;
      const x = radius * Math.cos(segment);
      const y = radius * Math.sin(segment);
      vertices.push(x, y, 0);
      normals.push(0, 0, 1);
      uvs.push((x / radius + 1) / 2, (y / radius + 1) / 2);
    }
    for (let i = 1; i <= seg; i++) indices.push(i, i + 1, 0);
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

export class RingGeometry extends BufferGeometry {
  constructor(innerRadius = 0.5, outerRadius = 1, thetaSegments = 32, phiSegments = 1, thetaStart = 0, thetaLength = Math.PI * 2) {
    super();
    this.type = 'RingGeometry';
    this.parameters = { innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength };
    const ts = Math.max(3, Math.floor(thetaSegments));
    const ps = Math.max(1, Math.floor(phiSegments));
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    let radius = innerRadius;
    const radiusStep = (outerRadius - innerRadius) / ps;
    const vertex = new Vector3();
    const uv = new Vector2();
    for (let j = 0; j <= ps; j++) {
      for (let i = 0; i <= ts; i++) {
        const segment = thetaStart + (i / ts) * thetaLength;
        vertex.x = radius * Math.cos(segment);
        vertex.y = radius * Math.sin(segment);
        vertices.push(vertex.x, vertex.y, 0);
        normals.push(0, 0, 1);
        uv.x = (vertex.x / outerRadius + 1) / 2;
        uv.y = (vertex.y / outerRadius + 1) / 2;
        uvs.push(uv.x, uv.y);
      }
      radius += radiusStep;
    }
    for (let j = 0; j < ps; j++) {
      const thetaSegmentLevel = j * (ts + 1);
      for (let i = 0; i < ts; i++) {
        const segment = i + thetaSegmentLevel;
        const a = segment;
        const b = segment + ts + 1;
        const c = segment + ts + 2;
        const d = segment + 1;
        indices.push(a, b, d, b, c, d);
      }
    }
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

export class TorusGeometry extends BufferGeometry {
  constructor(radius = 1, tube = 0.4, radialSegments = 12, tubularSegments = 48, arc = Math.PI * 2) {
    super();
    this.type = 'TorusGeometry';
    this.parameters = { radius, tube, radialSegments, tubularSegments, arc };
    const rs = Math.floor(radialSegments);
    const ts = Math.floor(tubularSegments);
    const indices = [];
    const vertices = [];
    const normals = [];
    const uvs = [];
    const center = new Vector3();
    const vertex = new Vector3();
    const normal = new Vector3();
    for (let j = 0; j <= rs; j++) {
      for (let i = 0; i <= ts; i++) {
        const u = (i / ts) * arc;
        const v = (j / rs) * Math.PI * 2;
        vertex.x = (radius + tube * Math.cos(v)) * Math.cos(u);
        vertex.y = (radius + tube * Math.cos(v)) * Math.sin(u);
        vertex.z = tube * Math.sin(v);
        vertices.push(vertex.x, vertex.y, vertex.z);
        center.x = radius * Math.cos(u);
        center.y = radius * Math.sin(u);
        normal.subVectors(vertex, center).normalize();
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(i / ts, j / rs);
      }
    }
    for (let j = 1; j <= rs; j++) {
      for (let i = 1; i <= ts; i++) {
        const a = (ts + 1) * j + i - 1;
        const b = (ts + 1) * (j - 1) + i - 1;
        const c = (ts + 1) * (j - 1) + i;
        const d = (ts + 1) * j + i;
        indices.push(a, b, d, b, c, d);
      }
    }
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

class PolyhedronGeometry extends BufferGeometry {
  constructor(vertices = [], indices = [], radius = 1, detail = 0) {
    super();
    this.type = 'PolyhedronGeometry';
    this.parameters = { vertices, indices, radius, detail };
    const vertexBuffer = [];
    const uvBuffer = [];

    const pushVertex = (v) => vertexBuffer.push(v.x, v.y, v.z);
    const getVertexByIndex = (index, vertex) => {
      const stride = index * 3;
      vertex.x = vertices[stride];
      vertex.y = vertices[stride + 1];
      vertex.z = vertices[stride + 2];
    };

    const subdivideFace = (a, b, c, cols) => {
      const v = [];
      for (let i = 0; i <= cols; i++) {
        v[i] = [];
        const aj = a.clone().lerp(c, i / cols);
        const bj = b.clone().lerp(c, i / cols);
        const rows = cols - i;
        for (let j = 0; j <= rows; j++) {
          if (j === 0 && i === cols) v[i][j] = aj;
          else v[i][j] = aj.clone().lerp(bj, j / rows);
        }
      }
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 2 * (cols - i) - 1; j++) {
          const k = Math.floor(j / 2);
          if (j % 2 === 0) {
            pushVertex(v[i][k + 1]);
            pushVertex(v[i + 1][k]);
            pushVertex(v[i][k]);
          } else {
            pushVertex(v[i][k + 1]);
            pushVertex(v[i + 1][k + 1]);
            pushVertex(v[i + 1][k]);
          }
        }
      }
    };

    const cols = detail + 1;
    const a = new Vector3();
    const b = new Vector3();
    const c = new Vector3();
    for (let i = 0; i < indices.length; i += 3) {
      getVertexByIndex(indices[i], a);
      getVertexByIndex(indices[i + 1], b);
      getVertexByIndex(indices[i + 2], c);
      subdivideFace(a, b, c, cols);
    }

    // 投到球面并按半径放大
    const v = new Vector3();
    for (let i = 0; i < vertexBuffer.length; i += 3) {
      v.set(vertexBuffer[i], vertexBuffer[i + 1], vertexBuffer[i + 2]).normalize().multiplyScalar(radius);
      vertexBuffer[i] = v.x;
      vertexBuffer[i + 1] = v.y;
      vertexBuffer[i + 2] = v.z;
      const u = (Math.atan2(v.z, -v.x) / (2 * Math.PI) + 0.5);
      const vv = 1 - (Math.acos(Math.max(-1, Math.min(1, v.y / radius))) / Math.PI);
      uvBuffer.push(u, vv);
    }

    this.setAttribute('position', new Float32BufferAttribute(vertexBuffer, 3));
    this.setAttribute('normal', new Float32BufferAttribute(vertexBuffer.slice(), 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvBuffer, 2));
    if (detail === 0) this.computeVertexNormals();
    else this.normalizeNormals();
  }

  normalizeNormals() {
    const normals = this.attributes.normal;
    const v = new Vector3();
    for (let i = 0; i < normals.count; i++) {
      v.set(normals.getX(i), normals.getY(i), normals.getZ(i)).normalize();
      normals.setXYZ(i, v.x, v.y, v.z);
    }
  }
}

export class IcosahedronGeometry extends PolyhedronGeometry {
  constructor(radius = 1, detail = 0) {
    const t = (1 + Math.sqrt(5)) / 2;
    const vertices = [
      -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
      0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
      t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1,
    ];
    const indices = [
      0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
      1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
      3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
      4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
    ];
    super(vertices, indices, radius, detail);
    this.type = 'IcosahedronGeometry';
    this.parameters = { radius, detail };
  }
}

export class OctahedronGeometry extends PolyhedronGeometry {
  constructor(radius = 1, detail = 0) {
    const vertices = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
    const indices = [
      0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2,
      1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2,
    ];
    super(vertices, indices, radius, detail);
    this.type = 'OctahedronGeometry';
    this.parameters = { radius, detail };
  }
}

export class LatheGeometry extends BufferGeometry {
  constructor(points = [new Vector2(0, -0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)], segments = 12, phiStart = 0, phiLength = Math.PI * 2) {
    super();
    this.type = 'LatheGeometry';
    this.parameters = { points, segments, phiStart, phiLength };
    const seg = Math.floor(segments);
    const phi = Math.min(Math.max(phiLength, 0), Math.PI * 2);
    const indices = [];
    const vertices = [];
    const uvs = [];
    const initNormals = [];
    const normals = [];
    const inverseSegments = 1.0 / seg;
    const vertex = new Vector3();
    const uv = new Vector2();
    const normal = new Vector3();
    const curNormal = new Vector3();
    const prevNormal = new Vector3();
    let dx = 0;
    let dy = 0;

    for (let j = 0; j <= points.length - 1; j++) {
      switch (j) {
        case 0:
          dx = points[j + 1].x - points[j].x;
          dy = points[j + 1].y - points[j].y;
          normal.x = dy * 1.0;
          normal.y = -dx;
          normal.z = dy * 0.0;
          prevNormal.copy(normal);
          normal.normalize();
          initNormals.push(normal.x, normal.y, normal.z);
          break;
        case points.length - 1:
          initNormals.push(prevNormal.x, prevNormal.y, prevNormal.z);
          break;
        default:
          dx = points[j + 1].x - points[j].x;
          dy = points[j + 1].y - points[j].y;
          normal.x = dy * 1.0;
          normal.y = -dx;
          normal.z = dy * 0.0;
          curNormal.copy(normal);
          normal.x += prevNormal.x;
          normal.y += prevNormal.y;
          normal.z += prevNormal.z;
          normal.normalize();
          initNormals.push(normal.x, normal.y, normal.z);
          prevNormal.copy(curNormal);
      }
    }

    for (let i = 0; i <= seg; i++) {
      const phiAngle = phiStart + i * inverseSegments * phi;
      const sin = Math.sin(phiAngle);
      const cos = Math.cos(phiAngle);
      for (let j = 0; j <= points.length - 1; j++) {
        vertex.x = points[j].x * sin;
        vertex.y = points[j].y;
        vertex.z = points[j].x * cos;
        vertices.push(vertex.x, vertex.y, vertex.z);
        uv.x = i / seg;
        uv.y = j / (points.length - 1);
        uvs.push(uv.x, uv.y);
        const x = initNormals[3 * j + 0] * sin;
        const y = initNormals[3 * j + 1];
        const z = initNormals[3 * j + 0] * cos;
        normals.push(x, y, z);
      }
    }

    for (let i = 0; i < seg; i++) {
      for (let j = 0; j < points.length - 1; j++) {
        const base = j + i * points.length;
        const a = base;
        const b = base + points.length;
        const c = base + points.length + 1;
        const d = base + 1;
        indices.push(a, b, d);
        indices.push(c, d, b);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  }
}

/** three 的胶囊：两段圆弧车出来的回转体。 */
export class CapsuleGeometry extends LatheGeometry {
  constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
    const pts = [];
    const caps = Math.max(1, Math.floor(capSegments));
    // 下半球：从 1.5π 扫到 2π（等价 0）
    for (let i = 0; i <= caps; i++) {
      const a = Math.PI * 1.5 + (Math.PI * 0.5 * i) / caps;
      pts.push(new Vector2(Math.cos(a) * radius, -length / 2 + Math.sin(a) * radius));
    }
    // 上半球：0 → 0.5π
    for (let i = 1; i <= caps; i++) {
      const a = (Math.PI * 0.5 * i) / caps;
      pts.push(new Vector2(Math.cos(a) * radius, length / 2 + Math.sin(a) * radius));
    }
    super(pts, radialSegments);
    this.type = 'CapsuleGeometry';
    this.parameters = { radius, length, capSegments, radialSegments };
  }
}

/** 沿曲线扫出来的管，法向用 Frenet 近似帧。 */
export class TubeGeometry extends BufferGeometry {
  constructor(path, tubularSegments = 64, radius = 1, radialSegments = 8, closed = false) {
    super();
    this.type = 'TubeGeometry';
    this.parameters = { path, tubularSegments, radius, radialSegments, closed };
    const frames = computeFrenetFrames(path, tubularSegments, closed);
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const P = new Vector3();
    const normal = new Vector3();
    const vertex = new Vector3();

    for (let i = 0; i <= tubularSegments; i++) {
      path.getPoint(i / tubularSegments, P);
      const N = frames.normals[i];
      const B = frames.binormals[i];
      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        const sin = Math.sin(v);
        const cos = -Math.cos(v);
        normal.x = cos * N.x + sin * B.x;
        normal.y = cos * N.y + sin * B.y;
        normal.z = cos * N.z + sin * B.z;
        normal.normalize();
        normals.push(normal.x, normal.y, normal.z);
        vertex.x = P.x + radius * normal.x;
        vertex.y = P.y + radius * normal.y;
        vertex.z = P.z + radius * normal.z;
        vertices.push(vertex.x, vertex.y, vertex.z);
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }
    for (let j = 1; j <= tubularSegments; j++) {
      for (let i = 1; i <= radialSegments; i++) {
        const a = (radialSegments + 1) * (j - 1) + (i - 1);
        const b = (radialSegments + 1) * j + (i - 1);
        const c = (radialSegments + 1) * j + i;
        const d = (radialSegments + 1) * (j - 1) + i;
        indices.push(a, b, d, b, c, d);
      }
    }
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

function computeFrenetFrames(path, segments, closed) {
  const normal = new Vector3();
  const tangents = [];
  const normals = [];
  const binormals = [];
  const vec = new Vector3();
  for (let i = 0; i <= segments; i++) {
    tangents[i] = path.getTangent(i / segments, new Vector3());
  }
  normals[0] = new Vector3();
  binormals[0] = new Vector3();
  let min = Number.MAX_VALUE;
  const tx = Math.abs(tangents[0].x);
  const ty = Math.abs(tangents[0].y);
  const tz = Math.abs(tangents[0].z);
  if (tx <= min) {
    min = tx;
    normal.set(1, 0, 0);
  }
  if (ty <= min) {
    min = ty;
    normal.set(0, 1, 0);
  }
  if (tz <= min) normal.set(0, 0, 1);
  vec.crossVectors(tangents[0], normal).normalize();
  normals[0].crossVectors(tangents[0], vec);
  binormals[0].crossVectors(tangents[0], normals[0]);
  for (let i = 1; i <= segments; i++) {
    normals[i] = normals[i - 1].clone();
    binormals[i] = binormals[i - 1].clone();
    vec.crossVectors(tangents[i - 1], tangents[i]);
    if (vec.length() > Number.EPSILON) {
      vec.normalize();
      const theta = Math.acos(Math.max(-1, Math.min(1, tangents[i - 1].dot(tangents[i]))));
      normals[i].applyAxisAngle(vec, theta);
    }
    binormals[i].crossVectors(tangents[i], normals[i]);
  }
  if (closed) {
    let theta = Math.acos(Math.max(-1, Math.min(1, normals[0].dot(normals[segments]))));
    theta /= segments;
    if (tangents[0].dot(vec.crossVectors(normals[0], normals[segments])) > 0) theta = -theta;
    for (let i = 1; i <= segments; i++) {
      normals[i].applyAxisAngle(tangents[i], theta * i);
      binormals[i].crossVectors(tangents[i], normals[i]);
    }
  }
  return { tangents, normals, binormals };
}

/** 简单的耳切三角化。渲染层的轮廓都是简单多边形（无洞），够用。 */
function triangulateShape(contour) {
  const n = contour.length;
  if (n < 3) return [];
  const area = (() => {
    let a = 0;
    for (let p = n - 1, q = 0; q < n; p = q++) {
      a += contour[p].x * contour[q].y - contour[q].x * contour[p].y;
    }
    return a * 0.5;
  })();
  // 耳切按逆时针跑，顺时针的轮廓先把遍历顺序翻过来
  const verts = [];
  for (let i = 0; i < n; i++) verts.push(area > 0 ? i : n - 1 - i);

  const result = [];
  let v = n;
  let guard = 2 * v;
  while (v > 3 && guard-- > 0) {
    let clipped = false;
    for (let i = 0; i < v; i++) {
      const u = (i + v - 1) % v;
      const w = (i + 1) % v;
      if (!snip(contour, verts[u], verts[i], verts[w], verts, v)) continue;
      result.push([verts[u], verts[i], verts[w]]);
      verts.splice(i, 1);
      v--;
      guard = 2 * v;
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (v === 3) result.push([verts[0], verts[1], verts[2]]);
  return result;
}

function snip(contour, u, v, w, verts, n) {
  const ax = contour[u].x;
  const ay = contour[u].y;
  const bx = contour[v].x;
  const by = contour[v].y;
  const cx = contour[w].x;
  const cy = contour[w].y;
  if (Number.EPSILON > (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) return false;
  const aX = cx - bx;
  const aY = cy - by;
  const bX = ax - cx;
  const bY = ay - cy;
  const cX = bx - ax;
  const cY = by - ay;
  for (let p = 0; p < n; p++) {
    const idx = verts[p];
    if (idx === u || idx === v || idx === w) continue;
    const px = contour[idx].x;
    const py = contour[idx].y;
    const apx = px - ax;
    const apy = py - ay;
    const bpx = px - bx;
    const bpy = py - by;
    const cpx = px - cx;
    const cpy = py - cy;
    const aCROSSbp = aX * bpy - aY * bpx;
    const cCROSSap = cX * apy - cY * apx;
    const bCROSScp = bX * cpy - bY * cpx;
    if (aCROSSbp >= -Number.EPSILON && bCROSScp >= -Number.EPSILON && cCROSSap >= -Number.EPSILON) {
      return false;
    }
  }
  return true;
}

export class ShapeGeometry extends BufferGeometry {
  constructor(shape, curveSegments = 12) {
    super();
    this.type = 'ShapeGeometry';
    this.parameters = { shape, curveSegments };
    const contour = shape.getPoints();
    const faces = triangulateShape(contour);
    const vertices = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    for (const p of contour) {
      vertices.push(p.x, p.y, 0);
      normals.push(0, 0, 1);
      uvs.push(p.x, p.y);
    }
    for (const f of faces) indices.push(f[0], f[1], f[2]);
    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  }
}

/** 轮廓沿 +Z 挤出，可选斜角。UV 走世界坐标（与原实现的 WorldUVGenerator 同约定）。 */
export class ExtrudeGeometry extends BufferGeometry {
  constructor(shape, options = {}) {
    super();
    this.type = 'ExtrudeGeometry';
    this.parameters = { shape, options };
    const depth = options.depth ?? 1;
    const steps = Math.max(1, Math.floor(options.steps ?? 1));
    const bevelEnabled = options.bevelEnabled !== false;
    const bevelThickness = options.bevelThickness ?? 0.2;
    const bevelSize = options.bevelSize ?? bevelThickness - 0.1;
    const bevelOffset = options.bevelOffset ?? 0;
    const bevelSegments = bevelEnabled ? Math.max(1, Math.floor(options.bevelSegments ?? 3)) : 0;

    const contour = shape.getPoints();
    const n = contour.length;
    const faces = triangulateShape(contour);

    const vertices = [];
    const uvs = [];
    const indices = [];

    /** 沿角平分线把轮廓向内 / 外偏移 amount。 */
    const offsetContour = (amount) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const prev = contour[(i - 1 + n) % n];
        const cur = contour[i];
        const next = contour[(i + 1) % n];
        // 两条边的内法线
        let v1x = cur.x - prev.x;
        let v1y = cur.y - prev.y;
        let v2x = next.x - cur.x;
        let v2y = next.y - cur.y;
        const l1 = Math.hypot(v1x, v1y) || 1;
        const l2 = Math.hypot(v2x, v2y) || 1;
        v1x /= l1;
        v1y /= l1;
        v2x /= l2;
        v2y /= l2;
        // 逆时针轮廓的内法线是把边向量左转 90°
        let nx = -(v1y + v2y);
        let ny = v1x + v2x;
        const nl = Math.hypot(nx, ny);
        if (nl < 1e-9) {
          nx = -v2y;
          ny = v2x;
        } else {
          nx /= nl;
          ny /= nl;
          // 夹角修正：拐角处的偏移量要按半角放大
          const cosHalf = Math.max(0.2, Math.abs(nx * -v2y + ny * v2x));
          nx /= cosHalf;
          ny /= cosHalf;
        }
        out.push(new Vector2(cur.x - nx * amount, cur.y - ny * amount));
      }
      return out;
    };

    // 轮廓走向决定内法线的符号；统一成逆时针再处理
    let signedArea = 0;
    for (let p = n - 1, q = 0; q < n; p = q++) {
      signedArea += contour[p].x * contour[q].y - contour[q].x * contour[p].y;
    }
    const ccw = signedArea > 0;
    const inward = (amount) => offsetContour(ccw ? amount : -amount);

    /** 一圈轮廓 = 一层顶点。层按 z 从 -bevelThickness 到 depth+bevelThickness 排。 */
    const layers = [];
    if (bevelSegments > 0) {
      for (let b = 0; b <= bevelSegments; b++) {
        const t = b / bevelSegments;
        const z = bevelThickness * Math.cos((t * Math.PI) / 2);
        const size = bevelSize * Math.sin((t * Math.PI) / 2) + bevelOffset;
        layers.push({ pts: inward(bevelSize + bevelOffset - size), z: -z });
      }
    }
    for (let s = 0; s <= steps; s++) {
      layers.push({ pts: bevelSegments > 0 ? inward(0) : contour, z: (depth * s) / steps });
    }
    if (bevelSegments > 0) {
      for (let b = bevelSegments - 1; b >= 0; b--) {
        const t = b / bevelSegments;
        const z = bevelThickness * Math.cos((t * Math.PI) / 2);
        const size = bevelSize * Math.sin((t * Math.PI) / 2) + bevelOffset;
        layers.push({ pts: inward(bevelSize + bevelOffset - size), z: depth + z });
      }
    }

    // 侧壁
    for (const layer of layers) {
      for (const p of layer.pts) {
        vertices.push(p.x, p.y, layer.z);
        uvs.push(p.x, p.y);
      }
    }
    for (let l = 0; l < layers.length - 1; l++) {
      const a0 = l * n;
      const b0 = (l + 1) * n;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        indices.push(a0 + i, b0 + i, a0 + j);
        indices.push(b0 + i, b0 + j, a0 + j);
      }
    }

    // 端盖：底（z = 最小层）与顶（z = 最大层）各一份，用同一套三角化
    const capBase = layers.length * n;
    const bottom = layers[0];
    const top = layers[layers.length - 1];
    for (const p of bottom.pts) {
      vertices.push(p.x, p.y, bottom.z);
      uvs.push(p.x, p.y);
    }
    for (const p of top.pts) {
      vertices.push(p.x, p.y, top.z);
      uvs.push(p.x, p.y);
    }
    for (const f of faces) {
      indices.push(capBase + f[2], capBase + f[1], capBase + f[0]);
      indices.push(capBase + n + f[0], capBase + n + f[1], capBase + n + f[2]);
    }

    this.setIndex(indices);
    this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    this.computeVertexNormals();
  }
}

/**
 * 合并一组几何体。属性集必须一致（原实现也是这个前提），索引会自动重排。
 * @param {BufferGeometry[]} geometries
 * @param {boolean} [useGroups=false]
 */
export function mergeGeometries(geometries, useGroups = false) {
  if (!geometries.length) return null;
  const isIndexed = geometries[0].index !== null;
  const attributesUsed = new Set(Object.keys(geometries[0].attributes));
  const attributes = {};
  const merged = new BufferGeometry();
  let offset = 0;

  for (const geometry of geometries) {
    let attributesCount = 0;
    if (isIndexed !== (geometry.index !== null)) return null;
    for (const name of Object.keys(geometry.attributes)) {
      if (!attributesUsed.has(name)) return null;
      if (attributes[name] === undefined) attributes[name] = [];
      attributes[name].push(geometry.attributes[name]);
      attributesCount++;
    }
    if (attributesCount !== attributesUsed.size) return null;
    if (useGroups) {
      const count = geometry.index ? geometry.index.count : geometry.attributes.position.count;
      merged.addGroup(offset, count, geometries.indexOf(geometry));
      offset += count;
    }
  }

  if (isIndexed) {
    let indexOffset = 0;
    const mergedIndex = [];
    for (const geometry of geometries) {
      const index = geometry.index;
      for (let j = 0; j < index.count; j++) mergedIndex.push(index.getX(j) + indexOffset);
      indexOffset += geometry.attributes.position.count;
    }
    merged.setIndex(mergedIndex);
  }

  for (const name of attributesUsed) {
    const list = attributes[name];
    const itemSize = list[0].itemSize;
    const normalized = list[0].normalized;
    let total = 0;
    for (const a of list) total += a.array.length;
    const Arr = list[0].array.constructor;
    const array = new Arr(total);
    let o = 0;
    for (const a of list) {
      array.set(a.array, o);
      o += a.array.length;
    }
    merged.setAttribute(name, new BufferAttribute(array, itemSize, normalized));
  }

  return merged;
}
