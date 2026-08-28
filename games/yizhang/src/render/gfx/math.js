const EPS = 1e-10;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) {
    this.x = x;
    this.y = y;
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
  equals(v) {
    return this.x === v.x && this.y === v.y;
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
    return Math.hypot(this.x, this.y);
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }
  normalize() {
    const l = this.length() || 1;
    return this.multiplyScalar(1 / l);
  }
  lerp(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }
  fromArray(a, o = 0) {
    this.x = a[o];
    this.y = a[o + 1];
    return this;
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
    this._onChangeCallback?.();
    return this;
  }
  setScalar(s) {
    return this.set(s, s, s);
  }
  copy(v) {
    return this.set(v.x, v.y, v.z ?? 0);
  }
  clone() {
    return new Vector3(this.x, this.y, this.z);
  }
  add(v) {
    return this.set(this.x + v.x, this.y + v.y, this.z + v.z);
  }
  addScalar(s) {
    return this.set(this.x + s, this.y + s, this.z + s);
  }
  addVectors(a, b) {
    return this.set(a.x + b.x, a.y + b.y, a.z + b.z);
  }
  addScaledVector(v, s) {
    return this.set(this.x + v.x * s, this.y + v.y * s, this.z + v.z * s);
  }
  sub(v) {
    return this.set(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  subVectors(a, b) {
    return this.set(a.x - b.x, a.y - b.y, a.z - b.z);
  }
  multiply(v) {
    return this.set(this.x * v.x, this.y * v.y, this.z * v.z);
  }
  multiplyScalar(s) {
    return this.set(this.x * s, this.y * s, this.z * s);
  }
  divideScalar(s) {
    return this.multiplyScalar(1 / (s || 1));
  }
  negate() {
    return this.set(-this.x, -this.y, -this.z);
  }
  dot(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
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
    return this.set(ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx);
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  length() {
    return Math.hypot(this.x, this.y, this.z);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  lerp(v, t) {
    return this.set(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t, this.z + (v.z - this.z) * t);
  }
  lerpVectors(a, b, t) {
    return this.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
  }
  distanceTo(v) {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }
  distanceToSquared(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }
  min(v) {
    return this.set(Math.min(this.x, v.x), Math.min(this.y, v.y), Math.min(this.z, v.z));
  }
  max(v) {
    return this.set(Math.max(this.x, v.x), Math.max(this.y, v.y), Math.max(this.z, v.z));
  }
  clamp(lo, hi) {
    return this.set(clamp(this.x, lo.x, hi.x), clamp(this.y, lo.y, hi.y), clamp(this.z, lo.z, hi.z));
  }
  applyMatrix3(m) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const e = m.elements;
    return this.set(e[0] * x + e[3] * y + e[6] * z, e[1] * x + e[4] * y + e[7] * z, e[2] * x + e[5] * y + e[8] * z);
  }
  applyMatrix4(m) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const e = m.elements;
    const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15] || 1);
    return this.set(
      (e[0] * x + e[4] * y + e[8] * z + e[12]) * w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) * w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) * w
    );
  }
  applyQuaternion(q) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const qx = q.x;
    const qy = q.y;
    const qz = q.z;
    const qw = q.w;
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;
    return this.set(
      ix * qw + iw * -qx + iy * -qz - iz * -qy,
      iy * qw + iw * -qy + iz * -qx - ix * -qz,
      iz * qw + iw * -qz + ix * -qy - iy * -qx
    );
  }
  applyAxisAngle(axis, angle) {
    return this.applyQuaternion(_q.setFromAxisAngle(axis, angle));
  }
  applyEuler(euler) {
    return this.applyQuaternion(_q.setFromEuler(euler));
  }
  transformDirection(m) {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const e = m.elements;
    this.set(e[0] * x + e[4] * y + e[8] * z, e[1] * x + e[5] * y + e[9] * z, e[2] * x + e[6] * y + e[10] * z);
    return this.normalize();
  }
  setFromMatrixPosition(m) {
    const e = m.elements;
    return this.set(e[12], e[13], e[14]);
  }
  setFromMatrixColumn(m, i) {
    return this.fromArray(m.elements, i * 4);
  }
  fromArray(a, o = 0) {
    return this.set(a[o], a[o + 1], a[o + 2]);
  }
  toArray(a = [], o = 0) {
    a[o] = this.x;
    a[o + 1] = this.y;
    a[o + 2] = this.z;
    return a;
  }
  equals(v) {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }
}

