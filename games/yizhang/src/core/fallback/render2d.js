// 占位渲染。src/render/index.js（Opus-2）缺席时顶上，导出签名与契约一致。
// Canvas2D 斜俯视调试视图：不追求好看，只保证「看得懂在发生什么」，
// 并且显式打上降级角标，免得被误认成正式画面。

const TAU = Math.PI * 2;
const DUSK = {
  skyTop: "#33465f",
  skyBottom: "#0b111b",
};

function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const PALETTE = {
  deckLit: "#3a4a5f",
  deckLit2: "#32425a",
  deckShade: "#232f40",
  deckEdge: "#151e2a",
  seam: "#131b26",
  crack: "#d9a441",
  crackDeep: "#c8702c",
  ivory: "#e7e1d4",
  muted: "#8b9ab0",
  shadow: "rgba(6,10,16,0.45)",
};

function oblique(x, y, z, scale, cam) {
  return {
    sx: (x - cam.x) * scale,
    sy: (z - cam.z) * scale * 0.58 - y * scale * 0.52,
  };
}

export function createRenderer(canvas, opts = {}) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas2D 不可用");

  let width = canvas.clientWidth || 960;
  let height = canvas.clientHeight || 540;
  let dpr = 1;
  let quality = "mid";
  let followId = opts.followId || null;
  const cam = { x: 0, z: 0, init: false };
  let lastView = null;
  const bursts = [];
  // 视角喂入（core/look.js feedLook 的 payload）。2D 斜俯视没有可转的机位，
  // 但 lookMode 必须「认」：收下、透出、并在降级角标里报出来，别让切换在
  // 兜底画面上看起来像坏了。simYaw / pitch 一并记下，探针与手测读得到。
  const look = { pitch: null, simYaw: null, lookMode: "locked" };

  function resize(w, h, ratio) {
    width = Math.max(1, Math.floor(w));
    height = Math.max(1, Math.floor(h));
    dpr = Math.min(2, ratio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }

  function setQuality(tier) {
    quality = tier;
  }

  function setFollow(id) {
    followId = id;
  }

  /** 契约同名口：吃 feedLook 的 payload（yaw 已是 sim 空间），单值写法也认。 */
  function setLook(payload = {}) {
    const o = typeof payload === "number" ? { pitch: payload } : payload || {};
    if (Number.isFinite(o.pitch)) look.pitch = o.pitch;
    const yaw = Number.isFinite(o.simYaw) ? o.simYaw : Number.isFinite(o.yaw) ? o.yaw : null;
    if (yaw !== null) look.simYaw = yaw;
    if (o.lookMode === "locked" || o.lookMode === "free") look.lookMode = o.lookMode;
    return { ...look };
  }

  /** 过门机位吸附：下一帧直接跳到目标位，不再看阻尼跟随飞 120 米。 */
  function snapCamera() {
    cam.init = false;
  }

  function ingestEvents(view) {
    if (!Array.isArray(view.events)) return;
    for (const e of view.events) {
      if (e.type === "hit" || e.type === "meteorLand" || e.type === "chunkCrack") {
        bursts.push({ x: e.x ?? 0, z: e.z ?? 0, t: 0, life: 0.4, kind: e.type });
      }
    }
    if (bursts.length > 40) bursts.splice(0, bursts.length - 40);
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, DUSK.skyTop);
    g.addColorStop(0.55, "#1d2939");
    g.addColorStop(1, DUSK.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }

  function drawArena(view, scale, cx, cy) {
    const arena = view.arena || { radius: 20, coreRadius: 6, chunks: [] };
    const chunks = arena.chunks || [];

    ctx.save();
    ctx.translate(cx, cy);

    // 台体厚度：只在还活着的子块下面垫一层，塌掉的块必须露出真正的空洞。
    const inner0 = arena.coreRadius ?? 6;
    ctx.fillStyle = PALETTE.deckEdge;
    for (const chunk of chunks) {
      if (!chunk.alive) continue;
      ctx.beginPath();
      for (let i = 0; i <= 16; i += 1) {
        const a = chunk.a0 + ((chunk.a1 - chunk.a0) * i) / 16;
        const p = oblique(Math.cos(a) * arena.radius, -0.7, Math.sin(a) * arena.radius, scale, cam);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      for (let i = 16; i >= 0; i -= 1) {
        const a = chunk.a0 + ((chunk.a1 - chunk.a0) * i) / 16;
        const p = oblique(Math.cos(a) * inner0, -0.7, Math.sin(a) * inner0, scale, cam);
        ctx.lineTo(p.sx, p.sy);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    const cShadow = oblique(0, -0.7, 0, scale, cam);
    ctx.ellipse(cShadow.sx, cShadow.sy, inner0 * scale, inner0 * scale * 0.58, 0, 0, TAU);
    ctx.fill();

    chunks.forEach((chunk, index) => {
      if (!chunk.alive) return;
      ctx.beginPath();
      const inner = arena.coreRadius ?? 6;
      const steps = quality === "low" ? 6 : 16;
      for (let i = 0; i <= steps; i += 1) {
        const a = chunk.a0 + ((chunk.a1 - chunk.a0) * i) / steps;
        const p = oblique(Math.cos(a) * arena.radius, 0, Math.sin(a) * arena.radius, scale, cam);
        if (i === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      }
      for (let i = steps; i >= 0; i -= 1) {
        const a = chunk.a0 + ((chunk.a1 - chunk.a0) * i) / steps;
        const p = oblique(Math.cos(a) * inner, 0, Math.sin(a) * inner, scale, cam);
        ctx.lineTo(p.sx, p.sy);
      }
      ctx.closePath();
      const wear = 1 - chunk.hp / (chunk.maxHp || 100);
      // 四块之间给一点固有色差，不然整个台面是一坨均匀的蓝灰
      ctx.fillStyle = wear > 0.5 ? PALETTE.deckShade : index % 2 ? PALETTE.deckLit : PALETTE.deckLit2;
      ctx.fill();
      ctx.strokeStyle = PALETTE.deckEdge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (chunk.cracks > 0) {
        // 裂纹画成从中心向外的几道折线，而不是给整块描边——描边等于廉价发光轮廓。
        ctx.strokeStyle = wear > 0.6 ? PALETTE.crackDeep : PALETTE.crack;
        ctx.globalAlpha = 0.18 + wear * 0.34;
        ctx.lineWidth = 1 + wear * 1.4;
        ctx.beginPath();
        for (let c = 0; c < chunk.cracks; c += 1) {
          const a = chunk.a0 + ((chunk.a1 - chunk.a0) * (c + 0.5 + (c % 2) * 0.22)) / chunk.cracks;
          for (let s = 0; s <= 4; s += 1) {
            const rr = inner + ((arena.radius - inner) * s) / 4;
            const wobble = ((s % 2 ? 1 : -1) * 0.045 * (1 + c)) % 0.14;
            const p = oblique(Math.cos(a + wobble) * rr, 0, Math.sin(a + wobble) * rr, scale, cam);
            if (s === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // 中心核心台
    ctx.beginPath();
    const core = arena.coreRadius ?? 6;
    for (let i = 0; i <= 32; i += 1) {
      const a = (i / 32) * TAU;
      const p = oblique(Math.cos(a) * core, 0, Math.sin(a) * core, scale, cam);
      if (i === 0) ctx.moveTo(p.sx, p.sy);
      else ctx.lineTo(p.sx, p.sy);
    }
    ctx.closePath();
    ctx.fillStyle = "#41536b";
    ctx.fill();
    ctx.strokeStyle = PALETTE.seam;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 中缝
    const s0 = oblique(-arena.radius, 0, 0, scale, cam);
    const s1 = oblique(arena.radius, 0, 0, scale, cam);
    ctx.strokeStyle = PALETTE.seam;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s0.sx, s0.sy);
    ctx.lineTo(s1.sx, s1.sy);
    ctx.stroke();

    ctx.restore();
  }

  function drawPlayer(p, scale, cx, cy, isSelf) {
    const base = oblique(p.x, 0, p.z, scale, cam);
    const body = oblique(p.x, p.y, p.z, scale, cam);
    const r = 0.7 * scale;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = PALETTE.shadow;
    ctx.beginPath();
    ctx.ellipse(base.sx, base.sy, r * 0.95, r * 0.5, 0, 0, TAU);
    ctx.fill();

    if (p.awakenedT > 0) {
      ctx.strokeStyle = p.color || PALETTE.crack;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(base.sx, base.sy, r * 1.7, r * 0.9, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 扇击弧
    if (p.slapPhase === "active" || p.slapPhase === "windup") {
      const reach = (p.slapPhase === "active" ? 2.8 : 1.6) * scale;
      ctx.fillStyle = p.slapPhase === "active" ? "rgba(217,164,65,0.30)" : "rgba(217,164,65,0.12)";
      ctx.beginPath();
      ctx.moveTo(body.sx, body.sy);
      ctx.ellipse(body.sx, body.sy, reach, reach * 0.58, 0, p.yaw - 0.7, p.yaw + 0.7);
      ctx.closePath();
      ctx.fill();
    }

    const h = 1.9 * scale * 0.52;
    ctx.fillStyle = isSelf ? p.color || "#cbb9a0" : "#5f6f85";
    if (p.invulnT > 0) ctx.globalAlpha = 0.45;
    ctx.beginPath();
    roundRect(ctx, body.sx - r * 0.55, body.sy - h, r * 1.1, h, r * 0.4);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 朝向：掌
    const hx = body.sx + Math.cos(p.yaw) * r * 1.25;
    const hy = body.sy - h * 0.55 + Math.sin(p.yaw) * r * 0.72;
    ctx.fillStyle = p.color || "#cbb9a0";
    ctx.beginPath();
    ctx.ellipse(hx, hy, r * 0.5, r * 0.4, p.yaw, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(10,14,20,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (quality !== "low") {
      ctx.fillStyle = isSelf ? PALETTE.ivory : PALETTE.muted;
      ctx.font = "500 11px ui-serif, Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(p.name || p.id, body.sx, body.sy - h - 8);
    }
    ctx.restore();
  }

  function drawBursts(dtGuess, scale, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = bursts.length - 1; i >= 0; i -= 1) {
      const b = bursts[i];
      b.t += dtGuess;
      const k = b.t / b.life;
      if (k >= 1) {
        bursts.splice(i, 1);
        continue;
      }
      const p = oblique(b.x, 0.6, b.z, scale, cam);
      ctx.globalAlpha = (1 - k) * 0.7;
      ctx.strokeStyle = b.kind === "chunkCrack" ? PALETTE.crackDeep : PALETTE.crack;
      ctx.lineWidth = 2 * (1 - k) + 0.6;
      ctx.beginPath();
      ctx.ellipse(p.sx, p.sy, (0.6 + k * 2.6) * scale, (0.6 + k * 2.6) * scale * 0.58, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawBadge() {
    ctx.save();
    ctx.font = "500 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "left";
    const mode = look.lookMode === "free" ? "自由视角" : "锁定视角";
    const label = `占位渲染 · src/render 未接入 · ${mode}`;
    const w = ctx.measureText(label).width + 16;
    const x = Math.round((width - w) / 2);
    const y = height - 28;
    ctx.fillStyle = "rgba(11,17,27,0.72)";
    ctx.fillRect(x, y, w, 20);
    ctx.strokeStyle = "rgba(217,164,65,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 19);
    ctx.fillStyle = PALETTE.crack;
    ctx.fillText(label, x + 8, y + 14);
    ctx.restore();
  }

  function sync(view) {
    if (!view) return;
    if (view !== lastView) ingestEvents(view);
    lastView = view;

    const players = Array.isArray(view.players) ? view.players : [];
    const self = players.find((p) => p.id === followId) || players[0];
    if (self) {
      // 只跟一部分，整座岛始终留在画面里；全跟会让边界一直在跑。
      const tx = self.x * 0.38;
      const tz = self.z * 0.38;
      if (!cam.init) {
        cam.x = tx;
        cam.z = tz;
        cam.init = true;
      } else {
        cam.x += (tx - cam.x) * 0.12;
        cam.z += (tz - cam.z) * 0.12;
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSky();

    const radius = (view.arena && view.arena.radius) || 20;
    // 先按「整座岛入画」算，再兜一个下限：竖屏下宽度受限，全塞进去人就只剩几个像素。
    const fit = Math.min(width / (radius * 2.8), height / (radius * 1.85));
    const scale = Math.max(fit, Math.min(width, height) / 30);
    const cx = width / 2;
    const cy = height * 0.54;

    drawArena(view, scale, cx, cy);
    drawBursts(1 / 60, scale, cx, cy);

    const sorted = players.slice().sort((a, b) => a.z - b.z);
    for (const p of sorted) {
      if (!p.alive) continue;
      drawPlayer(p, scale, cx, cy, self && p.id === self.id);
    }

    drawBadge();
  }

  resize(width, height, typeof devicePixelRatio === "number" ? devicePixelRatio : 1);

  return {
    sync,
    resize,
    setQuality,
    setFollow,
    setLook,
    getLook: () => ({ ...look }),
    snapCamera,
    dispose() {
      bursts.length = 0;
      lastView = null;
    },
    isFallback: true,
  };
}
