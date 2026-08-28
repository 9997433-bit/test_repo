// 渲染适配层 · 数学基元。
//
// 这一层没有任何引擎类型：Vector3 / Matrix4 / Color 都是纯 JS，语义与项目原本
// 依赖的那套（右手系、列向量、matrix.elements 列主序）逐字一致。渲染后端
// （Babylon.js 8）只在 ./backend.js 的边界上读 `.elements` / `.x/.y/.z` —— 列主序的
// elements 数组与 Babylon 行主序 Matrix 的 `m` 数组逐元素相同，所以过界不必转置。
//
// 只实现渲染层真的用到的方法。缺哪个补哪个，不要在这里堆一份完整的通用数学库。

const EPS = 1e-6;

export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

// ---------------------------------------------------------------- 色彩管理
//
// 与原实现同一套约定：材质 / 着色器里的颜色是**线性**的，十六进制字面量是 sRGB。
// setHex / setStyle 进来时解码，getHex / getHSL 出去时编码。少了这一层，所有
// 调色板色号在 PBR 光照下都会亮一档。

export function srgbToLinear(c) {
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
}

export function linearToSrgb(c) {
  return c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;
}

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  get width() {
    return this.x;
  }

  set width(v) {
    this.x = v;
  }

  get height() {
    return this.y;
  }

  set height(v) {
    this.y = v;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  setScalar(s) {
    this.x = s;
    this.y = s;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    return this.multiplyScalar(1 / (this.length() || 1));
  }

  equals(v) {
    return v.x === this.x && v.y === this.y;
  }
}

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  setScalar(s) {
    this.x = s;
    this.y = s;
    this.z = s;
    return this;
  }

  setX(x) {
    this.x = x;
    return this;
  }

  setY(y) {
    this.y = y;
    return this;
  }

  setZ(z) {
    this.z = z;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addScalar(s) {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
  }

  addVectors(a, b) {
    this.x = a.x + b.x;
    this.y = a.y + b.y;
    this.z = a.z + b.z;
    return this;
  }

  addScaledVector(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  subVectors(a, b) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;
    this.z = a.z - b.z;
    return this;
  }

  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  multiplyScalar(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  divideScalar(s) {
    return this.multiplyScalar(1 / s);
  }

  negate() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  normalize() {
    return this.divideScalar(this.length() || 1);
  }

  setLength(l) {
    return this.normalize().multiplyScalar(l);
  }

  distanceTo(v) {
    return Math.sqrt(this.distanceToSquared(v));
  }

  distanceToSquared(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  lerp(v, a) {
    this.x += (v.x - this.x) * a;
    this.y += (v.y - this.y) * a;
    this.z += (v.z - this.z) * a;
    return this;
  }

  lerpVectors(a, b, t) {
    this.x = a.x + (b.x - a.x) * t;
    this.y = a.y + (b.y - a.y) * t;
    this.z = a.z + (b.z - a.z) * t;
    return this;
  }

  cross(v) {
    return this.crossVectors(this, v);
  }

  crossVectors(a, b) {
    const ax = a.x;
    const ay = a.y;
    const az = a.z;
    const bx = b.x;
    const by = b.y;
    const bz = b.z;
    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;
    return this;
  }

  min(v) {
    this.x = Math.min(this.x, v.x);
    this.y = Math.min(this.y, v.y);
    this.z = Math.min(this.z, v.z);
    return this;
  }

  max(v) {
    this.x = Math.max(this.x, v.x);
    this.y = Math.max(this.y, v.y);
    this.z = Math.max(this.z, v.z);
    return this;
  }

  clampLength(min, max) {
    const l = this.length() || 1;
    return this.divideScalar(l).multiplyScalar(clamp(l, min, max));
  }

  applyMatrix4(m) {
    const { x, y, z } = this;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);
    this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
    this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
    this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;
    return this;
  }

  /** 只旋转 / 缩放，不平移（法线与方向向量用）。 */
  transformDirection(m) {
    const { x, y, z } = this;
    const e = m.elements;
    this.x = e[0] * x + e[4] * y + e[8] * z;
    this.y = e[1] * x + e[5] * y + e[9] * z;
    this.z = e[2] * x + e[6] * y + e[10] * z;
    return this.normalize();
  }

  applyQuaternion(q) {
    const { x, y, z } = this;
    const { x: qx, y: qy, z: qz, w: qw } = q;
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return this;
  }

  applyAxisAngle(axis, angle) {
    return this.applyQuaternion(_quat.setFromAxisAngle(axis, angle));
  }

  applyEuler(euler) {
    return this.applyQuaternion(_quat.setFromEuler(euler));
  }

  setFromMatrixPosition(m) {
    const e = m.elements;
    this.x = e[12];
    this.y = e[13];
    this.z = e[14];
    return this;
  }

  setFromMatrixColumn(m, i) {
    return this.fromArray(m.elements, i * 4);
  }

  fromArray(arr, offset = 0) {
    this.x = arr[offset];
    this.y = arr[offset + 1];
    this.z = arr[offset + 2];
    return this;
  }

  toArray(arr = [], offset = 0) {
    arr[offset] = this.x;
    arr[offset + 1] = this.y;
    arr[offset + 2] = this.z;
    return arr;
  }

  equals(v) {
    return v.x === this.x && v.y === this.y && v.z === this.z;
  }
}

export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  set(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copy(q) {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  identity() {
    return this.set(0, 0, 0, 1);
  }

  /** 与原实现同序：'XYZ' 缺省，四元数按 qx·qy·qz 复合。 */
  setFromEuler(euler) {
    const { x, y, z, order } = euler;
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);
    switch (order) {
      case 'YXZ':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'ZXY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'ZYX':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'YZX':
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 + s1 * c2 * s3;
        this.z = c1 * c2 * s3 - s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
      case 'XZY':
        this.x = s1 * c2 * c3 - c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 + s1 * s2 * s3;
        break;
      case 'XYZ':
      default:
        this.x = s1 * c2 * c3 + c1 * s2 * s3;
        this.y = c1 * s2 * c3 - s1 * c2 * s3;
        this.z = c1 * c2 * s3 + s1 * s2 * c3;
        this.w = c1 * c2 * c3 - s1 * s2 * s3;
        break;
    }
    return this;
  }

  setFromAxisAngle(axis, angle) {
    const half = angle / 2;
    const s = Math.sin(half);
    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(half);
    return this;
  }

  setFromRotationMatrix(m) {
    const te = m.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];
    const trace = m11 + m22 + m33;
    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      this.w = 0.25 / s;
      this.x = (m32 - m23) * s;
      this.y = (m13 - m31) * s;
      this.z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
      this.w = (m32 - m23) / s;
      this.x = 0.25 * s;
      this.y = (m12 + m21) / s;
      this.z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
      this.w = (m13 - m31) / s;
      this.x = (m12 + m21) / s;
      this.y = 0.25 * s;
      this.z = (m23 + m32) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
      this.w = (m21 - m12) / s;
      this.x = (m13 + m31) / s;
      this.y = (m23 + m32) / s;
      this.z = 0.25 * s;
    }
    return this;
  }

  setFromUnitVectors(from, to) {
    let r = from.dot(to) + 1;
    if (r < EPS) {
      r = 0;
      if (Math.abs(from.x) > Math.abs(from.z)) this.set(-from.y, from.x, 0, r);
      else this.set(0, -from.z, from.y, r);
    } else {
      this.set(
        from.y * to.z - from.z * to.y,
        from.z * to.x - from.x * to.z,
        from.x * to.y - from.y * to.x,
        r
      );
    }
    return this.normalize();
  }

  multiply(q) {
    return this.multiplyQuaternions(this, q);
  }

  premultiply(q) {
    return this.multiplyQuaternions(q, this);
  }

  multiplyQuaternions(a, b) {
    const { x: ax, y: ay, z: az, w: aw } = a;
    const { x: bx, y: by, z: bz, w: bw } = b;
    this.x = ax * bw + aw * bx + ay * bz - az * by;
    this.y = ay * bw + aw * by + az * bx - ax * bz;
    this.z = az * bw + aw * bz + ax * by - ay * bx;
    this.w = aw * bw - ax * bx - ay * by - az * bz;
    return this;
  }

  invert() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }

  normalize() {
    const l = this.length();
    if (l === 0) return this.identity();
    const inv = 1 / l;
    this.x *= inv;
    this.y *= inv;
    this.z *= inv;
    this.w *= inv;
    return this;
  }

  slerp(q, t) {
    if (t === 0) return this;
    if (t === 1) return this.copy(q);
    const { x, y, z, w } = this;
    let cos = w * q.w + x * q.x + y * q.y + z * q.z;
    let qx = q.x;
    let qy = q.y;
    let qz = q.z;
    let qw = q.w;
    if (cos < 0) {
      cos = -cos;
      qx = -qx;
      qy = -qy;
      qz = -qz;
      qw = -qw;
    }
    if (cos >= 1) return this;
    const sqrSin = 1 - cos * cos;
    if (sqrSin <= Number.EPSILON) {
      const s = 1 - t;
      this.w = s * w + t * qw;
      this.x = s * x + t * qx;
      this.y = s * y + t * qy;
      this.z = s * z + t * qz;
      return this.normalize();
    }
    const sin = Math.sqrt(sqrSin);
    const len = Math.atan2(sin, cos);
    const a = Math.sin((1 - t) * len) / sin;
    const b = Math.sin(t * len) / sin;
    this.w = w * a + qw * b;
    this.x = x * a + qx * b;
    this.y = y * a + qy * b;
    this.z = z * a + qz * b;
    return this;
  }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }

  set(x, y, z, order = this.order) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
    return this;
  }

  copy(e) {
    this.x = e.x;
    this.y = e.y;
    this.z = e.z;
    this.order = e.order;
    return this;
  }

  clone() {
    return new Euler(this.x, this.y, this.z, this.order);
  }

  setFromQuaternion(q, order = this.order) {
    _mat.makeRotationFromQuaternion(q);
    return this.setFromRotationMatrix(_mat, order);
  }

  setFromRotationMatrix(m, order = this.order) {
    const te = m.elements;
    const m11 = te[0];
    const m12 = te[4];
    const m13 = te[8];
    const m21 = te[1];
    const m22 = te[5];
    const m23 = te[9];
    const m31 = te[2];
    const m32 = te[6];
    const m33 = te[10];
    switch (order) {
      case 'YXZ':
        this.x = Math.asin(-clamp(m23, -1, 1));
        if (Math.abs(m23) < 0.9999999) {
          this.y = Math.atan2(m13, m33);
          this.z = Math.atan2(m21, m22);
        } else {
          this.y = Math.atan2(-m31, m11);
          this.z = 0;
        }
        break;
      case 'XYZ':
      default:
        this.y = Math.asin(clamp(m13, -1, 1));
        if (Math.abs(m13) < 0.9999999) {
          this.x = Math.atan2(-m23, m33);
          this.z = Math.atan2(-m12, m11);
        } else {
          this.x = Math.atan2(m32, m22);
          this.z = 0;
        }
        break;
    }
    this.order = order;
    return this;
  }
}

