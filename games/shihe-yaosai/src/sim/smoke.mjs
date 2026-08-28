#!/usr/bin/env node
// 无头冒烟：不依赖渲染层，纯 node 跑通 N 波。
//   node src/sim/smoke.mjs [--waves=5] [--seed=7] [--quiet] [--json]
// 退出码 0 = 通过。失败会打印原因。
import { createMatch, step, getView, resolveTowers } from "./index.js";
import { createRng, nextInt } from "./rng.js";

const DT = 1 / 60;

function parseArgs(argv) {
  const out = { waves: 5, seed: 7, quiet: false, json: false, autoplay: true };
  for (const arg of argv) {
    const m = /^--([a-zA-Z]+)(?:=(.*))?$/.exec(arg);
    if (!m) continue;
    const [, key, value] = m;
    if (key === "waves") out.waves = Number(value);
    else if (key === "seed") out.seed = /^-?\d+$/.test(value || "") ? Number(value) : value;
    else if (key === "quiet") out.quiet = true;
    else if (key === "json") out.json = true;
    else if (key === "noplay") out.autoplay = false;
  }
  return out;
}

// 简单确定性 AI：按预算铺塔 + 定时过载，用来验证循环真的可玩。
// 18/19 两座棱镜相邻，用来触发折光；其余绕环铺开覆盖三条轨道。
const PLAN = [
  { socket: 0, towerId: "rail" },
  { socket: 6, towerId: "scatter" },
  { socket: 12, towerId: "rail" },
  { socket: 18, towerId: "prism" },
  { socket: 19, towerId: "prism" },
  { socket: 3, towerId: "well" },
  { socket: 9, towerId: "star" },
  { socket: 15, towerId: "scatter" },
  { socket: 21, towerId: "rail" },
  { socket: 13, towerId: "well" },
  { socket: 1, towerId: "star" },
  { socket: 7, towerId: "prism" },
  { socket: 8, towerId: "prism" },
  { socket: 16, towerId: "rail" },
  { socket: 22, towerId: "scatter" },
  { socket: 4, towerId: "star" },
  { socket: 10, towerId: "rail" },
  { socket: 20, towerId: "well" },
  { socket: 2, towerId: "scatter" },
  { socket: 14, towerId: "star" },
  { socket: 5, towerId: "rail" },
  { socket: 11, towerId: "scatter" },
  { socket: 17, towerId: "star" },
  { socket: 23, towerId: "rail" },
];
const TOWER_COST = resolveTowers();

function createBot(seed) {
  return { rng: createRng(`bot:${seed}`), planIdx: 0, nextOverclock: 14 };
}

function botInput(bot, view) {
  const input = {};
  const next = PLAN[bot.planIdx];
  if (next) {
    const spec = TOWER_COST[next.towerId];
    const slot = view.sockets[next.socket];
    if (slot && !slot.towerId && spec && view.scrap >= spec.cost) input.place = { socket: next.socket, towerId: next.towerId };
  }
  if (view.time >= bot.nextOverclock) {
    const armed = view.sockets.filter((s) => s.towerId && s.overclockT === 0 && s.overheatT === 0);
    if (armed.length > 0) {
      input.overclockSocket = armed[nextInt(bot.rng, armed.length)].i;
      bot.nextOverclock = view.time + 9;
    } else {
      bot.nextOverclock = view.time + 2;
    }
  }
  return input;
}

function botObserve(bot, events) {
  for (const e of events) {
    if (e.type === "place") bot.planIdx += 1;
  }
}

function runMatch({ waves, seed, autoplay }) {
  const match = createMatch(seed, { waveCount: waves });
  const bot = createBot(seed);
  const waveLog = [];
  const seen = { kill: 0, leak: 0, place: 0, deny: 0, overclock: 0, overheat: 0, spawn: 0 };
  const shotKinds = new Set();
  const towerKinds = new Set();
  let maxShots = 0;
  let maxEnemies = 0;
  let prismBends = 0;
  let fieldTicks = 0;
  let slowTicks = 0;
  let guard = 0;

  for (;;) {
    guard += 1;
    if (guard > 60 * 60 * 20) return { match, waveLog, seen, error: "timeout", shotKinds, towerKinds, maxShots, maxEnemies, prismBends, fieldTicks, slowTicks };
    const view = getView(match);
    const input = autoplay ? botInput(bot, view) : {};
    const { events } = step(match, input, DT);
    botObserve(bot, events);
    for (const e of events) {
      if (seen[e.type] !== undefined) seen[e.type] += 1;
      if (e.type === "waveClear") {
        const v = getView(match);
        waveLog.push({ wave: e.wave, t: e.t, coreHp: v.coreHp, scrap: v.scrap, kills: v.stats.kills, leaks: v.stats.leaks });
      }
      if (e.type === "place") towerKinds.add(e.towerId);
    }
    const after = getView(match);
    if (after.shots.length > maxShots) maxShots = after.shots.length;
    if (after.enemies.length > maxEnemies) maxEnemies = after.enemies.length;
    for (const s of after.shots) {
      shotKinds.add(s.kind);
      if (s.points.length === 3) prismBends += 1;
    }
    if (after.fields.length > 0) fieldTicks += 1;
    if (after.enemies.some((e) => e.slowed)) slowTicks += 1;
    if (after.over) break;
  }
  return { match, waveLog, seen, shotKinds, towerKinds, maxShots, maxEnemies, prismBends, fieldTicks, slowTicks };
}

