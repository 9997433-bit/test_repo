// 光照方案（手册 §5）：一盏有来源的主光 + 冷天空补光 + 冷边缘光 + 裂缝暖光。
//
// 规则：
//  - 只有主光投影，阴影形状是被设计过的，不是「到处都有影子」
//  - 暗部由半球光的下半（岩面反弹的暖褐）染色，不允许死黑
//  - 边缘光用来分离主体，替代廉价发光描边（手册 §5.4 / §2-4）
//  - 裂缝的暖黄 emissive 有一盏真实点光作依据，不是凭空发光

import { DirectionalLight, HemisphereLight, PointLight, Vector3 } from 'three';
import { PALETTE } from './config.js';

export function createLighting({ scene, quality, sunDir }) {
  const key = new DirectionalLight(PALETTE.keyLight, 3.6);
  key.position.copy(sunDir).multiplyScalar(60);
  key.target.position.set(0, 0, 0);
  scene.add(key);
  scene.add(key.target);

  if (quality.shadows) {
    key.castShadow = true;
    key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    key.shadow.camera.near = 5;
    key.shadow.camera.far = 140;
    const half = 30;
    key.shadow.camera.left = -half;
    key.shadow.camera.right = half;
    key.shadow.camera.top = half;
    key.shadow.camera.bottom = -half;
    key.shadow.bias = -0.0016;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = quality.softShadows ? 3.2 : 1;
    key.shadow.camera.updateProjectionMatrix();
  }

  // 冷天空 / 暖反弹。强度只有主光的 1/4 上下，保留阴影层次。
  const ambient = new HemisphereLight(PALETTE.fillSky, PALETTE.fillBounce, 0.95);
  ambient.position.set(0, 30, 0);
  scene.add(ambient);

  // 背后的冷边缘光，不投影
  const rim = new DirectionalLight(PALETTE.rimLight, quality.rimLight ? 1.25 : 0.5);
  rim.position.set(sunDir.x * -40, 16, sunDir.z * -46);
  rim.target.position.set(0, 1.2, 0);
  scene.add(rim);
  scene.add(rim.target);

  // 中缝里透出的暖光。只够照亮缝口附近的石棱，不能把整座岛烤成橙色。
  let crack = null;
  if (quality.crackFillLight) {
    crack = new PointLight(PALETTE.crackLight, 7, 13, 2);
    crack.position.set(0, -0.55, 0);
    scene.add(crack);
  }

  const tmp = new Vector3();

  return {
    key,
    ambient,
    rim,
    crack,
    /** 阴影相机跟着焦点走，2048 的贴图才能全部花在打斗区域上。 */
    update(time, focus) {
      tmp.copy(focus);
      key.target.position.set(tmp.x, 0, tmp.z);
      key.position.set(tmp.x + sunDir.x * 60, sunDir.y * 60, tmp.z + sunDir.z * 60);
      key.target.updateMatrixWorld();
      rim.target.position.set(tmp.x, 1.2, tmp.z);
      rim.position.set(tmp.x - sunDir.x * 40, 16, tmp.z - sunDir.z * 46);
      rim.target.updateMatrixWorld();
      if (crack) {
        const flicker = 0.86 + Math.sin(time * 1.7) * 0.06 + Math.sin(time * 4.3 + 1.1) * 0.04;
        crack.intensity = 7 * flicker;
      }
    },
    setShadowsEnabled(on) {
      key.castShadow = on && quality.shadows;
    },
    dispose() {
      scene.remove(key);
      scene.remove(key.target);
      scene.remove(ambient);
      scene.remove(rim);
      scene.remove(rim.target);
      if (crack) scene.remove(crack);
      key.dispose?.();
      ambient.dispose?.();
      rim.dispose?.();
      crack?.dispose?.();
    },
  };
}
