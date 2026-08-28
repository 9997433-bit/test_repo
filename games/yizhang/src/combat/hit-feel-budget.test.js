// 打击感的分工线：**时间封顶，分量放行**。复盘结论钉在这里，省得下一轮又有人去拧秒数。
//
//   1. 时间维度是封顶的。单次命中定格 ≤ `HIT_STOP.max = 0.12s`（验收线上限），两次定格
//      之间还有 `cooldown = 0.22s` 节流。而且它是**两级台阶**不是连续函数：过没过
//      `heavyPower = 12`（与 combat/tuning 的重击门槛同源）决定 0.08 还是 0.115，
//      combat 把倍率堆到天上去也就是那一档。
//      0.12 是留着的天花板，不是可以花掉的预算——「这一掌不够爽」不是把定格拉长的理由，
//      60fps 下 0.115s 已经是七帧，再长只会把连段剁成幻灯片。
//   2. 分量维度是放行的。这一记有多重，combat 如实写进命中记录与事件的 `power` / `impulse`
//      （`sim/step.js` 原样转成 `hit` 事件的 `power`）。下游按它放大：VFX
//      （`render/combat-vfx.js` 的 slap / heavyImpact 按 power 取粒子量与尺度）与相机冲击
//      （`render/camera.js` 的 `impulse()`，眼下 shake ≤ 1.4、fovKick ≤ 6.5）各自 clamp 住上限。
//      要「更有打击感」，动的是那两条曲线，不是本文件里的秒数——所以下面只钉「clamp 在场」
//      这条性质，不钉相机那两个具体数字：调它们是允许的，拆掉它们不是。
//
// 所以这里两头一起钉：hit-stop 的数值表原地不动、且 combat 侧堆什么倍率都顶不动它；
// 同一记的分量确实一路传到了相机冲击上，并被相机自己的上限接住。
//
// 朝向按 combat 自己的方言摆位：yaw=0 面向 +Z。

import { describe, expect, it } from "vitest";

import { HIT_STOP, createHitStop, hitStopFor, hitStopForEvents } from "../core/juice.js";
import { normalizeEvent } from "../core/view.js";
import { createCamera } from "../render/camera.js";
import { KNOCKBACK } from "../data/tuning.js";
import { GLOVE_BY_ID, resolveSlap } from "./index.js";
import { ARENA, AWAKEN, HIT, SKILLS } from "./constants.js";
import { makePlayer, makeState } from "./testkit.js";

const SELF = "A";

/**
 * 出一掌，回收 combat 写下的命中记录。
 * `behind` 时靶子背对攻方（吃 `HIT.behindMul`），否则正对。
 * `awakened` / `chain` 分别开觉醒与木棉觉醒的「第 3 下」。
 */
function slapOnce({ gloveId, dist, awakened = false, behind = false, chain = false }) {
  const a = makePlayer(SELF, { gloveId, x: 0, z: 0, yaw: 0 });
  const b = makePlayer("B", { gloveId: "cotton", x: 0, z: dist, yaw: behind ? 0 : Math.PI });
  if (awakened) a.awakenedT = AWAKEN.duration;
  if (chain) a.cottonChain = 2;
  const state = makeState([a, b], { gloveById: GLOVE_BY_ID });
  const hits = resolveSlap(state, a, undefined, 0);
  return { hits, state };
}

/** combat 的命中记录 -> `sim/step.js` 推的那条 `hit` 事件 -> view 归一化后的形状。 */
function viewHitEvent(hit) {
  return normalizeEvent({
    type: "hit",
    id: hit.attackerId,
    targetId: hit.id,
    source: "slap",
    power: hit.power,
    gloveId: hit.gloveId,
  });
}

/** 扫一遍 combat 能打出的扇击力度：八只掌 × 觉醒 × 背身 × 木棉连段 × 贴脸/够到边缘。 */
function powerSpread() {
  const out = [];
  for (const [gloveId, g] of Object.entries(GLOVE_BY_ID)) {
    const reach = g.slapRange + ARENA.playerRadius;
    for (const dist of [0.3, reach - 0.02]) {
      for (const awakened of [false, true]) {
        for (const behind of [false, true]) {
          const chain = awakened && gloveId === "cotton";
          const { hits } = slapOnce({ gloveId, dist, awakened, behind, chain });
          expect(hits, `${gloveId} @ ${dist.toFixed(2)}m 该命中`).toHaveLength(1);
          out.push({ gloveId, dist, awakened, behind, hit: hits[0] });
        }
      }
    }
  }
  return out;
}

