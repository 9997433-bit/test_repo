/** Canvas 矢量美术：禽类英雄、超能蛋、敌人、场景装饰。全部程序绘制，无外部素材。 */

const TAU = Math.PI * 2;

function ellipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function poly(ctx, pts, fill) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, fill) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/**
 * 种族口径归一。
 *
 * `src/data/heroes.js` 的权威写法是 `chicken`，而 `combat/constants.js`
 * 与 `core/catalog.js` 历史上用过 `chick` 别名。立绘两边都要认，
 * 否则鸡族英雄会掉进 duck 分支——没有鸡冠、喙也画成鸭嘴。
 */
const RACE_ALIAS = { chicken: "chicken", chick: "chicken", chickens: "chicken", duck: "duck", ducks: "duck", goose: "goose", geese: "goose", bird: "bird", birds: "bird" };

function raceOf(hero) {
  return RACE_ALIAS[hero?.race] ?? "duck";
}

function eye(ctx, x, y, r, look = 0) {
  circle(ctx, x, y, r, "#ffffff");
  circle(ctx, x + look * r * 0.3, y + r * 0.1, r * 0.52, "#1a1526");
  circle(ctx, x + look * r * 0.3 + r * 0.18, y - r * 0.2, r * 0.2, "#ffffff");
}

/**
 * 画一只禽类英雄。
 * @param {object} hero - { race, palette, school }
 * @param {object} opts - { size, facing, bob, blink, glow }
 */
export function drawHero(ctx, hero, x, y, opts = {}) {
  const size = opts.size ?? 46;
  const facing = opts.facing ?? 1;
  const bob = opts.bob ?? 0;
  const [main, accent, dark] = hero.palette ?? ["#ffd447", "#ff8a3d", "#2a2144"];
  const race = raceOf(hero);
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(facing, 1);

  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 18;
  }

  // 脚
  const footY = size * 0.4;
  poly(ctx, [[-size * 0.2, footY], [-size * 0.02, footY], [-size * 0.12, footY + size * 0.16]], "#ff9f3d");
  poly(ctx, [[size * 0.06, footY], [size * 0.24, footY], [size * 0.14, footY + size * 0.16]], "#ff9f3d");

  // 尾羽
  poly(
    ctx,
    [[-size * 0.4, -size * 0.05], [-size * 0.72, -size * 0.28], [-size * 0.62, size * 0.06]],
    accent,
  );

  // 身体
  ellipse(ctx, 0, 0, size * 0.46, size * 0.42, main);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ellipse(ctx, size * 0.06, size * 0.08, size * 0.34, size * 0.28, "#ffffff");
  ctx.restore();

  // 翅膀
  ellipse(ctx, -size * 0.02, size * 0.02, size * 0.22, size * 0.16, accent, -0.25);

  // 颈 / 头
  const neck = race === "goose" ? size * 0.5 : race === "chicken" ? size * 0.34 : size * 0.42;
  if (race === "goose") {
    ctx.beginPath();
    ctx.moveTo(-size * 0.06, -size * 0.2);
    ctx.quadraticCurveTo(size * 0.16, -neck * 0.9, size * 0.1, -neck);
    ctx.lineWidth = size * 0.17;
    ctx.strokeStyle = main;
    ctx.lineCap = "round";
    ctx.stroke();
  }
  const headX = race === "goose" ? size * 0.1 : size * 0.04;
  const headY = -neck - size * 0.06;
  const headR = race === "chicken" ? size * 0.3 : size * 0.28;
  circle(ctx, headX, headY, headR, main);

  // 冠 / 头饰
  if (race === "chicken") {
    poly(
      ctx,
      [
        [headX - headR * 0.3, headY - headR * 0.9],
        [headX - headR * 0.05, headY - headR * 1.55],
        [headX + headR * 0.18, headY - headR * 0.92],
      ],
      "#ff4d6d",
    );
  } else if (race === "bird") {
    poly(
      ctx,
      [
        [headX - headR * 0.5, headY - headR * 0.7],
        [headX - headR * 0.1, headY - headR * 1.7],
        [headX + headR * 0.25, headY - headR * 0.85],
      ],
      accent,
    );
  }

  // 喙
  if (race === "duck" || race === "goose") {
    roundRect(ctx, headX + headR * 0.55, headY - headR * 0.12, headR * 0.95, headR * 0.42, headR * 0.2, "#ff9f3d");
    if (race === "goose") circle(ctx, headX + headR * 0.62, headY - headR * 0.24, headR * 0.16, "#e07a2a");
  } else {
    poly(
      ctx,
      [
        [headX + headR * 0.5, headY - headR * 0.16],
        [headX + headR * 1.35, headY + headR * 0.06],
        [headX + headR * 0.5, headY + headR * 0.28],
      ],
      "#ff9f3d",
    );
  }

  // 眼
  eye(ctx, headX + headR * 0.22, headY - headR * 0.16, headR * 0.26, opts.blink ? 0 : 1);

  // 流派徽记
  if (opts.badge) {
    circle(ctx, -size * 0.3, -size * 0.16, size * 0.16, dark);
    ctx.fillStyle = opts.badge.color ?? "#ffd447";
    ctx.font = `${size * 0.2}px var(--font, sans-serif)`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.scale(facing, 1);
    ctx.fillText(opts.badge.icon ?? "◈", -facing * size * 0.3, -size * 0.15);
  }
  ctx.restore();
}

