/**
 * Canvas 2.5D 等距城镇渲染器。导入时不触碰 DOM（工厂函数接收 canvas）。
 * 视觉要素：雪原地形、程序化建筑、火炉暖光、寒潮冷色、昼夜漂移、雪粒子、小人通勤。
 */
import { clamp, lerp, TICKS_PER_DAY } from "../config.js";
import { BUILDINGS, BUILDING_ORDER } from "../data/buildings.js";
import { tempBand, heatOutput } from "../sim/climate.js";
import { mulberry32 } from "../engine/rng.js";
import { createSnow, updateAndDrawSnow } from "./snow.js";
import { createVillagers, updateVillagers, drawVillagers } from "./villagers.js";

const GRID = 13;
const TILE_W = 60;
const TILE_H = 30;

/** 建筑外观：kind = box | tent | mine | pagoda | furnace | banner 装饰字。 */
const STYLES = {
  furnace: { kind: "furnace", base: "#4a4038", h: 40 },
  hunter: { kind: "tent", base: "#7c6248", roof: "#93745a", h: 18, banner: "猎", bc: "#7f5539" },
  lumber: { kind: "box", base: "#6b4f32", roof: "#8a6a41", h: 16, banner: "木", bc: "#5f7043" },
  coalMine: { kind: "mine", base: "#3a3a41", roof: "#55555e", h: 15, banner: "煤", bc: "#3f3f46" },
  ironMine: { kind: "mine", base: "#4e5158", roof: "#6b6f78", h: 15, banner: "铁", bc: "#5a6472" },
  house: { kind: "box", base: "#8a6a4a", roof: "#a04a32", h: 18, banner: "宅", bc: "#a04a32" },
  warehouse: { kind: "box", base: "#75593b", roof: "#5e4a30", h: 22, banner: "仓", bc: "#8c7748" },
  kitchen: { kind: "box", base: "#7d5b3d", roof: "#b7803f", h: 15, banner: "膳", bc: "#c58a3b", steam: true },
  clinic: { kind: "box", base: "#6d5c46", roof: "#4f7a52", h: 15, banner: "医", bc: "#4f7a52" },
  academy: { kind: "pagoda", base: "#6b5540", roof: "#3f5d7a", h: 26, banner: "学", bc: "#3f5d7a" },
  recruitHall: { kind: "pagoda", base: "#74513c", roof: "#a03a3a", h: 24, banner: "贤", bc: "#c33", lantern: true },
  infantryCamp: { kind: "tent", base: "#5d6470", roof: "#7887a0", h: 17, banner: "步", bc: "#4a6fa5" },
  archerCamp: { kind: "tent", base: "#5f6a5a", roof: "#7a8a72", h: 17, banner: "弓", bc: "#4f7a52" },
  cavalryCamp: { kind: "tent", base: "#6e5a50", roof: "#8a7264", h: 17, banner: "骑", bc: "#8a5a2e" },
  hospital: { kind: "tent", base: "#6a5f52", roof: "#8a8072", h: 16, banner: "疗", bc: "#b05252" },
  wall: { kind: "none" },
  envoy: { kind: "pagoda", base: "#5f5a4c", roof: "#7a6a9a", h: 22, banner: "使", bc: "#7a6a9a" },
};

/** 日夜/温度调色。 */
function ambient(state, time) {
  const cycle = (state.tick % (TICKS_PER_DAY * 6)) / (TICKS_PER_DAY * 6); // 6 天一轮昼夜漂移
  const nightness = 0.5 - 0.5 * Math.cos(cycle * Math.PI * 2); // 0 白昼 → 1 深夜
  const t = state.temperature;
  const coldness = clamp((2 - t) / 30, 0, 1);
  return { nightness: nightness * 0.75, coldness };
}

