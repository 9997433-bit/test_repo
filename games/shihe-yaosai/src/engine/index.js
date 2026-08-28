// Opus-1 引擎：WebGPU 优先，WebGL2 回退。
// 约定见 round1/BRIEF.md：createRenderer(canvas) -> { engine, scene, backend, setQuality, dispose }
// 本模块只负责画布、后端、灯光、氛围与后处理档位；网格由 world / combat 代理构建。

import { Engine } from "@babylonjs/core/Engines/engine.js";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine.js";
import { Constants } from "@babylonjs/core/Engines/constants.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import { SphericalPolynomial } from "@babylonjs/core/Maths/sphericalPolynomial.js";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight.js";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator.js";
import { DefaultRenderingPipeline } from "@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline.js";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer.js";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.js";
import { RawCubeTexture } from "@babylonjs/core/Materials/Textures/rawCubeTexture.js";
import { ImageProcessingConfiguration } from "@babylonjs/core/Materials/imageProcessingConfiguration.js";

// 场景组件副作用：没有它阴影不会被渲染、球谐属性不存在。
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent.js";
import "@babylonjs/core/Materials/Textures/baseTexture.polynomial.js";

/** 允许的质量档，顺序即降级顺序。 */
export const QUALITY_TIERS = ["high", "mid", "low"];

/** 深蚀星域配色：全部程序化，不下载任何 HDR / 贴图。 */
export const PALETTE = {
  clear: [0.016, 0.023, 0.055],
  fog: [0.021, 0.036, 0.082],
  ambient: [0.048, 0.068, 0.118],
  zenith: [0.10, 0.20, 0.44],
  horizon: [0.05, 0.115, 0.26],
  nadir: [0.008, 0.014, 0.038],
  accent: [0.40, 0.09, 0.30],
  key: [0.78, 0.90, 1.0],
  rim: [1.0, 0.36, 0.72],
};

const PRESETS = {
  high: {
    scaleFor: (dpr) => 1 / Math.min(Math.max(dpr, 1), 2),
    postprocess: true,
    bloomWeight: 0.62,
    bloomThreshold: 0.58,
    bloomKernel: 64,
    bloomScale: 0.6,
    fxaa: true,
    samples: 4,
    glow: true,
    glowIntensity: 0.9,
    glowBlurKernel: 32,
    glowTextureSize: 512,
    shadows: true,
    shadowMapSize: 1024,
    shadowBlurKernel: 24,
  },
  mid: {
    scaleFor: () => 1,
    postprocess: true,
    bloomWeight: 0.48,
    bloomThreshold: 0.68,
    bloomKernel: 32,
    bloomScale: 0.5,
    fxaa: true,
    samples: 1,
    glow: true,
    glowIntensity: 0.72,
    glowBlurKernel: 16,
    glowTextureSize: 256,
    shadows: false,
    shadowMapSize: 0,
    shadowBlurKernel: 0,
  },
  low: {
    scaleFor: () => 1.25,
    postprocess: false,
    fxaa: false,
    samples: 1,
    glow: false,
    shadows: false,
    shadowMapSize: 0,
    shadowBlurKernel: 0,
  },
};

const WEBGPU_INIT_TIMEOUT_MS = 9000;

function normalizeTier(tier) {
  return QUALITY_TIERS.includes(tier) ? tier : "mid";
}

function toColor3(rgb) {
  return new Color3(rgb[0], rgb[1], rgb[2]);
}

function readOverride(key) {
  try {
    if (typeof window === "undefined" || !window.location) return null;
    return new URLSearchParams(window.location.search).get(key);
  } catch {
    return null;
  }
}

function devicePixelRatioSafe() {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
  return Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
}

/** 让任何 promise 都不可能把启动流程卡死。 */
function withTimeout(promise, ms, label) {
  let timer = null;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => {
    if (timer !== null) clearTimeout(timer);
  });
}

/**
 * 依次尝试 WebGPU → WebGL2。任何异常都被吞掉并降级，绝不让画布空着。
 * @returns {Promise<{ engine: any, backend: 'webgpu'|'webgl2', notes: string[] }>}
 */
