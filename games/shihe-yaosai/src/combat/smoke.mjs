#!/usr/bin/env node
// 无头渲染冒烟：NullEngine + 真实 sim 视图，验证 syncCombat 建/收网格不泄漏。
//   node src/combat/smoke.mjs [--seconds=90] [--seed=7]
import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { Scene } from "@babylonjs/core/scene.js";
import { createMatch, step, getView } from "../sim/index.js";
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

const PLAN = [
  { socket: 0, towerId: "rail" },
  { socket: 6, towerId: "scatter" },
  { socket: 12, towerId: "rail" },
  { socket: 18, towerId: "prism" },
  { socket: 19, towerId: "prism" },
  { socket: 3, towerId: "well" },
  { socket: 9, towerId: "star" },
  { socket: 15, towerId: "scatter" },
];

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const match = createMatch(opts.seed, { waveCount: 5 });

  let planIdx = 0;
  let maxMeshes = 0;
  let peakShots = 0;
  let peakFields = 0;
  let syncCalls = 0;
  let bentBeams = 0;
  let impacts = 0;
  const kinds = new Set();

  for (let i = 0; i < opts.seconds * 60; i += 1) {
    const view = getView(match);
    const next = PLAN[planIdx];
    const input = next && !view.sockets[next.socket].towerId ? { place: { socket: next.socket, towerId: next.towerId } } : {};
    if (view.time > 6 && view.time % 11 < DT) {
      const armed = view.sockets.filter((s) => s.towerId && s.overclockT === 0 && s.overheatT === 0);
      if (armed.length) input.overclockSocket = armed[0].i;
    }
    const { events } = step(match, input, DT);
    if (events.some((e) => e.type === "place")) planIdx += 1;

    const after = getView(match);
    const stats = syncCombat(scene, after);
    syncCalls += 1;
    for (const s of after.shots) {
      kinds.add(s.kind);
      if (s.points.length === 3) bentBeams += 1;
    }
    peakShots = Math.max(peakShots, after.shots.length);
    peakFields = Math.max(peakFields, after.fields.length);
    impacts = Math.max(impacts, stats ? stats.impacts : 0);
    maxMeshes = Math.max(maxMeshes, scene.meshes.length);
    if (after.over) break;
  }

  // 打空视图，弹道全部回收后场上不该留残留网格
  for (let i = 0; i < 60; i += 1) syncCombat(scene, { time: 1e6 + i, shots: [], fields: [] });
  const idleMeshes = scene.meshes.filter((m) => m.isVisible).length;
  const pooled = scene.meshes.length - idleMeshes;
  disposeCombat(scene);
  const afterDispose = scene.meshes.length;

  const nullView = syncCombat(scene, null);
  const noScene = syncCombat(null, { shots: [] });

  const failures = [];
  if (syncCalls < 60) failures.push("sync never ran");
  if (kinds.size < 4) failures.push(`only rendered ${[...kinds].join(",")}`);
  if (bentBeams === 0) failures.push("no bent prism beam reached the renderer");
  if (peakShots === 0) failures.push("no shots in view");
  if (peakFields === 0) failures.push("no well fields in view");
  if (impacts === 0) failures.push("no impact flashes spawned");
  if (idleMeshes !== 0) failures.push(`${idleMeshes} visible meshes left after shots cleared`);
  if (pooled > 16) failures.push(`impact pool grew to ${pooled} meshes`);
  if (afterDispose !== 0) failures.push(`${afterDispose} meshes left after disposeCombat`);
  if (nullView !== null || noScene !== null) failures.push("guard clauses did not return null");

  console.log(`[combat] seed=${opts.seed} syncCalls=${syncCalls} peakShots=${peakShots} peakFields=${peakFields} peakMeshes=${maxMeshes}`);
  console.log(`[combat] shotKinds=${[...kinds].sort().join(",")} bentBeamFrames=${bentBeams} peakImpacts=${impacts}`);
  console.log(`[combat] meshes visibleWhenIdle=${idleMeshes} pooled=${pooled} afterDispose=${afterDispose}`);
  console.log(failures.length === 0 ? "[combat] PASS" : `[combat] FAIL\n  - ${failures.join("\n  - ")}`);
  engine.dispose();
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
