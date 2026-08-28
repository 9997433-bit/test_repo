import { BufferAttribute, BufferGeometry } from './buffer.js';
import { Vector2, Vector3 } from './math.js';

function setPosNormUv(geo, positions, normals, uvs, indices) {
  geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  if (normals) geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  if (uvs) geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  if (indices) geo.setIndex(indices);
  if (!normals) geo.computeVertexNormals();
  return geo;
}

export class BoxGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1) {
    super();
    this.type = 'BoxGeometry';
    this.parameters = { width, height, depth, widthSegments, heightSegments, depthSegments };
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;
    const p = [
      -w, -h, d, w, -h, d, w, h, d, -w, h, d,
      w, -h, -d, -w, -h, -d, -w, h, -d, w, h, -d,
      -w, h, d, w, h, d, w, h, -d, -w, h, -d,
      -w, -h, -d, w, -h, -d, w, -h, d, -w, -h, d,
      -w, -h, -d, -w, -h, d, -w, h, d, -w, h, -d,
      w, -h, d, w, -h, -d, w, h, -d, w, h, d,
    ];
    const n = [
      0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
      0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
      0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
      -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    ];
    const uv = [];
    for (let i = 0; i < 6; i++) uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    const idx = [];
    for (let i = 0; i < 6; i++) {
      const o = i * 4;
      idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    }
    setPosNormUv(this, p, n, uv, idx);
  }
}

export class PlaneGeometry extends BufferGeometry {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super();
    this.type = 'PlaneGeometry';
    this.parameters = { width, height, widthSegments, heightSegments };
    const ws = Math.max(1, widthSegments | 0);
    const hs = Math.max(1, heightSegments | 0);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    for (let iy = 0; iy <= hs; iy++) {
      const v = iy / hs;
      const y = (v - 0.5) * height;
      for (let ix = 0; ix <= ws; ix++) {
        const u = ix / ws;
        positions.push((u - 0.5) * width, -y, 0);
        normals.push(0, 0, 1);
        uvs.push(u, 1 - v);
      }
    }
    for (let iy = 0; iy < hs; iy++) {
      for (let ix = 0; ix < ws; ix++) {
        const a = ix + (ws + 1) * iy;
        const b = ix + (ws + 1) * (iy + 1);
        const c = ix + 1 + (ws + 1) * (iy + 1);
        const d = ix + 1 + (ws + 1) * iy;
        indices.push(a, b, d, b, c, d);
      }
    }
    setPosNormUv(this, positions, normals, uvs, indices);
  }
}

export class CircleGeometry extends BufferGeometry {
  constructor(radius = 1, segments = 32, thetaStart = 0, thetaLength = Math.PI * 2) {
    super();
    this.type = 'CircleGeometry';
    this.parameters = { radius, segments, thetaStart, thetaLength };
    segments = Math.max(3, segments | 0);
    const positions = [0, 0, 0];
    const normals = [0, 0, 1];
    const uvs = [0.5, 0.5];
    const indices = [];
    for (let s = 0; s <= segments; s++) {
      const t = thetaStart + (s / segments) * thetaLength;
      const x = radius * Math.cos(t);
      const y = radius * Math.sin(t);
      positions.push(x, y, 0);
      normals.push(0, 0, 1);
      uvs.push((x / radius + 1) / 2, (y / radius + 1) / 2);
    }
    for (let i = 1; i <= segments; i++) indices.push(0, i, i + 1);
    setPosNormUv(this, positions, normals, uvs, indices);
  }
}

export class RingGeometry extends BufferGeometry {
  constructor(innerRadius = 0.5, outerRadius = 1, thetaSegments = 32, phiSegments = 1, thetaStart = 0, thetaLength = Math.PI * 2) {
    super();
    this.type = 'RingGeometry';
    this.parameters = { innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength };
    thetaSegments = Math.max(3, thetaSegments | 0);
    phiSegments = Math.max(1, phiSegments | 0);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    for (let j = 0; j <= phiSegments; j++) {
      const r = innerRadius + ((outerRadius - innerRadius) * j) / phiSegments;
      for (let i = 0; i <= thetaSegments; i++) {
        const t = thetaStart + (i / thetaSegments) * thetaLength;
        positions.push(r * Math.cos(t), r * Math.sin(t), 0);
        normals.push(0, 0, 1);
        uvs.push((i / thetaSegments), j / phiSegments);
      }
    }
    for (let j = 0; j < phiSegments; j++) {
      for (let i = 0; i < thetaSegments; i++) {
        const a = i + (thetaSegments + 1) * j;
        const b = i + (thetaSegments + 1) * (j + 1);
        const c = i + 1 + (thetaSegments + 1) * (j + 1);
        const d = i + 1 + (thetaSegments + 1) * j;
        indices.push(a, b, d, b, c, d);
      }
    }
    setPosNormUv(this, positions, normals, uvs, indices);
  }
}