function checkViewPurity(view) {
  const problems = [];
  const walk = (node, path) => {
    if (node === null) return;
    const type = typeof node;
    if (type === "function" || type === "undefined" || type === "symbol") problems.push(`${path}: ${type}`);
    else if (type === "number" && !Number.isFinite(node)) problems.push(`${path}: ${node}`);
    else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (type === "object") {
      if (node.constructor && node.constructor !== Object) problems.push(`${path}: ${node.constructor.name}`);
      for (const key of Object.keys(node)) walk(node[key], `${path}.${key}`);
    }
  };
  walk(view, "view");
  try {
    JSON.parse(JSON.stringify(view));
  } catch (err) {
    problems.push(`JSON round-trip failed: ${err.message}`);
  }
  return problems;
}

function determinismCheck(opts) {
  const hash = (o) => JSON.stringify(o);
  const a = runMatch(opts);
  const b = runMatch(opts);
  return hash(getView(a.match)) === hash(getView(b.match));
}

function pauseCheck(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  for (let i = 0; i < 120; i += 1) step(match, {}, DT);
  const before = getView(match);
  for (let i = 0; i < 600; i += 1) step(match, { pause: true }, DT);
  const after = getView(match);
  return {
    ok: before.time === after.time && before.tick === after.tick && after.paused === true,
    before: before.time,
    after: after.time,
  };
}

/** 等到场上有敌人，再把塔放到敌群所在的角度上，避免探针靠运气。 */
function waitForCluster(match, minCount, maxSec) {
  for (let i = 0; i < maxSec * 60; i += 1) {
    const view = getView(match);
    if (view.enemies.length >= minCount) {
      let sx = 0;
      let sz = 0;
      for (const e of view.enemies) {
        sx += Math.cos(e.theta);
        sz += Math.sin(e.theta);
      }
      const theta = Math.atan2(sz, sx);
      const idx = ((Math.round((theta / (Math.PI * 2)) * 24) % 24) + 24) % 24;
      return { view, socket: idx };
    }
    step(match, {}, DT);
  }
  return null;
}

/** 棱镜折光探针：相邻两座棱镜，光束应折成 2 段（points 长度 3）。 */
function prismBendProbe(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  const found = waitForCluster(match, 3, 40);
  if (!found) return { ok: false, reason: "no enemy cluster to aim at" };
  const a = found.socket;
  const b = (a + 1) % 24;
  step(match, { place: { socket: a, towerId: "prism" } }, DT);
  step(match, { place: { socket: b, towerId: "prism" } }, DT);
  let bent = 0;
  let straight = 0;
  for (let i = 0; i < 60 * 40; i += 1) {
    step(match, {}, DT);
    for (const s of getView(match).shots) {
      if (s.kind !== "prism") continue;
      if (s.points.length === 3) bent += 1;
      else straight += 1;
    }
    if (bent > 0 && straight > 0) break;
  }
  return { ok: bent > 0 && straight > 0, bent, straight, sockets: [a, b] };
}

/** 坠井探针：命中后生成力场，范围内敌人被减速且轨道半径被往内拽。 */
function wellProbe(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  const found = waitForCluster(match, 3, 40);
  if (!found) return { ok: false, reason: "no enemy cluster to aim at" };
  step(match, { place: { socket: found.socket, towerId: "well" } }, DT);
  let fields = 0;
  let slowed = 0;
  let maxPull = 0;
  for (let i = 0; i < 60 * 40; i += 1) {
    step(match, {}, DT);
    const view = getView(match);
    if (view.fields.length > 0) fields += 1;
    for (const e of view.enemies) {
      if (e.slowed) slowed += 1;
      if (e.pull > maxPull) maxPull = e.pull;
    }
    if (fields > 0 && slowed > 0 && maxPull > 0.05) break;
  }
  return { ok: fields > 0 && slowed > 0 && maxPull > 0.05, fields, slowed, maxPull: Math.round(maxPull * 1000) / 1000 };
}

