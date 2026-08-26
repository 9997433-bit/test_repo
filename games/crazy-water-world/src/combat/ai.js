// 自动战斗的选择逻辑：行动序与目标选择。
// 这里的每个比较器都必须是全序且与语言环境无关——禁止任何依赖 ICU 排序规则的字符串比较。

/** 码点比较：跨引擎、跨语言环境字节稳定，是 ICU 排序比较的替代品。 */
export function byCodePoint(a, b) {
  const x = String(a);
  const y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function living(units, side) {
  return units.filter((u) => u.side === side && u.hp > 0);
}

export function anyAlive(units, side) {
  return units.some((u) => u.side === side && u.hp > 0);
}

/**
 * 行动序：速度降序 → 名字码点升序 → 我方优先 → 入场序号升序。
 * slot 兜底保证同名同速单位（关卡里成对出现的「海盗杂兵」）也有确定顺序。
 */
export function actionOrder(units) {
  return units
    .filter((u) => u.hp > 0)
    .sort(
      (a, b) =>
        b.spd - a.spd ||
        byCodePoint(a.name, b.name) ||
        byCodePoint(a.side, b.side) ||
        a.slot - b.slot,
    );
}

/**
 * 目标池：嘲讽单位 > 前排 > 后排。池内用 rng 均匀抽一个。
 * 每次调用恰好消费 1 个随机数，这是战斗快照的一部分（契约 §8.2）。
 */
export function pickTarget(rng, actor, units) {
  const foes = living(units, actor.side === "ally" ? "enemy" : "ally");
  if (!foes.length) return null;
  const taunting = foes.filter((f) => f.tauntOn);
  const pool = taunting.length ? taunting : foes;
  const front = pool.filter((f) => f.lane === "front");
  const use = front.length ? front : pool;
  const idx = Math.floor(rng() * use.length);
  return use[idx < use.length ? idx : use.length - 1];
}

/**
 * 铁钩专用目标池：优先够后排（钩人集火的意义就在于把后排拽出来），
 * 敌方没有后排时退回普通规则。同样恰好消费 1 个随机数。
 */
export function pickBackTarget(rng, actor, units) {
  const foes = living(units, actor.side === "ally" ? "enemy" : "ally");
  if (!foes.length) return null;
  const back = foes.filter((f) => f.lane === "back");
  const use = back.length ? back : foes;
  const idx = Math.floor(rng() * use.length);
  return use[idx < use.length ? idx : use.length - 1];
}

/** 奶量目标：血量百分比最低的队友，平局按入场序号——不消费随机数。 */
export function weakestAlly(units, side) {
  const mates = living(units, side);
  if (!mates.length) return null;
  let best = mates[0];
  for (const m of mates) {
    const a = m.hp / m.maxHp;
    const b = best.hp / best.maxHp;
    if (a < b || (a === b && m.slot < best.slot)) best = m;
  }
  return best;
}