function lathe(points, segments, phiStart, phiLength) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const inverse = 1 / segments;
  for (let i = 0; i <= segments; i++) {
    const phi = phiStart + i * inverse * phiLength;
    const sin = Math.sin(phi);
    const cos = Math.cos(phi);
    for (let j = 0; j <= points.length - 1; j++) {
      const v = points[j];
      positions.push(v.x * sin, v.y, v.x * cos);
      uvs.push(i / segments, j / (points.length - 1));
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < points.length - 1; j++) {
      const a = j + i * points.length;
      const b = j + (i + 1) * points.length;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { positions, uvs, indices };
}

export class LatheGeometry extends BufferGeometry {
  constructor(points = [new Vector2(0, -0.5), new Vector2(0.5, 0), new Vector2(0, 0.5)], segments = 12, phiStart = 0, phiLength = Math.PI * 2) {
    super();
    this.type = 'LatheGeometry';
    this.parameters = { points, segments, phiStart, phiLength };
    const { positions, uvs, indices } = lathe(points, Math.max(3, segments | 0), phiStart, phiLength);
    setPosNormUv(this, positions, null, uvs, indices);
  }
}

export class SphereGeometry extends BufferGeometry {
  constructor(radius = 1, widthSegments = 32, heightSegments = 16, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI) {
    super();
    this.type = 'SphereGeometry';
    this.parameters = { radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength };
    widthSegments = Math.max(3, widthSegments | 0);
    heightSegments = Math.max(2, heightSegments | 0);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    for (let iy = 0; iy <= heightSegments; iy++) {
      const v = iy / heightSegments;
      const theta = thetaStart + v * thetaLength;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      for (let ix = 0; ix <= widthSegments; ix++) {
        const u = ix / widthSegments;
        const phi = phiStart + u * phiLength;
        const x = -radius * Math.cos(phi) * sinT;
        const y = radius * cosT;
        const z = radius * Math.sin(phi) * sinT;
        positions.push(x, y, z);
        normals.push(x / radius, y / radius, z / radius);
        uvs.push(u, 1 - v);
      }
    }
    for (let iy = 0; iy < heightSegments; iy++) {
      for (let ix = 0; ix < widthSegments; ix++) {
        const a = iy * (widthSegments + 1) + ix;
        const b = a + widthSegments + 1;
        const c = b + 1;
        const d = a + 1;
        if (iy !== 0 || thetaStart > 0) indices.push(a, b, d);
        if (iy !== heightSegments - 1 || thetaStart + thetaLength < Math.PI) indices.push(b, c, d);
      }
    }
    setPosNormUv(this, positions, normals, uvs, indices);
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
    this.parameters = { radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength };
    radialSegments = Math.max(3, radialSegments | 0);
    heightSegments = Math.max(1, heightSegments | 0);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const half = height / 2;
    const slope = (radiusBottom - radiusTop) / height;
    let index = 0;
    const indexArray = [];
    for (let y = 0; y <= heightSegments; y++) {
      const row = [];
      const v = y / heightSegments;
      const r = v * (radiusBottom - radiusTop) + radiusTop;
      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * thetaLength + thetaStart;
        const sin = Math.sin(theta);
        const cos = Math.cos(theta);
        positions.push(r * sin, -v * height + half, r * cos);
        const nx = sin;
        const ny = slope;
        const nz = cos;
        const len = Math.hypot(nx, ny, nz) || 1;
        normals.push(nx / len, ny / len, nz / len);
        uvs.push(u, 1 - v);
        row.push(index++);
      }
      indexArray.push(row);
    }
    for (let x = 0; x < radialSegments; x++) {
      for (let y = 0; y < heightSegments; y++) {
        const a = indexArray[y][x];
        const b = indexArray[y + 1][x];
        const c = indexArray[y + 1][x + 1];
        const d = indexArray[y][x + 1];
        indices.push(a, b, d, b, c, d);
      }
    }
    const cap = (radius, y, sign) => {
      if (radius === 0) return;
      const center = index;
      positions.push(0, y, 0);
      normals.push(0, sign, 0);
      uvs.push(0.5, 0.5);
      index++;
      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const theta = u * thetaLength + thetaStart;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        positions.push(radius * sin, y, radius * cos);
        normals.push(0, sign, 0);
        uvs.push(cos * 0.5 + 0.5, sin * 0.5 * sign + 0.5);
        index++;
      }
      for (let x = 0; x < radialSegments; x++) {
        const a = center;
        const b = center + x + 1;
        const c = center + x + 2;
        if (sign === 1) indices.push(a, c, b);
        else indices.push(a, b, c);
      }
    };
    if (!openEnded) {
      cap(radiusTop, half, 1);
      cap(radiusBottom, -half, -1);
    }
    setPosNormUv(this, positions, normals, uvs, indices);
  }
}

