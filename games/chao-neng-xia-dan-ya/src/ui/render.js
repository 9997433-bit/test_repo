/** 战场 Canvas 渲染器（480×800 逻辑坐标）。 */
import { LAUNCH_X, LAUNCH_Y, MAX_AIM_DEG, NEST_Y } from "../core/sim.js";
import { drawBrick, drawEgg, drawEnemy, drawHero, drawNest, drawPeg, circle, poly, roundRect } from "./art.js";

const THEMES = {
  farm: { sky: ["#3b2a5e", "#6b4a7a", "#c98f5a"], accent: "#ffd447", ground: "#3a2a1e", fog: "rgba(255,212,71,0.05)" },
  night: { sky: ["#120e26", "#2a1240", "#4a1c4a"], accent: "#ff6b9d", ground: "#1a1030", fog: "rgba(255,107,157,0.06)" },
  volcano: { sky: ["#2a0e12", "#5a1a18", "#a03a1e"], accent: "#ff8a3d", ground: "#301010", fog: "rgba(255,138,61,0.08)" },
  glacier: { sky: ["#0e1d2e", "#1c3a5a", "#5a8fb0"], accent: "#8fd3ff", ground: "#12283c", fog: "rgba(143,211,255,0.07)" },
  circuit: { sky: ["#0c1420", "#123040", "#1a5a5a"], accent: "#3ee0c5", ground: "#0e1e24", fog: "rgba(62,224,197,0.06)" },
  kitchen: { sky: ["#1e0f14", "#4a1a20", "#8a3a24"], accent: "#ffb36b", ground: "#241014", fog: "rgba(255,179,107,0.07)" },
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  let t = 0;
  const stars = Array.from({ length: 46 }, (_, i) => ({
    x: (i * 97) % 480,
    y: (i * 53) % 420,
    r: 0.6 + ((i * 7) % 5) * 0.32,
    p: (i % 10) * 0.6,
  }));

  function background(theme) {
    const th = THEMES[theme] ?? THEMES.farm;
    const g = ctx.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(0.55, th.sky[1]);
    g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 480, 800);

    ctx.save();
    for (const s of stars) {
      ctx.globalAlpha = 0.25 + Math.abs(Math.sin(t * 1.3 + s.p)) * 0.5;
      circle(ctx, s.x, s.y + Math.sin(t * 0.4 + s.p) * 4, s.r, "#ffffff");
    }
    ctx.restore();

    if (theme === "circuit") {
      ctx.save();
      ctx.strokeStyle = "rgba(62,224,197,0.14)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 90 + i * 90);
        ctx.lineTo(480, 90 + i * 90);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (theme === "volcano" || theme === "kitchen") {
      ctx.save();
      for (let i = 0; i < 10; i++) {
        const y = 800 - ((t * 30 + i * 90) % 860);
        ctx.globalAlpha = 0.14;
        circle(ctx, 40 + ((i * 137) % 400), y, 8 + (i % 3) * 4, th.accent);
      }
      ctx.restore();
    }
    if (theme === "glacier") {
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 6; i++) {
        poly(ctx, [[i * 90 - 20, 800], [i * 90 + 40, 620 - (i % 3) * 40], [i * 90 + 110, 800]], "#cfeaff");
      }
      ctx.restore();
    }

    // 侧墙
    const wall = ctx.createLinearGradient(0, 0, 22, 0);
    wall.addColorStop(0, "rgba(255,255,255,0.14)");
    wall.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, 22, 800);
    ctx.save();
    ctx.translate(480, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, 22, 800);
    ctx.restore();
  }

  function launcher(battle) {
    const hero = battle.activeHero();
    const angle = (battle.aim.angle * Math.PI) / 180;
    ctx.save();
    // 发射台底座
    roundRect(ctx, LAUNCH_X - 46, LAUNCH_Y - 40, 92, 42, 14, "rgba(20,16,28,0.75)");
    ctx.save();
    ctx.translate(LAUNCH_X, LAUNCH_Y);
    ctx.rotate(angle);
    roundRect(ctx, -11, 0, 22, 34, 8, "#4a3a6a");
    roundRect(ctx, -7, 4, 14, 26, 6, hero?.palette?.[0] ?? "#ffd447");
    ctx.restore();
    if (hero) drawHero(ctx, hero, LAUNCH_X, LAUNCH_Y - 34, { size: 40, facing: battle.aim.angle >= 0 ? 1 : -1, bob: Math.sin(t * 3) * 2 });
    ctx.restore();
  }

  function aimUI(battle) {
    const pts = battle.prediction.points;
    if (!pts || pts.length < 2) return;
    ctx.save();
    ctx.setLineDash([7, 9]);
    ctx.lineDashOffset = -t * 60;
    ctx.strokeStyle = battle.prediction.hitsEnemy ? "rgba(255,107,157,0.95)" : "rgba(246,240,230,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.setLineDash([]);
    const last = pts[pts.length - 1];
    ctx.globalAlpha = 0.6 + Math.sin(t * 8) * 0.3;
    circle(ctx, last[0], last[1], 6, battle.prediction.hitsEnemy ? "#ff6b9d" : "#f6f0e6");
    // 首个命中点画准星，让「这一发会打到谁」比整条虚线更好读
    const impact = battle.prediction.impact;
    if (impact) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ff6b9d";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(impact[0], impact[1], 13 + Math.sin(t * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(impact[0] - 18, impact[1]);
      ctx.lineTo(impact[0] - 8, impact[1]);
      ctx.moveTo(impact[0] + 8, impact[1]);
      ctx.lineTo(impact[0] + 18, impact[1]);
      ctx.stroke();
    }
    ctx.restore();

    // 角度扇形与力度条
    ctx.save();
    ctx.translate(LAUNCH_X, LAUNCH_Y);
    ctx.globalAlpha = 0.16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 66, Math.PI / 2 - (MAX_AIM_DEG * Math.PI) / 180, Math.PI / 2 + (MAX_AIM_DEG * Math.PI) / 180);
    ctx.closePath();
    ctx.fillStyle = "#ffd447";
    ctx.fill();
    ctx.restore();

    ctx.save();
    const px = 26;
    const py = 120;
    roundRect(ctx, px, py, 10, 220, 5, "rgba(0,0,0,0.4)");
    const h = 220 * battle.aim.power;
    const grad = ctx.createLinearGradient(0, py + 220 - h, 0, py + 220);
    grad.addColorStop(0, "#ff4d6d");
    grad.addColorStop(1, "#ffd447");
    ctx.fillStyle = grad;
    roundRect(ctx, px, py + 220 - h, 10, h, 5, grad);
    ctx.restore();
  }

  function nest(battle) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,77,109,0.5)";
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, NEST_Y);
    ctx.lineTo(480, NEST_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    const grad = ctx.createLinearGradient(0, NEST_Y, 0, 800);
    grad.addColorStop(0, "rgba(255,77,109,0.12)");
    grad.addColorStop(1, "rgba(255,77,109,0.02)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, NEST_Y, 480, 800 - NEST_Y);
    drawNest(ctx, 240, NEST_Y + 30, 200);
    // 标签放在警戒线上方：线下方 96px 被英雄坞挡住，写在那里会被裁掉
    ctx.fillStyle = "rgba(246,240,230,0.5)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("蛋巢防线", 12, NEST_Y - 9);
    if (battle.shields > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.2;
      ctx.strokeStyle = "#9fb8ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(240, NEST_Y + 26, 96, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  function effects(battle) {
    for (const b of battle.beams) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life / 0.28);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      const mx = (b.x1 + b.x2) / 2 + (Math.random() - 0.5) * 24;
      const my = (b.y1 + b.y2) / 2 + (Math.random() - 0.5) * 24;
      ctx.lineTo(mx, my);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }
    for (const r of battle.ripples) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life / 0.4) * 0.7;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    for (const p of battle.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      circle(ctx, p.x, p.y, p.r, p.color);
      ctx.restore();
    }
    for (const f of battle.floats) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.9));
      ctx.fillStyle = f.color;
      ctx.font = `bold ${f.size}px "Trebuchet MS", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
    if (battle.banner) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, battle.banner.life / 0.5);
      ctx.fillStyle = "rgba(20,16,28,0.72)";
      roundRect(ctx, 40, 96, 400, 40, 12, "rgba(20,16,28,0.72)");
      ctx.fillStyle = "#ffd447";
      ctx.font = "bold 18px \"Trebuchet MS\", sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(battle.banner.text, 240, 116);
      ctx.restore();
    }
  }

  return {
    draw(battle) {
      t += 1 / 60;
      const world = battle.world;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, 480, 800);
      background(battle.level.theme ?? "farm");

      const shake = battle.shakeAmt;
      if (shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }

      for (const p of world.ice) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        roundRect(ctx, p.x, p.y, p.w, p.h, 6, "#bfe6ff");
        ctx.restore();
      }
      for (const f of world.fans) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "#3ee0c5";
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = "#3ee0c5";
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const yy = f.y + 20 + i * (f.h / 5);
          const off = ((t * 90 * Math.sign(f.ax || 1)) % 40) - 20;
          ctx.beginPath();
          ctx.moveTo(f.x + 10 + off, yy);
          ctx.lineTo(f.x + f.w - 10 + off, yy);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (const s of world.slopes) {
        ctx.save();
        ctx.strokeStyle = "#6a5a8a";
        ctx.lineWidth = s.thickness ?? 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
        ctx.restore();
      }
      for (const p of world.portals) {
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.sin(t * 5) * 0.25;
        circle(ctx, p.x, p.y, p.r, "#c9a6ff");
        circle(ctx, p.tx, p.ty, p.r * 0.7, "#3ee0c5");
        ctx.restore();
      }
      for (const p of world.pegs) if (p.alive) drawPeg(ctx, p, t);
      for (const b of world.bricks) if (b.alive) drawBrick(ctx, b);
      for (const e of world.enemies) if (e.alive) drawEnemy(ctx, e, t);

      nest(battle);
      launcher(battle);
      if (battle.state === "aim") aimUI(battle);

      for (const egg of world.eggs) {
        ctx.save();
        for (let i = 0; i < egg.trail.length; i++) {
          ctx.globalAlpha = (i / egg.trail.length) * 0.35;
          circle(ctx, egg.trail[i][0], egg.trail[i][1], egg.r * (0.3 + (i / egg.trail.length) * 0.6), egg.palette?.[0] ?? "#ffd447");
        }
        ctx.restore();
        drawEgg(ctx, egg, t);
      }

      effects(battle);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