export class Matrix4 {
  constructor() {
    // 列主序，与调用方的既有约定一致（也与后端 Matrix 的内存布局逐元素相同）
    this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  set(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {
    const te = this.elements;
    te[0] = n11;
    te[4] = n12;
    te[8] = n13;
    te[12] = n14;
    te[1] = n21;
    te[5] = n22;
    te[9] = n23;
    te[13] = n24;
    te[2] = n31;
    te[6] = n32;
    te[10] = n33;
    te[14] = n34;
    te[3] = n41;
    te[7] = n42;
    te[11] = n43;
    te[15] = n44;
    return this;
  }

  identity() {
    return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  clone() {
    return new Matrix4().fromArray(this.elements);
  }

  copy(m) {
    const te = this.elements;
    const me = m.elements;
    for (let i = 0; i < 16; i++) te[i] = me[i];
    return this;
  }

  fromArray(arr, offset = 0) {
    for (let i = 0; i < 16; i++) this.elements[i] = arr[i + offset];
    return this;
  }

  toArray(arr = [], offset = 0) {
    const te = this.elements;
    for (let i = 0; i < 16; i++) arr[offset + i] = te[i];
    return arr;
  }

  makeScale(x, y, z) {
    return this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
  }

  makeTranslation(x, y, z) {
    if (x && typeof x === 'object') return this.makeTranslation(x.x, x.y, x.z);
    return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
  }

  makeRotationX(t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
  }

  makeRotationY(t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
  }

  makeRotationZ(t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  makeRotationAxis(axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const { x, y, z } = axis;
    const tx = t * x;
    const ty = t * y;
    return this.set(
      tx * x + c, tx * y - s * z, tx * z + s * y, 0,
      tx * y + s * z, ty * y + c, ty * z - s * x, 0,
      tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
      0, 0, 0, 1
    );
  }

  makeRotationFromQuaternion(q) {
    return this.compose(_zero, q, _one);
  }

  multiply(m) {
    return this.multiplyMatrices(this, m);
  }

  premultiply(m) {
    return this.multiplyMatrices(m, this);
  }

  multiplyMatrices(a, b) {
    const ae = a.elements;
    const be = b.elements;
    const te = this.elements;
    const a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
    const a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
    const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
    const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];
    const b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
    const b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
    const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
    const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];
    te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;
    te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;
    te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;
    te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
    return this;
  }

  compose(position, quaternion, scale) {
    const te = this.elements;
    const { x, y, z, w } = quaternion;
    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;
    const sx = scale.x;
    const sy = scale.y;
    const sz = scale.z;
    te[0] = (1 - (yy + zz)) * sx;
    te[1] = (xy + wz) * sx;
    te[2] = (xz - wy) * sx;
    te[3] = 0;
    te[4] = (xy - wz) * sy;
    te[5] = (1 - (xx + zz)) * sy;
    te[6] = (yz + wx) * sy;
    te[7] = 0;
    te[8] = (xz + wy) * sz;
    te[9] = (yz - wx) * sz;
    te[10] = (1 - (xx + yy)) * sz;
    te[11] = 0;
    te[12] = position.x;
    te[13] = position.y;
    te[14] = position.z;
    te[15] = 1;
    return this;
  }

  decompose(position, quaternion, scale) {
    const te = this.elements;
    let sx = _v.set(te[0], te[1], te[2]).length();
    const sy = _v.set(te[4], te[5], te[6]).length();
    const sz = _v.set(te[8], te[9], te[10]).length();
    if (this.determinant() < 0) sx = -sx;
    position.x = te[12];
    position.y = te[13];
    position.z = te[14];
    _mat2.copy(this);
    const invSX = 1 / sx;
    const invSY = 1 / sy;
    const invSZ = 1 / sz;
    const me = _mat2.elements;
    me[0] *= invSX;
    me[1] *= invSX;
    me[2] *= invSX;
    me[4] *= invSY;
    me[5] *= invSY;
    me[6] *= invSY;
    me[8] *= invSZ;
    me[9] *= invSZ;
    me[10] *= invSZ;
    quaternion.setFromRotationMatrix(_mat2);
    scale.x = sx;
    scale.y = sy;
    scale.z = sz;
    return this;
  }

  determinant() {
    const te = this.elements;
    const n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
    const n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
    const n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
    const n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];
    return (
      n41 *
        (+n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34) +
      n42 *
        (+n11 * n23 * n34 - n11 * n24 * n33 + n14 * n21 * n33 - n13 * n21 * n34 + n13 * n24 * n31 - n14 * n23 * n31) +
      n43 *
        (+n11 * n24 * n32 - n11 * n22 * n34 - n14 * n21 * n32 + n12 * n21 * n34 + n14 * n22 * n31 - n12 * n24 * n31) +
      n44 *
        (-n13 * n22 * n31 - n11 * n23 * n32 + n11 * n22 * n33 + n13 * n21 * n32 - n12 * n21 * n33 + n12 * n23 * n31)
    );
  }

  invert() {
    const te = this.elements;
    const n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3];
    const n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7];
    const n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11];
    const n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15];
    const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const d = 1 / det;
    te[0] = t11 * d;
    te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * d;
    te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * d;
    te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * d;
    te[4] = t12 * d;
    te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * d;
    te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * d;
    te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * d;
    te[8] = t13 * d;
    te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * d;
    te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * d;
    te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * d;
    te[12] = t14 * d;
    te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * d;
    te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * d;
    te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * d;
    return this;
  }

  transpose() {
    const te = this.elements;
    let t;
    t = te[1]; te[1] = te[4]; te[4] = t;
    t = te[2]; te[2] = te[8]; te[8] = t;
    t = te[6]; te[6] = te[9]; te[9] = t;
    t = te[3]; te[3] = te[12]; te[12] = t;
    t = te[7]; te[7] = te[13]; te[13] = t;
    t = te[11]; te[11] = te[14]; te[14] = t;
    return this;
  }

  scale(v) {
    const te = this.elements;
    const { x, y, z } = v;
    te[0] *= x; te[4] *= y; te[8] *= z;
    te[1] *= x; te[5] *= y; te[9] *= z;
    te[2] *= x; te[6] *= y; te[10] *= z;
    te[3] *= x; te[7] *= y; te[11] *= z;
    return this;
  }

  setPosition(x, y, z) {
    const te = this.elements;
    if (x && typeof x === 'object') {
      te[12] = x.x;
      te[13] = x.y;
      te[14] = x.z;
    } else {
      te[12] = x;
      te[13] = y;
      te[14] = z;
    }
    return this;
  }

  extractRotation(m) {
    const te = this.elements;
    const me = m.elements;
    const sx = 1 / _v.set(me[0], me[1], me[2]).length();
    const sy = 1 / _v.set(me[4], me[5], me[6]).length();
    const sz = 1 / _v.set(me[8], me[9], me[10]).length();
    te[0] = me[0] * sx; te[1] = me[1] * sx; te[2] = me[2] * sx; te[3] = 0;
    te[4] = me[4] * sy; te[5] = me[5] * sy; te[6] = me[6] * sy; te[7] = 0;
    te[8] = me[8] * sz; te[9] = me[9] * sz; te[10] = me[10] * sz; te[11] = 0;
    te[12] = 0; te[13] = 0; te[14] = 0; te[15] = 1;
    return this;
  }

  lookAt(eye, target, up) {
    const te = this.elements;
    _z.subVectors(eye, target);
    if (_z.lengthSq() === 0) _z.z = 1;
    _z.normalize();
    _x.crossVectors(up, _z);
    if (_x.lengthSq() === 0) {
      if (Math.abs(up.z) === 1) _z.x += 0.0001;
      else _z.z += 0.0001;
      _z.normalize();
      _x.crossVectors(up, _z);
    }
    _x.normalize();
    _y.crossVectors(_z, _x);
    te[0] = _x.x; te[4] = _y.x; te[8] = _z.x;
    te[1] = _x.y; te[5] = _y.y; te[9] = _z.y;
    te[2] = _x.z; te[6] = _y.z; te[10] = _z.z;
    return this;
  }

  makePerspective(left, right, top, bottom, near, far) {
    const te = this.elements;
    const x = (2 * near) / (right - left);
    const y = (2 * near) / (top - bottom);
    const a = (right + left) / (right - left);
    const b = (top + bottom) / (top - bottom);
    const c = -(far + near) / (far - near);
    const d = (-2 * far * near) / (far - near);
    te[0] = x; te[4] = 0; te[8] = a; te[12] = 0;
    te[1] = 0; te[5] = y; te[9] = b; te[13] = 0;
    te[2] = 0; te[6] = 0; te[10] = c; te[14] = d;
    te[3] = 0; te[7] = 0; te[11] = -1; te[15] = 0;
    return this;
  }
}