describe("hit-stop 数值表冻结", () => {
  // 这张表是 O 席（`core/juice.js`）的域。`heavyPower` 已从 16 收到 12，与
  // `HIT.heavyPowerThreshold` / `KNOCKBACK.heavyPowerThreshold` 同源（见下面「重击门槛已对齐」
  // 一节：收拢后单次定格恒 ≤ 0.12，档位本身没动）。其余五个数照旧冻结；把 max 抬过 0.12 才是回归。
  it("六个数一个不动，0.12s 就是单次定格的天花板", () => {
    expect(HIT_STOP).toEqual({
      dealt: 0.08,
      taken: 0.065,
      heavyBonus: 0.035,
      heavyPower: 12,
      max: 0.12,
      cooldown: 0.22,
    });
  });

  it("定格永远短于冷却，且现役最重一记还没顶到天花板", () => {
    // 单次定格短于两次定格的间隔：连段中间一定有正常流速的空档，不会被剁成幻灯片
    expect(HIT_STOP.max).toBeLessThan(HIT_STOP.cooldown);
    // 0.12 是**天花板**不是当下值：打人 / 挨打各自加满重击加成也只到 0.115 / 0.1，
    // 留着的那几毫秒是余量，不是可以拿去花的预算
    expect(HIT_STOP.dealt + HIT_STOP.heavyBonus).toBe(0.115);
    expect(HIT_STOP.dealt + HIT_STOP.heavyBonus).toBeLessThan(HIT_STOP.max);
    expect(HIT_STOP.taken + HIT_STOP.heavyBonus).toBeLessThan(HIT_STOP.max);
  });
});

describe("combat 再怎么堆倍率也顶不动那 0.12s", () => {
  const HEAVY_SECONDS = HIT_STOP.dealt + HIT_STOP.heavyBonus;

  it("八只掌全排列跑一遍：定格只有轻/重两档，恒在天花板以下", () => {
    const spread = powerSpread();
    expect(spread.length).toBe(Object.keys(GLOVE_BY_ID).length * 8);

    let sawLight = 0;
    let sawHeavy = 0;
    for (const s of spread) {
      const seconds = hitStopFor(viewHitEvent(s.hit), SELF);
      const tag = `${s.gloveId} ${s.awakened ? "觉醒" : "常态"}${s.behind ? " 背身" : ""} @ ${s.dist.toFixed(2)}m`;
      expect(seconds, tag).toBeLessThanOrEqual(HIT_STOP.max);
      if (s.hit.power >= HIT_STOP.heavyPower) {
        expect(seconds, `${tag} 该在重击那一档`).toBe(HEAVY_SECONDS);
        sawHeavy += 1;
      } else {
        expect(seconds, `${tag} 该在基础那一档`).toBe(HIT_STOP.dealt);
        sawLight += 1;
      }
    }
    // 两档都得有样本，比对才不是空转
    expect(sawLight).toBeGreaterThan(0);
    expect(sawHeavy).toBeGreaterThan(0);
  });

  it("时间是两级台阶不是连续函数：power 再大也只能踏上那一档", () => {
    const spread = powerSpread();
    const powers = spread.map((s) => s.hit.power);
    const light = Math.min(...powers);
    const heavy = Math.max(...powers);
    // 木棉觉醒第 3 下（×2.2）+ 背身（×1.15）就是 combat 现有的最重一记
    expect(heavy / light).toBeGreaterThan(6);
    expect(heavy).toBeGreaterThan(HIT_STOP.heavyPower);
    expect(light).toBeLessThan(HIT_STOP.heavyPower);

    const freeze = (power) => hitStopFor({ type: "hit", playerId: SELF, source: "slap", power }, SELF);
    // 分量翻六倍，秒数只涨 43.75%（0.08 → 0.115），然后就再也不涨了
    expect(freeze(heavy) / freeze(light)).toBeCloseTo(1.4375, 9);
    expect(freeze(heavy * 100)).toBe(HEAVY_SECONDS);
    expect(freeze(Number.MAX_SAFE_INTEGER)).toBe(HEAVY_SECONDS);
    // 非有限的 power 落回基础档而不是炸出更长的定格
    expect(freeze(Infinity)).toBe(HIT_STOP.dealt);
    expect(freeze(NaN)).toBe(HIT_STOP.dealt);
  });

  it("同帧多段只停一次；闸门按 max 钳、按 cooldown 节流", () => {
    const { hits, state } = slapOnce({ gloveId: "cotton", dist: 0.3, awakened: true, chain: true });
    const heavy = viewHitEvent(hits[0]);
    const light = { ...heavy, power: 1 };
    expect(state.events.some((e) => e.type === "slap")).toBe(true);
    expect(hitStopForEvents([light, heavy, light], SELF)).toBe(HEAVY_SECONDS);

    const gate = createHitStop();
    // 闸门自己那道 min 是最后一层保险：请求十秒也只发 max
    expect(gate.request(10, 0)).toBe(true);
    expect(gate.remaining(0)).toBe(HIT_STOP.max);
    // 冷却里的第二记不再定格：连段靠 VFX 顶，不靠再冻一次
    expect(gate.request(10, HIT_STOP.cooldown - 1e-6)).toBe(false);
    expect(gate.request(10, HIT_STOP.cooldown)).toBe(true);
  });
});

