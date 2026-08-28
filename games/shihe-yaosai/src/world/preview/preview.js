// Opus-2 世界 · 独立预览页。
// 只为了在 Opus-1 的引擎接上来之前能单独看见世界层，不参与正式启动链路。

import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

import { buildWorld, syncWorld, pickSocket, getWorld, socketWorldPos, WORLD_METRICS } from "../index.js";
import { demoView } from "./demo-view.js";

const params = new URLSearchParams(location.search);
const numberParam = (key, fallback) => {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

const CAMERAS = {
  // alpha, beta, radius, target
  iso: [-Math.PI / 2.35, 0.98, 108, [0, 2, 0]],
  wide: [-Math.PI / 2.35, 1.22, 150, [0, 2, 0]],
  low: [-Math.PI / 2.9, 1.42, 92, [0, 4, 0]],
  top: [-Math.PI / 2, 0.24, 130, [0, 0, 0]],
  core: [-Math.PI / 2.15, 1.05, 62, [0, 1, 0]],
};

const flagParam = (key, fallback = true) => {
  const raw = params.get(key);
  if (raw === null) return fallback;
  return raw !== "0" && raw !== "false";
};

const canvas = document.getElementById("preview-canvas");
const engine = new Engine(canvas, true, { antialias: true, stencil: true, preserveDrawingBuffer: true }, true);
const scene = new Scene(engine);

const frozenTime = params.get("t") === null ? null : numberParam("t", 0);
const hpOverride = params.get("hp") === null ? undefined : numberParam("hp", 1);
const hoverSocket = params.get("hover") === null ? null : numberParam("hover", 0);
const selectedSocket = params.get("selected") === null ? null : numberParam("selected", 0);

let wallClock = 0;
const viewTime = () => (frozenTime === null ? wallClock : frozenTime);

const world = buildWorld(
  scene,
  () => demoView(viewTime(), { hp: hpOverride, hover: hoverSocket, selected: selectedSocket }),
  { glow: flagParam("glow"), sky: flagParam("sky"), environment: flagParam("env") }
);

const camName = params.get("cam") ?? "iso";
const camera = scene.activeCamera;
camera.lowerRadiusLimit = 8;

if (camName === "socket") {
  // 贴脸看某一座塔：把目标点放到插座上，相机从外侧略高处压下来。
  const index = numberParam("focus", 4);
  const theta = (index / WORLD_METRICS.socketCount) * WORLD_METRICS.tau;
  const pos = socketWorldPos(index);
  camera.setTarget(new Vector3(pos.x, pos.y + 2.6, pos.z));
  camera.alpha = theta + 0.55;
  camera.beta = 1.22;
  camera.radius = numberParam("r", 22);
} else {
  // ArcRotateCamera.setTarget 会按当前位置反算 alpha/beta/radius，必须先定目标再定角度。
  const preset = CAMERAS[camName] ?? CAMERAS.iso;
  camera.setTarget(new Vector3(...preset[3]));
  camera.alpha = preset[0];
  camera.beta = preset[1];
  camera.radius = numberParam("r", preset[2]);
}

const hud = document.getElementById("preview-hud");
scene.onPointerDown = () => {
  const index = pickSocket(scene);
  hud.dataset.picked = index === null ? "—" : String(index);
  hud.textContent = `pickSocket → ${hud.dataset.picked}`;
};

scene.registerBeforeRender(() => {
  if (frozenTime === null) wallClock += engine.getDeltaTime() / 1000;
});

engine.runRenderLoop(() => scene.render());
addEventListener("resize", () => engine.resize());

// 截图脚本靠这两个全局量判断「场景已经稳定，可以拍了」。
let frames = 0;
scene.onAfterRenderObservable.add(() => {
  frames += 1;
  window.__worldFrames = frames;
  if (frames >= 6) window.__worldReady = true;
});

Object.assign(window, {
  scene,
  engine,
  world,
  syncWorld,
  getWorld,
  pickSocket,
  demoView,
  setDemoTime(t) {
    wallClock = t;
  },
});