/** three 的 Color：内部存**线性**分量，十六进制进出时做 sRGB 转换。 */
export class Color {
  constructor(r, g, b) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.isColor = true;
    if (g === undefined && b === undefined) this.set(r);
    else this.setRGB(r, g, b);
  }

  set(value) {
    if (value === undefined || value === null) return this;
    if (value.isColor) return this.copy(value);
    if (typeof value === 'number') return this.setHex(value);
    if (typeof value === 'string') return this.setStyle(value);
    return this;
  }

  setHex(hex, convert = true) {
    hex = Math.floor(hex);
    const r = ((hex >> 16) & 255) / 255;
    const g = ((hex >> 8) & 255) / 255;
    const b = (hex & 255) / 255;
    if (convert) {
      this.r = srgbToLinear(r);
      this.g = srgbToLinear(g);
      this.b = srgbToLinear(b);
    } else {
      this.r = r;
      this.g = g;
      this.b = b;
    }
    return this;
  }

  setStyle(style) {
    const s = String(style).trim();
    if (s.startsWith('#')) {
      const hex = s.slice(1);
      const full =
        hex.length === 3
          ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
          : hex.slice(0, 6);
      return this.setHex(parseInt(full, 16));
    }
    const m = /^rgba?\(([^)]+)\)$/i.exec(s);
    if (m) {
      const [r, g, b] = m[1].split(',').map((v) => parseFloat(v) / 255);
      return this.setRGB(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
    }
    return this;
  }

  /** 分量直接写入工作空间（线性），与 three 的 setRGB 同义。 */
  setRGB(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }

  setScalar(v) {
    return this.setRGB(v, v, v);
  }

  /** h/s/l 是 sRGB 空间的，写进来时转成线性。 */
  setHSL(h, s, l) {
    h = ((h % 1) + 1) % 1;
    s = clamp(s, 0, 1);
    l = clamp(l, 0, 1);
    let r;
    let g;
    let b;
    if (s === 0) {
      r = l;
      g = l;
      b = l;
    } else {
      const q = l <= 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    this.r = srgbToLinear(r);
    this.g = srgbToLinear(g);
    this.b = srgbToLinear(b);
    return this;
  }

  /** 读出来的是 sRGB 空间的 h/s/l（与 three 同约定）。 */
  getHSL(target = { h: 0, s: 0, l: 0 }) {
    const r = linearToSrgb(this.r);
    const g = linearToSrgb(this.g);
    const b = linearToSrgb(this.b);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    let sat = 0;
    const lit = (min + max) / 2;
    if (min !== max) {
      const delta = max - min;
      sat = lit <= 0.5 ? delta / (max + min) : delta / (2 - max - min);
      switch (max) {
        case r:
          hue = (g - b) / delta + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / delta + 2;
          break;
        default:
          hue = (r - g) / delta + 4;
          break;
      }
      hue /= 6;
    }
    target.h = hue;
    target.s = sat;
    target.l = lit;
    return target;
  }

  getHex() {
    const to255 = (v) => clamp(Math.round(linearToSrgb(v) * 255), 0, 255);
    return (to255(this.r) << 16) ^ (to255(this.g) << 8) ^ to255(this.b);
  }

  getHexString() {
    return `000000${this.getHex().toString(16)}`.slice(-6);
  }

  copy(c) {
    this.r = c.r;
    this.g = c.g;
    this.b = c.b;
    return this;
  }

  clone() {
    return new Color().setRGB(this.r, this.g, this.b);
  }

  add(c) {
    this.r += c.r;
    this.g += c.g;
    this.b += c.b;
    return this;
  }

  multiply(c) {
    this.r *= c.r;
    this.g *= c.g;
    this.b *= c.b;
    return this;
  }

  multiplyScalar(s) {
    this.r *= s;
    this.g *= s;
    this.b *= s;
    return this;
  }

  addScalar(s) {
    this.r += s;
    this.g += s;
    this.b += s;
    return this;
  }

  lerp(c, a) {
    this.r += (c.r - this.r) * a;
    this.g += (c.g - this.g) * a;
    this.b += (c.b - this.b) * a;
    return this;
  }

  lerpColors(a, b, t) {
    this.r = a.r + (b.r - a.r) * t;
    this.g = a.g + (b.g - a.g) * t;
    this.b = a.b + (b.b - a.b) * t;
    return this;
  }

  offsetHSL(h, s, l) {
    const hsl = this.getHSL();
    return this.setHSL(hsl.h + h, hsl.s + s, hsl.l + l);
  }

  equals(c) {
    return c.r === this.r && c.g === this.g && c.b === this.b;
  }

  toArray(arr = [], offset = 0) {
    arr[offset] = this.r;
    arr[offset + 1] = this.g;
    arr[offset + 2] = this.b;
    return arr;
  }
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * 6 * (2 / 3 - t);
  return p;
}

