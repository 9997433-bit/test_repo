/**
 * 极限挑战（肉鸽）运行态（Opus-3 所有权）。
 *
 * GDD 硬约束：肉鸽「不能带自己的养成」。因此本文件构造的一切状态都活在 run 对象里，
 * 与账号存档完全隔离——run 不读 `heroLevels` / `heroStars` / `dex` / `fishing`，
 * 也不会写回除 `bestRogueWave` 之外的任何存档字段（见 `finishRogueRun`）。
 */
import {
  ROGUE_ATK_PER_LEVEL,
  ROGUE_BASE_LEVEL,
  ROGUE_BASE_STAR,
  ROGUE_MAX_LEVEL,
  clampInt,
} from "./constants.js";
import { heroList } from "./catalog.js";
import { createRng, sampleWithout } from "./rng.js";

export const ROGUE_FIELD_SIZE = 5;
export const DRAFT_EVERY_WAVES = 2;
export const DRAFT_OPTIONS = 3;

/** 本地神器表；Fable-3 若在 `src/data` 补 ARTIFACTS，可由调用方通过 pool 覆盖。 */
export const ROGUE_ARTIFACTS = {
  yolk_core: { id: "yolk_core", name: "蛋黄核心", mods: { atk: 0.15 } },
  spring_shell: { id: "spring_shell", name: "弹簧壳", mods: { bounce: 0.08 } },
  twin_yolk: { id: "twin_yolk", name: "双黄蛋", mods: { extraEggs: 1 } },
  static_down: { id: "static_down", name: "静电绒毛", mods: { crit: 0.08 } },
  heavy_shell: { id: "heavy_shell", name: "铅壳", mods: { eggPower: 0.12, radius: 1 } },
  combo_metronome: { id: "combo_metronome", name: "连击节拍器", mods: { comboDecay: -0.25 } },
  molten_yolk: { id: "molten_yolk", name: "熔岩蛋黄", mods: { burn: 1 } },
  frost_shell: { id: "frost_shell", name: "霜壳", mods: { freeze: 1 } },
  peg_magnet: { id: "peg_magnet", name: "钉板磁铁", mods: { magnet: 0.2 } },
  overtime_clock: { id: "overtime_clock", name: "加时闹钟", mods: { energy: 0.2 } },
};

/**
 * 新开一局肉鸽。`heroPool` 默认取全部英雄 id，不含任何账号进度。
 */
export function createRogueRun({ seed = Date.now(), heroPool, artifactPool } = {}) {
  const pool = (heroPool ?? heroList().map((h) => h.id)).filter(Boolean);
  return {
    kind: "rogue",
    seed,
    rngState: createRng(seed).getState(),
    wave: 0,
    squad: [],
    artifacts: [],
    tempLevels: {},
    heroPool: pool,
    artifactPool: artifactPool ?? Object.keys(ROGUE_ARTIFACTS),
    draft: null,
    finished: false,
    log: [],
  };
}

function runRng(run) {
  const rng = createRng(run.seed);
  rng.setState(run.rngState ?? rng.getState());
  return rng;
}

function commitRng(run, rng) {
  run.rngState = rng.getState();
}

export function rogueLevelOf(run, heroId) {
  return clampInt(run?.tempLevels?.[heroId] ?? ROGUE_BASE_LEVEL, ROGUE_BASE_LEVEL, ROGUE_MAX_LEVEL);
}

export function rogueStarOf() {
  return ROGUE_BASE_STAR;
}

/** 每 DRAFT_EVERY_WAVES 波给一次三选一。 */
export function shouldOfferDraft(run) {
  if (!run || run.finished) return false;
  if (run.wave <= 0) return true;
  return run.wave % DRAFT_EVERY_WAVES === 0;
}

/**
 * 生成三选一。队伍未满优先给英雄，满队后英雄选项会变成「强化」（临时等级）。
 */