export class Vector4 {
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
  copy(v) {
    return this.set(v.x, v.y, v.z, v.w ?? 1);
  }
  clone() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }
}

export class Color {
  constructor(r, g, b) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
    if (g === undefined && b === undefined) {
      if (typeof r === 'number') this.setHex(r);
      else if (r?.isColor) this.copy(r);
      else if (typeof r === 'string') this.setStyle(r);
    } else {
      this.setRGB(r ?? 1, g ?? 1, b ?? 1);
    }
  }
  get isColor() {
    return true;
  }
  set(value) {
    if (typeof value === 'number') return this.setHex(value);
    if (value?.isColor) return this.copy(value);
    if (typeof value === 'string') return this.setStyle(value);
    return this;
  }
  setHex(hex) {
    hex = hex >>> 0;
    this.r = ((hex >> 16) & 255) / 255;
    this.g = ((hex >> 8) & 255) / 255;
    this.b = (hex & 255) / 255;
    return this;
  }
  setRGB(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
    return this;
  }
  setStyle(style) {
    const s = String(style).trim();
    if (s[0] === '#') {
      const h = s.slice(1);
      if (h.length === 3) {
        return this.setHex(
          (parseInt(h[0] + h[0], 16) << 16) | (parseInt(h[1] + h[1], 16) << 8) | parseInt(h[2] + h[2], 16)
        );
      }
      return this.setHex(parseInt(h, 16));
    }
    return this;
  }
  copy(c) {
    this.r = c.r;
    this.g = c.g;
    this.b = c.b;
    return this;
  }
  clone() {
    return new Color().copy(this);
  }
  lerp(c, t) {
    this.r += (c.r - this.r) * t;
    this.g += (c.g - this.g) * t;
    this.b += (c.b - this.b) * t;
    return this;
  }
  lerpColors(a, b, t) {
    this.r = a.r + (b.r - a.r) * t;
    this.g = a.g + (b.g - a.g) * t;
    this.b = a.b + (b.b - a.b) * t;
    return this;
  }
  multiplyScalar(s) {
    this.r *= s;
    this.g *= s;
    this.b *= s;
    return this;
  }
  multiply(c) {
    this.r *= c.r;
    this.g *= c.g;
    this.b *= c.b;
    return this;
  }
  getHex() {
    return ((this.r * 255) << 16) ^ ((this.g * 255) << 8) ^ ((this.b * 255) << 0);
  }
  getHSL(target = { h: 0, s: 0, l: 0 }) {
    const r = this.r;
    const g = this.g;
    const b = this.b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h;
    let s;
    const l = (max + min) / 2;
    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const d = max - min;
      s = l <= 0.5 ? d / (max + min) : d / (2 - max - min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h /= 6;
    }
    target.h = h;
    target.s = s;
    target.l = l;
    return target;
  }
  setHSL(h, s, l) {
    h = ((h % 1) + 1) % 1;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    if (s === 0) {
      this.r = this.g = this.b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      this.r = hue2rgb(p, q, h + 1 / 3);
      this.g = hue2rgb(p, q, h);
      this.b = hue2rgb(p, q, h - 1 / 3);
    }
    return this;
  }
  offsetHSL(h, s, l) {
    const hsl = this.getHSL();
    return this.setHSL(hsl.h + h, Math.max(0, hsl.s + s), Math.max(0, hsl.l + l));
  }
  getHexString() {
    return this.getHex().toString(16).padStart(6, '0');
  }
  toArray(a = [], o = 0) {
    a[o] = this.r;
    a[o + 1] = this.g;
    a[o + 2] = this.b;
    return a;
  }
}