export class Sphere {
  constructor(center = new Vector3(), radius = -1) {
    this.center = center;
    this.radius = radius;
    this.isSphere = true;
  }

  set(center, radius) {
    this.center.copy(center);
    this.radius = radius;
    return this;
  }

  copy(s) {
    this.center.copy(s.center);
    this.radius = s.radius;
    return this;
  }

  clone() {
    return new Sphere(this.center.clone(), this.radius);
  }
}

export class Box3 {
  constructor(min = new Vector3(Infinity, Infinity, Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)) {
    this.min = min;
    this.max = max;
    this.isBox3 = true;
  }

  makeEmpty() {
    this.min.set(Infinity, Infinity, Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
    return this;
  }

  isEmpty() {
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }

  expandByPoint(p) {
    this.min.min(p);
    this.max.max(p);
    return this;
  }

  getCenter(target = new Vector3()) {
    return this.isEmpty() ? target.set(0, 0, 0) : target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }

  getSize(target = new Vector3()) {
    return this.isEmpty() ? target.set(0, 0, 0) : target.subVectors(this.max, this.min);
  }

  getBoundingSphere(target) {
    this.getCenter(target.center);
    target.radius = this.isEmpty() ? 0 : this.getSize(_v).length() * 0.5;
    return target;
  }
}

/** 中心式 Catmull-Rom（three 的 'centripetal' 缺省），只做 getPoint / getPoints。 */
export class CatmullRomCurve3 {
  constructor(points = [], closed = false, curveType = 'centripetal', tension = 0.5) {
    this.points = points;
    this.closed = closed;
    this.curveType = curveType;
    this.tension = tension;
  }

