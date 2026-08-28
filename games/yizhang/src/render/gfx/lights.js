import { Color, Vector2 } from './math.js';
import { Object3D } from './object3d.js';
import { OrthographicCamera } from './camera.js';

export class Light extends Object3D {
  constructor(color, intensity = 1) {
    super();
    this.type = 'Light';
    this.isLight = true;
    this.color = new Color(color ?? 0xffffff);
    this.intensity = intensity;
  }
  dispose() {}
}

export class AmbientLight extends Light {
  constructor(color, intensity) {
    super(color, intensity);
    this.type = 'AmbientLight';
    this.isAmbientLight = true;
  }
}

export class HemisphereLight extends Light {
  constructor(skyColor, groundColor, intensity) {
    super(skyColor, intensity);
    this.type = 'HemisphereLight';
    this.isHemisphereLight = true;
    this.groundColor = new Color(groundColor ?? 0x444444);
  }
}

export class DirectionalLight extends Light {
  constructor(color, intensity) {
    super(color, intensity);
    this.type = 'DirectionalLight';
    this.isDirectionalLight = true;
    this.target = new Object3D();
    this.shadow = new DirectionalLightShadow();
  }
}

export class PointLight extends Light {
  constructor(color, intensity, distance = 0, decay = 2) {
    super(color, intensity);
    this.type = 'PointLight';
    this.isPointLight = true;
    this.distance = distance;
    this.decay = decay;
  }
}

class LightShadow {
  constructor(camera) {
    this.camera = camera;
    this.bias = 0;
    this.normalBias = 0;
    this.radius = 1;
    this.mapSize = new Vector2(512, 512);
    this.map = null;
    this.autoUpdate = true;
    this.needsUpdate = false;
  }
}

export class DirectionalLightShadow extends LightShadow {
  constructor() {
    super(new OrthographicCamera(-5, 5, 5, -5, 0.5, 500));
    this.isDirectionalLightShadow = true;
  }
}
