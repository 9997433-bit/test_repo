import { heroById } from "../data/heroes.js";
import { applyDamage, applySlow, applyStun, execute, knockback } from "./damage.js";

/**
 * 大招层。每个技能返回一份「juice 契约」，渲染/音效层照着演出即可，
 * 不必再去猜技能 id：
 *
 *   {
 *     id, name, fx,            // fx 是稳定的演出标识，每个技能各不相同
 *     hits, damage, kills,     // 结算摘要，可用来决定飘字与连击提示
 *     targets: number[],       // 命中敌人 id，UI 可给它们加特效
 *     cooldown,                // 本次进入的冷却
 *     juice: {
 *       shake, color, sfx, duration,   // 屏震强度 0~1 / 主色 / 音效名 / 演出时长
 *       focusT,                        // 演出焦点在路线上的进度（null = 全屏）
 *       shape,                         // 形状提示：sweep/rain/ring/arc/aura/dash
 *       text,                          // 招式名，直接用于飘字
 *     }
 *   }
 *
 * 所有伤害走 damage.js，护盾 boss 不再被大招无视。
 */

const PALETTE = {
  gold: "#c9a24a",
  cinnabar: "#b23a2f",
  ink: "#1c1610",
  moss: "#6b7a6a",
  ember: "#c46a1b",
};

function frontFirst(enemies) {
  return [...enemies].sort((a, b) => b.t - a.t);
}

function blank(id, name) {
  return {
    id,
    name,
    fx: id,
    hits: 0,
    damage: 0,
    kills: 0,
    targets: [],
    cooldown: 0,
    juice: { shake: 0, color: PALETTE.ink, sfx: "skill", duration: 0.3, focusT: null, shape: "none", text: name || "" },
  };
}