async function createBackend(canvas, preferred) {
  const notes = [];
  const contextOptions = {
    antialias: true,
    stencil: true,
    depth: true,
    alpha: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: true,
    doNotHandleContextLost: false,
    audioEngine: false,
  };

  if (preferred !== "webgl2") {
    try {
      if (typeof navigator === "undefined" || !navigator.gpu) {
        throw new Error("navigator.gpu unavailable");
      }
      const supported = await withTimeout(
        Promise.resolve(WebGPUEngine.IsSupportedAsync),
        WEBGPU_INIT_TIMEOUT_MS,
        "WebGPU adapter probe"
      );
      if (!supported) throw new Error("no WebGPU adapter");

      // 不用 WebGPUEngine.CreateAsync：它内部没有 reject 分支，初始化失败会永久挂起。
      const engine = new WebGPUEngine(canvas, {
        ...contextOptions,
        enableAllFeatures: false,
        setMaximumLimits: false,
      });
      try {
        await withTimeout(engine.initAsync(), WEBGPU_INIT_TIMEOUT_MS, "WebGPU device init");
      } catch (err) {
        try {
          engine.dispose();
        } catch {
          /* 半初始化的引擎清理失败无所谓 */
        }
        throw err;
      }
      return { engine, backend: "webgpu", notes };
    } catch (err) {
      notes.push(`webgpu unavailable: ${err && err.message ? err.message : err}`);
      console.warn("[shihe-yaosai/engine] WebGPU 不可用，回退 WebGL2 —", err);
    }
  } else {
    notes.push("webgpu skipped by ?gfx=webgl2");
  }

  const engine = new Engine(canvas, true, contextOptions, false);
  if (engine.webGLVersion && engine.webGLVersion < 2) {
    notes.push(`webgl1 fallback (webGLVersion=${engine.webGLVersion})`);
  }
  return { engine, backend: "webgl2", notes };
}

/**
 * 程序化天空立方体：只有 6 张 64px 的内存贴图，作为 PBR 金属的环境反射。
 * 球谐系数手工写入，避免 WebGPU 下的异步 readPixels 回读。
 */
function createProceduralEnvironment(scene) {
  const size = 64;
  const faces = [];
  const zenith = PALETTE.zenith;
  const horizon = PALETTE.horizon;
  const nadir = PALETTE.nadir;
  const accent = PALETTE.accent;

  for (let face = 0; face < 6; face++) {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = ((x + 0.5) / size) * 2 - 1;
        const v = ((y + 0.5) / size) * 2 - 1;
        let dx;
        let dy;
        let dz;
        switch (face) {
          case 0: dx = 1; dy = -v; dz = -u; break;
          case 1: dx = -1; dy = -v; dz = u; break;
          case 2: dx = u; dy = 1; dz = v; break;
          case 3: dx = u; dy = -1; dz = -v; break;
          case 4: dx = u; dy = -v; dz = 1; break;
          default: dx = -u; dy = -v; dz = -1; break;
        }
        const len = Math.hypot(dx, dy, dz) || 1;
        const ny = dy / len;
        const azimuth = Math.atan2(dz / len, dx / len);

        const vertical = Math.min(1, Math.abs(ny));
        const smooth = vertical * vertical * (3 - 2 * vertical);
        const target = ny >= 0 ? zenith : nadir;

        const lobe = Math.max(0, Math.cos(azimuth - 0.6));
        const band = lobe ** 6 * (1 - vertical) * 0.85;

        const o = (y * size + x) * 4;
        for (let c = 0; c < 3; c++) {
          const linear = horizon[c] + (target[c] - horizon[c]) * smooth + accent[c] * band;
          data[o + c] = Math.round(Math.min(1, Math.max(0, linear)) ** (1 / 2.2) * 255);
        }
        data[o + 3] = 255;
      }
    }
    faces.push(data);
  }

  const texture = new RawCubeTexture(
    scene,
    faces,
    size,
    Constants.TEXTUREFORMAT_RGBA,
    Constants.TEXTURETYPE_UNSIGNED_BYTE,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE
  );
  texture.name = "sh-env";
  texture.gammaSpace = true;
  texture.coordinatesMode = Texture.CUBIC_MODE;

  const polynomial = new SphericalPolynomial();
  polynomial.addAmbient(toColor3(PALETTE.ambient));
  texture.sphericalPolynomial = polynomial;

  return texture;
}

