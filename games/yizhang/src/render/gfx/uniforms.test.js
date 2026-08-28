// 自写着色器的 uniform 必须真的送到后端材质上。
//
// 这里盯的是一类特别难查的回归：适配层靠 `isVector3` / `isColor` 这种类型标记来决定
// 怎么把值塞进引擎。标记一旦漏掉，分派会静悄悄地什么都不做，着色器那边读到的是 0，
// 症状是「云海变成一条黑带」「落日不见了」——离原因十万八千里。
// 所以这里不测标记本身，测的是「值到底有没有落到后端材质上」。

import { describe, expect, it, vi } from 'vitest';
import {
  Color,
  Matrix4,
  Quaternion,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from './index.js';
import { resolveMaterial } from './backend/materials.js';

const VERT = /* glsl */ `
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** 各类 uniform 各来一个，源码里都真的声明出来，翻译层才会登记。 */
const FRAG = /* glsl */ `
  uniform vec3 uTint;
  uniform vec3 uSunDir;
  uniform vec2 uResolution;
  uniform float uAmount;
  uniform mat4 uWarp;
  void main() {
    gl_FragColor = vec4(uTint * uAmount + uSunDir + vec3(uResolution, 0.0) + uWarp[0].xyz, 1.0);
  }
`;

function material() {
  return new ShaderMaterial({
    name: 'uniform-probe',
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTint: { value: new Color(0.25, 0.5, 0.75) },
      uSunDir: { value: new Vector3(-0.58, 0.42, 0.38) },
      uResolution: { value: new Vector2(1280, 720) },
      uAmount: { value: 0.375 },
      uWarp: { value: new Matrix4() },
    },
  });
}

describe('着色器 uniform 分派', () => {
  it('vec3 / vec2 / mat4 / float / color 全都落到后端材质上', () => {
    const renderer = new WebGLRenderer();
    const bm = resolveMaterial(material(), renderer.bscene);

    expect(bm._colors3.uTint, 'uTint').toBeDefined();
    expect(bm._colors3.uTint.asArray()).toEqual([0.25, 0.5, 0.75]);

    // 落日方向是最容易漏的一个：漏了就 normalize(vec3(0)) → NaN → 整片渲成黑
    expect(bm._vectors3.uSunDir, 'uSunDir').toBeDefined();
    const sun = bm._vectors3.uSunDir.asArray();
    expect(sun[0]).toBeCloseTo(-0.58);
    expect(sun[1]).toBeCloseTo(0.42);
    expect(sun[2]).toBeCloseTo(0.38);

    expect(bm._vectors2.uResolution, 'uResolution').toBeDefined();
    expect(bm._vectors2.uResolution.asArray()).toEqual([1280, 720]);
    expect(bm._floats.uAmount).toBeCloseTo(0.375);
    expect(bm._matrices.uWarp, 'uWarp').toBeDefined();
    expect(bm._matrices.uWarp.isIdentity()).toBe(true);

    renderer.dispose();
  });

  it('这些名字都进了 Babylon 的 uniform 登记表，不然引擎根本不会去绑', () => {
    const renderer = new WebGLRenderer();
    const bm = resolveMaterial(material(), renderer.bscene);
    for (const name of ['uTint', 'uSunDir', 'uResolution', 'uAmount', 'uWarp']) {
      expect(bm._options.uniforms, name).toContain(name);
    }
    renderer.dispose();
  });

  it('分派不出去的取值会喊出来，而不是悄悄读成 0', () => {
    const renderer = new WebGLRenderer();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const src = material();
    src.uniforms.uTint.value = { nonsense: true };

    resolveMaterial(src, renderer.bscene);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('uTint');

    warn.mockRestore();
    renderer.dispose();
  });
});

describe('数学类型都带着自己的类型标记', () => {
  it('Vector2 / Vector3 / Quaternion / Matrix4 / Color 一个都不缺', () => {
    expect(new Vector2().isVector2).toBe(true);
    expect(new Vector3().isVector3).toBe(true);
    expect(new Quaternion().isQuaternion).toBe(true);
    expect(new Matrix4().isMatrix4).toBe(true);
    expect(new Color(1, 1, 1).isColor).toBe(true);
  });
});