/** 不放塔必须漏光星核，证明失败分支与漏敌扣核真的生效。 */
function loseCheck(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  for (let i = 0; i < 60 * 300; i += 1) {
    step(match, {}, DT);
    if (match.over) break;
  }
  const view = getView(match);
  return { ok: view.result === "lose" && view.coreHp === 0, result: view.result, coreHp: view.coreHp, leaks: view.stats.leaks };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const log = opts.quiet || opts.json ? () => {} : (...args) => console.log(...args);

  log(`[smoke] 蚀核要塞 sim — seed=${opts.seed} waves=${opts.waves}`);
  const run = runMatch(opts);
  const view = getView(run.match);
  const purity = checkViewPurity(view);
  const pause = pauseCheck(opts.seed);
  const deterministic = determinismCheck(opts);
  const lose = loseCheck(opts.seed);
  const prism = prismBendProbe(opts.seed);
  const well = wellProbe(opts.seed);

  const failures = [];
  if (run.error) failures.push(`run error: ${run.error}`);
  if (run.waveLog.length < opts.waves) failures.push(`only cleared ${run.waveLog.length}/${opts.waves} waves (result=${view.result})`);
  if (view.result !== "win") failures.push(`result=${view.result} coreHp=${view.coreHp}`);
  if (run.seen.kill <= 0) failures.push("no kills");
  if (run.towerKinds.size < 3) failures.push(`only ${run.towerKinds.size} tower types placed`);
  if (run.seen.overclock <= 0) failures.push("overclock never fired");
  if (run.seen.overheat <= 0) failures.push("overheat never triggered");
  if (!prism.ok) failures.push(`prism bend probe failed: ${JSON.stringify(prism)}`);
  if (!well.ok) failures.push(`well probe failed: ${JSON.stringify(well)}`);
  if (purity.length > 0) failures.push(`view not JSON-pure: ${purity.slice(0, 3).join(", ")}`);
  if (!pause.ok) failures.push(`pause advanced sim time ${pause.before} -> ${pause.after}`);
  if (!deterministic) failures.push("same seed produced different results");
  if (!lose.ok) failures.push(`no-tower run should lose, got result=${lose.result} coreHp=${lose.coreHp}`);

  const report = {
    seed: opts.seed,
    waves: opts.waves,
    result: view.result,
    coreHp: view.coreHp,
    coreMax: view.coreMax,
    simSeconds: view.time,
    ticks: view.tick,
    scrap: view.scrap,
    towers: [...run.towerKinds].sort(),
    shotKinds: [...run.shotKinds].sort(),
    events: run.seen,
    peakEnemies: run.maxEnemies,
    peakShots: run.maxShots,
    prismBendTicks: run.prismBends,
    wellFieldTicks: run.fieldTicks,
    deterministic,
    prismBendProbe: prism,
    wellProbe: well,
    loseWithoutTowers: lose,
    pauseFreezesTime: pause.ok,
    jsonPureView: purity.length === 0,
    waveLog: run.waveLog,
    ok: failures.length === 0,
    failures,
  };

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const w of run.waveLog) {
      log(`  wave ${String(w.wave).padStart(2)} cleared @ ${w.t.toFixed(1)}s  core ${w.coreHp}/${view.coreMax}  scrap ${w.scrap}  kills ${w.kills}  leaks ${w.leaks}`);
    }
    log(`[smoke] result=${view.result} core=${view.coreHp}/${view.coreMax} sim=${view.time.toFixed(1)}s ticks=${view.tick}`);
    log(`[smoke] towers=${report.towers.join(",")} shots=${report.shotKinds.join(",")} peakEnemies=${report.peakEnemies} peakShots=${report.peakShots}`);
    log(`[smoke] events kill=${run.seen.kill} leak=${run.seen.leak} place=${run.seen.place} deny=${run.seen.deny} overclock=${run.seen.overclock} overheat=${run.seen.overheat}`);
    log(`[smoke] prismBendTicks=${run.prismBends} wellFieldTicks=${run.fieldTicks} deterministic=${deterministic} pauseFreeze=${pause.ok} jsonPure=${purity.length === 0}`);
    log(`[smoke] probe prism: bent=${prism.bent} straight=${prism.straight} sockets=${(prism.sockets || []).join("/")} ok=${prism.ok}`);
    log(`[smoke] probe well : fieldTicks=${well.fields} slowTicks=${well.slowed} maxPullInward=${well.maxPull} ok=${well.ok}`);
    log(`[smoke] no-tower control run: result=${lose.result} core=${lose.coreHp} leaks=${lose.leaks}`);
    log(failures.length === 0 ? "[smoke] PASS" : `[smoke] FAIL\n  - ${failures.join("\n  - ")}`);
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
