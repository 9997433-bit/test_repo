#!/usr/bin/env node
// 无头渲染冒烟：NullEngine + 真实 sim 视图，验证 syncCombat 建/收网格不泄漏。
//   node src/combat/smoke.mjs [--seconds=90] [--seed=7]
//
// 两段：
//   soak     —— sim 的价值 bot 打一局，喂真实视图流，盯网格增长与回收；
//   showcase —— 围着敌群摆一圈五塔（含相邻双棱镜），把契约 §3.3 的五种 ShotKind
//               和 §3.6 的折射段全部逼进渲染层。靠打得好不好来碰运气凑弹道太脆。
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { createMatch, step, getView } from "../sim/index.js";
import { BOT_TOWERS, botInput, createBot, crowdSocket, freeSocketNear } from "../sim/bot.mjs";
import { syncCombat, disposeCombat } from "./index.js";

const DT = 1 / 60;

function parseArgs(argv) {
  const out = { seconds: 90, seed: 7 };
  for (const arg of argv) {
    const m = /^--([a-zA-Z]+)=(.*)$/.exec(arg);
    if (!m) continue;
    if (m[1] === "seconds") out.seconds = Number(m[2]);
    if (m[1] === "seed") out.seed = /^-?\d+$/.test(m[2]) ? Number(m[2]) : m[2];
  }
  return out;
}

function createTally() {
  return { syncCalls: 0, peakShots: 0, peakFields: 0, peakMeshes: 0, impacts: 0, bentBeams: 0, kinds: new Set() };
}

/** 推一帧：先 step，再把新视图喂给渲染层，顺手记账。 */
function frame(scene, match, input, tally) {
  const { events } = step(match, input, DT);
  const view = getView(match);
  const stats = syncCombat(scene, view);
  tally.syncCalls += 1;
  for (const s of view.shots) {
    tally.kinds.add(s.kind);
    if (s.kind === "beam" && s.relay !== null) tally.bentBeams += 1;
  }
  tally.peakShots = Math.max(tally.peakShots, view.shots.length);
  tally.peakFields = Math.max(tally.peakFields, view.fields.length);
  tally.impacts = Math.max(tally.impacts, stats ? stats.impacts : 0);
  tally.peakMeshes = Math.max(tally.peakMeshes, scene.meshes.length);
  return { view, events };
}

// ---------------------------------------------------------------- soak：bot 真打一局

function soak(scene, opts, tally) {
  const match = createMatch(opts.seed, { waveCount: 5 });
  const bot = createBot(opts.seed, getView(match));
  const built = [];
  for (let i = 0; i < opts.seconds * 60; i += 1) {
    const input = botInput(bot, getView(match));
    const { view, events } = frame(scene, match, input, tally);
    for (const e of events) if (e.type === "place") built.push(`${e.towerId}@${e.socket}`);
    if (view.over) return { built, result: view.result, time: view.time };
  }
  const view = getView(match);
  return { built, result: view.result, time: view.time };
}

// ---------------------------------------------------------------- showcase：五塔全开

// 相对敌群质心插座的落位。双棱镜相邻，折射条件 dist3(主目标, 另一棱镜炮口) ≤ 18 才够得着。
const SHOWCASE = [
  { at: 0, towerId: "prism" },
  { at: 1, towerId: "prism" },
  { at: -1, towerId: "scatter" },
  { at: 2, towerId: "rail" },
  { at: -2, towerId: "well" },
  { at: 3, towerId: "star" },
];
// 哪种弹道没出现，就去补哪座塔。霰星射程只有 14，一定要贴着敌群才打得出 pellet。
const KIND_TOWER = { tracer: "rail", beam: "prism", pellet: "scatter", pulse: "well", arc: "star" };
const PATCH_EVERY = 120; // 每 2s 检查一次还缺哪种弹道

function waitForCluster(scene, match, tally, minCount, maxSec) {
  for (let i = 0; i < maxSec * 60; i += 1) {
    const view = getView(match);
    if (view.enemies.length >= minCount) {
      const socket = crowdSocket(view);
      if (socket !== null) return socket;
    }
    if (frame(scene, match, {}, tally).view.over) return null;
  }
  return null;
}

