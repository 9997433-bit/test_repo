#!/usr/bin/env node
// 无头冒烟：不依赖渲染层，纯 node 跑通 N 波。
//   node src/sim/smoke.mjs [--waves=5] [--seed=7] [--quiet] [--json]
// 退出码 0 = 通过。失败会打印原因。
import { createMatch, step, getView } from "./index.js";
import { BOT_TOWERS as TOWERS, BOT_TOWER_IDS as TOWER_IDS, botInput, createBot, crowdSocket } from "./bot.mjs";

const DT = 1 / 60;

function parseArgs(argv) {
  const out = { waves: 5, seed: 7, quiet: false, json: false, autoplay: true, trace: false };
  for (const arg of argv) {
    const m = /^--([a-zA-Z]+)(?:=(.*))?$/.exec(arg);
    if (!m) continue;
    const [, key, value] = m;
    if (key === "waves") out.waves = Number(value);
    else if (key === "seed") out.seed = /^-?\d+$/.test(value || "") ? Number(value) : value;
    else if (key === "quiet") out.quiet = true;
    else if (key === "json") out.json = true;
    else if (key === "noplay") out.autoplay = false;
    else if (key === "trace") out.trace = true;
  }
  return out;
}

function runMatch({ waves, seed, autoplay }) {
  const match = createMatch(seed, { waveCount: waves });
  const bot = createBot(seed, getView(match));
  const waveLog = [];
  const seen = { kill: 0, leak: 0, place: 0, deny: 0, overclock: 0, overheat: 0, spawn: 0, phase: 0 };
  const shotKinds = new Set();
  const towerKinds = new Set();
  const placements = [];
  const leakLog = [];
  let maxShots = 0;
  let maxEnemies = 0;
  let bentBeams = 0;
  let fieldTicks = 0;
  let slowTicks = 0;
  let guard = 0;

  for (;;) {
    guard += 1;
    if (guard > 60 * 60 * 20) {
      return { match, waveLog, seen, error: "timeout", shotKinds, towerKinds, maxShots, maxEnemies, bentBeams, fieldTicks, slowTicks, placements, leakLog };
    }
    const view = getView(match);
    const input = autoplay ? botInput(bot, view) : {};
    const { events } = step(match, input, DT);
    for (const e of events) {
      if (seen[e.type] !== undefined) seen[e.type] += 1;
      if (e.type === "waveClear") {
        const v = getView(match);
        waveLog.push({ wave: e.wave, t: e.t, coreHp: v.coreHp, scrap: v.scrap, kills: v.stats.kills, leaks: v.stats.leaks });
      }
      if (e.type === "place") {
        towerKinds.add(e.towerId);
        placements.push(`${e.towerId}@${e.socket}#${e.t.toFixed(1)}s`);
      }
      if (e.type === "leak") leakLog.push(`${e.kind}@w${match.wave}#${e.t.toFixed(1)}s`);
    }
    const after = getView(match);
    if (after.shots.length > maxShots) maxShots = after.shots.length;
    if (after.enemies.length > maxEnemies) maxEnemies = after.enemies.length;
    for (const s of after.shots) {
      shotKinds.add(s.kind);
      if (s.kind === "beam" && s.relay !== null) bentBeams += 1;
    }
    if (after.fields.length > 0) fieldTicks += 1;
    if (after.enemies.some((e) => e.slowed)) slowTicks += 1;
    if (after.over) break;
  }
  return { match, waveLog, seen, shotKinds, towerKinds, maxShots, maxEnemies, bentBeams, fieldTicks, slowTicks, placements, leakLog };
}

