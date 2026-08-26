// 快速冒烟探针：识别、模板、战斗、tick 可靠性、解锁与迁移。任何一步失败即非零退出。
import { classifyStroke } from "../src/drawing/recognizer.js";
import { templatePoints, TEMPLATE_TYPES } from "../src/drawing/templates.js";
import { createBattle } from "../src/combat/battle.js";
import { computeMods } from "../src/combat/mods.js";
import { checkInkUnlock, recordStroke } from "../src/progression/unlock.js";
import { defaultSave, migrateSave } from "../src/core/store.js";

function fail(msg, extra) {
  console.error("probe FAIL:", msg, extra ?? "");
  process.exit(1);
}

// 1) 手绘直线识别
const line = Array.from({ length: 36 }, (_, i) => ({ x: i * 8, y: 20, t: i * 10 }));
const r = classifyStroke(line);
if (r.type !== "line") fail("expected line", r);

// 2) 六式模板全部自识别（键盘施法路径）
for (const t of TEMPLATE_TYPES) {
  const res = classifyStroke(templatePoints(t));
  if (res.type !== t) fail(`template ${t} classified as ${res.type}`);
  if (res.precision < 0.5) fail(`template ${t} precision too low`, res.precision);
}

// 3) 战斗：法修螺旋应对体修造成伤害
const b = createBattle({
  player: { id: "p", name: "p", classId: "fa", element: "fire", hp: 100, atk: 20, qi: 80 },
  enemy: { id: "e", name: "e", classId: "ti", element: "earth", hp: 40, atk: 4 },
});
b.cast({ type: "spiral", precision: 0.8, pressure: 0.5 });
if (b.getState().enemy.hp >= 40) fail("spiral did no damage");

// 4) tick 可靠性：一次大步长与多次小步长出手次数一致
function attacks(tickFn) {
  const bb = createBattle({
    player: { id: "p", name: "p", classId: "fa", element: "fire", hp: 9999, atk: 1, qi: 80 },
    enemy: { id: "e", name: "e", classId: "ti", element: "earth", hp: 9999, atk: 1, atkMs: 1700 },
    seed: 3,
  });
  tickFn(bb);
  return bb.getState().log.filter((l) => l.kind === "enemy").length;
}
const bigTick = attacks((bb) => bb.tick(8500));
const smallTicks = attacks((bb) => {
  for (let i = 0; i < 85; i += 1) bb.tick(100);
});
if (bigTick !== 5 || smallTicks !== 5) fail("tick accumulator mismatch", { bigTick, smallTicks });

// 5) 天赋/灵兽折算
const mods = computeMods({ ...defaultSave(), talents: { might: 5 }, beasts: [{ passive: "crit", value: 0.08 }] });
if (Math.abs(mods.dmgMult - 1.3) > 1e-9) fail("talent dmgMult wrong", mods.dmgMult);
if (Math.abs(mods.critChance - 0.13) > 1e-9) fail("beast crit wrong", mods.critChance);

// 6) 墨客解锁与 v1 存档迁移
let save = defaultSave();
for (const t of TEMPLATE_TYPES) save = recordStroke(save, { type: t, precision: 0.7 });
if (!checkInkUnlock(save)) fail("ink unlock should trigger");
const migrated = migrateSave({ version: 1, gallery: [{ type: "line", precision: 0.9 }] });
if (migrated?.version !== 2 || migrated.strokeStats.line !== 0.9) fail("v1 migration broken", migrated);

console.log("probe ok", {
  line: r.precision.toFixed(2),
  templates: TEMPLATE_TYPES.length,
  enemyHp: b.getState().enemy.hp,
  ticks: `${bigTick}/${smallTicks}`,
});