/** 头像（编队/HUD 用，只画头部特写）。 */
export function drawHeroPortrait(ctx, hero, x, y, size) {
  const [main, accent] = hero.palette ?? ["#ffd447", "#ff8a3d"];
  const r = size * 0.42;
  ctx.save();
  circle(ctx, x, y + size * 0.06, r * 1.18, "rgba(0,0,0,0.25)");
  circle(ctx, x, y, r, main);
  const race = raceOf(hero);
  if (race === "chicken") poly(ctx, [[x - r * 0.3, y - r * 0.85], [x - r * 0.04, y - r * 1.5], [x + r * 0.2, y - r * 0.88]], "#ff4d6d");
  if (race === "bird") poly(ctx, [[x - r * 0.5, y - r * 0.66], [x - r * 0.08, y - r * 1.6], [x + r * 0.26, y - r * 0.8]], accent);
  if (race === "duck" || race === "goose") roundRect(ctx, x + r * 0.42, y - r * 0.1, r * 0.9, r * 0.4, r * 0.2, "#ff9f3d");
  else poly(ctx, [[x + r * 0.42, y - r * 0.14], [x + r * 1.24, y + r * 0.06], [x + r * 0.42, y + r * 0.26]], "#ff9f3d");
  eye(ctx, x + r * 0.16, y - r * 0.16, r * 0.24, 1);
  eye(ctx, x - r * 0.42, y - r * 0.14, r * 0.2, 1);
  ctx.restore();
}