/** JSON 纯净：无函数 / undefined / NaN / -0 / 类实例，且 JSON 往返后深度相等。 */
function checkViewPurity(view) {
  const problems = [];
  const walk = (node, path) => {
    if (node === null) return;
    const type = typeof node;
    if (type === "function" || type === "undefined" || type === "symbol") problems.push(`${path}: ${type}`);
    else if (type === "number") {
      if (!Number.isFinite(node)) problems.push(`${path}: ${node}`);
      if (Object.is(node, -0)) problems.push(`${path}: -0`);
    } else if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (type === "object") {
      if (node.constructor && node.constructor !== Object) problems.push(`${path}: ${node.constructor.name}`);
      for (const key of Object.keys(node)) walk(node[key], `${path}.${key}`);
    }
  };
  walk(view, "view");
  try {
    const encoded = JSON.stringify(view);
    if (JSON.stringify(JSON.parse(encoded)) !== encoded) problems.push("JSON round-trip changed the value");
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

/** 首波必须在 2 秒内出怪：契约测试用 80×0.1s 断言场上有敌人。 */
function firstWaveCheck(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  let firstSpawnT = null;
  for (let i = 0; i < 60 * 10 && firstSpawnT === null; i += 1) {
    const { events } = step(match, {}, DT);
    const spawn = events.find((e) => e.type === "spawn");
    if (spawn) firstSpawnT = spawn.t;
  }
  const coarse = createMatch(seed, { waveCount: 5 });
  for (let i = 0; i < 80; i += 1) step(coarse, {}, 0.1);
  const enemiesAt8s = getView(coarse).enemies.length;
  return { ok: firstSpawnT !== null && firstSpawnT <= 2 && enemiesAt8s > 0, firstSpawnT, enemiesAt8s };
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

/** 过载：4s ×2.2，随后停火 3s。 */
function overclockCheck(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  step(match, { place: { socket: 0, towerId: "rail" } }, DT);
  const activation = step(match, { overclockSocket: 0 }, DT);
  const armed = getView(match).sockets[0];
  let overheatAt = null;
  let readyAt = null;
  for (let i = 0; i < 60 * 12 && readyAt === null; i += 1) {
    const { events } = step(match, {}, DT);
    for (const e of events) {
      if (e.type === "overheat" && overheatAt === null) overheatAt = e.t;
      if (e.type === "ready" && readyAt === null) readyAt = e.t;
    }
  }
  const cooled = getView(match).sockets[0];
  const span = overheatAt !== null && readyAt !== null ? readyAt - overheatAt : null;
  return {
    ok:
      activation.events.some((e) => e.type === "overclock") &&
      armed.overclockT > 0 &&
      armed.overheatT === 0 &&
      overheatAt !== null &&
      Math.abs(overheatAt - 4) < 0.1 &&
      span !== null &&
      Math.abs(span - 3) < 0.1 &&
      cooled.overclockT === 0 &&
      cooled.overheatT === 0,
    overheatAt,
    overheatSpan: span === null ? null : Math.round(span * 1000) / 1000,
  };
}

/** 等到场上有敌人，再把塔放到敌群所在的角度上，避免探针靠运气。 */
function waitForCluster(match, minCount, maxSec) {
  for (let i = 0; i < maxSec * 60; i += 1) {
    const view = getView(match);
    if (view.enemies.length >= minCount) {
      const socket = crowdSocket(view);
      if (socket !== null) return { view, socket };
    }
    step(match, {}, DT);
  }
  return null;
}

/**
 * 单塔探针：把三座同类塔压在敌群那段弧上，确认它确实出伤、出对应弹道。
 * 价值 bot 只会挑性价比最高的一种塔，所以五塔各自的机制得靠这里逐个验。
 */
function towerProbe(seed, towerId) {
  const match = createMatch(seed, { waveCount: 5 });
  const found = waitForCluster(match, 3, 40);
  if (!found) return { towerId, ok: false, reason: "no enemy cluster to aim at" };
  const count = found.view.sockets.length;
  const spec = TOWERS[towerId];
  for (const offset of [0, 1, -1]) {
    const socket = ((found.socket + offset) % count + count) % count;
    match.scrap = Math.max(match.scrap, spec.cost);
    step(match, { place: { socket, towerId } }, DT);
  }
  const before = getView(match).stats;
  const kinds = new Set();
  for (let i = 0; i < 60 * 60; i += 1) {
    step(match, {}, DT);
    for (const s of getView(match).shots) kinds.add(s.kind);
    if (match.over) break;
  }
  const after = getView(match).stats;
  const damage = Math.round((after.damage - before.damage) * 100) / 100;
  const kills = after.kills - before.kills;
  return {
    towerId,
    shotKind: spec.shotKind,
    ok: damage > 0 && kinds.has(spec.shotKind),
    damage,
    kills,
    kinds: [...kinds].sort(),
  };
}

/** 棱镜折射探针：相邻两座棱镜，契约 §3.6 要求折出第 2 段（独立 beam，relay = 折射塔插座号）。 */
function prismBendProbe(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  const found = waitForCluster(match, 3, 40);
  if (!found) return { ok: false, reason: "no enemy cluster to aim at" };
  const count = found.view.sockets.length;
  const a = found.socket;
  const b = (a + 1) % count;
  step(match, { place: { socket: a, towerId: "prism" } }, DT);
  step(match, { place: { socket: b, towerId: "prism" } }, DT);
  let bent = 0;
  let straight = 0;
  for (let i = 0; i < 60 * 60; i += 1) {
    step(match, {}, DT);
    for (const s of getView(match).shots) {
      if (s.kind !== "beam") continue;
      if (s.relay !== null) bent += 1;
      else straight += 1;
    }
    if (bent > 0 && straight > 0) break;
  }
  return { ok: bent > 0 && straight > 0, bent, straight, sockets: [a, b] };
}

/** 坠井探针：光环环常驻，范围内敌人被减速并持续掉血。 */
function wellProbe(seed) {
  const match = createMatch(seed, { waveCount: 5 });
  const found = waitForCluster(match, 3, 40);
  if (!found) return { ok: false, reason: "no enemy cluster to aim at" };
  step(match, { place: { socket: found.socket, towerId: "well" } }, DT);
  let fields = 0;
  let slowed = 0;
  let pulses = 0;
  const before = getView(match).stats.damage;
  for (let i = 0; i < 60 * 60; i += 1) {
    step(match, {}, DT);
    const view = getView(match);
    if (view.fields.length > 0) fields += 1;
    for (const e of view.enemies) if (e.slowed) slowed += 1;
    if (view.shots.some((s) => s.kind === "pulse")) pulses += 1;
    if (fields > 0 && slowed > 0 && pulses > 0) break;
  }
  const dealt = getView(match).stats.damage - before;
  return {
    ok: fields > 0 && slowed > 0 && pulses > 0 && dealt > 0,
    fields,
    slowed,
    pulses,
    damage: Math.round(dealt * 100) / 100,
  };
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

/** 蚀主：跑满全表时应出现 boss 敌人并切相位。 */
function bossProbe(seed) {
  const match = createMatch(seed);
  let bossSeen = false;
  for (let i = 0; i < 60 * 30; i += 1) {
    const { events } = step(match, {}, DT);
    if (events.some((e) => e.type === "spawn" && e.boss)) bossSeen = true;
    if (match.over) break;
  }
  const total = getView(match).waveTotal;
  return { waveTotal: total, reachedBossEarly: bossSeen };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const log = opts.quiet || opts.json ? () => {} : (...args) => console.log(...args);

  log(`[smoke] 蚀核要塞 sim — seed=${opts.seed} waves=${opts.waves}`);
  const run = runMatch(opts);
  const view = getView(run.match);
  const purity = checkViewPurity(view);
  const firstWave = firstWaveCheck(opts.seed);
  const pause = pauseCheck(opts.seed);
  const overclock = overclockCheck(opts.seed);
  const deterministic = determinismCheck(opts);
  const lose = loseCheck(opts.seed);
  const prism = prismBendProbe(opts.seed);
  const well = wellProbe(opts.seed);
  const boss = bossProbe(opts.seed);
  const towerProbes = TOWER_IDS.map((id) => towerProbe(opts.seed, id));
  const brokenTowers = towerProbes.filter((p) => !p.ok);

  const failures = [];
  if (run.error) failures.push(`run error: ${run.error}`);
  if (run.waveLog.length < opts.waves) failures.push(`only cleared ${run.waveLog.length}/${opts.waves} waves (result=${view.result})`);
  if (view.result !== "win") failures.push(`result=${view.result} coreHp=${view.coreHp}`);
  if (run.seen.kill <= 0) failures.push("no kills");
  if (brokenTowers.length > 0) failures.push(`towers with no effect: ${brokenTowers.map((p) => p.towerId).join(",")}`);
  if (run.seen.overclock <= 0) failures.push("overclock never fired");
  if (run.seen.overheat <= 0) failures.push("overheat never triggered");
  if (!firstWave.ok) failures.push(`first wave too late: ${JSON.stringify(firstWave)}`);
  if (!overclock.ok) failures.push(`overclock window wrong: ${JSON.stringify(overclock)}`);
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
    prismBendTicks: run.bentBeams,
    wellFieldTicks: run.fieldTicks,
    slowTicks: run.slowTicks,
    deterministic,
    firstWave,
    overclock,
    towerProbes,
    prismBendProbe: prism,
    wellProbe: well,
    loseWithoutTowers: lose,
    boss,
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
    log(`[smoke] firstSpawn=${firstWave.firstSpawnT}s enemiesAt8s=${firstWave.enemiesAt8s} overheatAt=${overclock.overheatAt}s overheatSpan=${overclock.overheatSpan}s`);
    log(`[smoke] bentBeamTicks=${run.bentBeams} auraFieldTicks=${run.fieldTicks} slowTicks=${run.slowTicks} deterministic=${deterministic} pauseFreeze=${pause.ok} jsonPure=${purity.length === 0}`);
    for (const p of towerProbes) {
      log(`[smoke] probe ${p.towerId.padEnd(7)}: shot=${p.shotKind} damage=${p.damage} kills=${p.kills} ok=${p.ok}`);
    }
    log(`[smoke] probe prism: bent=${prism.bent} straight=${prism.straight} sockets=${(prism.sockets || []).join("/")} ok=${prism.ok}`);
    log(`[smoke] probe well : fieldTicks=${well.fields} slowTicks=${well.slowed} pulses=${well.pulses} auraDamage=${well.damage} ok=${well.ok}`);
    log(`[smoke] no-tower control run: result=${lose.result} core=${lose.coreHp} leaks=${lose.leaks}`);
    if (opts.trace) {
      log(`[smoke] placements: ${run.placements.join(" ")}`);
      log(`[smoke] leaks     : ${run.leakLog.join(" ")}`);
    }
    log(`[smoke] full table waveTotal=${boss.waveTotal}（第 ${boss.waveTotal} 波 = 蚀主）`);
    log(failures.length === 0 ? "[smoke] PASS" : `[smoke] FAIL\n  - ${failures.join("\n  - ")}`);
  }
  process.exit(failures.length === 0 ? 0 : 1);
}

main();