export function createRenderer(canvas, getState) {
  const ctx = canvas.getContext("2d");
  const snow = createSnow();
  const villagers = createVillagers();
  const deco = makeDecorations();
  let view = { scale: 1, ox: 0, oy: 0, w: 0, h: 0 };
  let selected = null;

  function project(gx, gy) {
    return {
      x: view.ox + ((gx - gy) * TILE_W * view.scale) / 2,
      y: view.oy + ((gx + gy) * TILE_H * view.scale) / 2,
    };
  }

  function makeDecorations() {
    const rng = mulberry32(97);
    const used = new Set(BUILDING_ORDER.map((id) => BUILDINGS[id].tile.join(",")));
    const trees = [];
    let guard = 0;
    while (trees.length < 26 && guard++ < 400) {
      const gx = Math.floor(rng() * GRID);
      const gy = Math.floor(rng() * GRID);
      const key = `${gx},${gy}`;
      const nearBuilding = [...used].some((k) => {
        const [bx, by] = k.split(",").map(Number);
        return Math.abs(bx - gx) <= 1 && Math.abs(by - gy) <= 1;
      });
      if (nearBuilding || used.has(key)) continue;
      used.add(key);
      trees.push({ gx: gx + rng() * 0.5 - 0.25, gy: gy + rng() * 0.5 - 0.25, s: 0.7 + rng() * 0.7 });
    }
    return { trees };
  }

  function resize() {
    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== Math.round(w) || canvas.height !== Math.round(h)) {
      canvas.width = Math.round(w);
      canvas.height = Math.round(h);
    }
    view.w = canvas.width;
    view.h = canvas.height;
    const worldW = (GRID + 1.6) * TILE_W;
    const worldH = (GRID + 3.4) * TILE_H;
    view.scale = Math.min(view.w / worldW, view.h / worldH);
    view.ox = view.w / 2;
    view.oy = (view.h - GRID * TILE_H * view.scale) / 2 + 26 * view.scale;
  }

  // ———— 基础形状 ————
  function tilePath(x, y, s = 1) {
    const hw = (TILE_W / 2) * view.scale * s;
    const hh = (TILE_H / 2) * view.scale * s;
    ctx.beginPath();
    ctx.moveTo(x, y - hh);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x - hw, y);
    ctx.closePath();
  }

  function drawPrism(x, y, fw, hgt, baseColor, roofColor, snowy = true) {
    const k = view.scale;
    const hw = fw * (TILE_W / 2) * k;
    const hh = fw * (TILE_H / 2) * k;
    const hz = hgt * k;
    // 左墙
    ctx.fillStyle = shade(baseColor, -0.24);
    ctx.beginPath();
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x, y + hh - hz);
    ctx.lineTo(x - hw, y - hz);
    ctx.closePath();
    ctx.fill();
    // 右墙
    ctx.fillStyle = shade(baseColor, 0.02);
    ctx.beginPath();
    ctx.moveTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x, y + hh - hz);
    ctx.lineTo(x + hw, y - hz);
    ctx.closePath();
    ctx.fill();
    // 顶
    ctx.fillStyle = roofColor;
    tilePathAt(x, y - hz, fw);
    ctx.fill();
    if (snowy) {
      ctx.fillStyle = "rgba(240,246,255,0.82)";
      tilePathAt(x, y - hz - 1 * k, fw * 0.86);
      ctx.fill();
    }
  }

  function tilePathAt(x, y, s) {
    const hw = s * (TILE_W / 2) * view.scale;
    const hh = s * (TILE_H / 2) * view.scale;
    ctx.beginPath();
    ctx.moveTo(x, y - hh);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x - hw, y);
    ctx.closePath();
  }

  function drawTentShape(x, y, fw, hgt, baseColor, roofColor) {
    const k = view.scale;
    const hw = fw * (TILE_W / 2) * k;
    const hh = fw * (TILE_H / 2) * k;
    const hz = hgt * k;
    ctx.fillStyle = shade(baseColor, -0.2);
    ctx.beginPath();
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x, y - hz);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(roofColor, 0.06);
    ctx.beginPath();
    ctx.moveTo(x + hw, y);
    ctx.lineTo(x, y + hh);
    ctx.lineTo(x, y - hz);
    ctx.closePath();
    ctx.fill();
    // 雪檐
    ctx.strokeStyle = "rgba(240,246,255,0.85)";
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x, y - hz);
    ctx.lineTo(x + hw, y);
    ctx.stroke();
  }

  function drawBanner(x, y, hgt, char, color) {
    const k = view.scale;
    ctx.save();
    ctx.strokeStyle = "#3a3128";
    ctx.lineWidth = 1.6 * k;
    ctx.beginPath();
    ctx.moveTo(x + 16 * k, y + 2 * k);
    ctx.lineTo(x + 16 * k, y - (hgt + 24) * k);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(x + 16 * k, y - (hgt + 24) * k, 13 * k, 16 * k);
    ctx.fillStyle = "#f5ead0";
    ctx.font = `${10 * k}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, x + 22.5 * k, y - (hgt + 16) * k);
    ctx.restore();
  }

  function drawLevelPips(x, y, hgt, lv) {
    const k = view.scale;
    ctx.fillStyle = "#ffd968";
    const total = Math.min(lv, 10);
    const w = total * 5 * k;
    for (let i = 0; i < total; i++) {
      const px = x - w / 2 + i * 5 * k + 2.5 * k;
      const py = y - (hgt + 8) * k;
      ctx.beginPath();
      ctx.moveTo(px, py - 2.2 * k);
      ctx.lineTo(px + 2 * k, py);
      ctx.lineTo(px, py + 2.2 * k);
      ctx.lineTo(px - 2 * k, py);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawFurnace(x, y, lv, state, time) {
    const k = view.scale;
    const heat = heatOutput(state);
    const lit = heat > 0;
    const flick = lit ? 0.85 + Math.sin(time * 9) * 0.08 + Math.sin(time * 23) * 0.07 : 0;
    // 石座
    drawPrism(x, y, 1.15, 12, "#565049", "#6a645c");
    // 炉身（八角塔感：两层棱柱）
    drawPrism(x, y - 12 * k, 0.85, 16 + lv * 1.6, "#4a4038", "#3b332c", false);
    const topY = y - (28 + lv * 1.6) * k;
    drawPrism(x, topY, 0.5, 10, "#3d352d", "#2f2822", false);
    // 炉口火光
    ctx.save();
    ctx.fillStyle = lit ? `rgba(255,${150 + Math.floor(40 * flick)},50,${0.75 + flick * 0.2})` : "#1c1713";
    tilePathAt(x, y - 6 * k, 0.34);
    ctx.fill();
    if (lit) {
      // 火焰
      ctx.globalCompositeOperation = "lighter";
      const fh = (7 + 4 * flick) * k;
      const grd = ctx.createRadialGradient(x, y - 8 * k, 1, x, y - 8 * k, fh * 2.4);
      grd.addColorStop(0, "rgba(255,220,120,0.9)");
      grd.addColorStop(0.5, "rgba(255,130,40,0.45)");
      grd.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y - 8 * k, fh * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      // 烟
      ctx.fillStyle = "rgba(200,205,215,0.16)";
      for (let i = 0; i < 4; i++) {
        const p = (time * 0.35 + i * 0.25) % 1;
        const sx = x + Math.sin(time * 1.4 + i * 2.2) * 6 * k * p;
        const sy = topY - 10 * k - p * 46 * k;
        ctx.beginPath();
        ctx.arc(sx, sy, (3.5 + p * 7) * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    drawLevelPips(x, topY, 14, lv);
  }

  function drawTree(x, y, s) {
    const k = view.scale * s;
    ctx.fillStyle = "#4a3c2c";
    ctx.fillRect(x - 1.4 * k, y - 6 * k, 2.8 * k, 6 * k);
    for (let i = 0; i < 3; i++) {
      const w = (14 - i * 3.4) * k;
      const yy = y - (7 + i * 7) * k;
      ctx.fillStyle = i % 2 ? "#2f4a3c" : "#39584a";
      ctx.beginPath();
      ctx.moveTo(x, yy - 9 * k);
      ctx.lineTo(x + w / 2, yy);
      ctx.lineTo(x - w / 2, yy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(240,246,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(x, yy - 9 * k);
      ctx.lineTo(x + w * 0.3, yy - 4 * k);
      ctx.lineTo(x - w * 0.3, yy - 4 * k);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawWallSegment(x, y, lv, isTower) {
    const h = isTower ? 14 + lv * 1.6 : 7 + lv * 1.1;
    drawPrism(x, y, isTower ? 0.52 : 0.4, h, "#5a5c63", "#71747c");
  }

  function drawBuilding(id, state, time) {
    const def = BUILDINGS[id];
    const lv = state.buildings[id];
    const [gx, gy] = def.tile;
    const { x, y } = project(gx, gy);
    if (id === "wall") return; // 城墙单独按边环绘制
    if (lv <= 0) {
      // 未建：地基虚影
      ctx.save();
      ctx.setLineDash([4 * view.scale, 4 * view.scale]);
      ctx.strokeStyle = "rgba(150,170,205,0.4)";
      ctx.lineWidth = 1.4 * view.scale;
      tilePathAt(x, y, 0.8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(150,170,205,0.5)";
      ctx.font = `${11 * view.scale}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(def.icon, x, y + 4 * view.scale);
      ctx.restore();
      return;
    }
    const st = STYLES[id];
    if (st.kind === "furnace") {
      drawFurnace(x, y, lv, state, time);
      return;
    }
    if (st.kind === "tent") drawTentShape(x, y, 0.9, st.h + lv * 1.2, st.base, st.roof);
    else if (st.kind === "mine") {
      drawPrism(x, y, 0.9, 8 + lv, st.base, st.roof);
      // 井架
      const k = view.scale;
      ctx.strokeStyle = "#2e2a25";
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(x - 8 * k, y - (8 + lv) * k);
      ctx.lineTo(x, y - (24 + lv) * k);
      ctx.lineTo(x + 8 * k, y - (8 + lv) * k);
      ctx.stroke();
    } else if (st.kind === "pagoda") {
      drawPrism(x, y, 0.95, st.h * 0.55 + lv, st.base, st.roof);
      drawPrism(x, y - (st.h * 0.55 + lv) * view.scale, 0.62, st.h * 0.45, shade(st.base, 0.08), st.roof);
    } else {
      drawPrism(x, y, 0.92, st.h + lv * 1.2, st.base, st.roof);
    }
    if (st.steam) {
      const k = view.scale;
      ctx.fillStyle = "rgba(230,235,245,0.2)";
      for (let i = 0; i < 2; i++) {
        const p = (time * 0.5 + i * 0.5) % 1;
        ctx.beginPath();
        ctx.arc(x + 4 * k, y - (st.h + 6) * k - p * 20 * k, (2.5 + p * 4) * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (st.lantern) {
      const k = view.scale;
      ctx.fillStyle = "#e33";
      ctx.beginPath();
      ctx.ellipse(x - 14 * k, y - (st.h + 4) * k, 3.2 * k, 4 * k, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (st.banner) drawBanner(x, y, st.h + lv, st.banner, st.bc);
    drawLevelPips(x, y, (st.kind === "pagoda" ? st.h : st.h + lv * 1.2) + 6, lv);
  }

  // ———— 帧 ————
  function frame(dt, time) {
    const state = getState();
    resize();
    const { w, h, scale } = view;
    const amb = ambient(state, time);
    const band = tempBand(state.temperature);
    const freezing = band === "freeze";
    const blizzard = state.blizzard.active;

    // 天空
    const skyTop = mixColor("#28374f", "#0c1220", amb.nightness);
    const skyBot = mixColor(blizzard ? "#5a6b85" : "#4a5f7d", "#141c2c", amb.nightness);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, skyTop);
    sky.addColorStop(1, skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 地形
    const snowLight = mixColor("#dfe8f4", "#8b9cbb", amb.nightness);
    const snowDark = mixColor("#c3d2e6", "#75879f", amb.nightness);
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        const { x, y } = project(gx, gy);
        tilePath(x, y, 1.01);
        ctx.fillStyle = (gx + gy) % 2 ? snowDark : snowLight;
        ctx.fill();
      }
    }
    // 地面边缘阴影
    ctx.strokeStyle = "rgba(20,28,44,0.5)";
    ctx.lineWidth = 2 * scale;
    const c1 = project(0, GRID - 1);
    const c2 = project(GRID - 1, GRID - 1);
    const c3 = project(GRID - 1, 0);
    ctx.beginPath();
    ctx.moveTo(c1.x - (TILE_W / 2) * scale, c1.y);
    ctx.lineTo(c2.x, c2.y + (TILE_H / 2) * scale);
    ctx.lineTo(c3.x + (TILE_W / 2) * scale, c3.y);
    ctx.stroke();

    // 选中高亮
    if (selected && BUILDINGS[selected]) {
      const [gx, gy] = BUILDINGS[selected].tile;
      const { x, y } = project(gx, gy);
      const pulse = 0.55 + Math.sin(time * 5) * 0.25;
      ctx.strokeStyle = `rgba(255,215,110,${pulse})`;
      ctx.lineWidth = 2.4 * scale;
      tilePath(x, y, 1.12);
      ctx.stroke();
    }

    // 深度排序绘制：城墙 → 树 → 建筑 → 小人
    updateVillagers(villagers, state, dt, freezing || blizzard);
    const drawables = [];
    if (state.buildings.wall >= 1) {
      const lv = state.buildings.wall;
      for (let i = 0; i < GRID; i++) {
        for (const [gx, gy] of [[i, -0.8], [-0.8, i], [i, GRID - 0.2], [GRID - 0.2, i]]) {
          const isTower = i === 0 || i === GRID - 1;
          drawables.push({ d: gx + gy, fn: () => { const p = project(gx, gy); drawWallSegment(p.x, p.y, lv, isTower); } });
        }
      }
    }
    for (const t of deco.trees) {
      drawables.push({ d: t.gx + t.gy, fn: () => { const p = project(t.gx, t.gy); drawTree(p.x, p.y, t.s); } });
    }
    for (const id of BUILDING_ORDER) {
      const [gx, gy] = BUILDINGS[id].tile;
      drawables.push({ d: gx + gy, fn: () => drawBuilding(id, state, time) });
    }
    for (const p of villagers.list) {
      drawables.push({ d: p.x + p.y + 0.01, fn: () => drawVillagers({ list: [p] }, ctx, project, time, freezing) });
    }
    drawables.sort((a, b) => a.d - b.d);
    for (const item of drawables) item.fn();

    // 火炉暖光（叠加）
    const heat = heatOutput(state);
    if (heat > 0) {
      const [fx, fy] = BUILDINGS.furnace.tile;
      const fp = project(fx, fy);
      const flick = 1 + Math.sin(time * 8.5) * 0.05 + Math.sin(time * 19) * 0.04;
      const radius = (90 + heat * 9) * scale * flick;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(fp.x, fp.y - 10 * scale, 6 * scale, fp.x, fp.y - 10 * scale, radius);
      glow.addColorStop(0, "rgba(255,160,70,0.30)");
      glow.addColorStop(0.55, "rgba(255,120,50,0.12)");
      glow.addColorStop(1, "rgba(255,100,40,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(fp.x, fp.y - 10 * scale, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 冷色叠加 + 夜色 + 暗角
    if (amb.coldness > 0.02) {
      ctx.fillStyle = `rgba(96,140,220,${amb.coldness * 0.2})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (amb.nightness > 0.05) {
      ctx.fillStyle = `rgba(8,12,26,${amb.nightness * 0.3})`;
      ctx.fillRect(0, 0, w, h);
    }
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, `rgba(4,8,20,${0.32 + amb.coldness * 0.15})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // 雪
    const intensity = blizzard ? 1 : band === "freeze" ? 0.55 : 0.3;
    const wind = blizzard ? 0.24 + Math.sin(time * 0.7) * 0.08 : 0.02;
    updateAndDrawSnow(snow, ctx, w, h, dt, time, intensity, wind);
    if (blizzard) {
      ctx.fillStyle = `rgba(200,215,235,${0.05 + Math.sin(time * 2.2) * 0.03})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function buildingAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / rect.width;
    const px = (clientX - rect.left) * dpr;
    const py = (clientY - rect.top) * dpr;
    let best = null;
    let bestDist = 42 * view.scale;
    for (const id of BUILDING_ORDER) {
      if (id === "wall") continue;
      const [gx, gy] = BUILDINGS[id].tile;
      const { x, y } = project(gx, gy);
      const dist = Math.hypot(px - x, py - (y - 10 * view.scale));
      if (dist < bestDist) {
        bestDist = dist;
        best = id;
      }
    }
    return best;
  }

  return {
    frame,
    buildingAt,
    setSelected(id) {
      selected = id;
    },
    getSelected() {
      return selected;
    },
  };
}

// ———— 颜色工具 ————
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = (c) => Math.round(clamp(amount > 0 ? c + (255 - c) * amount : c * (1 + amount), 0, 255));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function mixColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}
