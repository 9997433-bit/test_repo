import { WEATHERS } from "../data/weather.js";
import { BUILDINGS } from "../data/buildings.js";
import { RESOURCE_META } from "../data/resources.js";

const CELL = 56;

export function paintSea(canvas, state, t) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const weather = WEATHERS[state.world.weather] || WEATHERS.clear;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const dusk = Math.sin(state.world.timeOfDay * Math.PI * 2);
  g.addColorStop(0, weather.sky[0]);
  g.addColorStop(1, weather.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const reduce = state.settings.reduceMotion;
  const wave = reduce ? 0 : Math.sin(t / 700) * 4;
  ctx.fillStyle = weather.sky[1];
  ctx.beginPath();
  ctx.moveTo(0, h * 0.42 + wave);
  for (let x = 0; x <= w; x += 12) {
    const y = h * 0.42 + Math.sin(x / 38 + t / 500) * (reduce ? 1 : 6) + wave;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  const ox = w / 2 - (state.raft.width * CELL) / 2;
  const oy = h * 0.46 - (state.raft.height * CELL) / 2 + wave * 0.4;

  for (let y = 0; y < state.raft.height; y += 1) {
    for (let x = 0; x < state.raft.width; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#d59a4c" : "#c07f32";
      ctx.strokeStyle = "#7a4a1e";
      ctx.fillRect(ox + x * CELL, oy + y * CELL, CELL - 2, CELL - 2);
      ctx.strokeRect(ox + x * CELL, oy + y * CELL, CELL - 2, CELL - 2);
    }
  }

  for (const b of state.buildings) {
    const def = BUILDINGS[b.type];
    const bw = (b.rot % 180 === 0 ? def.w : def.h) * CELL - 6;
    const bh = (b.rot % 180 === 0 ? def.h : def.w) * CELL - 6;
    ctx.fillStyle = "#fff7e8";
    ctx.strokeStyle = "#16323c";
    ctx.lineWidth = 2;
    ctx.fillRect(ox + b.x * CELL + 3, oy + b.y * CELL + 3, bw, bh);
    ctx.strokeRect(ox + b.x * CELL + 3, oy + b.y * CELL + 3, bw, bh);
    ctx.fillStyle = "#16323c";
    ctx.font = "12px 'Noto Sans SC', sans-serif";
    ctx.fillText(def.name, ox + b.x * CELL + 8, oy + b.y * CELL + 20);
    ctx.fillText(`Lv.${b.level}`, ox + b.x * CELL + 8, oy + b.y * CELL + 36);
  }

  for (const f of state.explore.salvage.flotsam) {
    const fx = ((f.x + 1) / 2) * w;
    const fy = h * 0.38 + Math.sin(t / 400 + f.x) * 8 + f.y * 40;
    ctx.fillStyle = RESOURCE_META[f.res]?.color || "#fff";
    ctx.beginPath();
    ctx.arc(fx, fy, 7 + (f.rare ? 3 : 0), 0, Math.PI * 2);
    ctx.fill();
    if (f.rare) {
      ctx.strokeStyle = "#ffd166";
      ctx.stroke();
    }
  }

  if (dusk < -0.2) {
    ctx.fillStyle = "rgba(6, 21, 27, 0.28)";
    ctx.fillRect(0, 0, w, h);
  }
}

export function canvasToCell(canvas, state, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const ox = w / 2 - (state.raft.width * CELL) / 2;
  const oy = h * 0.46 - (state.raft.height * CELL) / 2;
  const x = Math.floor((clientX - rect.left - ox) / CELL);
  const y = Math.floor((clientY - rect.top - oy) / CELL);
  return { x, y };
}