export function rollDraft(run, { count = DRAFT_OPTIONS, kind } = {}) {
  if (!run || run.finished) return null;
  const rng = runRng(run);
  const wantArtifact = kind === "artifact" || (!kind && run.wave > 0 && run.wave % 4 === 0);

  let options;
  if (wantArtifact) {
    const owned = new Set(run.artifacts);
    const pool = run.artifactPool.filter((id) => !owned.has(id));
    options = sampleWithout(pool, count, rng).map((id) => ({
      type: "artifact",
      id,
      name: ROGUE_ARTIFACTS[id]?.name ?? id,
      mods: ROGUE_ARTIFACTS[id]?.mods ?? {},
    }));
  } else {
    const onField = new Set(run.squad);
    const fresh = run.heroPool.filter((id) => !onField.has(id));
    const full = run.squad.length >= ROGUE_FIELD_SIZE;
    const pool = full || fresh.length < count ? run.heroPool : fresh;
    options = sampleWithout(pool, count, rng).map((id) => ({
      type: onField.has(id) ? "upgrade" : "hero",
      id,
      level: rogueLevelOf(run, id),
    }));
  }

  commitRng(run, rng);
  run.draft = { wave: run.wave, options };
  return run.draft;
}

/**
 * 应用一次选择。同一英雄重复出现时转化为临时等级（+1），是肉鸽内唯一的成长来源。
 */
export function applyDraft(run, choiceId) {
  if (!run || !run.draft) return { ok: false, code: "NO_DRAFT", reason: "当前没有可选项" };
  const choice = run.draft.options.find((o) => o.id === choiceId);
  if (!choice) return { ok: false, code: "BAD_CHOICE", reason: "选项不存在" };

  if (choice.type === "artifact") {
    if (!run.artifacts.includes(choice.id)) run.artifacts.push(choice.id);
  } else if (run.squad.includes(choice.id) || run.squad.length >= ROGUE_FIELD_SIZE) {
    if (!run.squad.includes(choice.id)) {
      return { ok: false, code: "SQUAD_FULL", reason: "上场位已满，只能强化在场英雄" };
    }
    run.tempLevels[choice.id] = Math.min(ROGUE_MAX_LEVEL, rogueLevelOf(run, choice.id) + 1);
  } else {
    run.squad.push(choice.id);
    run.tempLevels[choice.id] = ROGUE_BASE_LEVEL;
  }

  run.log.push({ wave: run.wave, choice: { ...choice } });
  run.draft = null;
  return { ok: true, choice };
}

export function advanceWave(run) {
  if (!run || run.finished) return run;
  run.wave += 1;
  return run;
}

/** 肉鸽神器提供的全局乘区，只在 run 内生效。 */
export function rogueArtifactMods(run) {
  const total = { atk: 0, crit: 0, extraEggs: 0, eggPower: 0, energy: 0, radius: 0 };
  for (const id of run?.artifacts ?? []) {
    const mods = ROGUE_ARTIFACTS[id]?.mods ?? {};
    for (const key of Object.keys(total)) total[key] += Number(mods[key]) || 0;
  }
  return total;
}

/**
 * 结束一局。唯一写回账号存档的字段是 `bestRogueWave`（历史最好成绩），
 * 不发放金币 / 碎片 / 经验，保证肉鸽与养成互不污染。
 */
export function finishRogueRun(run, save) {
  if (!run) return { ok: false, code: "NO_RUN", reason: "没有进行中的挑战" };
  run.finished = true;
  const summary = {
    wave: run.wave,
    squad: [...run.squad],
    artifacts: [...run.artifacts],
    tempLevels: { ...run.tempLevels },
  };
  if (save && typeof save === "object") {
    const best = Math.max(Math.floor(Number(save.bestRogueWave) || 0), run.wave);
    save.bestRogueWave = best;
    summary.newRecord = best === run.wave && run.wave > 0;
  }
  return { ok: true, ...summary };
}

/** 肉鸽临时队的攻击乘区：只看 run 内临时等级与神器。 */
export function rogueAtkMulFor(run, heroId) {
  const level = rogueLevelOf(run, heroId);
  const artifacts = rogueArtifactMods(run);
  return (1 + (level - ROGUE_BASE_LEVEL) * ROGUE_ATK_PER_LEVEL) * (1 + artifacts.atk);
}
