// 蚀核要塞 · 启动入口（Opus-1）
// 职责：拉起渲染器 → 防御式装配 sim / world / input / ui / combat → 驱动主循环。
// 任何兄弟模块尚未落地或抛错时，画面必须仍然是一个活的 Babylon 场景。

import { createRenderer } from "./engine/index.js";

const TAG = "[shihe-yaosai]";
const MAX_DT = 1 / 20;
const BACKEND_LABEL = { webgpu: "WebGPU", webgl2: "WebGL2" };

const canvas = document.getElementById("sh-canvas");
const backendEl = document.getElementById("sh-backend");

/**
 * #sh-backend 是 HUD 冻结 class 之一；这里只写文本，不碰结构。
 * ui/hud.js 约定：占位文本被改写后 HUD 就把这块让给 main.js。
 */
let backendText = "boot";
let hudToast = null;
const brokenModules = new Set();

function paintBackend() {
  if (!backendEl) return;
  const failed = brokenModules.size ? ` · ⚠ ${Array.from(brokenModules).join("/")}` : "";
  backendEl.textContent = backendText + failed;
}

function reportBroken(scope, err) {
  if (!brokenModules.has(scope)) {
    console.error(`${TAG} ${scope} 未就绪：`, err);
    brokenModules.add(scope);
    paintBackend();
    hudToast?.(`${scope} 模块未就绪，已降级运行`, "warn", 6000);
  }
}

/**
 * 兄弟模块由其它代理并行开发，签名可能与简报略有出入。
 * 按最可能的调用形式依次尝试，命中后锁定；连续失败则停用该模块。
 */
function makeAdapter(scope, fn, variants, accept) {
  if (typeof fn !== "function") return null;
  let locked = -1;
  let failures = 0;
  let disabled = false;

  return function call(ctx) {
    if (disabled) return undefined;

    if (locked >= 0) {
      try {
        return fn(...variants[locked](ctx));
      } catch (err) {
        failures += 1;
        if (failures === 1 || failures >= 8) reportBroken(scope, err);
        if (failures >= 8) disabled = true;
        return undefined;
      }
    }

    let lastErr = null;
    for (let i = 0; i < variants.length; i++) {
      try {
        const result = fn(...variants[i](ctx));
        if (accept && !accept(result)) {
          lastErr = new Error(`${scope}: 返回值不符合契约`);
          continue;
        }
        locked = i;
        failures = 0;
        return result;
      } catch (err) {
        lastErr = err;
      }
    }
    disabled = true;
    reportBroken(scope, lastErr);
    return undefined;
  };
}

async function loadModule(scope, specifier) {
  try {
    return await specifier();
  } catch (err) {
    reportBroken(scope, err);
    return {};
  }
}

function emptyView(backend) {
  return {
    backend,
    wave: 0,
    scrap: 0,
    coreHp: 0,
    coreMax: 0,
    sockets: [],
    enemies: [],
    shots: [],
    events: [],
  };
}

/** world 未就绪时的占位：一个会转的发光信标，证明渲染循环是活的。 */
async function buildFallbackBeacon(scene) {
  const [{ MeshBuilder }, { StandardMaterial }, { Color3 }] = await Promise.all([
    import("@babylonjs/core/Meshes/meshBuilder.js"),
    import("@babylonjs/core/Materials/standardMaterial.js"),
    import("@babylonjs/core/Maths/math.color.js"),
  ]);

  const core = MeshBuilder.CreateSphere("sh-fallback-core", { diameter: 16, segments: 24 }, scene);
  const coreMat = new StandardMaterial("sh-fallback-core-mat", scene);
  coreMat.emissiveColor = new Color3(0.24, 0.86, 1);
  coreMat.diffuseColor = new Color3(0.04, 0.1, 0.18);
  coreMat.specularColor = new Color3(0.3, 0.6, 0.8);
  core.material = coreMat;

  const ring = MeshBuilder.CreateTorus("sh-fallback-ring", { diameter: 80, thickness: 1.6, tessellation: 96 }, scene);
  const ringMat = new StandardMaterial("sh-fallback-ring-mat", scene);
  ringMat.emissiveColor = new Color3(1, 0.24, 0.58);
  ringMat.diffuseColor = new Color3(0.06, 0.02, 0.06);
  ring.material = ringMat;

  return (elapsed) => {
    ring.rotation.y = elapsed * 0.25;
    const pulse = 0.75 + Math.sin(elapsed * 2.2) * 0.25;
    coreMat.emissiveColor.set(0.24 * pulse, 0.86 * pulse, 1 * pulse);
  };
}

