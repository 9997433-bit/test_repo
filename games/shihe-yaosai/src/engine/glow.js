// Opus-1 引擎 · 辉光层的唯一出处。
//
// 契约 §5 把 GlowLayer 划给 engine：档位一变（high/mid 有辉光、low 全关）就得重建，
// 而重建这件事只有引擎知道时机。Round 2 结论 §2 记的「high/mid 过亮」正是
// 世界层又自建了一层，两层辉光叠加的结果。
//
// 所以这里做三件事：
//   1. 按档位建 / 拆引擎自己那层；
//   2. 每次换档顺手清掉场景里别处建出来的辉光层（low 档同样清）；
//   3. 记住天穹这类要排除的网格，重建后自动补回去。

import { GlowLayer } from "@babylonjs/core/Layers/glowLayer.js";

/** 引擎自己那层的名字。场景里其它 GlowLayer 一律视为重复。 */
export const GLOW_LAYER_NAME = "sh-glow";

/**
 * 各档辉光参数。low 档按契约「全关」。
 * 引擎的 PRESETS 只引用这里，避免同一组数字写两遍。
 */
export const GLOW_TIERS = {
  high: { enabled: true, intensity: 0.9, blurKernelSize: 32, textureSize: 512 },
  mid: { enabled: true, intensity: 0.72, blurKernelSize: 16, textureSize: 256 },
  low: { enabled: false },
};

/** 未知档位按 mid 处理，和 engine 的 normalizeTier 保持同一口径。 */
export function glowSpecFor(tier) {
  return GLOW_TIERS[tier] ?? GLOW_TIERS.mid;
}

function isGlowLayer(layer) {
  if (!layer) return false;
  if (layer instanceof GlowLayer) return true;
  // 同一份 @babylonjs/core 被打进两个 chunk 时 instanceof 会失手，再按效果名认一次。
  try {
    return layer.getEffectName?.() === GlowLayer.EffectName;
  } catch {
    return false;
  }
}

function isLive(mesh) {
  return !!mesh && !(mesh.isDisposed?.() ?? false);
}

/**
 * 建一个绑在 scene 上的辉光控制器。整个引擎只建一个。
 * @param {import("@babylonjs/core/scene.js").Scene} scene
 */
export function createGlowController(scene) {
  const excluded = new Set();
  let layer = null;
  let warned = false;

  function pushExclusions() {
    if (!layer) return;
    for (const mesh of Array.from(excluded)) {
      if (!isLive(mesh)) {
        excluded.delete(mesh);
        continue;
      }
      try {
        layer.addExcludedMesh(mesh);
      } catch {
        /* ignore */
      }
    }
  }

  /**
   * 拆掉不是引擎建的辉光层。
   * 世界层等兄弟模块若自带一层，这里把它摘掉——引擎这层才是画质档的落点。
   * @returns {number} 摘掉的层数
   */
  function reconcile() {
    const layers = scene?.effectLayers;
    if (!Array.isArray(layers) || layers.length === 0) return 0;

    let removed = 0;
    for (const other of layers.slice()) {
      if (other === layer || !isGlowLayer(other)) continue;
      try {
        other.dispose();
        removed += 1;
      } catch {
        /* 别人的层拆不掉也不能带崩换档 */
      }
    }

    if (removed > 0 && !warned) {
      warned = true;
      console.warn(
        `[shihe-yaosai/engine] 场景里出现 ${removed} 个引擎之外的 GlowLayer，已摘除：辉光只跟画质档走。`
      );
    }
    return removed;
  }

  function teardown() {
    if (!layer) return;
    try {
      layer.dispose();
    } catch {
      /* ignore */
    }
    layer = null;
  }

  /**
   * 按档位重建辉光层。幂等：同一档反复调用只是重建一次。
   * @param {{ enabled: boolean, intensity?: number, blurKernelSize?: number, textureSize?: number }} spec
   * @returns {any|null} 生效的辉光层；本档关闭或创建失败时为 null
   */
  function apply(spec) {
    teardown();

    if (spec && spec.enabled) {
      try {
        // NullEngine / 没有后处理能力的后端会在这里抛，辉光可以缺席但引擎不能塌。
        layer = new GlowLayer(GLOW_LAYER_NAME, scene, {
          mainTextureFixedSize: spec.textureSize ?? 256,
          blurKernelSize: spec.blurKernelSize ?? 16,
          mainTextureSamples: 1,
        });
        layer.intensity = Number.isFinite(spec.intensity) ? spec.intensity : 1;
      } catch (err) {
        console.warn("[shihe-yaosai/engine] 辉光层创建失败", err);
        layer = null;
      }
    }

    // low 档也要清一遍：本档说好「全关」，别人建的那层同样不能留下来发光。
    reconcile();
    pushExclusions();
    return layer;
  }

  /**
   * 登记不参与辉光的网格（天穹、星点这类背景）。
   * 换档重建后会自动补回去，调用方只需登记一次。
   * @param {any|any[]} meshes
   */
  function exclude(meshes) {
    if (!meshes) return;
    for (const mesh of Array.isArray(meshes) ? meshes : [meshes]) {
      if (!isLive(mesh)) continue;
      excluded.add(mesh);
      if (layer) {
        try {
          layer.addExcludedMesh(mesh);
        } catch {
          /* ignore */
        }
      }
    }
  }

  function dispose() {
    teardown();
    excluded.clear();
  }

  return {
    get layer() {
      return layer;
    },
    get excludedCount() {
      return excluded.size;
    },
    apply,
    exclude,
    reconcile,
    dispose,
  };
}
