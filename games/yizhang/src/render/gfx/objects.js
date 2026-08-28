// 渲染适配层 · 可绘制对象。
//
// Mesh / InstancedMesh / SkinnedMesh / Points / LineSegments 都只是「几何 + 材质 +
// 变换」的记录；后端在绘制前把它们投影成引擎侧的网格。刚性蒙皮沿用原实现的语义：
// 每个零件是一根权重 1 的骨头，合批后的网格跟着各自的节点动。

import { Object3D } from './core.js';
import { InstancedBufferAttribute } from './geometry.js';
import { Matrix4 } from './math.js';

const _identity = new Matrix4();

export class Mesh extends Object3D {
  constructor(geometry = null, material = null) {
    super();
    this.type = 'Mesh';
    this.isMesh = true;
    this.geometry = geometry;
    this.material = material;
    /** 覆盖式包围球（蒙皮网格用），null 表示按几何体自己算。 */
    this.boundingSphere = null;
  }
}

export class InstancedMesh extends Mesh {
  constructor(geometry, material, count) {
    super(geometry, material);
    this.type = 'InstancedMesh';
    this.isInstancedMesh = true;
    this.count = count;
    this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
    this.instanceColor = null;
    this.frustumCulled = true;
    for (let i = 0; i < count; i++) this.setMatrixAt(i, _identity);
  }

  setMatrixAt(index, matrix) {
    matrix.toArray(this.instanceMatrix.array, index * 16);
  }

  getMatrixAt(index, matrix) {
    matrix.fromArray(this.instanceMatrix.array, index * 16);
    return matrix;
  }

  setColorAt(index, color) {
    if (this.instanceColor === null) {
      this.instanceColor = new InstancedBufferAttribute(
        new Float32Array(this.instanceMatrix.count * 3).fill(1),
        3
      );
    }
    color.toArray(this.instanceColor.array, index * 3);
  }

  getColorAt(index, color) {
    return color.setRGB(
      this.instanceColor.array[index * 3],
      this.instanceColor.array[index * 3 + 1],
      this.instanceColor.array[index * 3 + 2]
    );
  }

  dispose() {
    this._backendDisposed = true;
  }
}

/**
 * 刚性蒙皮的骨架。骨头就是原来的零件节点：不做真的形变，只把「谁跟着谁动」记下来。
 */
export class Skeleton {
  constructor(bones = [], boneInverses = []) {
    this.isSkeleton = true;
    this.bones = bones.slice();
    this.boneInverses = boneInverses.slice();
    this.boneMatrices = null;
    if (this.boneInverses.length === 0) this.calculateInverses();
    /** 后端句柄（Babylon Skeleton）。 */
    this._backend = null;
  }

  calculateInverses() {
    this.boneInverses.length = 0;
    for (const bone of this.bones) {
      const inverse = new Matrix4();
      if (bone) inverse.copy(bone.matrixWorld).invert();
      this.boneInverses.push(inverse);
    }
    return this;
  }

  pose() {
    return this;
  }

  update() {
    return this;
  }

  getBoneByName(name) {
    return this.bones.find((b) => b.name === name);
  }

  dispose() {
    this._backend?.dispose?.();
    this._backend = null;
  }
}

export class SkinnedMesh extends Mesh {
  constructor(geometry, material) {
    super(geometry, material);
    this.type = 'SkinnedMesh';
    this.isSkinnedMesh = true;
    this.bindMode = 'attached';
    this.bindMatrix = new Matrix4();
    this.bindMatrixInverse = new Matrix4();
    this.skeleton = null;
  }

  bind(skeleton, bindMatrix) {
    this.skeleton = skeleton;
    if (bindMatrix === undefined) {
      this.updateMatrixWorld(true);
      this.skeleton.calculateInverses();
      bindMatrix = this.matrixWorld;
    }
    this.bindMatrix.copy(bindMatrix);
    this.bindMatrixInverse.copy(bindMatrix).invert();
    return this;
  }

  updateMatrixWorld(force) {
    super.updateMatrixWorld(force);
    // 'attached'：绑定逆阵每帧跟着自身世界矩阵走，于是零件在世界系里跟住它的骨头
    if (this.bindMode === 'attached') this.bindMatrixInverse.copy(this.matrixWorld).invert();
    else this.bindMatrixInverse.copy(this.bindMatrix).invert();
  }
}

export class Points extends Object3D {
  constructor(geometry = null, material = null) {
    super();
    this.type = 'Points';
    this.isPoints = true;
    this.geometry = geometry;
    this.material = material;
  }
}

export class Line extends Object3D {
  constructor(geometry = null, material = null) {
    super();
    this.type = 'Line';
    this.isLine = true;
    this.geometry = geometry;
    this.material = material;
  }
}

export class LineSegments extends Line {
  constructor(geometry = null, material = null) {
    super(geometry, material);
    this.type = 'LineSegments';
    this.isLineSegments = true;
  }
}