async function boot() {
  if (!canvas) {
    console.error(`${TAG} 找不到 #sh-canvas`);
    return;
  }

  const renderer = await createRenderer(canvas);
  const { engine, scene, backend, setQuality } = renderer;
  const pinnedQuality = new URLSearchParams(window.location.search).has("q");

  backendText = `${BACKEND_LABEL[backend] || backend} · ${renderer.quality}`;
  paintBackend();
  console.info(`${TAG} 后端 ${backend}，质量档 ${renderer.quality}`, renderer.notes);

  const state = {
    backend,
    setQuality(tier) {
      const applied = setQuality(tier);
      backendText = `${BACKEND_LABEL[backend] || backend} · ${applied}`;
      paintBackend();
      state.quality = applied;
      return applied;
    },
    quality: renderer.quality,
    engine,
    scene,
    renderer,
    ready: false,
    frames: 0,
    fps: 0,
    view: null,
    modules: { sim: false, world: false, input: false, ui: false, combat: false },
  };
  window.__SHIHE__ = state;

  const [simMod, worldMod, inputMod, uiMod, combatMod] = await Promise.all([
    loadModule("sim", () => import("./sim/index.js")),
    loadModule("world", () => import("./world/index.js")),
    loadModule("input", () => import("./input/index.js")),
    loadModule("ui", () => import("./ui/index.js")),
    loadModule("combat", () => import("./combat/index.js")),
  ]);

  // ---- 模拟层 ----
  let match = null;
  const seed = Number(new URLSearchParams(window.location.search).get("seed")) || 20260828;
  if (typeof simMod.createMatch === "function") {
    try {
      match = simMod.createMatch(seed) ?? null;
    } catch (err) {
      reportBroken("sim", err);
    }
  } else {
    reportBroken("sim", new Error("createMatch 缺失"));
  }

  let latestView = emptyView(backend);

  function readView() {
    if (match && typeof simMod.getView === "function") {
      try {
        const view = simMod.getView(match);
        if (view && typeof view === "object") {
          if (view.backend !== backend) {
            try {
              view.backend = backend;
            } catch {
              /* sim 若把视图冻结了就按原样用 */
            }
          }
          return view;
        }
      } catch (err) {
        reportBroken("sim", err);
        match = null;
      }
    }
    return emptyView(backend);
  }

  // buildWorld(scene, getView)：同时兼容 getView() 与 getView(match) 两种取法。
  function getView(maybeMatch) {
    if (maybeMatch && maybeMatch !== match && typeof simMod.getView === "function") {
      try {
        return simMod.getView(maybeMatch);
      } catch {
        /* 落回最近一帧 */
      }
    }
    return latestView;
  }

  latestView = readView();
  state.view = latestView;

  // ---- 世界层 ----
  let worldReady = false;
  let animateFallback = null;
  if (typeof worldMod.buildWorld === "function") {
    try {
      worldMod.buildWorld(scene, getView);
      worldReady = true;
    } catch (err) {
      reportBroken("world", err);
    }
  } else {
    reportBroken("world", new Error("buildWorld 缺失"));
  }

  if (!worldReady) {
    try {
      animateFallback = await buildFallbackBeacon(scene);
    } catch (err) {
      console.warn(`${TAG} 占位信标也没建起来，只剩空场景`, err);
    }
  }

  // world 若自带相机，让它接管并释放引擎兜底相机（后处理会随 activeCamera 变更重建）。
  const worldCamera = scene.cameras.find((cam) => cam !== renderer.camera);
  if (worldCamera) {
    scene.activeCamera = worldCamera;
    try {
      renderer.camera.dispose();
      if (scene.metadata?.shihe) scene.metadata.shihe.fallbackCamera = null;
    } catch {
      /* ignore */
    }
  }
  state.setQuality(renderer.quality);

  // ---- 输入层 ----
  const inputCtx = {
    canvas,
    scene,
    engine,
    getView,
    pickSocket: typeof worldMod.pickSocket === "function" ? worldMod.pickSocket : null,
    setQuality: state.setQuality,
  };
  const createInput = makeAdapter(
    "input",
    inputMod.createInput,
    [
      () => [canvas, scene, inputCtx],
      () => [scene, canvas, inputCtx],
      () => [inputCtx],
      () => [],
    ],
    (result) => !!result && typeof result.read === "function"
  );
  const input = (createInput && createInput(inputCtx)) || { read: () => ({}) };
  if (typeof inputMod.createInput !== "function") reportBroken("input", new Error("createInput 缺失"));

  // ---- HUD ----
  // 画质按钮的回调走 mountHud 的 options；暂停 / 过载 / 选塔由 HUD 派发 'sh-ui'，
  // input 已经在听，这里再挂钩子就会双触发。
  const hudRoot = document.getElementById("sh-hud") || document.body;
  const hudCtx = {
    root: hudRoot,
    scene,
    canvas,
    backend,
    getView,
    quality: state.quality,
    setQuality: state.setQuality,
    onQuality: state.setQuality,
  };
  const mountHud = makeAdapter("ui", uiMod.mountHud, [
    () => [hudRoot, hudCtx],
    () => [hudCtx],
    () => [document, hudCtx],
    () => [],
  ]);
  const hud = mountHud ? mountHud(hudCtx) : null;
  if (typeof uiMod.mountHud !== "function") reportBroken("ui", new Error("mountHud 缺失"));
  if (typeof hud?.toast === "function") hudToast = (text, kind, ttl) => hud.toast(text, kind, ttl);
  else if (typeof uiMod.toast === "function") hudToast = uiMod.toast;
  for (const scope of brokenModules) hudToast?.(`${scope} 模块未就绪，已降级运行`, "warn", 6000);

  // ---- 每帧同步 ----
  const syncWorld = worldReady
    ? makeAdapter("world", worldMod.syncWorld, [
        (c) => [c.scene, c.view, c.dt],
        (c) => [c.view, c.scene, c.dt],
        (c) => [c.view],
      ])
    : null;
  const syncCombat = makeAdapter("combat", combatMod.syncCombat, [
    (c) => [c.scene, c.view, c.dt],
    (c) => [c.view, c.scene, c.dt],
    (c) => [c.view],
  ]);
  // ui/hud.js 的 syncHud(view, extras)：extras 补上模拟层看不见的表现层状态。
  const syncHud = makeAdapter("ui", uiMod.syncHud, [
    (c) => [c.view, c.hudExtras],
    (c) => [c.hud, c.view],
    (c) => [c.view],
  ]);

  const hudExtras = { backend, quality: state.quality, paused: false };
  const frameCtx = { scene, engine, view: latestView, dt: 0, hud, hudExtras, backend };

  function refreshHudExtras() {
    hudExtras.quality = state.quality;
    if (typeof input.peek !== "function") return;
    try {
      const peek = input.peek();
      hudExtras.towerId = peek.towerId;
      hudExtras.selectedSocket = peek.selectedSocket;
      hudExtras.paused = peek.paused;
    } catch {
      /* peek 是可选钩子，坏了不影响主循环 */
    }
  }

  // 帧率兜底：没有 ?q= 显式钉档时，跑不动就自动降级。
  // 用墙钟而不是循环里那个被夹到 MAX_DT 的 dt，否则越卡越采不到样。
  const clock = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  let sampleStart = clock();
  let sampleFrames = 0;
  let degradeCooldown = 2;

  function autoDegrade() {
    sampleFrames += 1;
    const span = (clock() - sampleStart) / 1000;
    if (span < 1.5) return;
    state.fps = Math.round(sampleFrames / span);
    sampleStart = clock();
    sampleFrames = 0;
    if (pinnedQuality) return;
    if (degradeCooldown > 0) {
      degradeCooldown -= 1;
      return;
    }
    if (state.quality === "high" && state.fps < 38) {
      console.info(`${TAG} ${state.fps}fps → 降到 mid`);
      state.setQuality("mid");
      degradeCooldown = 3;
    } else if (state.quality === "mid" && state.fps < 26) {
      console.info(`${TAG} ${state.fps}fps → 降到 low`);
      state.setQuality("low");
      degradeCooldown = 3;
    }
  }

  let elapsed = 0;
  engine.runRenderLoop(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, MAX_DT);
    elapsed += dt;

    let command = {};
    try {
      command = input.read(dt) || {};
    } catch (err) {
      reportBroken("input", err);
      input.read = () => ({});
    }

    if (match && typeof simMod.step === "function") {
      try {
        simMod.step(match, command, dt);
      } catch (err) {
        reportBroken("sim", err);
        match = null;
      }
    }

    latestView = readView();
    state.view = latestView;
    frameCtx.view = latestView;
    frameCtx.dt = dt;

    if (syncWorld) syncWorld(frameCtx);
    if (syncCombat) syncCombat(frameCtx);
    if (syncHud) {
      refreshHudExtras();
      syncHud(frameCtx);
    }
    if (animateFallback) animateFallback(elapsed);

    scene.render();
    state.frames += 1;
    autoDegrade();
  });

  state.modules = {
    sim: !!match,
    world: worldReady,
    input: typeof input.read === "function" && !!inputMod.createInput,
    ui: !!hud,
    combat: !!syncCombat,
  };
  state.ready = true;
  window.addEventListener("beforeunload", () => renderer.dispose(), { once: true });
  console.info(`${TAG} 启动完成`, state.modules);
}

boot().catch((err) => {
  console.error(`${TAG} 启动失败`, err);
  backendText = "启动失败";
  paintBackend();
  window.__SHIHE__ = window.__SHIHE__ || { backend: "none", setQuality: () => "none", error: String(err) };
});
