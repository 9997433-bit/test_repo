/**
 * 冒险关卡表：6 章 × 4 关。
 * 第 1 章手工摆放（教学曲线），第 2–6 章按主题用确定性随机生成。
 */
import { createRng, hashSeed } from "../core/rng.js";

export const CHAPTERS = [
  { id: 1, name: "农场晨曦", theme: "farm", pool: ["slime", "pigeon"], boss: "boss_pot", scale: 1.0, desc: "鸡窝边的第一场蛋战" },
  { id: 2, name: "夜市霓虹", theme: "night", pool: ["slime", "pigeon", "pig"], boss: "boss_pot", scale: 1.5, desc: "霓虹灯下的油摊争夺" },
  { id: 3, name: "火山温泉", theme: "volcano", pool: ["pig", "crab", "slime"], boss: "boss_pot", scale: 2.2, desc: "滚烫泉水里的硬壳军团" },
  { id: 4, name: "冰川港", theme: "glacier", pool: ["crab", "totem", "pigeon"], boss: "boss_statue", scale: 3.1, desc: "冰面打滑，弹道难料" },
  { id: 5, name: "电路都市", theme: "circuit", pool: ["pigeon", "pig", "totem"], boss: "boss_hatcher", scale: 4.2, desc: "传送门与风扇的立体迷宫" },
  { id: 6, name: "魔王厨房", theme: "kitchen", pool: ["pig", "crab", "chef_fox"], boss: "boss_pot", scale: 5.6, desc: "决战油锅之上" },
];

const W = 480;

function pegRow(y, count, startX = 60, endX = 420, type = "peg") {
  const out = [];
  const span = count > 1 ? (endX - startX) / (count - 1) : 0;
  for (let i = 0; i < count; i++) out.push({ x: startX + span * i, y, r: 9, type });
  return out;
}

function enemyRow(type, y, count, startX = 60, gap = 78) {
  const out = [];
  for (let i = 0; i < count; i++) out.push({ type, x: startX + gap * i, y });
  return out;
}

/** —— 第 1 章：手工关 —— */
const CH1 = [
  {
    id: "1-1",
    name: "破壳而出",
    intro: "拖拽瞄准，松手下蛋！",
    playerHp: 100,
    descend: 12,
    scale: 1,
    enemies: [...enemyRow("slime", 210, 4, 78, 96), ...enemyRow("slime", 296, 3, 126, 96)],
    pegs: [...pegRow(430, 5, 90, 390), ...pegRow(520, 4, 130, 350), ...pegRow(610, 3, 170, 310)],
    bricks: [],
    rewards: { gold: 90, shards: 6 },
  },
  {
    id: "1-2",
    name: "谷仓夜袭",
    intro: "钉板会把蛋弹回敌人堆里",
    playerHp: 100,
    descend: 16,
    scale: 1.15,
    enemies: [
      ...enemyRow("slime", 200, 5, 60, 88),
      ...enemyRow("pigeon", 288, 3, 110, 110),
      { type: "slime", x: 220, y: 372 },
    ],
    pegs: [...pegRow(420, 6, 60, 420), ...pegRow(500, 5, 100, 380), ...pegRow(590, 4, 140, 340)],
    bricks: [
      { x: 40, y: 340, w: 60, h: 22, hp: 34, color: "#8a6a4a" },
      { x: 380, y: 340, w: 60, h: 22, hp: 34, color: "#8a6a4a" },
    ],
    rewards: { gold: 120, shards: 8 },
  },
  {
    id: "1-3",
    name: "铁皮猪圈",
    intro: "炸弹钉能一次清一片",
    playerHp: 100,
    descend: 20,
    scale: 1.35,
    enemies: [
      ...enemyRow("pig", 196, 3, 84, 130),
      ...enemyRow("slime", 282, 4, 70, 96),
      ...enemyRow("pigeon", 360, 2, 150, 160),
    ],
    pegs: [
      ...pegRow(432, 7, 46, 434),
      { x: 240, y: 500, r: 12, type: "bomb" },
      ...pegRow(566, 5, 90, 390),
      { x: 130, y: 640, r: 12, type: "bomb" },
      { x: 350, y: 640, r: 12, type: "bomb" },
    ],
    bricks: [
      { x: 150, y: 148, w: 180, h: 20, hp: 60, kind: "steel", color: "#8a93a6" },
      { x: 60, y: 452, w: 44, h: 20, hp: 40, kind: "bomb", color: "#ff8a3d" },
      { x: 376, y: 452, w: 44, h: 20, hp: 40, kind: "bomb", color: "#ff8a3d" },
    ],
    slopes: [
      { x1: 0, y1: 660, x2: 120, y2: 706, thickness: 8 },
      { x1: 480, y1: 660, x2: 360, y2: 706, thickness: 8 },
    ],
    rewards: { gold: 150, shards: 10 },
  },
  {
    id: "1-4",
    name: "魔王油锅",
    intro: "BOSS 每 3 回合发动攻击",
    playerHp: 120,
    descend: 22,
    scale: 1.5,
    boss: true,
    enemies: [
      { type: "boss_pot", x: 182, y: 176, scale: 1.0 },
      ...enemyRow("slime", 320, 4, 60, 100),
      { type: "totem", x: 220, y: 402 },
    ],
    pegs: [...pegRow(468, 6, 58, 422), ...pegRow(556, 5, 96, 384), { x: 240, y: 640, r: 13, type: "bomb" }],
    bricks: [
      { x: 20, y: 470, w: 40, h: 20, hp: 46, color: "#a05a3a" },
      { x: 420, y: 470, w: 40, h: 20, hp: 46, color: "#a05a3a" },
    ],
    rewards: { gold: 240, shards: 18 },
  },
];

