import { BufferAttribute, InstancedBufferAttribute } from './buffer.js';
import { DynamicDrawUsage } from './constants.js';
import { Color, Matrix4, Vector3 } from './math.js';
import { Object3D } from './object3d.js';

export class Mesh extends Object3D {
  constructor(geometry, material) {
    super();
    this.type = 'Mesh';
    this.isMesh = true;
    this.geometry = geometry;
    this.material = material;
  }
  copy(source, recursive) {
    super.copy(source, recursive);
    this.geometry = source.geometry;
    this.material = source.material;
    return this;
  }
}

export class InstancedMesh extends Mesh {
  constructor(geometry, material, count = 1) {
    super(geometry, material);
    this.type = 'InstancedMesh';
    this.isInstancedMesh = true;
    this.count = count;
    this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
    this.instanceColor = null;
    this.frustumCulled = false;
    const identity = new Matrix4();
    for (let i = 0; i < count; i++) this.setMatrixAt(i, identity);
  }
  setMatrixAt(index, matrix) {
    matrix.toArray(this.instanceMatrix.array, index * 16);
    this.instanceMatrix.needsUpdate = true;
  }
  getMatrixAt(index, matrix) {
    return matrix.fromArray(this.instanceMatrix.array, index * 16);
  }
  setColorAt(index, color) {
    if (!this.instanceColor) {
      this.instanceColor = new InstancedBufferAttribute(new Float32Array(this.count * 3), 3);
    }
    this.instanceColor.setXYZ(index, color.r, color.g, color.b);
    this.instanceColor.needsUpdate = true;
  }
  getColorAt(index, color) {
    color.r = this.instanceColor.getX(index);
    color.g = this.instanceColor.getY(index);
    color.b = this.instanceColor.getZ(index);
    return color;
  }
  dispose() {
    this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(0), 16);
    this.instanceColor = null;
  }
}

export class Skeleton {
  constructor(bones = [], boneInverses) {
    this.bones = bones;
    this.boneInverses = boneInverses ?? bones.map((b) => {
      b.updateWorldMatrix(true, false);
      return new Matrix4().copy(b.matrixWorld).invert();
    });
    this.boneMatrices = new Float32Array(bones.length * 16);
    this.uuid = `sk${Math.random().toString(36).slice(2)}`;
  }
  update() {
    const identity = new Matrix4();
    const tmp = new Matrix4();
    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i];
      bone.updateWorldMatrix(true, false);
      tmp.multiplyMatrices(bone.matrixWorld, this.boneInverses[i] ?? identity);
      tmp.toArray(this.boneMatrices, i * 16);
    }
  }
  clone() {
    return new Skeleton(this.bones, this.boneInverses.map((m) => m.clone()));
  }
  dispose() {
    this.bones = [];
    this.boneInverses = [];
    this.boneMatrices = new Float32Array(0);
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
    this.boundingSphere = null;
  }
  bind(skeleton, bindMatrix) {
    this.skeleton = skeleton;
    if (bindMatrix) this.bindMatrix.copy(bindMatrix);
    else {
      this.updateMatrixWorld(true);
      this.bindMatrix.copy(this.matrixWorld);
    }
    this.bindMatrixInverse.copy(this.bindMatrix).invert();
    return this;
  }
  pose() {
    this.skeleton?.update();
  }
}

export class Points extends Object3D {
  constructor(geometry, material) {
    super();
    this.type = 'Points';
    this.isPoints = true;
    this.geometry = geometry;
    this.material = material;
  }
}

export class Line extends Object3D {
  constructor(geometry, material) {
    super();
    this.type = 'Line';
    this.isLine = true;
    this.geometry = geometry;
    this.material = material;
  }
}

export class LineSegments extends Line {
  constructor(geometry, material) {
    super(geometry, material);
    this.type = 'LineSegments';
    this.isLineSegments = true;
  }
}

export class Bone extends Object3D {
  constructor() {
    super();
    this.type = 'Bone';
    this.isBone = true;
  }
}

void BufferAttribute;
void DynamicDrawUsage;
void Color;
void Vector3;
