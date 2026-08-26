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

  // 冷边缘光，不投影。
  //
  // 方位很关键：放在主光的正对面就等于放在跟随镜头的身后，那不是边缘光，是一盏正面补光，
  // 会把角色的后背连同识别色布片一起打平打白。所以把它转到主光的侧后方 90°，
  // 让它只擦过轮廓的一侧 —— 这才是用来把主体从暮色背景里分离出来的那道冷边。
  const rim = new DirectionalLight(PALETTE.rimLight, quality.rimLight ? 1.05 : 0.45);
  rim.position.set(sunDir.z * 46, 24, -sunDir.x * 46);
  rim.target.position.set(0, 1.2, 0);
  scene.add(rim);
  scene.add(rim.target);

  // 裂缝的暖光分两盏，因为它要解释两件不同的事。
  //  deep —— 沉在井底，把十几米高的井壁从下往上烤出一层暖色。用真实的平方衰减，
  //          越往井口越暗，所以塌一块板露出来的是「有深度的洞」而不是「亮橙色的底」。
  //  seam —— 贴在板缝正下方，只够舔亮缝口的石棱，让暖黄真的只出现在缝里。
  let crack = null;
  let seam = null;
  if (quality.crackFillLight) {
    crack = new PointLight(PALETTE.crackLight, 26, 20, 2);
    crack.position.set(0, -13.2, 0);
    scene.add(crack);

    // 井太深，底下那盏光衰减完就到不了缝口了。缝里的暖黄要能读出来，
    // 得有一盏贴在板缝正下方的光去舔缝壁与板沿 —— 只有朝内的面吃得到，
    // 台面朝上的面几乎不受影响，暖色因此仍然只出现在缝里。
    seam = new PointLight(PALETTE.crackLight, 11, 15, 2);
    seam.position.set(0, -1.7, 0);
    scene.add(seam);
  }

  const tmp = new Vector3();

  return {
    key,
    ambient,
    rim,
    crack,
    seam,
    /** 阴影相机跟着焦点走，2048 的贴图才能全部花在打斗区域上。 */
    update(time, focus) {
      tmp.copy(focus);
      key.target.position.set(tmp.x, 0, tmp.z);
      key.position.set(tmp.x + sunDir.x * 60, sunDir.y * 60, tmp.z + sunDir.z * 60);
      key.target.updateMatrixWorld();
      rim.target.position.set(tmp.x, 1.2, tmp.z);
      rim.position.set(tmp.x + sunDir.z * 46, 24, tmp.z - sunDir.x * 46);
      rim.target.updateMatrixWorld();
      if (crack) {
        const flicker = 0.86 + Math.sin(time * 1.7) * 0.06 + Math.sin(time * 4.3 + 1.1) * 0.04;
        crack.intensity = 26 * flicker;
        seam.intensity = 11 * flicker;
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
      if (seam) scene.remove(seam);
      key.dispose?.();
      ambient.dispose?.();
      rim.dispose?.();
      crack?.dispose?.();
      seam?.dispose?.();
    },
  };
}
