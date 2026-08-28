// 蚀核要塞 · 启动入口（Opus-1）
// 职责：拉起渲染器 → 按 docs/API_CONTRACT.md 的冻结签名装配 sim / world / input / ui / combat → 驱动主循环。
//
// Round 1 那套「按几种签名轮流试着调」的适配器已经删干净：兄弟模块全部落地，这里只认一种调用形式。
//   createRenderer(canvas, { quality })
//   createMatch(seed) / step(match, input, dt) / getView(match)
//   buildWorld(scene) / syncWorld(scene, view) / pickSocket(scene, pickInfo)
//   createInput({ canvas, scene, pickSocket })
//   mountHud(root) / syncHud(view, { backend, quality, events })
//   syncCombat(scene, view)
//
// 本文件不画任何东西：没有网格、没有弹道、没有 HUD 结构，只做装配与每帧调度。

import { createRenderer } from "./engine/index.js";
import { createMatch, getView, step } from "./sim/index.js";
import { buildWorld, pickSocket, syncWorld } from "./world/index.js";
import { syncCombat } from "./combat/index.js";
import { createInput } from "./input/index.js";
import { mountHud, syncHud } from "./ui/index.js";

const TAG = "[shihe-yaosai]";
/** 掉帧时把模拟时间也拖长毫无好处，夹到 50ms 让 sim 少补几个子步。 */
const MAX_DT = 1 / 20;
const BACKEND_LABEL = { webgpu: "WebGPU", webgl2: "WebGL2" };
/** 同一环连错这么多帧就摘掉它，别让控制台被刷爆。 */
const FAIL_LIMIT = 8;

const canvas = document.getElementById("sh-canvas");
const backendEl = document.getElementById("sh-backend");

/**
 * #sh-backend 是 HUD 冻结 class 之一；这里只写文本，不碰结构。
 * HUD 约定：占位文本被改写后就把这块让给 main.js（见 ui/hud.js 的 syncBackend）。
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
  console.error(`${TAG} ${scope} 出错：`, err);
  if (brokenModules.has(scope)) return;
  brokenModules.add(scope);
  paintBackend();
  hudToast?.(`${scope} 模块异常，已降级运行`, "warn", 6000);
}

/**
 * 表现层某一环抛错不能带崩整帧。首错与摘除时各报一次，中间静默。
 * 这不是签名适配器：调用形式只有一种，只是把异常挡在渲染循环外。
 */
function protect(scope, fn) {
  let failures = 0;
  return (...args) => {
    if (failures >= FAIL_LIMIT) return undefined;
    try {
      return fn(...args);
    } catch (err) {
      failures += 1;
      if (failures === 1) reportBroken(scope, err);
      else if (failures === FAIL_LIMIT) console.error(`${TAG} ${scope} 连续 ${FAIL_LIMIT} 帧出错，已停用`, err);
      return undefined;
    }
  };
}

/** 启动就崩时也不能白屏：契约 §9.6 要求把原因写进 .sh-toast。 */
function paintFatal(message) {
  backendText = "启动失败";
  paintBackend();
  const toastEl = document.getElementById("sh-toast");
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.setAttribute("data-kind", "bad");
  toastEl.setAttribute("data-show", "1");
  toastEl.classList.add("is-error");
}

/** world 没搭起来时的占位：一个会转的发光信标，证明渲染循环是活的。 */
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

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const quality = params.get("quality") || params.get("q");
  const rawSeed = Number.parseInt(params.get("seed") ?? "", 10);
  return {
    quality: quality || null,
    seed: Number.isFinite(rawSeed) ? rawSeed >>> 0 : Date.now() % 2 ** 31,
  };
}