/** 超能蛋。 */
export function drawEgg(ctx, egg, t = 0) {
  const [main, accent] = egg.palette ?? ["#ffd447", "#ff8a3d"];
  const tint = { fire: "#ff8a3d", ice: "#8fd3ff", thunder: "#ffe566", none: null }[egg.element] ?? null;
  const rot = Math.atan2(egg.vy, egg.vx) + Math.PI / 2;
  ctx.save();
  ctx.translate(egg.x, egg.y);
  ctx.rotate(rot * 0.25 + Math.sin(t * 6 + egg.id) * 0.08);
  if (tint) {
    ctx.shadowColor = tint;
    ctx.shadowBlur = 16;
  }
  ellipse(ctx, 0, 0, egg.r * 0.82, egg.r * 1.06, "#fff6e0");
  ellipse(ctx, -egg.r * 0.2, -egg.r * 0.3, egg.r * 0.34, egg.r * 0.42, "#ffffff");
  ctx.shadowBlur = 0;
  ellipse(ctx, egg.r * 0.1, egg.r * 0.28, egg.r * 0.5, egg.r * 0.42, main);
  ellipse(ctx, egg.r * 0.16, egg.r * 0.34, egg.r * 0.26, egg.r * 0.2, accent);
  if (tint) {
    ctx.globalAlpha = 0.5 + Math.sin(t * 10) * 0.2;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, egg.r * 0.95, egg.r * 1.2, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** 敌人：按 shape 分派。 */
export function drawEnemy(ctx, e, t = 0) {
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const hit = e.flash > 0;
  ctx.save();
  if (hit) {
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 18;
  }
  const body = hit ? "#ffffff" : e.color;
  const wob = Math.sin(t * 3 + cx * 0.05) * 2;

  switch (e.shape) {
    case "slime": {
      ctx.beginPath();
      ctx.moveTo(e.x, e.y + e.h);
      ctx.quadraticCurveTo(e.x - 2, e.y + wob, cx, e.y + wob);
      ctx.quadraticCurveTo(e.x + e.w + 2, e.y + wob, e.x + e.w, e.y + e.h);
      ctx.closePath();
      ctx.fillStyle = body;
      ctx.fill();
      ellipse(ctx, cx - e.w * 0.16, cy - e.h * 0.1, e.w * 0.1, e.h * 0.12, "#1a1526");
      ellipse(ctx, cx + e.w * 0.16, cy - e.h * 0.1, e.w * 0.1, e.h * 0.12, "#1a1526");
      ctx.strokeStyle = "#1a1526";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + e.h * 0.12, e.w * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }
    case "bird": {
      ellipse(ctx, cx, cy + wob * 0.5, e.w * 0.4, e.h * 0.42, body);
      const flap = Math.sin(t * 12 + cx) * e.h * 0.22;
      poly(ctx, [[cx - e.w * 0.3, cy], [cx - e.w * 0.75, cy - flap], [cx - e.w * 0.28, cy + e.h * 0.2]], body);
      poly(ctx, [[cx + e.w * 0.3, cy], [cx + e.w * 0.75, cy - flap], [cx + e.w * 0.28, cy + e.h * 0.2]], body);
      circle(ctx, cx + e.w * 0.16, cy - e.h * 0.24, e.h * 0.22, body);
      poly(ctx, [[cx + e.w * 0.3, cy - e.h * 0.26], [cx + e.w * 0.6, cy - e.h * 0.18], [cx + e.w * 0.3, cy - e.h * 0.1]], "#ff9f3d");
      eye(ctx, cx + e.w * 0.18, cy - e.h * 0.28, e.h * 0.09);
      break;
    }
    case "pig": {
      roundRect(ctx, e.x, e.y + 4, e.w, e.h - 6, 12, body);
      roundRect(ctx, e.x + 2, e.y, e.w - 4, 12, 6, "#8a93a6");
      circle(ctx, cx, cy + e.h * 0.12, e.w * 0.16, "#ffd0d8");
      circle(ctx, cx - e.w * 0.06, cy + e.h * 0.12, 2.5, "#7a4a55");
      circle(ctx, cx + e.w * 0.06, cy + e.h * 0.12, 2.5, "#7a4a55");
      eye(ctx, cx - e.w * 0.2, cy - e.h * 0.1, 5);
      eye(ctx, cx + e.w * 0.2, cy - e.h * 0.1, 5);
      break;
    }
    case "crab": {
      ellipse(ctx, cx, cy, e.w * 0.42, e.h * 0.36, body);
      for (let i = 0; i < 5; i++) {
        const px = e.x + 8 + i * ((e.w - 16) / 4);
        poly(ctx, [[px - 5, e.y + 8], [px, e.y - 6], [px + 5, e.y + 8]], "#ffd447");
      }
      circle(ctx, cx - e.w * 0.42, cy + e.h * 0.14, e.h * 0.16, body);
      circle(ctx, cx + e.w * 0.42, cy + e.h * 0.14, e.h * 0.16, body);
      eye(ctx, cx - e.w * 0.14, cy, 5);
      eye(ctx, cx + e.w * 0.14, cy, 5);
      break;
    }
    case "totem": {
      roundRect(ctx, e.x + 4, e.y, e.w - 8, e.h, 8, body);
      ctx.globalAlpha = 0.5 + Math.sin(t * 4) * 0.3;
      circle(ctx, cx, e.y + e.h * 0.28, e.w * 0.2, "#7ee08a");
      ctx.globalAlpha = 1;
      eye(ctx, cx - 7, e.y + e.h * 0.6, 5);
      eye(ctx, cx + 7, e.y + e.h * 0.6, 5);
      break;
    }
    case "fox": {
      ellipse(ctx, cx, cy + 4, e.w * 0.4, e.h * 0.36, body);
      poly(ctx, [[cx - e.w * 0.3, cy - e.h * 0.2], [cx - e.w * 0.36, cy - e.h * 0.56], [cx - e.w * 0.08, cy - e.h * 0.3]], body);
      poly(ctx, [[cx + e.w * 0.3, cy - e.h * 0.2], [cx + e.w * 0.36, cy - e.h * 0.56], [cx + e.w * 0.08, cy - e.h * 0.3]], body);
      roundRect(ctx, cx - e.w * 0.3, e.y - 2, e.w * 0.6, 12, 5, "#ffffff");
      eye(ctx, cx - 9, cy - 2, 5);
      eye(ctx, cx + 9, cy - 2, 5);
      poly(ctx, [[cx - 5, cy + 10], [cx + 5, cy + 10], [cx, cy + 16]], "#1a1526");
      break;
    }
    case "pot": {
      roundRect(ctx, e.x, e.y + e.h * 0.25, e.w, e.h * 0.75, 16, body);
      ellipse(ctx, cx, e.y + e.h * 0.28, e.w * 0.5, e.h * 0.16, "#ffb36b");
      for (let i = 0; i < 4; i++) {
        const bx = e.x + 18 + i * (e.w - 36) / 3;
        const by = e.y + e.h * 0.24 - Math.abs(Math.sin(t * 3 + i)) * 12;
        circle(ctx, bx, by, 5 + Math.sin(t * 4 + i) * 2, "rgba(255,214,71,0.8)");
      }
      eye(ctx, cx - e.w * 0.18, cy + e.h * 0.1, 9);
      eye(ctx, cx + e.w * 0.18, cy + e.h * 0.1, 9);
      ctx.strokeStyle = "#1a1526";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + e.h * 0.3, e.w * 0.16, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      break;
    }
    case "statue": {
      roundRect(ctx, e.x + 6, e.y + 10, e.w - 12, e.h - 10, 10, body);
      poly(ctx, [[cx - e.w * 0.3, e.y + 14], [cx, e.y - 8], [cx + e.w * 0.3, e.y + 14]], body);
      roundRect(ctx, cx - 5, e.y - 30, 10, 34, 4, "#9fd6ff");
      eye(ctx, cx - e.w * 0.16, cy, 8);
      eye(ctx, cx + e.w * 0.16, cy, 8);
      break;
    }
    case "machine": {
      roundRect(ctx, e.x, e.y, e.w, e.h, 10, body);
      roundRect(ctx, e.x + 10, e.y + 10, e.w - 20, e.h - 30, 8, "#2a2144");
      ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.3;
      circle(ctx, cx, cy - 4, 14, "#ffd447");
      ctx.globalAlpha = 1;
      for (let i = 0; i < 5; i++) circle(ctx, e.x + 14 + i * ((e.w - 28) / 4), e.y + e.h - 10, 4, "#ff4d6d");
      break;
    }
    default:
      roundRect(ctx, e.x, e.y, e.w, e.h, 8, body);
  }
  ctx.restore();

  // 血条与状态
  const hpRatio = Math.max(0, e.hp / e.maxHp);
  const bw = Math.max(30, e.w);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(e.x + (e.w - bw) / 2, e.y - 10, bw, 5);
  ctx.fillStyle = e.boss ? "#ff4d6d" : hpRatio > 0.4 ? "#7ee08a" : "#ffd447";
  ctx.fillRect(e.x + (e.w - bw) / 2, e.y - 10, bw * hpRatio, 5);
  if (e.armor > 0) {
    ctx.fillStyle = "#9fb8ff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`🛡${e.armor}`, e.x + (e.w - bw) / 2, e.y - 13);
  }
  const icons = [];
  if (e.status.burn > 0) icons.push(["▲", "#ff8a3d", e.status.burn]);
  if (e.status.freeze > 0) icons.push(["❄", "#8fd3ff", e.status.freeze]);
  if (e.status.shock > 0) icons.push(["⚡", "#ffe566", e.status.shock]);
  icons.forEach(([icon, color, n], i) => {
    ctx.fillStyle = color;
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${icon}${n}`, e.x + e.w / 2 + (i - (icons.length - 1) / 2) * 22, e.y - 18);
  });
}

export function drawPeg(ctx, p, t) {
  const glow = p.hitFlash > 0 ? p.hitFlash / 0.3 : 0;
  if (p.type === "bomb") {
    ctx.save();
    ctx.shadowColor = "#ff8a3d";
    ctx.shadowBlur = 12 + glow * 18;
    circle(ctx, p.x, p.y, p.r, "#ff8a3d");
    circle(ctx, p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.3, "#ffd447");
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.shadowColor = "#3ee0c5";
  ctx.shadowBlur = 6 + glow * 20;
  circle(ctx, p.x, p.y, p.r, p.lit ? "#8ff5e4" : "#3ee0c5");
  circle(ctx, p.x - p.r * 0.3, p.y - p.r * 0.32, p.r * 0.32, "rgba(255,255,255,0.8)");
  ctx.restore();
  void t;
}

export function drawBrick(ctx, b) {
  const ratio = b.hp / b.maxHp;
  const color = b.flash > 0 ? "#ffffff" : b.color ?? "#7a6aa0";
  roundRect(ctx, b.x, b.y, b.w, b.h, 5, color);
  ctx.globalAlpha = 0.28;
  roundRect(ctx, b.x + 2, b.y + 2, b.w - 4, b.h * 0.4, 4, "#ffffff");
  ctx.globalAlpha = 1;
  if (b.kind === "steel") {
    ctx.strokeStyle = "#e6ecf5";
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
  }
  if (b.kind === "bomb") {
    ctx.fillStyle = "#1a1526";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("💣", b.x + b.w / 2, b.y + b.h / 2);
  }
  if (ratio < 1) {
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w * 0.3, b.y);
    ctx.lineTo(b.x + b.w * 0.45, b.y + b.h);
    ctx.stroke();
  }
}

export function drawNest(ctx, x, y, w) {
  ctx.save();
  ctx.strokeStyle = "#8a6a4a";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + i * (w / 7), y + 6);
    ctx.quadraticCurveTo(x, y - 10 + (i % 2) * 6, x + w / 2 - i * (w / 7), y + 14);
    ctx.stroke();
  }
  ctx.restore();
}

export { circle, ellipse, poly, roundRect };
