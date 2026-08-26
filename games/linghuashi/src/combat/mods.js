import { talentMult } from "../classes/talents.js";
import { beastBonus } from "../progression/beasts.js";

// 把存档中的天赋等级与灵兽被动折算成战斗修正。
// 纯函数：save → mods，便于单测与回放。
export function defaultMods() {
  return {
    dmgMult: 1,
    shieldMult: 1,
    healMult: 1,
    controlMult: 1,
    critChance: 0.05,
    dodgeChance: 0,
    qiRegenPerSec: 0,
    openingShield: 0,
  };
}

export function computeMods(save) {
  const t = save.talents || {};
  const beasts = beastBonus(save);
  return {
    // 攻系三天赋（威能/亲和/连击）整体乘算
    dmgMult: talentMult(save, "atk"),
    // 护盾稳固 + 壁垒本能 + 增益延绵 → 盾量
    shieldMult: 1 + (t.ward || 0) * 0.1 + (t.bastion || 0) * 0.08 + (t.linger || 0) * 0.04,
    // 回春之笔 → 治疗量
    healMult: 1 + (t.spring || 0) * 0.12,
    // 控制专精 → 束缚时长
    controlMult: 1 + (t.control || 0) * 0.1,
    // 墨狐：暴击率（基础 5%，封顶 45%）
    critChance: Math.min(0.45, 0.05 + (beasts.crit || 0)),
    // 灵动身法 → 闪避（封顶 25%）
    dodgeChance: Math.min(0.25, (t.dodge || 0) * 0.04),
    // 纸鲤：每秒额外灵气
    qiRegenPerSec: beasts.qiRegen || 0,
    // 山海鹿：开局护盾
    openingShield: beasts.shield || 0,
  };
}