export class Euler {
  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this._x = x;
    this._y = y;
    this._z = z;
    this._order = order;
    this._onChangeCallback = () => {};
  }
  get x() {
    return this._x;
  }
  set x(v) {
    this._x = v;
    this._onChangeCallback();
  }
  get y() {
    return this._y;
  }
  set y(v) {
    this._y = v;
    this._onChangeCallback();
  }
  get z() {
    return this._z;
  }
  set z(v) {
    this._z = v;
    this._onChangeCallback();
  }
  get order() {
    return this._order;
  }
  set order(v) {
    this._order = v;
    this._onChangeCallback();
  }
  set(x, y, z, order) {
    this._x = x;
    this._y = y;
    this._z = z;
    if (order) this._order = order;
    this._onChangeCallback();
    return this;
  }
  copy(e) {
    return this.set(e._x, e._y, e._z, e._order);
  }
  clone() {
    return new Euler(this._x, this._y, this._z, this._order);
  }
  setFromQuaternion(q, order = this._order, update = true) {
    _m.makeRotationFromQuaternion(q);
    return this.setFromRotationMatrix(_m, order, update);
  }
  setFromRotationMatrix(m, order = this._order, update = true) {
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
    this._order = order;
    if (order === 'XYZ') {
      this._y = Math.asin(clamp(m13, -1, 1));
      if (Math.abs(m13) < 0.9999999) {
        this._x = Math.atan2(-m23, m33);
        this._z = Math.atan2(-m12, m11);
      } else {
        this._x = Math.atan2(m32, m22);
        this._z = 0;
      }
    } else {
      this._y = Math.asin(clamp(m13, -1, 1));
      this._x = Math.atan2(-m23, m33);
      this._z = Math.atan2(-m12, m11);
    }
    if (update) this._onChangeCallback();
    return this;
  }
}

export class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
    this._onChangeCallback = () => {};
  }
  get x() {
    return this._x;
  }
  set x(v) {
    this._x = v;
    this._onChangeCallback();
  }
  get y() {
    return this._y;
  }
  set y(v) {
    this._y = v;
    this._onChangeCallback();
  }
  get z() {
    return this._z;
  }
  set z(v) {
    this._z = v;
    this._onChangeCallback();
  }
  get w() {
    return this._w;
  }
  set w(v) {
    this._w = v;
    this._onChangeCallback();
  }
  set(x, y, z, w) {
    this._x = x;
    this._y = y;
    this._z = z;
    this._w = w;
    this._onChangeCallback();
    return this;
  }
  copy(q) {
    return this.set(q.x, q.y, q.z, q.w);
  }
  clone() {
    return new Quaternion(this._x, this._y, this._z, this._w);
  }
  identity() {
    return this.set(0, 0, 0, 1);
  }
  multiply(q) {
    return this.multiplyQuaternions(this, q);
  }
  premultiply(q) {
    return this.multiplyQuaternions(q, this);
  }
  multiplyQuaternions(a, b) {
    const qax = a.x;
    const qay = a.y;
    const qaz = a.z;
    const qaw = a.w;
    const qbx = b.x;
    const qby = b.y;
    const qbz = b.z;
    const qbw = b.w;
    return this.set(
      qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
      qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
      qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
      qaw * qbw - qax * qbx - qay * qby - qaz * qbz
    );
  }
  setFromAxisAngle(axis, angle) {
    const h = angle / 2;
    const s = Math.sin(h);
    return this.set(axis.x * s, axis.y * s, axis.z * s, Math.cos(h));
  }
  setFromEuler(euler, update = true) {
    const x = euler._x;
    const y = euler._y;
    const z = euler._z;
    const order = euler._order;
    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);
    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);
    if (order === 'XYZ') {
      this._x = s1 * c2 * c3 + c1 * s2 * s3;
      this._y = c1 * s2 * c3 - s1 * c2 * s3;
      this._z = c1 * c2 * s3 + s1 * s2 * c3;
      this._w = c1 * c2 * c3 - s1 * s2 * s3;
    } else if (order === 'YXZ') {
      this._x = s1 * c2 * c3 + c1 * s2 * s3;
      this._y = c1 * s2 * c3 - s1 * c2 * s3;
      this._z = c1 * c2 * s3 - s1 * s2 * c3;
      this._w = c1 * c2 * c3 + s1 * s2 * s3;
    } else {
      this._x = s1 * c2 * c3 + c1 * s2 * s3;
      this._y = c1 * s2 * c3 - s1 * c2 * s3;
      this._z = c1 * c2 * s3 + s1 * s2 * c3;
      this._w = c1 * c2 * c3 - s1 * s2 * s3;
    }
    if (update) this._onChangeCallback();
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
      const s = 0.5 / Math.sqrt(trace + 1);
      this._w = 0.25 / s;
      this._x = (m32 - m23) * s;
      this._y = (m13 - m31) * s;
      this._z = (m21 - m12) * s;
    } else if (m11 > m22 && m11 > m33) {
      const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
      this._w = (m32 - m23) / s;
      this._x = 0.25 * s;
      this._y = (m12 + m21) / s;
      this._z = (m13 + m31) / s;
    } else if (m22 > m33) {
      const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
      this._w = (m13 - m31) / s;
      this._x = (m12 + m21) / s;
      this._y = 0.25 * s;
      this._z = (m23 + m32) / s;
    } else {
      const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
      this._w = (m21 - m12) / s;
      this._x = (m13 + m31) / s;
      this._y = (m23 + m32) / s;
      this._z = 0.25 * s;
    }
    this._onChangeCallback();
    return this;
  }
  invert() {
    this._x *= -1;
    this._y *= -1;
    this._z *= -1;
    this._onChangeCallback();
    return this;
  }
  normalize() {
    let l = Math.hypot(this._x, this._y, this._z, this._w);
    if (l === 0) return this.identity();
    l = 1 / l;
    this._x *= l;
    this._y *= l;
    this._z *= l;
    this._w *= l;
    this._onChangeCallback();
    return this;
  }
}