  getPoint(t, target = new Vector3()) {
    const points = this.points;
    const l = points.length;
    const p = (l - (this.closed ? 0 : 1)) * t;
    let intPoint = Math.floor(p);
    let weight = p - intPoint;
    if (this.closed) {
      intPoint += intPoint > 0 ? 0 : (Math.floor(Math.abs(intPoint) / l) + 1) * l;
    } else if (weight === 0 && intPoint === l - 1) {
      intPoint = l - 2;
      weight = 1;
    }
    let p0;
    let p3;
    if (this.closed || intPoint > 0) p0 = points[(intPoint - 1) % l];
    else {
      _tmpCurve.subVectors(points[0], points[1]).add(points[0]);
      p0 = _tmpCurve;
    }
    const p1 = points[intPoint % l];
    const p2 = points[(intPoint + 1) % l];
    if (this.closed || intPoint + 2 < l) p3 = points[(intPoint + 2) % l];
    else {
      _tmpCurve2.subVectors(points[l - 1], points[l - 2]).add(points[l - 1]);
      p3 = _tmpCurve2;
    }
    if (this.curveType === 'centripetal' || this.curveType === 'chordal') {
      const pow = this.curveType === 'chordal' ? 0.5 : 0.25;
      let dt0 = Math.pow(p0.distanceToSquared(p1), pow);
      let dt1 = Math.pow(p1.distanceToSquared(p2), pow);
      let dt2 = Math.pow(p2.distanceToSquared(p3), pow);
      if (dt1 < 1e-4) dt1 = 1.0;
      if (dt0 < 1e-4) dt0 = dt1;
      if (dt2 < 1e-4) dt2 = dt1;
      _px.initNonuniformCatmullRom(p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2);
      _py.initNonuniformCatmullRom(p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2);
      _pz.initNonuniformCatmullRom(p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2);
    } else {
      _px.initCatmullRom(p0.x, p1.x, p2.x, p3.x, this.tension);
      _py.initCatmullRom(p0.y, p1.y, p2.y, p3.y, this.tension);
      _pz.initCatmullRom(p0.z, p1.z, p2.z, p3.z, this.tension);
    }
    return target.set(_px.calc(weight), _py.calc(weight), _pz.calc(weight));
  }

