/** 小人通勤：在民居/工坊/火炉间往返；严寒时聚拢到火炉取暖。 */
import { mulberry32 } from "../engine/rng.js";
import { BUILDINGS } from "../data/buildings.js";

const MAX_SHOWN = 26;
const WORKPLACES = ["lumber", "hunter", "coalMine", "ironMine", "kitchen", "warehouse", "academy"];

export function createVillagers(seed = 733) {
  return { list: [], rng: mulberry32(seed) };
}

function activeSpots(state, freezing) {
  const spots = [];
  const furnaceTile = BUILDINGS.furnace.tile;
  if (freezing) return [furnaceTile, furnaceTile, furnaceTile];
  if (state.buildings.house >= 1) spots.push(BUILDINGS.house.tile);
  for (const id of WORKPLACES) {
    if (state.buildings[id] >= 1) spots.push(BUILDINGS[id].tile);
  }
  spots.push(furnaceTile);
  return spots;
}

function newTarget(v, spots, rng) {
  const [gx, gy] = spots[Math.floor(rng() * spots.length)];
  v.tx = gx + (rng() - 0.5) * 1.4;
  v.ty = gy + (rng() - 0.5) * 1.4;
  v.pause = 0.6 + rng() * 2.4;
}

export function updateVillagers(v, state, dt, freezing) {
  const want = Math.min(MAX_SHOWN, Math.floor(state.population));
  const spots = activeSpots(state, freezing);
  while (v.list.length < want) {
    const p = {
      x: BUILDINGS.furnace.tile[0] + (v.rng() - 0.5) * 3,
      y: BUILDINGS.furnace.tile[1] + (v.rng() - 0.5) * 3,
      tx: 0,
      ty: 0,
      pause: 0,
      speed: 0.55 + v.rng() * 0.35,
      cloak: v.rng() < 0.5 ? "#5d4a3a" : "#4a5568",
      phase: v.rng() * Math.PI * 2,
    };
    newTarget(p, spots, v.rng);
    v.list.push(p);
  }
  if (v.list.length > want) v.list.length = Math.max(0, want);

  for (const p of v.list) {
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.08) {
      p.pause -= dt;
      if (p.pause <= 0) newTarget(p, spots, v.rng);
      continue;
    }
    const spd = p.speed * (freezing ? 1.5 : 1) * dt;
    p.x += (dx / dist) * spd;
    p.y += (dy / dist) * spd;
  }
}

/** 绘制：project(gx, gy) → {x, y} 屏幕坐标。 */
export function drawVillagers(v, ctx, project, time, cold) {
  for (const p of v.list) {
    const { x, y } = project(p.x, p.y);
    const bob = Math.sin(time * 7 + p.phase) * 0.9;
    ctx.save();
    ctx.translate(x, y + bob * 0.3);
    // 影子
    ctx.fillStyle = "rgba(30,40,70,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 1.5, 3.4, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // 披风身体
    ctx.fillStyle = p.cloak;
    ctx.beginPath();
    ctx.moveTo(-2.6, 0);
    ctx.quadraticCurveTo(0, -8.5, 2.6, 0);
    ctx.closePath();
    ctx.fill();
    // 头
    ctx.fillStyle = cold ? "#d9c6b0" : "#e8d5be";
    ctx.beginPath();
    ctx.arc(0, -8.6, 2.1, 0, Math.PI * 2);
    ctx.fill();
    // 斗笠
    ctx.fillStyle = "#8a713f";
    ctx.beginPath();
    ctx.ellipse(0, -9.6, 3, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