export class Matrix3 {
  constructor() {
    this.elements = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  }
  set(n11, n12, n13, n21, n22, n23, n31, n32, n33) {
    const te = this.elements;
    te[0] = n11;
    te[1] = n21;
    te[2] = n31;
    te[3] = n12;
    te[4] = n22;
    te[5] = n32;
    te[6] = n13;
    te[7] = n23;
    te[8] = n33;
    return this;
  }
  identity() {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }
  copy(m) {
    this.elements.set(m.elements);
    return this;
  }
  getNormalMatrix(m4) {
    return this.setFromMatrix4(m4).invert().transpose();
  }
  setFromMatrix4(m) {
    const me = m.elements;
    return this.set(me[0], me[4], me[8], me[1], me[5], me[9], me[2], me[6], me[10]);
  }
  transpose() {
    const te = this.elements;
    let tmp;
    tmp = te[1];
    te[1] = te[3];
    te[3] = tmp;
    tmp = te[2];
    te[2] = te[6];
    te[6] = tmp;
    tmp = te[5];
    te[5] = te[7];
    te[7] = tmp;
    return this;
  }
  invert() {
    const n11 = this.elements[0];
    const n21 = this.elements[1];
    const n31 = this.elements[2];
    const n12 = this.elements[3];
    const n22 = this.elements[4];
    const n32 = this.elements[5];
    const n13 = this.elements[6];
    const n23 = this.elements[7];
    const n33 = this.elements[8];
    const t11 = n33 * n22 - n32 * n23;
    const t12 = n32 * n13 - n33 * n12;
    const t13 = n23 * n12 - n22 * n13;
    const det = n11 * t11 + n21 * t12 + n31 * t13;
    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const detInv = 1 / det;
    this.elements[0] = t11 * detInv;
    this.elements[1] = (n31 * n23 - n33 * n21) * detInv;
    this.elements[2] = (n32 * n21 - n31 * n22) * detInv;
    this.elements[3] = t12 * detInv;
    this.elements[4] = (n33 * n11 - n31 * n13) * detInv;
    this.elements[5] = (n31 * n12 - n32 * n11) * detInv;
    this.elements[6] = t13 * detInv;
    this.elements[7] = (n21 * n13 - n23 * n11) * detInv;
    this.elements[8] = (n22 * n11 - n21 * n12) * detInv;
    return this;
  }
}