const HANDLERS = {
  /** 赵云·七进七出：沿路贯穿，命中者短暂踉跄。 */
  qijin(ctx, out) {
    for (const e of ctx.enemies) {
      const r = applyDamage(e, ctx.hero.atk * 0.95);
      if (!r.dealt && !r.absorbed) continue;
      applySlow(e, 0.7, 1.4);
      out.damage += r.dealt;
      out.hits += 1;
      out.targets.push(e.id);
      if (r.killed) out.kills += 1;
    }
    out.fx = "lance-sweep";
    out.juice = {
      shake: 0.45,
      color: PALETTE.gold,
      sfx: "sweep",
      duration: 0.55,
      focusT: ctx.frontT,
      shape: "sweep",
      text: ctx.hero.skill.name,
    };
  },

  /** 黄忠·百步穿杨：全屏箭雨，最远的那个吃满「远射」加成。 */
  baibu(ctx, out) {
    const far = [...ctx.enemies].sort((a, b) => a.t - b.t)[0];
    for (const e of ctx.enemies) {
      const mul = e === far ? 1.65 : 1.15;
      const r = applyDamage(e, ctx.hero.atk * mul);
      if (!r.dealt && !r.absorbed) continue;
      out.damage += r.dealt;
      out.hits += 1;
      out.targets.push(e.id);
      if (r.killed) out.kills += 1;
    }
    out.fx = "arrow-rain";
    out.juice = {
      shake: 0.25,
      color: PALETTE.moss,
      sfx: "twang",
      duration: 0.9,
      focusT: far ? far.t : null,
      shape: "rain",
      text: ctx.hero.skill.name,
    };
  },

  /** 张飞·当阳爆喝：只吼推进过半的敌人，击退 + 眩晕。 */
  dangyang(ctx, out) {
    let pushed = 0;
    for (const e of ctx.enemies) {
      if (e.t <= 0.45) continue;
      const r = applyDamage(e, ctx.hero.atk * 0.8);
      pushed += knockback(e, 0.08);
      applyStun(e, 1.2);
      out.damage += r.dealt;
      out.hits += 1;
      out.targets.push(e.id);
      if (r.killed) out.kills += 1;
    }
    out.fx = "shockwave";
    out.juice = {
      shake: out.hits ? 1 : 0.4,
      color: PALETTE.cinnabar,
      sfx: "roar",
      duration: 0.7,
      focusT: 0.45,
      shape: "ring",
      text: ctx.hero.skill.name,
      push: Number(pushed.toFixed(4)),
    };
  },

  /** 关羽·温酒斩华雄：扇形六人，残血直接斩。 */
  wenjiu(ctx, out) {
    for (const e of frontFirst(ctx.enemies).slice(0, 6)) {
      const r = applyDamage(e, ctx.hero.atk * 1.4);
      out.damage += r.dealt;
      out.hits += 1;
      out.targets.push(e.id);
      if (!r.killed && execute(e, 0.18)) out.juice.beheaded = (out.juice.beheaded || 0) + 1;
      if (e.hp <= 0) out.kills += 1;
    }
    out.fx = "blade-arc";
    out.juice = {
      shake: 0.6,
      color: PALETTE.cinnabar,
      sfx: "slash",
      duration: 0.5,
      focusT: ctx.frontT,
      shape: "arc",
      text: ctx.hero.skill.name,
      beheaded: out.juice.beheaded || 0,
    };
  },

  /** 刘备·仁德：无伤害增益 —— 攻速 6 秒，外加 4 秒鼓舞增伤。 */
  rende(ctx, out) {
    ctx.side.haste = Math.max(ctx.side.haste || 0, 6);
    ctx.side.rally = Math.max(ctx.side.rally || 0, 4);
    out.hits = 1;
    out.fx = "rally-aura";
    out.juice = {
      shake: 0.15,
      color: PALETTE.gold,
      sfx: "chime",
      duration: 1.2,
      focusT: null,
      shape: "aura",
      text: ctx.hero.skill.name,
      buff: { haste: 6, rally: 4 },
    };
  },

  /** 马超·西凉铁骑：撞飞排头，顺带践踏身后一小段。 */
  xiliang(ctx, out) {
    const order = frontFirst(ctx.enemies);
    const front = order[0];
    if (front) {
      const r = applyDamage(front, ctx.hero.atk * 1.8);
      knockback(front, 0.05);
      applyStun(front, 0.5);
      out.damage += r.dealt;
      out.hits += 1;
      out.targets.push(front.id);
      if (r.killed) out.kills += 1;
      for (const e of order.slice(1)) {
        if (front.t - e.t > 0.07) break;
        const t = applyDamage(e, ctx.hero.atk * 0.6);
        out.damage += t.dealt;
        out.hits += 1;
        out.targets.push(e.id);
        if (t.killed) out.kills += 1;
      }
    }
    out.fx = "cavalry-charge";
    out.juice = {
      shake: 0.7,
      color: PALETTE.ember,
      sfx: "hoof",
      duration: 0.6,
      focusT: front ? front.t : null,
      shape: "dash",
      text: ctx.hero.skill.name,
    };
  },
};

export const SKILL_FX = {
  qijin: "lance-sweep",
  baibu: "arrow-rain",
  dangyang: "shockwave",
  wenjiu: "blade-arc",
  rende: "rally-aura",
  xiliang: "cavalry-charge",
};

/**
 * 释放大招。ctx 可选（战斗层会带上格子与射程信息），不传也能工作，
 * 保证 game.js / 测试里的老调用 castSkill(side, unit, enemies) 不变。
 */
export function castSkill(side, heroUnit, enemies, ctx = {}) {
  const hero = heroById(heroUnit?.id);
  if (!hero) return blank(heroUnit?.id || "unknown", "");
  const alive = (enemies || []).filter((e) => e && e.hp > 0);
  const out = blank(hero.skill.id, hero.skill.name);
  const handler = HANDLERS[hero.skill.id];
  if (handler) {
    handler(
      {
        side,
        hero,
        heroUnit,
        enemies: alive,
        frontT: alive.length ? Math.max(...alive.map((e) => e.t)) : null,
        cellIndex: ctx.cellIndex ?? -1,
        reach: ctx.reach ?? hero.range,
      },
      out,
    );
  }
  heroUnit.cooldown = hero.skill.cd;
  out.cooldown = hero.skill.cd;
  out.damage = Number(out.damage.toFixed(2));
  return out;
}