function generateStage(chapter, index) {
  const stageNo = index + 1;
  const id = `${chapter.id}-${stageNo}`;
  const rng = createRng(hashSeed(`cnyd-${id}`));
  const isBoss = stageNo === 4;
  const scale = chapter.scale * (1 + index * 0.16);
  const enemies = [];

  if (isBoss) {
    enemies.push({ type: chapter.boss, x: 178, y: 170, scale: scale * 0.9 });
    const minions = rng.int(3, 5);
    for (let i = 0; i < minions; i++) {
      enemies.push({ type: rng.pick(chapter.pool), x: 44 + i * 84 + rng.range(-10, 10), y: 330 + rng.int(0, 1) * 72 });
    }
  } else {
    const rows = 2 + (stageNo >= 3 ? 1 : 0);
    for (let r = 0; r < rows; r++) {
      const count = rng.int(3, 5);
      const gap = (W - 120) / Math.max(1, count - 1 || 1);
      for (let i = 0; i < count; i++) {
        enemies.push({
          type: rng.pick(chapter.pool),
          x: 56 + (count === 1 ? 180 : gap * i) + rng.range(-8, 8),
          y: 190 + r * 84,
        });
      }
    }
    if (stageNo >= 3 && rng.chance(0.6)) enemies.push({ type: "chef_fox", x: rng.range(80, 340), y: 400 });
  }

  const pegs = [];
  const rows = rng.int(3, 4);
  for (let r = 0; r < rows; r++) {
    const y = 440 + r * 66;
    const count = rng.int(4, 7);
    const inset = 40 + rng.range(0, 40);
    pegs.push(...pegRow(y, count, inset, W - inset, rng.chance(0.18) ? "bomb" : "peg"));
  }

  const bricks = [];
  if (chapter.theme === "circuit" || chapter.theme === "kitchen") {
    bricks.push({ x: 130, y: 150, w: 220, h: 18, hp: 70, kind: "steel", color: "#8a93a6" });
  }
  const brickCount = rng.int(2, 5);
  for (let i = 0; i < brickCount; i++) {
    bricks.push({
      x: rng.range(24, W - 84),
      y: rng.range(330, 470),
      w: rng.int(40, 70),
      h: 20,
      hp: Math.round(34 * scale),
      kind: rng.chance(0.2) ? "bomb" : "brick",
      color: chapter.theme === "volcano" ? "#a05a3a" : chapter.theme === "glacier" ? "#6fa8d0" : "#7a6aa0",
    });
  }

  const slopes = [];
  if (rng.chance(0.7)) {
    slopes.push({ x1: 0, y1: 640 + rng.range(-30, 30), x2: 140, y2: 706, thickness: 8 });
    slopes.push({ x1: W, y1: 640 + rng.range(-30, 30), x2: 340, y2: 706, thickness: 8 });
  }

  const ice = chapter.theme === "glacier" ? [{ x: 30, y: 500, w: 420, h: 14 }] : [];
  const fans =
    chapter.theme === "circuit"
      ? [{ x: 0, y: 300, w: 120, h: 300, ax: 260, ay: 0 }, { x: 360, y: 300, w: 120, h: 300, ax: -260, ay: 0 }]
      : [];
  const portals =
    chapter.theme === "circuit" && rng.chance(0.7)
      ? [{ x: 60, y: 620, r: 16, tx: 420, ty: 260 }]
      : [];

  return {
    id,
    name: `${chapter.name} ${stageNo}`,
    intro: isBoss ? `${chapter.name} · BOSS 战` : chapter.desc,
    playerHp: isBoss ? 120 + chapter.id * 10 : 100 + chapter.id * 6,
    descend: 14 + chapter.id * 3 + stageNo * 2,
    scale,
    boss: isBoss,
    enemies,
    pegs,
    bricks,
    slopes,
    ice,
    fans,
    portals,
    rewards: { gold: Math.round(90 * scale + stageNo * 30), shards: Math.round(6 * chapter.id + stageNo * 2) },
  };
}

function buildAll() {
  const stages = [];
  for (const chapter of CHAPTERS) {
    for (let i = 0; i < 4; i++) {
      const stage =
        chapter.id === 1
          ? { ...CH1[i], boss: i === 3, slopes: CH1[i].slopes ?? [], ice: [], fans: [], portals: [] }
          : generateStage(chapter, i);
      stages.push({ ...stage, chapter: chapter.id, theme: chapter.theme, index: stages.length + 1 });
    }
  }
  return stages;
}

export const STAGES = buildAll();

export function stageByIndex(index) {
  return STAGES[Math.max(0, Math.min(STAGES.length - 1, index - 1))];
}

export function stagesOfChapter(chapterId) {
  return STAGES.filter((s) => s.chapter === chapterId);
}

export const TOTAL_STAGES = STAGES.length;
