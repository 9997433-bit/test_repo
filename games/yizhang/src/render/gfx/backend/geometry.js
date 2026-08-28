// 后端 · 几何体上载。
//
// 适配层的 BufferGeometry 是一组具名属性数组；这里把它们变成引擎侧的顶点缓冲。
// 名字大多能直接沿用，只有骨骼索引 / 权重两项要换成引擎的叫法。

import { Geometry as BGeometry } from '@babylonjs/core/Meshes/geometry.js';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js';

const KIND_ALIASES = {
  position: VertexBuffer.PositionKind,
  normal: VertexBuffer.NormalKind,
  uv: VertexBuffer.UVKind,
  uv1: VertexBuffer.UV2Kind,
  uv2: VertexBuffer.UV2Kind,
  tangent: VertexBuffer.TangentKind,
  color: VertexBuffer.ColorKind,
  skinIndex: VertexBuffer.MatricesIndicesKind,
  skinWeight: VertexBuffer.MatricesWeightsKind,
};

export const kindOf = (name) => KIND_ALIASES[name] ?? name;

/** 逐实例的属性不进顶点缓冲，交给瘦实例缓冲。 */
const isInstanced = (attr) => !!attr?.isInstancedBufferAttribute;

function floatData(attr) {
  const src = attr.array;
  return src instanceof Float32Array ? src : Float32Array.from(src);
}

/**
 * 拿到（必要时创建）一份几何体的引擎资源，并把标脏的属性重新上传。
 *
 * @param {object} geo   适配层几何体
 * @param {*} scene      引擎场景
 * @returns {{geometry: *, attributeNames: string[], instancedNames: string[]}}
 */
export function resolveGeometry(geo, scene) {
  if (!geo) return null;
  let rec = geo._backend;
  if (rec && rec.scene !== scene) {
    rec = null;
    geo._backend = null;
  }
  if (!rec) {
    rec = {
      scene,
      geometry: new BGeometry(`gfx-geo-${geo.id}`, scene, undefined, false),
      versions: new Map(),
      attributeNames: [],
      instancedNames: [],
      indexVersion: -1,
    };
    geo._backend = rec;
  }

  const g = rec.geometry;
  rec.attributeNames.length = 0;
  rec.instancedNames.length = 0;

  for (const [name, attr] of Object.entries(geo.attributes)) {
    if (!attr) continue;
    if (isInstanced(attr)) {
      rec.instancedNames.push(name);
      continue;
    }
    const kind = kindOf(name);
    rec.attributeNames.push(kind);
    const known = rec.versions.get(kind);
    if (known === undefined) {
      g.setVerticesData(kind, floatData(attr), attr.usage !== 35044, attr.itemSize);
      rec.versions.set(kind, attr.version);
    } else if (known !== attr.version) {
      g.updateVerticesData(kind, floatData(attr), false, false);
      rec.versions.set(kind, attr.version);
    }
  }

  if (geo.index) {
    if (rec.indexVersion !== geo.index.version) {
      g.setIndices(Array.from(geo.index.array), geo.attributes.position?.count ?? undefined, true);
      rec.indexVersion = geo.index.version;
    }
  }

  return rec;
}

/** 逐实例属性（矩阵除外）的原始数组，交给瘦实例缓冲。 */
export function instancedAttribute(geo, name) {
  const attr = geo?.attributes?.[name];
  if (!attr) return null;
  return { data: floatData(attr), stride: attr.itemSize, version: attr.version };
}
