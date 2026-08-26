import { TALISMANS } from "../data/talismans.js";
import { classById, COUNTER } from "../data/classes.js";
import { realmById } from "../data/realms.js";
import { reaction } from "./elements.js";

export function createActor(spec, realmId) {
  const realm = realmById(realmId || spec.realmId || "qi_refining");
  const hp = spec.hp ?? realm.hp;
  return {
    id: spec.id,
    name: spec.name,
    classId: spec.classId,
    element: spec.element,
    maxHp: hp,
    hp,
    maxQi: spec.qi ?? realm.qi,
    qi: spec.qi ?? realm.qi,
    atk: spec.atk ?? realm.atk,
    shield: 0,
    controlMs: 0,
    shred: 0,
  };
}

export function createBattle({ player, enemy, seed = 1 }) {
  const state = {
    player: createActor(player),
    enemy: createActor(enemy),
    log: [],
    finished: null,
    t: 0,
    rng: mulberry(seed),
  };

  function push(msg, extra = {}) {
    state.log.unshift({ t: state.t, msg, ...extra });
    state.log = state.log.slice(0, 24);
  }

  function checkEnd() {
    if (state.player.hp <= 0) state.finished = "lose";
    if (state.enemy.hp <= 0) state.finished = "win";
    return state.finished;
  }

  function deal(target, amount) {
    let left = amount;
    if (target.shield > 0) {
      const absorb = Math.min(target.shield, left);
      target.shield -= absorb;
      left -= absorb;
    }
    target.hp = Math.max(0, target.hp - left);
    return amount;
  }

  function cast(stroke, elementHint) {
    if (state.finished) return { events: [], state };
    const events = [];
    const cls = classById(state.player.classId);
    const talisman = TALISMANS[stroke.type] ?? TALISMANS.scribble;
    const cost = talisman.qi;
    if (state.player.qi < cost) {
      push("灵气不足，笔锋散了。", { kind: "warn" });
      return { events, state };
    }
    state.player.qi -= cost;
    const bonus = cls?.bonus?.[stroke.type] ?? 0;
    const prec = Math.max(0.2, stroke.precision ?? 0.4);
    const press = stroke.pressure ?? 0.5;
    let dmg = state.player.atk * (0.65 + prec * 1.15) * (1 + bonus) * (0.85 + press * 0.3);
    const react = reaction(elementHint || cls?.element, state.enemy.element);
    dmg *= react.damage;
    if (COUNTER[state.player.classId] === state.enemy.classId) dmg *= 1.18;
    if (COUNTER[state.enemy.classId] === state.player.classId) dmg *= 0.88;
    dmg *= 1 + (state.enemy.shred || 0);

    if (stroke.type === "circle") {
      const shield = 18 + prec * 42 * (1 + bonus);
      state.player.shield += shield;
      push(`${talisman.name} · 护盾 +${Math.round(shield)}`, { kind: "buff" });
    } else if (stroke.type === "cloud") {
      const heal = 16 + prec * 36 * (1 + bonus);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
      push(`${talisman.name} · 回春 ${Math.round(heal)}`, { kind: "heal" });
    } else if (stroke.type === "curve") {
      state.enemy.controlMs += 700 + prec * 900 + (react.control || 0);
      const hit = deal(state.enemy, dmg * 0.55);
      push(`${talisman.name} · 束缚并伤 ${Math.round(hit)}`, { kind: "ctrl" });
    } else if (stroke.type === "zigzag") {
      state.enemy.shred = Math.min(0.35, state.enemy.shred + 0.08 + prec * 0.08);
      const hit = deal(state.enemy, dmg * 1.15);
      push(`${talisman.name} · 破甲穿刺 ${Math.round(hit)}`, { kind: "hit" });
    } else if (stroke.type === "spiral") {
      const hit = deal(state.enemy, dmg * 1.25);
      push(`${talisman.name} · 阵法轰击 ${Math.round(hit)}`, { kind: "aoe" });
    } else {
      const hit = deal(state.enemy, dmg);
      push(`${talisman.name} · ${Math.round(hit)}`, { kind: "hit" });
    }

    if (react.label) push(react.label, { kind: "react" });
    events.push({ type: "cast", talisman, stroke });
    checkEnd();
    return { events, state };
  }

  function tick(dtMs) {
    if (state.finished) return state;
    state.t += dtMs;
    state.player.qi = Math.min(state.player.maxQi, state.player.qi + dtMs * 0.008);
    state.enemy.controlMs = Math.max(0, state.enemy.controlMs - dtMs);
    if (state.enemy.controlMs > 0) return state;
    if (state.t % 1800 < dtMs) {
      const roll = state.rng();
      const raw = state.enemy.atk * (0.85 + roll * 0.4);
      const hit = deal(state.player, raw);
      push(`${state.enemy.name} 反噬 ${Math.round(hit)}`, { kind: "enemy" });
      checkEnd();
    }
    return state;
  }

  return { cast, tick, getState: () => state };
}

function mulberry(seed) {
  let s = seed | 0 || 1;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