async function boot() {
  if (!canvas) {
    console.error(`${TAG} 找不到 #sh-canvas`);
    paintFatal("找不到画布 #sh-canvas");
    return;
  }

  const { quality: qualityOverride, seed } = readParams();
  const renderer = await createRenderer(canvas, qualityOverride ? { quality: qualityOverride } : {});
  const { engine, scene, backend } = renderer;

  backendText = `${BACKEND_LABEL[backend] || backend} · ${renderer.quality}`;
  paintBackend();
  console.info(`${TAG} 后端 ${backend}，质量档 ${renderer.quality}，种子 ${seed}`, renderer.notes);

  // ?quality= 钉死档位；HUD 的画质按钮一旦被按过，自动降级也不再插手。
  let qualityPinned = !!qualityOverride;

  function applyTier(tier) {
    const applied = renderer.setQuality(tier);
    state.quality = applied;
    backendText = `${BACKEND_LABEL[backend] || backend} · ${applied}`;
    paintBackend();
    return applied;
  }

  const state = {
    backend,
    quality: renderer.quality,
    seed,
    engine,
    scene,
    renderer,
    ready: false,
    frames: 0,
    fps: 0,
    view: null,
    modules: { sim: false, world: false, input: false, ui: false, combat: false },
    /** HUD 的画质按钮直接打到这里（ui/hud.js 约定读 window.__SHIHE__.setQuality）。 */
    setQuality(tier) {
      qualityPinned = true;
      return applyTier(tier);
    },
  };
  window.__SHIHE__ = state;

  // ---- 模拟层 ----
  const match = createMatch(seed);

  // ---- 世界层 ----
  // buildWorld(scene) 不传 getView：世界层的 autoSync 因此不启用，
  // 每帧只由本文件调一次 syncWorld，同一帧不会被画两遍。
  let world = null;
  let animateFallback = null;
  try {
    world = buildWorld(scene);
  } catch (err) {
    reportBroken("world", err);
    try {
      animateFallback = await buildFallbackBeacon(scene);
    } catch (beaconErr) {
      console.warn(`${TAG} 占位信标也没建起来，只剩空场景`, beaconErr);
    }
  }

  // world 若自带相机就让它接管：引擎释放兜底相机，并把后处理重挂到新相机上。
  const worldCamera = world?.camera ?? scene.cameras.find((cam) => cam !== renderer.camera) ?? null;
  if (worldCamera) renderer.useCamera(worldCamera);

  // ---- 输入层 ----
  const input = createInput({ canvas, scene, pickSocket });

  // ---- HUD ----
  // 选塔 / 过载 / 暂停由 HUD 派发 'sh-ui'，input 自己在听；画质按钮走
  // window.__SHIHE__.setQuality（上面已经挂好）。main 这里不再接任何回调，否则双触发。
  const hud = mountHud(document.getElementById("sh-hud") ?? document.body);
  if (typeof hud?.toast === "function") hudToast = (text, kind, ttl) => hud.toast(text, kind, ttl);
  for (const scope of brokenModules) hudToast?.(`${scope} 模块异常，已降级运行`, "warn", 6000);

  // ---- 每帧调度 ----
  const readInput = protect("input", () => input.read());
  const stepSim = protect("sim", (command, dt) => step(match, command, dt));
  const readView = protect("sim", () => getView(match));
  const drawWorld = protect("world", (view) => syncWorld(scene, view));
  const drawCombat = protect("combat", (view) => syncCombat(scene, view));
  const drawHud = protect("ui", (view, extras) => syncHud(view, extras));

  /** sim 停摆时还得给表现层一份形状正确的空视图。 */
  const idleView = {
    backend,
    wave: 0,
    waveTotal: 0,
    scrap: 0,
    coreHp: 0,
    coreMax: 0,
    paused: false,
    sockets: [],
    enemies: [],
    shots: [],
    fields: [],
    events: [],
  };

  // 本帧 step() 产出的全部事件。sim 内部按 1/60 补子步，一次调用就把子步事件收齐了；
  // 这个数组每帧原地清空复用，HUD 靠事件对象本身去重（WeakSet），不认数组身份。
  const frameEvents = [];
  const hudExtras = { backend, quality: state.quality, events: frameEvents };

  // 帧率兜底：档位没被钉住时，跑不动就自动降级。
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
    if (qualityPinned) return;
    if (degradeCooldown > 0) {
      degradeCooldown -= 1;
      return;
    }
    if (state.quality === "high" && state.fps < 38) {
      console.info(`${TAG} ${state.fps}fps → 降到 mid`);
      applyTier("mid");
      degradeCooldown = 3;
    } else if (state.quality === "mid" && state.fps < 26) {
      console.info(`${TAG} ${state.fps}fps → 降到 low`);
      applyTier("low");
      degradeCooldown = 3;
    }
  }

  // 调试句柄：控制台里能直接摸到每一层。
  state.match = match;
  state.world = world;
  state.input = input;
  state.hud = hud;
  state.modules = { sim: true, world: !!world, input: !!input, ui: !!hud, combat: true };

  let elapsed = 0;
  engine.runRenderLoop(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, MAX_DT);
    elapsed += dt;

    // 1) 输入。read() 已经按契约 §2.1 把 pause / selectedSocket 作为绝对量每帧给出，
    //    main 不做任何加工。
    const command = readInput() ?? {};

    // 2) 模拟。
    frameEvents.length = 0;
    const stepped = stepSim(command, dt);
    if (stepped && Array.isArray(stepped.events)) {
      for (const event of stepped.events) frameEvents.push(event);
    }

    // 3) 取视图。backend 覆写是全项目唯一允许改写 view 的位置（契约 §9.3）。
    //    events 一并换成本帧聚合值：getView 只镜像最后一次 step，而且给的是副本，
    //    与 extras.events 同时递给 HUD 会让同一条事件弹两遍。
    const view = readView() ?? idleView;
    view.backend = backend;
    view.events = frameEvents;
    state.view = view;

    // 4) 表现层。弹道由 combat 独占，本文件与 engine 都不画。
    drawWorld(view);
    drawCombat(view);

    hudExtras.quality = state.quality;
    drawHud(view, hudExtras);

    if (animateFallback) animateFallback(elapsed);

    scene.render();
    state.frames += 1;
    autoDegrade();
  });

  state.ready = true;

  window.addEventListener(
    "beforeunload",
    () => {
      try {
        input.dispose();
      } catch {
        /* ignore */
      }
      renderer.dispose();
    },
    { once: true },
  );
  console.info(`${TAG} 启动完成`, state.modules);
}

boot().catch((err) => {
  console.error(`${TAG} 启动失败`, err);
  paintFatal(`启动失败：${err && err.message ? err.message : err}`);
  window.__SHIHE__ = window.__SHIHE__ || {
    backend: "none",
    quality: "none",
    ready: false,
    setQuality: () => "none",
    error: String(err),
  };
});