  getPoints(divisions = 5) {
    const pts = [];
    for (let d = 0; d <= divisions; d++) pts.push(this.getPoint(d / divisions));
    return pts;
  }

  /** 弧长近似的切线，够 TubeGeometry 用。 */
  getTangent(t, target = new Vector3()) {
    const delta = 1e-4;
    const t1 = Math.max(0, t - delta);
    const t2 = Math.min(1, t + delta);
    this.getPoint(t1, _tanA);
    this.getPoint(t2, _tanB);
    return target.copy(_tanB).sub(_tanA).normalize();
  }
}

class CubicPoly {
  constructor() {
    this.c0 = 0;
    this.c1 = 0;
    this.c2 = 0;
    this.c3 = 0;
  }

  init(x0, x1, t0, t1) {
    this.c0 = x0;
    this.c1 = t0;
    this.c2 = -3 * x0 + 3 * x1 - 2 * t0 - t1;
    this.c3 = 2 * x0 - 2 * x1 + t0 + t1;
  }

  initCatmullRom(x0, x1, x2, x3, tension) {
    this.init(x1, x2, tension * (x2 - x0), tension * (x3 - x1));
  }

  initNonuniformCatmullRom(x0, x1, x2, x3, dt0, dt1, dt2) {
    let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
    let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
    t1 *= dt1;
    t2 *= dt1;
    this.init(x1, x2, t1, t2);
  }

