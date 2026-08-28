// Opus-2 世界 · 独立预览页。
// 只为了在 Opus-1 的引擎接上来之前能单独看见世界层，不参与正式启动链路。

import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";

import { buildWorld, syncWorld, pickSocket, getWorld, WORLD_METRICS } from "../index.js";
import { demoView } from "./demo-view.js";

const params = new URLSearchParams(location.search);
const numberParam = (key, fallback) => {
  const raw = params.get(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

const CAMERAS = {
  // alpha, beta, radius, targetY
  iso: [-Math.PI / 2.35, 1.02, 132, 3],
  wide: [-Math.PI / 2.35, 1.24, 178, 2],
  low: [-Math.PI / 2.9, 1.44, 96, 3.5],
  top: [-Math.PI / 2, 0.28, 150, 0],
  socket: [-Math.PI / 2.6, 1.32, 46, 2.5],
  core: [-Math.PI / 2.2, 1.16, 58, 2],
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

const world = buildWorld(scene, () =>
  demoView(viewTime(), { hp: hpOverride, hover: hoverSocket, selected: selectedSocket })
);

const preset = CAMERAS[params.get("cam") ?? "iso"] ?? CAMERAS.iso;
const camera = scene.activeCamera;
camera.alpha = preset[0];
camera.beta = preset[1];
camera.radius = numberParam("r", preset[2]);
camera.setTarget(new Vector3(0, preset[3], 0));
if (params.get("cam") === "socket") {
  const focus = WORLD_METRICS.socketCount;
  camera.alpha = Math.PI / 2 - (numberParam("focus", 4) / focus) * WORLD_METRICS.tau + Math.PI;
  const pos = { x: Math.cos((numberParam("focus", 4) / focus) * WORLD_METRICS.tau) * 40, z: Math.sin((numberParam("focus", 4) / focus) * WORLD_METRICS.tau) * 40 };
  camera.setTarget(new Vector3(pos.x * 0.82, 3, pos.z * 0.82));
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