// 「重击」这个词在工程里曾经有两条线：
//   * combat / data 侧：`HIT.heavyPowerThreshold` = `KNOCKBACK.heavyPowerThreshold` = 12。
//     有效击退过了它就算重击——碎地按它结算（`data/tiles.js`），命中记录与事件的 `heavy` 也按它写。
//   * 手感侧：`core/juice.js` 的 `HIT_STOP.heavyPower` 曾是 16，过了它定格才多加 35ms。
// 差着的那 4 造出一段灰区（12..16：磐石贴脸、陨掌背身这类）——碎地算重击、定格却还在基础档。
// 本轮 O 席把 16 收成 12，三处同源，灰区清空。本节钉住对齐后的四件事：
//   1. combat 侧的门槛与 tuning 同源，不许再长出第三条线；
//   2. juice 的门槛与 combat/tuning 逐字相同，「重击」全工程只有一种判读；
//   3. 对齐是安全的：按 12 判，单次定格恒 ≤ 0.12，`HIT_STOP.max` 一格没动；
//   4. 灰区为空——不存在「combat 判重、juice 还按基础档」的命中。
describe("重击门槛已对齐：combat / tuning / juice 同认 12", () => {
  const tagOf = (s) =>
    `${s.gloveId} ${s.awakened ? "觉醒" : "常态"}${s.behind ? " 背身" : ""} @ ${s.dist.toFixed(2)}m`;

  it("combat / tuning / juice 同源：12 只有一份", () => {
    expect(HIT.heavyPowerThreshold).toBe(KNOCKBACK.heavyPowerThreshold);
    expect(HIT.heavyPowerThreshold).toBe(12);
    expect(HIT_STOP.heavyPower).toBe(HIT.heavyPowerThreshold);
  });

  it("命中记录与事件都带着 heavy 出门，判读与门槛逐条一致", () => {
    const spread = powerSpread();
    let heavies = 0;
    for (const s of spread) {
      expect(s.hit.heavy, tagOf(s)).toBe(s.hit.power >= HIT.heavyPowerThreshold);
      if (s.hit.heavy) heavies += 1;
    }
    // 轻重两档都得有样本，这条比对才不是空转
    expect(heavies).toBeGreaterThan(0);
    expect(heavies).toBeLessThan(spread.length);

    const { hits, state } = slapOnce({ gloveId: "granite", dist: 0.3 });
    const ev = state.events.find((e) => e.type === "slap");
    expect(ev.heavy).toBe(hits[0].heavy);
    expect(ev.power).toBe(hits[0].power);
  });

  it("对齐是安全的：按 12 判重击，单次定格恒 ≤ 0.12，max 一格没动", () => {
    // 对齐后最长的一档还是 0.115，仍在天花板以下：收门槛只改「谁进重击档」，不改档位本身
    expect(HIT_STOP.max).toBe(0.12);
    const heaviest = hitStopFor(
      { type: "hit", playerId: SELF, source: "slap", power: Number.MAX_SAFE_INTEGER },
      SELF,
    );
    expect(heaviest).toBe(HIT_STOP.dealt + HIT_STOP.heavyBonus);
    expect(heaviest).toBeLessThan(HIT_STOP.max);

    for (const s of powerSpread()) {
      const ev = viewHitEvent(s.hit);
      const dealt = hitStopFor(ev, SELF);
      const taken = hitStopFor({ ...ev, playerId: "B", targetId: SELF }, SELF);
      expect(dealt, tagOf(s)).toBeLessThanOrEqual(HIT_STOP.max);
      expect(taken, tagOf(s)).toBeLessThanOrEqual(HIT_STOP.max);
      // 定格的档位就是 combat 自己写下的 heavy，两边不再各判一次
      expect(dealt === HIT_STOP.dealt + HIT_STOP.heavyBonus, tagOf(s)).toBe(s.hit.heavy);
      expect(taken === HIT_STOP.taken + HIT_STOP.heavyBonus, tagOf(s)).toBe(s.hit.heavy);
    }
  });

  it("灰区已清空：不存在 combat 判重、juice 还按基础档的命中", () => {
    // 灰区 = combat 判重击、juice 还按基础档定格的那一段（对齐前是 12..16）
    const gray = powerSpread().filter(
      (s) => s.hit.heavy && hitStopFor(viewHitEvent(s.hit), SELF) === HIT_STOP.dealt,
    );
    expect(gray.map(tagOf)).toEqual([]);

    // 对齐前落在灰区的那 18 记（磐石常态贴脸 14.46、陨掌常态背身 13.28 一类）现在都进了重击档
    const freeze = (power) => hitStopFor({ type: "hit", playerId: SELF, source: "slap", power }, SELF);
    for (const power of [12, 13.28, 14.46, 15.99]) {
      expect(freeze(power), `power=${power}`).toBe(HIT_STOP.dealt + HIT_STOP.heavyBonus);
    }
    // 门槛下面那一段照旧是基础档：收门槛没有把轻掌也拖进来
    expect(freeze(HIT.heavyPowerThreshold - 1e-9)).toBe(HIT_STOP.dealt);
  });
});

