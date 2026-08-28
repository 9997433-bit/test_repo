// Opus-2 世界 · 独立预览页。
// 只为了在 Opus-1 的引擎接上来之前能单独看见世界层，不参与正式启动链路。

import { Engine } from "@babylonjs/core/Engines/engine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.js";

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

// 冻结时间是给截图脚本用的：同一个 t 永远得到同一帧，截图才可比。
const state = {
  frozen: params.get("t") !== null,
  time: numberParam("t", 0),
  hp: params.get("hp") === null ? undefined : numberParam("hp", 1),
  hover: params.get("hover") === null ? null : numberParam("hover", 0),
  selected: params.get("selected") === null ? null : numberParam("selected", 0),
};

// 这页没有 src/engine，因此场上没有辉光层可认领：glow 开关在这里只是个空挡，
// 正式启动链路里的辉光由引擎按质量档创建。
const world = buildWorld(
  scene,
  () => demoView(state.time, { hp: state.hp, hover: state.hover, selected: state.selected }),
  { glow: flagParam("glow"), sky: flagParam("sky"), environment: flagParam("env") }
);

const camName = params.get("cam") ?? "iso";
const camera = scene.activeCamera;
camera.lowerRadiusLimit = 8;

if (camName === "socket" || camName === "turret") {
  // 贴脸看某一座塔：把目标点放到插座上，相机从外侧略高处压下来。
  const tight = camName === "turret";
  const index = numberParam("focus", 4);
  const theta = (index / WORLD_METRICS.socketCount) * WORLD_METRICS.tau;
  // 炮塔的体量都向外伸，取景点比插座再往外挪一点画面才居中。
  const push = tight ? 1.07 : 1;
  const pos = socketWorldPos(index);
  camera.setTarget(new Vector3(pos.x * push, pos.y + (tight ? 3.4 : 2.6), pos.z * push));
  camera.alpha = theta + numberParam("yaw", tight ? 0.75 : 0.55);
  camera.beta = tight ? 1.3 : 1.22;
  camera.radius = numberParam("r", tight ? 14 : 22);
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
  if (!state.frozen) state.time += engine.getDeltaTime() / 1000;
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

// 录制脚本用这一组钩子逐帧驱动：时间、血量、机位全部可复现。
window.__preview = {
  state,
  setTime(t) {
    state.frozen = true;
    state.time = t;
  },
  setHp(hp) {
    state.hp = hp;
  },
  setHover(index) {
    state.hover = index;
  },
  setSelected(index) {
    state.selected = index;
  },
  setCamera({ alpha, beta, radius, target }) {
    if (target) camera.setTarget(new Vector3(target[0], target[1], target[2]));
    if (alpha !== undefined) camera.alpha = alpha;
    if (beta !== undefined) camera.beta = beta;
    if (radius !== undefined) camera.radius = radius;
  },
  pickAt(index) {
    const mesh = scene.getMeshByName(`socket-${index}`);
    return pickSocket(scene, { hit: true, pickedMesh: mesh });
  },
  /** 把某个插座投影成屏幕坐标，方便自动化把鼠标真的移到它上面。 */
  projectSocket(index) {
    const p = socketWorldPos(index);
    const v = Vector3.Project(
      new Vector3(p.x, p.y + 1.05, p.z),
      Matrix.Identity(),
      scene.getTransformMatrix(),
      camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
    );
    return { x: v.x, y: v.y };
  },
};

Object.assign(window, { scene, engine, world, syncWorld, getWorld, pickSocket, demoView });
