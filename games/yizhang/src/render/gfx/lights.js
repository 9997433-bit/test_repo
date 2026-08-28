// 渲染适配层 · 灯光。
//
// 灯也是场景图节点（方向光靠 position → target 定向）。阴影参数只在这里记账，
// 后端按它们配一台引擎侧的阴影发生器。

import { Object3D } from './core.js';
import { Color, Vector2 } from './math.js';

class LightShadowCamera {
  constructor() {
    this.left = -5;
    this.right = 5;
    this.top = 5;
    this.bottom = -5;
    this.near = 0.5;
    this.far = 500;
  }

  updateProjectionMatrix() {}
}

class LightShadow {
  constructor() {
    this.mapSize = new Vector2(512, 512);
    this.camera = new LightShadowCamera();
    this.bias = 0;
    this.normalBias = 0;
    this.radius = 1;
    this.blurSamples = 8;
    this.needsUpdate = false;
  }
}

export class Light extends Object3D {
  constructor(color = 0xffffff, intensity = 1) {
    super();
    this.type = 'Light';
    this.isLight = true;
    this.color = new Color(color);
    this.intensity = intensity;
    /** 后端句柄。 */
    this._backend = null;
  }

  dispose() {
    this._backend?.dispose?.();
    this._backend = null;
  }
}

export class AmbientLight extends Light {
  constructor(color, intensity) {
    super(color, intensity);
    this.type = 'AmbientLight';
    this.isAmbientLight = true;
  }
}

export class HemisphereLight extends Light {
  constructor(skyColor = 0xffffff, groundColor = 0xffffff, intensity = 1) {
    super(skyColor, intensity);
    this.type = 'HemisphereLight';
    this.isHemisphereLight = true;
    this.groundColor = new Color(groundColor);
    this.position.set(0, 1, 0);
  }
}

export class DirectionalLight extends Light {
  constructor(color, intensity) {
    super(color, intensity);
    this.type = 'DirectionalLight';
    this.isDirectionalLight = true;
    this.position.set(0, 1, 0);
    this.target = new Object3D();
    this.shadow = new LightShadow();
  }
}

export class PointLight extends Light {
  constructor(color, intensity = 1, distance = 0, decay = 2) {
    super(color, intensity);
    this.type = 'PointLight';
    this.isPointLight = true;
    this.distance = distance;
    this.decay = decay;
    this.shadow = new LightShadow();
  }
}

export class SpotLight extends Light {
  constructor(color, intensity = 1, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 2) {
    super(color, intensity);
    this.type = 'SpotLight';
    this.isSpotLight = true;
    this.distance = distance;
    this.angle = angle;
    this.penumbra = penumbra;
    this.decay = decay;
    this.target = new Object3D();
    this.shadow = new LightShadow();
  }
}