describe("分量走的是 VFX / 相机冲击这条道", () => {
  it("power 一路传到相机冲击上，并被相机自己的 clamp 接住", () => {
    const spread = powerSpread();
    const light = Math.min(...spread.map((s) => s.hit.power));
    const heavy = Math.max(...spread.map((s) => s.hit.power));

    // 逐字照抄 `render/renderer.js` 的 hit 分支：远处别人互殴 0.12、自己打中 0.34、
    // 自己挨打 0.55；fov kick 自己挨打 2.6、其余 1.2
    const kick = (powers, scale, fov) => {
      const rig = createCamera({});
      for (const power of powers) rig.impulse(scale * power, fov);
      return rig.state;
    };
    // 分量真的传过来了：同一条道上，重的那记比轻的那记震
    const far = kick([light], 0.12, 1.2);
    expect(far.shake).toBeGreaterThan(0);
    expect(kick([heavy], 0.12, 1.2).shake).toBeGreaterThan(far.shake);

    // 而这条道自带上限：power 再翻一万倍、连击再多打十倍，震幅与 fov kick 都停在同一个数。
    // 这里只钉「有 clamp 兜着」这条性质，不钉相机那两个具体数值——那两条曲线正是
    // 「想更有打击感」时该去调的地方（`render/camera.js`），调它不该惊动 combat 的测试。
    const huge = kick([heavy * 100], 0.55, 2.6);
    expect(huge.shake).toBe(kick([heavy * 10000], 0.55, 2.6).shake);
    expect(Number.isFinite(huge.shake)).toBe(true);
    expect(far.shake).toBeLessThan(huge.shake);

    const combo = kick(Array(400).fill(heavy), 0.55, 2.6);
    const longer = kick(Array(4000).fill(heavy), 0.55, 2.6);
    expect(combo.shake).toBe(longer.shake);
    expect(combo.fovKick).toBe(longer.fovKick);
    expect(Number.isFinite(combo.fovKick)).toBe(true);
  });

  it("命中记录带着分量出门：power 与水平冲量都随倍率涨", () => {
    const DIST = 0.3;
    const cotton = GLOVE_BY_ID.cotton;
    /** 贴脸加成：够到边缘只有 (1 − closeBonus) 倍，觉醒把 slapRange 撑大也会捎带涨一点。 */
    const closeFactor = (range) =>
      1 - HIT.closeBonus + HIT.closeBonus * Math.max(0, Math.min(1, 1 - DIST / range));

    const plain = slapOnce({ gloveId: "cotton", dist: DIST }).hits[0];
    const loud = slapOnce({ gloveId: "cotton", dist: DIST, awakened: true, chain: true }).hits[0];
    const want =
      AWAKEN.powerMul *
      SKILLS.none.awakenThirdHitMul *
      (closeFactor(cotton.slapRange * AWAKEN.rangeMul) / closeFactor(cotton.slapRange));
    expect(loud.power / plain.power).toBeCloseTo(want, 9);
    expect(Math.hypot(loud.impulse.x, loud.impulse.z)).toBeGreaterThan(
      Math.hypot(plain.impulse.x, plain.impulse.z),
    );

    // 背身加成同样只进分量，不进秒数
    const back = slapOnce({ gloveId: "cotton", dist: DIST, behind: true }).hits[0];
    expect(back.behind).toBe(true);
    expect(back.power / plain.power).toBeCloseTo(HIT.behindMul, 9);
    expect(hitStopFor(viewHitEvent(back), SELF)).toBe(hitStopFor(viewHitEvent(plain), SELF));
  });
});