/** 补一座能打出缺失弹道的塔，落在当前敌群旁边。 */
function patchInput(view, tally, match) {
  for (const [kind, towerId] of Object.entries(KIND_TOWER)) {
    if (tally.kinds.has(kind)) continue;
    const center = crowdSocket(view);
    if (center === null) return null;
    const socket = freeSocketNear(view, center);
    if (socket === null) return null;
    match.scrap = Math.max(match.scrap, BOT_TOWERS[towerId].cost);
    return { place: { socket, towerId } };
  }
  return null;
}

function showcase(scene, opts, tally) {
  const match = createMatch(opts.seed, { waveCount: 5 });
  const center = waitForCluster(scene, match, tally, 3, 60);
  if (center === null) return { placed: [], reason: "no enemy cluster to aim at" };

  const count = getView(match).sockets.length;
  const placed = [];
  for (const slot of SHOWCASE) {
    const socket = ((center + slot.at) % count + count) % count;
    // 这一段验的是渲染，不是经济：直接把钱补够，五种弹道必须全部出现。
    match.scrap = Math.max(match.scrap, BOT_TOWERS[slot.towerId].cost);
    const { events } = frame(scene, match, { place: { socket, towerId: slot.towerId } }, tally);
    if (events.some((e) => e.type === "place")) placed.push(`${slot.towerId}@${socket}`);
  }

  for (let i = 0; i < 120 * 60; i += 1) {
    let input = {};
    if (i === 300) input = { overclockSocket: center };
    else if (i % PATCH_EVERY === 0) input = patchInput(getView(match), tally, match) || {};
    const { view, events } = frame(scene, match, input, tally);
    for (const e of events) if (e.type === "place") placed.push(`${e.towerId}@${e.socket}`);
    if (view.over) break;
  }
  return { placed };
}

// ---------------------------------------------------------------- 主流程

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const tally = createTally();

  const run = soak(scene, opts, tally);
  const show = showcase(scene, opts, tally);

  // 打空视图，弹道全部回收后场上不该留残留网格
  for (let i = 0; i < 60; i += 1) syncCombat(scene, { time: 1e6 + i, shots: [], fields: [] });
  const idleMeshes = scene.meshes.filter((m) => m.isVisible).length;
  const pooled = scene.meshes.length - idleMeshes;
  disposeCombat(scene);
  const afterDispose = scene.meshes.length;

  const nullView = syncCombat(scene, null);
  const noScene = syncCombat(null, { shots: [] });

  const kinds = [...tally.kinds].sort();
  const failures = [];
  if (tally.syncCalls < 60) failures.push("sync never ran");
  if (kinds.length < 5) failures.push(`only rendered ${kinds.join(",") || "nothing"}`);
  if (tally.bentBeams === 0) failures.push("no bent prism beam reached the renderer");
  if (tally.peakShots === 0) failures.push("no shots in view");
  if (tally.peakFields === 0) failures.push("no well fields in view");
  if (tally.impacts === 0) failures.push("no impact flashes spawned");
  if (show.reason) failures.push(`showcase skipped: ${show.reason}`);
  if (idleMeshes !== 0) failures.push(`${idleMeshes} visible meshes left after shots cleared`);
  if (pooled > 16) failures.push(`impact pool grew to ${pooled} meshes`);
  if (afterDispose !== 0) failures.push(`${afterDispose} meshes left after disposeCombat`);
  if (nullView !== null || noScene !== null) failures.push("guard clauses did not return null");

  console.log(
    `[combat] seed=${opts.seed} syncCalls=${tally.syncCalls} peakShots=${tally.peakShots} peakFields=${tally.peakFields} peakMeshes=${tally.peakMeshes}`
  );
  console.log(`[combat] shotKinds=${kinds.join(",")} bentBeamFrames=${tally.bentBeams} peakImpacts=${tally.impacts}`);
  console.log(`[combat] meshes visibleWhenIdle=${idleMeshes} pooled=${pooled} afterDispose=${afterDispose}`);
  console.log(`[combat] soak result=${run.result} sim=${run.time.toFixed(1)}s towers=${run.built.join(" ") || "none"}`);
  console.log(`[combat] showcase towers=${show.placed.join(" ") || "none"}`);
  console.log(failures.length === 0 ? "[combat] PASS" : `[combat] FAIL\n  - ${failures.join("\n  - ")}`);
  engine.dispose();
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