export class ConeGeometry extends CylinderGeometry {
  constructor(radius = 1, height = 1, radialSegments = 32, heightSegments = 1, openEnded = false, thetaStart = 0, thetaLength = Math.PI * 2) {
    super(0, radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength);
    this.type = 'ConeGeometry';
    this.parameters = { radius, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength };
  }
}

export class CapsuleGeometry extends LatheGeometry {
  constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
    const pts = [];
    const caps = Math.max(1, capSegments | 0);
    for (let i = 0; i <= caps; i++) {
      const t = (i / caps) * (Math.PI / 2);
      pts.push(new Vector2(radius * Math.cos(t), -length / 2 - radius * Math.sin(t)));
    }
    for (let i = 0; i <= caps; i++) {
      const t = (i / caps) * (Math.PI / 2);
      pts.push(new Vector2(radius * Math.cos(Math.PI / 2 - t), length / 2 + radius * Math.sin(t)));
    }
    super(pts, Math.max(3, radialSegments | 0));
    this.type = 'CapsuleGeometry';
    this.parameters = { radius, length, capSegments, radialSegments };
  }
}

export class TorusGeometry extends BufferGeometry {
  constructor(radius = 1, tube = 0.4, radialSegments = 12, tubularSegments = 48, arc = Math.PI * 2) {
    super();
    this.type = 'TorusGeometry';
    this.parameters = { radius, tube, radialSegments, tubularSegments, arc };
    radialSegments = Math.max(2, radialSegments | 0);
    tubularSegments = Math.max(3, tubularSegments | 0);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * arc;
        const v = (j / radialSegments) * Math.PI * 2;
        const x = (radius + tube * Math.cos(v)) * Math.cos(u);
        const y = (radius + tube * Math.cos(v)) * Math.sin(u);
        const z = tube * Math.sin(v);
        positions.push(x, y, z);
        const cx = radius * Math.cos(u);
        const cy = radius * Math.sin(u);
        const nx = x - cx;
        const ny = y - cy;
        const nz = z;
        const len = Math.hypot(nx, ny, nz) || 1;
        normals.push(nx / len, ny / len, nz / len);
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }
    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        const a = (tubularSegments + 1) * j + i - 1;
        const b = (tubularSegments + 1) * (j - 1) + i - 1;
        const c = (tubularSegments + 1) * (j - 1) + i;
        const d = (tubularSegments + 1) * j + i;
        indices.push(a, b, d, b, c, d);
      }
    }
    setPosNormUv(this, positions, normals, uvs, indices);
  }
}

function polyhedron(vertices, indices, radius, detail) {
  const pos = [];
  const pushV = (x, y, z) => {
    const l = Math.hypot(x, y, z) || 1;
    pos.push((x / l) * radius, (y / l) * radius, (z / l) * radius);
  };
  const subdivide = (a, b, c, d) => {
    if (d === 0) {
      pushV(a.x, a.y, a.z);
      pushV(b.x, b.y, b.z);
      pushV(c.x, c.y, c.z);
      return;
    }
    const ab = a.clone().add(b).multiplyScalar(0.5);
    const bc = b.clone().add(c).multiplyScalar(0.5);
    const ca = c.clone().add(a).multiplyScalar(0.5);
    subdivide(a, ab, ca, d - 1);
    subdivide(b, bc, ab, d - 1);
    subdivide(c, ca, bc, d - 1);
    subdivide(ab, bc, ca, d - 1);
  };
  const vs = [];
  for (let i = 0; i < vertices.length; i += 3) vs.push(new Vector3(vertices[i], vertices[i + 1], vertices[i + 2]));
  for (let i = 0; i < indices.length; i += 3) {
    subdivide(vs[indices[i]], vs[indices[i + 1]], vs[indices[i + 2]], detail | 0);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  geo.computeVertexNormals();
  const n = pos.length / 3;
  const uv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    uv[i * 2] = 0.5 + Math.atan2(pos[i * 3 + 2], pos[i * 3]) / (Math.PI * 2);
    uv[i * 2 + 1] = 0.5 + Math.asin(pos[i * 3 + 1] / radius) / Math.PI;
  }
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  return geo;
}