export class Matrix4 {
  constructor() {
    this.elements = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
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
  copy(m) {
    this.elements.set(m.elements);
    return this;
  }
  clone() {
    return new Matrix4().copy(this);
  }
  copyPosition(m) {
    const te = this.elements;
    const me = m.elements;
    te[12] = me[12];
    te[13] = me[13];
    te[14] = me[14];
    return this;
  }
  extractRotation(m) {
    const te = this.elements;
    const me = m.elements;
    const scaleX = 1 / _v.setFromMatrixColumn(m, 0).length();
    const scaleY = 1 / _v.setFromMatrixColumn(m, 1).length();
    const scaleZ = 1 / _v.setFromMatrixColumn(m, 2).length();
    te[0] = me[0] * scaleX;
    te[1] = me[1] * scaleX;
    te[2] = me[2] * scaleX;
    te[4] = me[4] * scaleY;
    te[5] = me[5] * scaleY;
    te[6] = me[6] * scaleY;
    te[8] = me[8] * scaleZ;
    te[9] = me[9] * scaleZ;
    te[10] = me[10] * scaleZ;
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;
    return this;
  }
  makeRotationFromQuaternion(q) {
    return this.compose(_zero, q, _one);
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
    te[0] = _x.x;
    te[4] = _y.x;
    te[8] = _z.x;
    te[1] = _x.y;
    te[5] = _y.y;
    te[9] = _z.y;
    te[2] = _x.z;
    te[6] = _y.z;
    te[10] = _z.z;
    return this;
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
    const a11 = ae[0];
    const a12 = ae[4];
    const a13 = ae[8];
    const a14 = ae[12];
    const a21 = ae[1];
    const a22 = ae[5];
    const a23 = ae[9];
    const a24 = ae[13];
    const a31 = ae[2];
    const a32 = ae[6];
    const a33 = ae[10];
    const a34 = ae[14];
    const a41 = ae[3];
    const a42 = ae[7];
    const a43 = ae[11];
    const a44 = ae[15];
    const b11 = be[0];
    const b12 = be[4];
    const b13 = be[8];
    const b14 = be[12];
    const b21 = be[1];
    const b22 = be[5];
    const b23 = be[9];
    const b24 = be[13];
    const b31 = be[2];
    const b32 = be[6];
    const b33 = be[10];
    const b34 = be[14];
    const b41 = be[3];
    const b42 = be[7];
    const b43 = be[11];
    const b44 = be[15];
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
  multiplyScalar(s) {
    const te = this.elements;
    for (let i = 0; i < 16; i++) te[i] *= s;
    return this;
  }
  invert() {
    const te = this.elements;
    const n11 = te[0];
    const n21 = te[1];
    const n31 = te[2];
    const n41 = te[3];
    const n12 = te[4];
    const n22 = te[5];
    const n32 = te[6];
    const n42 = te[7];
    const n13 = te[8];
    const n23 = te[9];
    const n33 = te[10];
    const n43 = te[11];
    const n14 = te[12];
    const n24 = te[13];
    const n34 = te[14];
    const n44 = te[15];
    const t11 =
      n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    const t12 =
      n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    const t13 =
      n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    const t14 =
      n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;
    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
    if (det === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const detInv = 1 / det;
    te[0] = t11 * detInv;
    te[1] =
      (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) *
      detInv;
    te[2] =
      (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) *
      detInv;
    te[3] =
      (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) *
      detInv;
    te[4] = t12 * detInv;
    te[5] =
      (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) *
      detInv;
    te[6] =
      (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) *
      detInv;
    te[7] =
      (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) *
      detInv;
    te[8] = t13 * detInv;
    te[9] =
      (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) *
      detInv;
    te[10] =
      (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) *
      detInv;
    te[11] =
      (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) *
      detInv;
    te[12] = t14 * detInv;
    te[13] =
      (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) *
      detInv;
    te[14] =
      (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) *
      detInv;
    te[15] =
      (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) *
      detInv;
    return this;
  }
  scale(v) {
    const x = v.x;
    const y = v.y;
    const z = v.z;
    const te = this.elements;
    te[0] *= x;
    te[4] *= y;
    te[8] *= z;
    te[1] *= x;
    te[5] *= y;
    te[9] *= z;
    te[2] *= x;
    te[6] *= y;
    te[10] *= z;
    te[3] *= x;
    te[7] *= y;
    te[11] *= z;
    return this;
  }
  setPosition(x, y, z) {
    const te = this.elements;
    if (x.isVector3 || (x.x != null && y == null)) {
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
  compose(position, quaternion, scale) {
    const te = this.elements;
    const x = quaternion.x;
    const y = quaternion.y;
    const z = quaternion.z;
    const w = quaternion.w;
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
    const det = te[0] * (te[5] * te[10] - te[6] * te[9]) - te[4] * (te[1] * te[10] - te[2] * te[9]) + te[8] * (te[1] * te[6] - te[2] * te[5]);
    if (det < 0) sx = -sx;
    position.x = te[12];
    position.y = te[13];
    position.z = te[14];
    _m.copy(this);
    const invX = sx !== 0 ? 1 / sx : 0;
    const invY = sy !== 0 ? 1 / sy : 0;
    const invZ = sz !== 0 ? 1 / sz : 0;
    _m.elements[0] *= invX;
    _m.elements[1] *= invX;
    _m.elements[2] *= invX;
    _m.elements[4] *= invY;
    _m.elements[5] *= invY;
    _m.elements[6] *= invY;
    _m.elements[8] *= invZ;
    _m.elements[9] *= invZ;
    _m.elements[10] *= invZ;
    quaternion.setFromRotationMatrix(_m);
    scale.x = sx;
    scale.y = sy;
    scale.z = sz;
    return this;
  }
  makeTranslation(x, y, z) {
    if (x.isVector3 || (x.x != null && y == null)) return this.set(1, 0, 0, x.x, 0, 1, 0, x.y, 0, 0, 1, x.z, 0, 0, 0, 1);
    return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1);
  }
  makeScale(x, y, z) {
    return this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1);
  }
  makeRotationX(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return this.set(1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1);
  }
  makeRotationY(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return this.set(c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1);
  }
  makeRotationZ(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return this.set(c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }
  makePerspective(left, right, top, bottom, near, far) {
    const x = (2 * near) / (right - left);
    const y = (2 * near) / (top - bottom);
    const a = (right + left) / (right - left);
    const b = (top + bottom) / (top - bottom);
    const c = -(far + near) / (far - near);
    const d = (-2 * far * near) / (far - near);
    return this.set(x, 0, a, 0, 0, y, b, 0, 0, 0, c, d, 0, 0, -1, 0);
  }
  fromArray(array, offset = 0) {
    for (let i = 0; i < 16; i++) this.elements[i] = array[offset + i];
    return this;
  }
  toArray(array = [], offset = 0) {
    for (let i = 0; i < 16; i++) array[offset + i] = this.elements[i];
    return array;
  }
}

export class Sphere {
  constructor(center = new Vector3(), radius = -1) {
    this.center = center;
    this.radius = radius;
  }
  copy(s) {
    this.center.copy(s.center);
    this.radius = s.radius;
    return this;
  }
  clone() {
    return new Sphere(this.center.clone(), this.radius);
  }
  set(center, radius) {
    this.center.copy(center);
    this.radius = radius;
    return this;
  }
}

export class Box3 {
  constructor(min = new Vector3(+Infinity, +Infinity, +Infinity), max = new Vector3(-Infinity, -Infinity, -Infinity)) {
    this.min = min;
    this.max = max;
  }
  setFromBufferAttribute(attr) {
    this.min.set(+Infinity, +Infinity, +Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i);
      const y = attr.getY(i);
      const z = attr.getZ(i);
      this.min.min({ x, y, z });
      this.max.max({ x, y, z });
    }
    return this;
  }
  getCenter(target) {
    return target.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  getSize(target) {
    return target.subVectors(this.max, this.min);
  }
  clone() {
    return new Box3(this.min.clone(), this.max.clone());
  }
  copy(b) {
    this.min.copy(b.min);
    this.max.copy(b.max);
    return this;
  }
}

Vector3.prototype.isVector3 = true;
Vector2.prototype.isVector2 = true;
Matrix4.prototype.isMatrix4 = true;

const _q = new Quaternion();
const _m = new Matrix4();
const _v = new Vector3();
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _zero = new Vector3(0, 0, 0);
const _one = new Vector3(1, 1, 1);

void EPS;
void clamp;
