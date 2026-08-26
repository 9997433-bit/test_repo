/** 敌人原型表（战斗控制器按关卡缩放系数实例化）。 */
export const ENEMY_TYPES = {
  slime: {
    id: "slime", name: "史莱姆砖怪", w: 46, h: 40, hp: 46, armor: 0, touch: 8,
    resist: { fire: -0.2, ice: 0, thunder: 0 }, color: "#7ee08a", shape: "slime",
  },
  pigeon: {
    id: "pigeon", name: "飞行鸽盗", w: 42, h: 34, hp: 32, armor: 0, touch: 6, drift: 42,
    resist: { fire: 0, ice: 0.1, thunder: -0.25 }, color: "#9fd6ff", shape: "bird",
  },
  pig: {
    id: "pig", name: "盔甲猪", w: 54, h: 46, hp: 82, armor: 8, touch: 12,
    resist: { fire: 0.1, ice: 0, thunder: 0.1 }, color: "#ff9fb0", shape: "pig",
  },
  crab: {
    id: "crab", name: "钉盾蟹", w: 52, h: 42, hp: 68, armor: 5, touch: 10, spiky: true,
    resist: { fire: 0, ice: -0.25, thunder: 0 }, color: "#ff8a3d", shape: "crab",
  },
  totem: {
    id: "totem", name: "回复图腾", w: 40, h: 52, hp: 54, armor: 2, touch: 4, heals: 8,
    resist: { fire: -0.1, ice: 0, thunder: 0.15 }, color: "#c9a6ff", shape: "totem",
  },
  chef_fox: {
    id: "chef_fox", name: "厨子狐", w: 58, h: 54, hp: 160, armor: 10, touch: 16, elite: true,
    resist: { fire: 0.25, ice: -0.15, thunder: 0 }, color: "#ffb36b", shape: "fox",
  },
  boss_pot: {
    id: "boss_pot", name: "魔王油锅", w: 116, h: 92, hp: 620, armor: 12, touch: 22, boss: true,
    resist: { fire: 0.4, ice: -0.3, thunder: 0 }, color: "#ff6b4d", shape: "pot",
  },
  boss_statue: {
    id: "boss_statue", name: "海神雕像", w: 108, h: 108, hp: 720, armor: 18, touch: 24, boss: true,
    resist: { fire: 0, ice: 0.35, thunder: -0.25 }, color: "#6fd3d0", shape: "statue",
  },
  boss_hatcher: {
    id: "boss_hatcher", name: "机械孵化器", w: 124, h: 88, hp: 860, armor: 20, touch: 26, boss: true, spawns: "slime",
    resist: { fire: 0.1, ice: 0.1, thunder: 0.3 }, color: "#b8c2cc", shape: "machine",
  },
};

export const ENEMY_LIST = Object.values(ENEMY_TYPES);

export function makeEnemy(typeId, x, y, scale = 1, extra = {}) {
  const t = ENEMY_TYPES[typeId] ?? ENEMY_TYPES.slime;
  const hp = Math.max(1, Math.round(t.hp * scale));
  return {
    id: `${typeId}-${x}-${y}-${Math.round(Math.random() * 1e6)}`,
    type: t.id,
    name: t.name,
    x,
    y,
    w: t.w,
    h: t.h,
    hp,
    maxHp: hp,
    armor: Math.round((t.armor ?? 0) * Math.min(2, scale)),
    touch: Math.round((t.touch ?? 6) * Math.min(2.5, scale)),
    resist: { ...(t.resist ?? {}) },
    color: t.color,
    shape: t.shape,
    boss: !!t.boss,
    elite: !!t.elite,
    heals: t.heals ?? 0,
    drift: t.drift ?? 0,
    driftPhase: Math.random() * Math.PI * 2,
    spawns: t.spawns ?? null,
    spiky: !!t.spiky,
    alive: true,
    restitution: t.boss ? 0.9 : 0.72,
    status: { burn: 0, freeze: 0, shock: 0 },
    flash: 0,
    ...extra,
  };
}