const T = (1 + Math.sqrt(5)) / 2;
const ICO_V = [
  -1, T, 0, 1, T, 0, -1, -T, 0, 1, -T, 0,
  0, -1, T, 0, 1, T, 0, -1, -T, 0, 1, -T,
  T, 0, -1, T, 0, 1, -T, 0, -1, -T, 0, 1,
];
const ICO_I = [
  0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
  1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
  3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
  4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
];

export class IcosahedronGeometry extends BufferGeometry {
  constructor(radius = 1, detail = 0) {
    super();
    this.type = 'IcosahedronGeometry';
    this.parameters = { radius, detail };
    const g = polyhedron(ICO_V, ICO_I, radius, detail);
    this.attributes = g.attributes;
    this.index = g.index;
  }
}

export class OctahedronGeometry extends BufferGeometry {
  constructor(radius = 1, detail = 0) {
    super();
    this.type = 'OctahedronGeometry';
    this.parameters = { radius, detail };
    const g = polyhedron(
      [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1],
      [0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4, 2],
      radius,
      detail
    );
    this.attributes = g.attributes;
    this.index = g.index;
  }
}

export class Shape {
  constructor() {
    this.curves = [];
    this.currentPoint = new Vector2();
    this.autoClose = false;
  }
  moveTo(x, y) {
    this.currentPoint.set(x, y);
    this.curves.push({ type: 'move', x, y });
    return this;
  }
  lineTo(x, y) {
    this.curves.push({ type: 'line', x, y });
    this.currentPoint.set(x, y);
    return this;
  }
  closePath() {
    this.autoClose = true;
    return this;
  }
  getPoints() {
    const pts = [];
    for (const c of this.curves) {
      if (c.type === 'move' || c.type === 'line') pts.push(new Vector2(c.x, c.y));
    }
    if (this.autoClose && pts.length > 2) {
      const a = pts[0];
      const b = pts[pts.length - 1];
      if (a.x !== b.x || a.y !== b.y) pts.push(a.clone());
    }
    return pts;
  }
}

function fanTriangulate(pts) {
  const indices = [];
  if (pts.length < 3) return indices;
  const n = pts[0].equals?.(pts[pts.length - 1]) || (pts[0].x === pts[pts.length - 1].x && pts[0].y === pts[pts.length - 1].y)
    ? pts.length - 1
    : pts.length;
  for (let i = 1; i < n - 1; i++) indices.push(0, i, i + 1);
  return indices;
}

export class ShapeGeometry extends BufferGeometry {
  constructor(shape, curveSegments = 12) {
    super();
    this.type = 'ShapeGeometry';
    this.parameters = { shapes: shape, curveSegments };
    const pts = Array.isArray(shape) ? shape[0].getPoints() : shape.getPoints();
    const positions = [];
    const uvs = [];
    for (const p of pts) {
      positions.push(p.x, p.y, 0);
      uvs.push(p.x, p.y);
    }
    const n = pts.length;
    const closed = n > 2 && pts[0].x === pts[n - 1].x && pts[0].y === pts[n - 1].y;
    const count = closed ? n - 1 : n;
    const indices = [];
    for (let i = 1; i < count - 1; i++) indices.push(0, i, i + 1);
    setPosNormUv(this, positions, null, uvs, indices);
  }
}

