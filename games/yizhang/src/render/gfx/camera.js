import { Matrix4, Vector3 } from './math.js';
import { Object3D } from './object3d.js';

export class Camera extends Object3D {
  constructor() {
    super();
    this.type = 'Camera';
    this.isCamera = true;
    this.matrixWorldInverse = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.projectionMatrixInverse = new Matrix4();
  }
  getWorldDirection(target) {
    this.updateWorldMatrix(true, false);
    const e = this.matrixWorld.elements;
    return target.set(-e[8], -e[9], -e[10]).normalize();
  }
  updateMatrixWorld(force) {
    super.updateMatrixWorld(force);
    this.matrixWorldInverse.copy(this.matrixWorld).invert();
  }
  clone() {
    return new this.constructor().copy(this);
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
    const te = this.projectionMatrix.elements;
    const w = 1 / (right - left);
    const h = 1 / (top - bottom);
    const p = 1 / (this.far - this.near);
    te[0] = 2 * w;
    te[4] = 0;
    te[8] = 0;
    te[12] = -(right + left) * w;
    te[1] = 0;
    te[5] = 2 * h;
    te[9] = 0;
    te[13] = -(top + bottom) * h;
    te[2] = 0;
    te[6] = 0;
    te[10] = -2 * p;
    te[14] = -(this.far + this.near) * p;
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[15] = 1;
    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
  }
}

void Vector3;