  calc(t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return this.c0 + this.c1 * t + this.c2 * t2 + this.c3 * t3;
  }
}

/**
 * 二维轮廓。渲染层只用 `moveTo / lineTo / absarc / closePath`，
 * 所以这里只存点列，`ExtrudeGeometry` / `ShapeGeometry` 直接吃它。
 */
export class Shape {
  constructor(points = []) {
    this.curves = points.slice();
    this.currentPoint = new Vector2();
    this.autoClose = false;
  }

  moveTo(x, y) {
    this.currentPoint.set(x, y);
    this.curves.push(new Vector2(x, y));
    return this;
  }

  lineTo(x, y) {
    this.currentPoint.set(x, y);
    this.curves.push(new Vector2(x, y));
    return this;
  }

  absarc(x, y, radius, startAngle, endAngle, clockwise = false) {
    const steps = Math.max(4, Math.ceil((Math.abs(endAngle - startAngle) / (Math.PI * 2)) * 32));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = clockwise
        ? startAngle - (startAngle - endAngle) * t
        : startAngle + (endAngle - startAngle) * t;
      this.curves.push(new Vector2(x + Math.cos(a) * radius, y + Math.sin(a) * radius));
    }
    this.currentPoint.copy(this.curves[this.curves.length - 1]);
    return this;
  }

  closePath() {
    this.autoClose = true;
    return this;
  }

  /** 去掉首尾重合点后的顶点环。 */
  getPoints() {
    const out = [];
    for (const p of this.curves) {
      const last = out[out.length - 1];
      if (last && Math.abs(last.x - p.x) < 1e-9 && Math.abs(last.y - p.y) < 1e-9) continue;
      out.push(new Vector2(p.x, p.y));
    }
    if (out.length > 1) {
      const a = out[0];
      const b = out[out.length - 1];
      if (Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9) out.pop();
    }
    return out;
  }
}

const _v = new Vector3();
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _zero = new Vector3(0, 0, 0);
const _one = new Vector3(1, 1, 1);
const _quat = new Quaternion();
const _mat = new Matrix4();
const _mat2 = new Matrix4();
const _tmpCurve = new Vector3();
const _tmpCurve2 = new Vector3();
const _tanA = new Vector3();
const _tanB = new Vector3();
const _px = new CubicPoly();
const _py = new CubicPoly();
const _pz = new CubicPoly();

export const MathUtils = {
  clamp,
  lerp: (a, b, t) => a + (b - a) * t,
  degToRad: (d) => (d * Math.PI) / 180,
  radToDeg: (r) => (r * 180) / Math.PI,
};