/**
 * 启动渲染器。
 * @param {HTMLCanvasElement} canvas 画布，index.html 中 id="sh-canvas"
 * @param {{ quality?: 'high'|'mid'|'low', backend?: 'webgpu'|'webgl2' }} [options]
 * @returns {Promise<{ engine: any, scene: any, backend: 'webgpu'|'webgl2', quality: string,
 *   camera: any, setQuality: (tier: string) => string, registerShadowCaster: (mesh: any) => void,
 *   resize: () => void, dispose: () => void }>}
 */
export async function createRenderer(canvas, options = {}) {
  const target = canvas || (typeof document !== "undefined" ? document.getElementById("sh-canvas") : null);
  if (!target) throw new Error("createRenderer: canvas #sh-canvas not found");

  const preferredBackend = options.backend || readOverride("gfx") || "webgpu";
  const { engine, backend, notes } = await createBackend(target, preferredBackend);

  const scene = new Scene(engine);
  scene.clearColor = new Color4(PALETTE.clear[0], PALETTE.clear[1], PALETTE.clear[2], 1);
  scene.ambientColor = toColor3(PALETTE.ambient);
  scene.fogEnabled = true;
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = toColor3(PALETTE.fog);
  scene.fogDensity = 0.0062;
  scene.imageProcessingConfiguration.toneMappingEnabled = true;
  scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
  scene.imageProcessingConfiguration.exposure = 1.05;
  scene.imageProcessingConfiguration.contrast = 1.12;

  let environmentTexture = null;
  try {
    environmentTexture = createProceduralEnvironment(scene);
    scene.environmentTexture = environmentTexture;
    scene.environmentIntensity = 0.6;
  } catch (err) {
    notes.push(`environment skipped: ${err && err.message ? err.message : err}`);
    console.warn("[shihe-yaosai/engine] 程序化环境贴图创建失败，退回纯灯光", err);
  }

  // 兜底相机：world 代理若自带相机，main.js 会把这台释放掉。
  const camera = new ArcRotateCamera("sh-fallback-camera", -Math.PI / 2, 1.02, 118, new Vector3(0, 4, 0), scene);
  camera.lowerRadiusLimit = 42;
  camera.upperRadiusLimit = 205;
  camera.lowerBetaLimit = 0.18;
  camera.upperBetaLimit = 1.46;
  camera.wheelDeltaPercentage = 0.02;
  camera.pinchDeltaPercentage = 0.02;
  camera.panningSensibility = 0;
  camera.minZ = 0.8;
  camera.maxZ = 900;
  camera.attachControl(target, true);
  scene.activeCamera = camera;

  const ambientLight = new HemisphericLight("sh-ambient", new Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.34;
  ambientLight.diffuse = new Color3(0.42, 0.58, 0.85);
  ambientLight.groundColor = new Color3(0.06, 0.05, 0.13);
  ambientLight.specular = new Color3(0.12, 0.18, 0.3);

  const keyLight = new DirectionalLight("sh-key", new Vector3(-0.45, -1, -0.36), scene);
  keyLight.position = new Vector3(72, 148, 58);
  keyLight.intensity = 1.55;
  keyLight.diffuse = toColor3(PALETTE.key);
  keyLight.specular = new Color3(0.9, 0.96, 1);
  keyLight.shadowMinZ = 8;
  keyLight.shadowMaxZ = 420;
  keyLight.autoUpdateExtends = true;

  const rimLight = new DirectionalLight("sh-rim", new Vector3(0.62, -0.22, 0.75), scene);
  rimLight.position = new Vector3(-96, 42, -110);
  rimLight.intensity = 0.5;
  rimLight.diffuse = toColor3(PALETTE.rim);
  rimLight.specular = new Color3(0.55, 0.2, 0.4);
  rimLight.shadowEnabled = false;

  let pipeline = null;
  let glow = null;
  let shadowGenerator = null;
  let quality = normalizeTier(options.quality || readOverride("q") || "high");
  let disposed = false;
  let ready = false;
  let inFrame = false;
  let pendingTier = null;
  let flushHandle = null;

  const shadowCasters = new Set();

  function flushQuality() {
    flushHandle = null;
    const tier = pendingTier;
    pendingTier = null;
    if (tier && !disposed) applyQuality(tier);
  }

  function teardownPost() {
    if (pipeline) {
      try {
        pipeline.dispose();
      } catch {
        /* ignore */
      }
      pipeline = null;
    }
    if (glow) {
      try {
        glow.dispose();
      } catch {
        /* ignore */
      }
      glow = null;
    }
  }

  function teardownShadows() {
    if (shadowGenerator) {
      try {
        shadowGenerator.dispose();
      } catch {
        /* ignore */
      }
      shadowGenerator = null;
    }
  }

  function pushShadowCasters() {
    if (!shadowGenerator) return;
    for (const mesh of Array.from(shadowCasters)) {
      if (!mesh || mesh.isDisposed?.()) {
        shadowCasters.delete(mesh);
        continue;
      }
      try {
        shadowGenerator.addShadowCaster(mesh, true);
      } catch {
        /* ignore */
      }
    }
  }

  function activeCameras() {
    if (scene.activeCameras && scene.activeCameras.length) return scene.activeCameras.slice();
    if (scene.activeCamera) return [scene.activeCamera];
    return scene.cameras.slice();
  }

  function applyQuality(tier) {
    const preset = PRESETS[tier];
    teardownPost();

    try {
      engine.setHardwareScalingLevel(preset.scaleFor(devicePixelRatioSafe()));
    } catch {
      /* ignore */
    }

    if (preset.postprocess) {
      try {
        pipeline = new DefaultRenderingPipeline("sh-post", true, scene, activeCameras(), false);
        pipeline.samples = preset.samples;
        pipeline.fxaaEnabled = preset.fxaa;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = preset.bloomThreshold;
        pipeline.bloomWeight = preset.bloomWeight;
        pipeline.bloomKernel = preset.bloomKernel;
        pipeline.bloomScale = preset.bloomScale;
        pipeline.chromaticAberrationEnabled = false;
        pipeline.depthOfFieldEnabled = false;
        pipeline.grainEnabled = false;
        pipeline.sharpenEnabled = false;
        pipeline.imageProcessingEnabled = true;
        if (pipeline.imageProcessing) {
          pipeline.imageProcessing.toneMappingEnabled = true;
          pipeline.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
          pipeline.imageProcessing.exposure = 1.05;
          pipeline.imageProcessing.contrast = 1.12;
          pipeline.imageProcessing.vignetteEnabled = true;
          pipeline.imageProcessing.vignetteWeight = 2.1;
          pipeline.imageProcessing.vignetteColor = new Color4(0.02, 0.03, 0.09, 0);
        }
        pipeline.prepare();
      } catch (err) {
        console.warn("[shihe-yaosai/engine] 后处理管线创建失败，本档降级为无后处理", err);
        teardownPost();
      }
    } else {
      // 没有后处理时色调映射必须回到材质里做，否则画面直接过曝。
      scene.imageProcessingConfiguration.applyByPostProcess = false;
    }

    if (preset.glow) {
      try {
        glow = new GlowLayer("sh-glow", scene, {
          mainTextureFixedSize: preset.glowTextureSize,
          blurKernelSize: preset.glowBlurKernel,
          mainTextureSamples: 1,
        });
        glow.intensity = preset.glowIntensity;
      } catch (err) {
        console.warn("[shihe-yaosai/engine] 辉光层创建失败", err);
        glow = null;
      }
    }

    if (preset.shadows) {
      if (!shadowGenerator || shadowGenerator.mapSize !== preset.shadowMapSize) {
        teardownShadows();
        try {
          shadowGenerator = new ShadowGenerator(preset.shadowMapSize, keyLight);
          shadowGenerator.useBlurExponentialShadowMap = true;
          shadowGenerator.blurKernel = preset.shadowBlurKernel;
          shadowGenerator.depthScale = 60;
          shadowGenerator.bias = 0.0016;
          shadowGenerator.normalBias = 0.02;
          shadowGenerator.darkness = 0.34;
          shadowGenerator.transparencyShadow = true;
        } catch (err) {
          console.warn("[shihe-yaosai/engine] 阴影生成器创建失败", err);
          shadowGenerator = null;
        }
      }
      pushShadowCasters();
    } else {
      teardownShadows();
    }

    quality = tier;
    if (scene.metadata && scene.metadata.shihe) {
      scene.metadata.shihe.quality = tier;
      scene.metadata.shihe.pipeline = pipeline;
      scene.metadata.shihe.glow = glow;
      scene.metadata.shihe.shadowGenerator = shadowGenerator;
    }
    return tier;
  }

  /**
   * 帧内换档会在命令缓冲提交之前销毁后处理纹理，WebGPU 直接报
   * "Destroyed texture used in a submit"。所以循环里发起的换档推迟到本帧提交之后。
   */
  function setQuality(tier) {
    if (disposed) return quality;
    const next = normalizeTier(tier);
    if (!inFrame) {
      pendingTier = null;
      if (flushHandle !== null) {
        clearTimeout(flushHandle);
        flushHandle = null;
      }
      return applyQuality(next);
    }

    quality = next;
    if (scene.metadata?.shihe) scene.metadata.shihe.quality = next;
    pendingTier = next;
    if (flushHandle === null) flushHandle = setTimeout(flushQuality, 0);
    return next;
  }

  /** world / combat 代理登记投影体；换档重建阴影贴图后会自动补回来。 */
  function registerShadowCaster(meshes) {
    if (!meshes) return;
    for (const mesh of Array.isArray(meshes) ? meshes : [meshes]) {
      if (!mesh) continue;
      shadowCasters.add(mesh);
      if (shadowGenerator) {
        try {
          shadowGenerator.addShadowCaster(mesh, true);
        } catch {
          /* ignore */
        }
      }
    }
  }

  scene.metadata = scene.metadata || {};
  scene.metadata.shihe = {
    backend,
    quality,
    notes,
    keyLight,
    rimLight,
    ambientLight,
    fallbackCamera: camera,
    pipeline: null,
    glow: null,
    shadowGenerator: null,
    environmentTexture,
    registerShadowCaster,
    setQuality,
  };

  applyQuality(quality);
  ready = true;

  const beginObserver = engine.onBeginFrameObservable.add(() => {
    inFrame = true;
  });
  const endObserver = engine.onEndFrameObservable.add(() => {
    inFrame = false;
  });

  // world 代理换相机后必须重建管线，否则后处理挂在已废弃的相机上。
  const cameraObserver = scene.onActiveCameraChanged?.add(() => {
    if (!ready || disposed) return;
    setQuality(quality);
  });

  let resizeQueued = false;
  const resize = () => {
    if (disposed) return;
    try {
      engine.resize();
    } catch {
      /* ignore */
    }
  };
  const queueResize = () => {
    if (disposed || resizeQueued) return;
    resizeQueued = true;
    const run = () => {
      resizeQueued = false;
      resize();
    };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(run);
    else setTimeout(run, 16);
  };

  if (typeof window !== "undefined") window.addEventListener("resize", queueResize);
  let observer = null;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(queueResize);
    try {
      observer.observe(target);
    } catch {
      observer = null;
    }
  }
  resize();

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (flushHandle !== null) clearTimeout(flushHandle);
    flushHandle = null;
    pendingTier = null;
    if (typeof window !== "undefined") window.removeEventListener("resize", queueResize);
    if (observer) observer.disconnect();
    if (cameraObserver) scene.onActiveCameraChanged?.remove(cameraObserver);
    engine.onBeginFrameObservable.remove(beginObserver);
    engine.onEndFrameObservable.remove(endObserver);
    teardownPost();
    teardownShadows();
    shadowCasters.clear();
    try {
      scene.dispose();
    } catch {
      /* ignore */
    }
    try {
      engine.dispose();
    } catch {
      /* ignore */
    }
  }

  return {
    engine,
    scene,
    backend,
    get quality() {
      return quality;
    },
    camera,
    notes,
    setQuality,
    registerShadowCaster,
    resize,
    dispose,
  };
}

export default createRenderer;
