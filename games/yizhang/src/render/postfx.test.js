// 后期链的档位契约单测。
//
// 这里不需要 GL 上下文：createPost 只跟 renderer 要一次后备缓冲尺寸，
// 剩下的 render target / ShaderMaterial 构造在 three 里都是纯 JS。
// 于是「低档到底有没有把辉光整条支链摘掉」可以在 node 里直接断言，
// 而不必依赖截图评审（SOTA R-03 / 风险图 K-5）。

import { describe, expect, it } from 'vitest';
import { Scene, Vector2 } from 'three';
import { QUALITY, QUALITY_TIERS } from './config.js';
import { createPost } from './postfx.js';

/** 只实现 createPost 真正会调到的那一个方法。 */
function fakeRenderer(w = 640, h = 360) {
  return {
    getDrawingBufferSize(target) {
      return (target ?? new Vector2()).set(w, h);
    },
  };
}

function post(tier) {
  return createPost({ renderer: fakeRenderer(), scene: new Scene(), quality: QUALITY[tier] });
}

describe('画质档的 bloom 合同', () => {
  it('低档关辉光，高/中档保留克制的选择性辉光', () => {
    expect(QUALITY.low.bloom).toBe(false);
    expect(QUALITY.low.bloomStrength).toBe(0);
    expect(QUALITY.low.bloomIterations).toBe(0);

    for (const tier of ['high', 'mid']) {
      expect(QUALITY[tier].bloom, tier).toBe(true);
      // 克制：强度不过 1，且靠阈值只放真正过曝的自发光体进来
      expect(QUALITY[tier].bloomStrength, tier).toBeGreaterThan(0);
      expect(QUALITY[tier].bloomStrength, tier).toBeLessThanOrEqual(1);
      expect(QUALITY[tier].bloomIterations, tier).toBeGreaterThan(0);
    }
  });

  it('三档都在表里，resolveTier 之外没有第四种档位', () => {
    expect(QUALITY_TIERS).toEqual(['high', 'mid', 'low']);
    for (const tier of QUALITY_TIERS) {
      expect(typeof QUALITY[tier].bloom, tier).toBe('boolean');
    }
  });
});

describe('createPost 按档位裁剪后期链', () => {
  it('低档 bloomEnabled=false，且合成着色器里不编译 bloom 采样', () => {
    const p = post('low');
    expect(p.bloomEnabled).toBe(false);
    // uniform 都不该出现，否则说明支链只是被调成了 0 而不是真的摘掉
    expect(p.debug.composite.defines.USE_BLOOM).toBeUndefined();
    expect(p.debug.composite.fragmentShader).toContain('USE_BLOOM');
    expect(p.debug.composite.uniforms.uBloom).toBeUndefined();
    expect(p.debug.composite.uniforms.uBloomStrength).toBeUndefined();
    // 只剩主渲染的那一张 render target
    expect(p.debug.targets).toBe(1);
    p.dispose();
  });

  it('高/中档 bloomEnabled=true，辉光链完整', () => {
    for (const tier of ['high', 'mid']) {
      const p = post(tier);
      expect(p.bloomEnabled, tier).toBe(true);
      expect(p.debug.composite.defines.USE_BLOOM, tier).toBeDefined();
      expect(p.debug.composite.uniforms.uBloomStrength.value, tier).toBe(
        QUALITY[tier].bloomStrength
      );
      // 主渲染 + 自发光通道 + 两张乒乓模糊
      expect(p.debug.targets, tier).toBe(4);
      p.dispose();
    }
  });

  it('低档的 setSize / setBloomStrength / dispose 都不抛（没有辉光 target 可碰）', () => {
    const p = post('low');
    expect(() => p.setSize(1280, 720)).not.toThrow();
    expect(() => p.setBloomStrength(0.9)).not.toThrow();
    // 关了就是关了：外部再调也不会偷偷把辉光打开
    expect(p.bloomEnabled).toBe(false);
    expect(() => p.dispose()).not.toThrow();
  });

  it('高档 setSize 会把辉光 target 一起按 bloomScale 缩放', () => {
    const p = post('high');
    p.setSize(1280, 720);
    expect(p.sceneTarget.width).toBe(1280);
    expect(p.sceneTarget.height).toBe(720);
    expect(p.debug.bloomSize).toEqual([
      Math.floor(1280 * QUALITY.high.bloomScale),
      Math.floor(720 * QUALITY.high.bloomScale),
    ]);
    p.dispose();
  });
});