export class ExtrudeGeometry extends BufferGeometry {
  constructor(shape, options = {}) {
    super();
    this.type = 'ExtrudeGeometry';
    this.parameters = { shapes: shape, options };
    const depth = options.depth ?? options.amount ?? 1;
    const bevelEnabled = options.bevelEnabled !== false;
    const bevelSize = bevelEnabled ? options.bevelSize ?? 0.01 : 0;
    const bevelThickness = bevelEnabled ? options.bevelThickness ?? 0.01 : 0;
    const pts = (Array.isArray(shape) ? shape[0] : shape).getPoints();
    const n0 = pts.length;
    const closed = n0 > 2 && pts[0].x === pts[n0 - 1].x && pts[0].y === pts[n0 - 1].y;
    const ring = closed ? pts.slice(0, n0 - 1) : pts.slice();
    const n = ring.length;
    const layers = [];
    const pushRing = (scale, z) => {
      const layer = [];
      for (const p of ring) {
        layer.push(new Vector3(p.x * scale, p.y * scale, z));
      }
      layers.push(layer);
    };
    if (bevelEnabled && bevelSize > 0) {
      pushRing(1, 0);
      pushRing(1 + bevelSize * 0.15, -bevelThickness * 0.4);
      pushRing(1, -bevelThickness);
      pushRing(1, -(depth + bevelThickness));
    } else {
      pushRing(1, 0);
      pushRing(1, -depth);
    }
    const positions = [];
    const uvs = [];
    const indices = [];
    const addV = (v) => {
      positions.push(v.x, v.y, v.z);
      uvs.push(v.x, v.y);
      return positions.length / 3 - 1;
    };
    const ids = layers.map((layer) => layer.map(addV));
    const cap = (layerIds, flip) => {
      for (let i = 1; i < n - 1; i++) {
        if (flip) indices.push(layerIds[0], layerIds[i + 1], layerIds[i]);
        else indices.push(layerIds[0], layerIds[i], layerIds[i + 1]);
      }
    };
    cap(ids[0], false);
    cap(ids[ids.length - 1], true);
    for (let l = 0; l < ids.length - 1; l++) {
      for (let i = 0; i < n; i++) {
        const i2 = (i + 1) % n;
        const a = ids[l][i];
        const b = ids[l][i2];
        const c = ids[l + 1][i2];
        const d = ids[l + 1][i];
        indices.push(a, d, b, b, d, c);
      }
    }
    setPosNormUv(this, positions, null, uvs, indices);
  }
}

export class CatmullRomCurve3 {
  constructor(points = []) {
    this.points = points;
    this.isCatmullRomCurve3 = true;
  }
  getPoint(t) {
    const pts = this.points;
    const l = pts.length;
    if (l === 0) return new Vector3();
    if (l === 1) return pts[0].clone();
    const p = (l - 1) * t;
    const i = Math.min(Math.floor(p), l - 2);
    const w = p - i;
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, l - 1)];
    const w2 = w * w;
    const w3 = w2 * w;
    const v = new Vector3();
    v.x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * w + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * w2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * w3);
    v.y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * w + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * w2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * w3);
    v.z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * w + (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * w2 + (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * w3);
    return v;
  }
  getTangent(t) {
    const d = 0.001;
    const a = this.getPoint(Math.max(0, t - d));
    const b = this.getPoint(Math.min(1, t + d));
    return b.sub(a).normalize();
  }
  getPoints(n = 5) {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(this.getPoint(i / n));
    return out;
  }
}

export class TubeGeometry extends BufferGeometry {
  constructor(path, tubularSegments = 64, radius = 1, radialSegments = 8, closed = false) {
    super();
    this.type = 'TubeGeometry';
    this.parameters = { path, tubularSegments, radius, radialSegments, closed };
    tubularSegments = Math.max(2, tubularSegments | 0);
    radialSegments = Math.max(3, radialSegments | 0);
    const positions = [];
    const normals = [];
    const uvs = [];
    const indices = [];
    const frames = [];
    let prevN = new Vector3(0, 1, 0);
    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const p = path.getPoint(t);
      const tan = path.getTangent(t);
      if (tan.lengthSq() < 1e-10) tan.set(0, 0, 1);
      let n = new Vector3().crossVectors(tan, prevN);
      if (n.lengthSq() < 1e-8) n.crossVectors(tan, new Vector3(1, 0, 0));
      n.normalize();
      const b = new Vector3().crossVectors(tan, n).normalize();
      prevN = n;
      frames.push({ p, n, b });
    }
    for (let i = 0; i <= tubularSegments; i++) {
      const f = frames[i];
      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        const cx = -radius * Math.cos(v);
        const cy = radius * Math.sin(v);
        const nx = cx * f.n.x + cy * f.b.x;
        const ny = cx * f.n.y + cy * f.b.y;
        const nz = cx * f.n.z + cy * f.b.z;
        positions.push(f.p.x + nx, f.p.y + ny, f.p.z + nz);
        const len = Math.hypot(nx, ny, nz) || 1;
        normals.push(nx / len, ny / len, nz / len);
        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }
    for (let i = 1; i <= tubularSegments; i++) {
      for (let j = 1; j <= radialSegments; j++) {
        const a = (radialSegments + 1) * (i - 1) + (j - 1);
        const b = (radialSegments + 1) * i + (j - 1);
        const c = (radialSegments + 1) * i + j;
        const d = (radialSegments + 1) * (i - 1) + j;
        indices.push(a, b, d, b, c, d);
      }
    }
    setPosNormUv(this, positions, normals, uvs, indices);
  }
}

void fanTriangulate;
void Vector3;
