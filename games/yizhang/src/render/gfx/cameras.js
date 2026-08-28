// 渲染适配层 · 相机。
//
// 相机也是场景图节点：位置 / 朝向走同一套欧拉角与世界矩阵，投影矩阵在这里自己算。
// 后端把世界矩阵拆成位置 + 四元数交给引擎相机（右手系下两边的「前方」同为 -Z）。

import { Object3D } from './core.js';
import { Matrix4 } from './math.js';

export class Camera extends Object3D {
  constructor() {
    super();
    this.type = 'Camera';
    this.isCamera = true;
    this.matrixWorldInverse = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrixInverse = new Matrix4();
  }

  updateMatrixWorld(force) {
    super.updateMatrixWorld(force);
    this.matrixWorldInverse.copy(this.matrixWorld).invert();
  }

  updateWorldMatrix(updateParents, updateChildren) {
    super.updateWorldMatrix(updateParents, updateChildren);
    this.matrixWorldInverse.copy(this.matrixWorld).invert();
  }
}

export class PerspectiveCamera extends Camera {
  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.type = 'PerspectiveCamera';
    this.isPerspectiveCamera = true;
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.zoom = 1;
    this.filmGauge = 35;
    this.filmOffset = 0;
    this.focus = 10;
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    const near = this.near;
    const top = (near * Math.tan((Math.PI / 180) * 0.5 * this.fov)) / this.zoom;
    const height = 2 * top;
    const width = this.aspect * height;
    const left = -0.5 * width;
    this.projectionMatrix.makePerspective(left, left + width, top, top - height, near, this.far);
    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    return this;
  }
}

export class OrthographicCamera extends Camera {
  constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000) {
    super();
    this.type = 'OrthographicCamera';
    this.isOrthographicCamera = true;
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.near = near;
    this.far = far;
    this.zoom = 1;
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    const dx = (this.right - this.left) / (2 * this.zoom);
    const dy = (this.top - this.bottom) / (2 * this.zoom);
    const cx = (this.right + this.left) / 2;
    const cy = (this.top + this.bottom) / 2;
    const left = cx - dx;
    const right = cx + dx;
    const top = cy + dy;
    const bottom = cy - dy;
    const w = 1.0 / (right - left);
    const h = 1.0 / (top - bottom);
    const p = 1.0 / (this.far - this.near);
    this.projectionMatrix.set(
      2 * w, 0, 0, -(right + left) * w,
      0, 2 * h, 0, -(top + bottom) * h,
      0, 0, -2 * p, -(this.far + this.near) * p,
      0, 0, 0, 1
    );
    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    return this;
  }
}
