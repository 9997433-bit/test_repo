/**
 * 城民：8~16 个小像素团，在民居 / 工坊 / 火炉之间通勤。
 * 全部坐标使用「网格浮点坐标」，由渲染器统一投影。
 */

const TAU = Math.PI * 2;

const COATS = [
  ["#2f4f63", "#8fc4d8"], // 青布
  ["#5a3b2e", "#d7b48b"], // 褐袄
  ["#3b3f57", "#a5aed0"], // 玄衣
  ["#59333a", "#d69aa2"], // 绛袍
  ["#2c4a3c", "#93c9ab"], // 苍绿
];

function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

/**
 * 站位不能落在建筑体内：往镜头方向（gx、gy 同时增大）让出一个「檐前空地」。
 * 深度 = gx+gy，因此偏移后城民会排在该建筑之后绘制，不会被屋顶吃掉。
 */
const APRON = 0.92;
function apronOf(node, spread = 0.42) {
  return {
    tx: node.gx + APRON + rnd(-spread, spread),
    ty: node.gy + APRON + rnd(-spread, spread),
  };
}

export function createVillagerCrowd() {
  /** @type {Array<object>} */
  const people = [];
  let nodes = [];
  let hearth = { gx: 4, gy: 4 };
  let homes = [];
  let works = [];
  const puffs = [];

  let nodeSig = "";

  function setNodes(list, hearthNode) {
    const clean = list.filter((n) => Number.isFinite(n.gx) && Number.isFinite(n.gy));
    // 渲染器每帧都会重建节点数组；内容没变就不要打断城民正在走的路
    const sig = clean.map((n) => `${n.key}:${n.gx},${n.gy},${n.role}`).join("|");
    if (sig === nodeSig) return;
    nodeSig = sig;
    nodes = clean;
    homes = nodes.filter((n) => n.role === "home");
    works = nodes.filter((n) => n.role === "work");
    if (hearthNode) hearth = hearthNode;
    if (!homes.length) homes = [hearth];
    if (!works.length) works = [hearth];
    for (const p of people) retarget(p, true);
  }

  function spawn() {
    const home = pick(homes);
    const coat = pick(COATS);
    const start = apronOf(home, 0.7);
    const p = {
      gx: start.tx,
      gy: start.ty,
      tx: 0, ty: 0,
      state: "toWork",
      timer: rnd(0, 2),
      speed: rnd(0.55, 0.95),
      coat: coat[0],
      trim: coat[1],
      skin: Math.random() < 0.5 ? "#e8cba9" : "#dcbd97",
      hat: Math.random() < 0.45,
      home,
      work: pick(works),
      carry: null,
      bob: Math.random() * TAU,
      facing: 1,
      breath: rnd(1, 4),
      scale: rnd(1.18, 1.44),
    };
    retarget(p, true);
    people.push(p);
  }

  function setCount(n) {
    const want = Math.max(4, Math.min(16, Math.round(n) || 8));
    while (people.length < want) spawn();
    while (people.length > want) people.pop();
  }

  function retarget(p, immediate) {
    if (!homes.length || !works.length) return;
    // 节点数组可能被整体替换，按 key 重新绑定，避免丢失原有的家 / 工位
    p.home = homes.find((n) => n.key === p.home?.key) || p.home;
    p.work = works.find((n) => n.key === p.work?.key) || p.work;
    if (!p.home || !homes.includes(p.home)) p.home = pick(homes);
    if (!p.work || !works.includes(p.work)) p.work = pick(works);
    if (p.state === "toHearth") {
      // 火炉四周围一圈取暖，而不是全挤在一点
      const a = rnd(0, TAU);
      const r = rnd(1.15, 1.9);
      p.tx = hearth.gx + Math.cos(a) * r;
      p.ty = hearth.gy + Math.sin(a) * r * 0.9 + 0.35;
    } else {
      const dest = p.state === "toWork" ? p.work : p.state === "toHome" ? p.home : null;
      if (dest) {
        const s = apronOf(dest);
        p.tx = s.tx;
        p.ty = s.ty;
      }
    }
    if (immediate) p.timer = Math.min(p.timer, 0.4);
  }

  const CARRY_COLOR = {
    food: "#e07a52", wood: "#a9743f", coal: "#3a3f46", iron: "#8fa4b4",
  };

  function nextState(p, env) {
    switch (p.state) {
      case "toWork":
        p.state = "working";
        p.timer = rnd(3.4, 7.5);
        break;
      case "working":
        p.state = "toHearth";
        p.carry = p.work?.yield ?? null;
        retarget(p);
        break;
      case "toHearth":
        p.carry = null;
        p.state = "warming";
        p.timer = rnd(1.8, 4.2) * (1 + env.blizzard * 1.6);
        break;
      case "warming":
        p.state = Math.random() < (env.blizzard > 0.4 ? 0.55 : 0.22) ? "toHome" : "toWork";
        retarget(p);
        break;
      case "toHome":
        p.state = "resting";
        p.timer = rnd(2.5, 6) * (1 + env.blizzard);
        break;
      default:
        p.state = "toWork";
        retarget(p);
    }
  }

  function update(dt, env) {
    const blizzard = env?.blizzard ?? 0;
    const chill = 1 - blizzard * 0.35;

    for (const p of people) {
      p.bob += dt * (p.state.startsWith("to") ? 9 : 2.2);
      p.breath -= dt;
      if (p.breath <= 0) {
        p.breath = rnd(2.2, 6);
        puffs.push({ gx: p.gx, gy: p.gy, life: 0, max: rnd(0.7, 1.3), dir: p.facing });
      }

      if (p.state.startsWith("to")) {
        const dx = p.tx - p.gx;
        const dy = p.ty - p.gy;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.09) {
          nextState(p, { blizzard });
        } else {
          const v = (p.speed * chill * dt) / Math.max(dist, 1e-4);
          p.gx += dx * v;
          p.gy += dy * v;
          p.facing = dx - dy >= 0 ? 1 : -1;
        }
      } else {
        p.timer -= dt;
        if (p.timer <= 0) nextState(p, { blizzard });
        // 原地小幅晃动，避免呆立
        p.gx += Math.sin(p.bob * 0.7) * dt * 0.012;
        p.gy += Math.cos(p.bob * 0.5) * dt * 0.012;
      }
    }

    for (let i = puffs.length - 1; i >= 0; i--) {
      const q = puffs[i];
      q.life += dt;
      if (q.life >= q.max) puffs.splice(i, 1);
    }
  }

  /** 呼吸白汽（统一在最后叠加） */
  function drawPuffs(ctx, project) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const q of puffs) {
      const t = q.life / q.max;
      const s = project(q.gx, q.gy);
      ctx.globalAlpha = (1 - t) * 0.3;
      ctx.fillStyle = "#dff3ff";
      ctx.beginPath();
      ctx.arc(s.x + q.dir * (3 + t * 6), s.y - 15 - t * 7, 1.4 + t * 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * 绘制深度区间 (dMin, dMax] 内的城民，便于与建筑按深度混排。
   * @param ctx  已应用世界变换的上下文
   * @param project (gx,gy) => {x,y}
   * @param env  { warmthAt(gx,gy): 0..1 }
   */
  function draw(ctx, project, env, dMin = -Infinity, dMax = Infinity) {
    const sorted = people
      .filter((p) => {
        const d = p.gx + p.gy;
        return d > dMin && d <= dMax;
      })
      .sort((a, b) => a.gx + a.gy - (b.gx + b.gy));

    for (const p of sorted) {
      const s = project(p.gx, p.gy);
      const warm = env?.warmthAt ? env.warmthAt(p.gx, p.gy) : 0;
      const walking = p.state.startsWith("to");
      const bobY = walking ? Math.abs(Math.sin(p.bob)) * 1.5 : Math.sin(p.bob) * 0.4;
      const k = p.scale;
      const x = s.x;
      const y = s.y - bobY;

      // 影子
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#04141c";
      ctx.beginPath();
      ctx.ellipse(x, s.y + 1, 4.6 * k, 2.1 * k, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;

      const stride = walking ? Math.sin(p.bob) * 2.1 : 0;
      const swing = walking ? Math.sin(p.bob + Math.PI) * 1.5 : 0;

      // 描边：雪地上的小人需要一圈暗边才读得出来
      const OL = 0.95;
      ctx.fillStyle = "rgba(7,22,30,.72)";
      ctx.fillRect(x - 2.6 * k + stride * 0.4 - OL, y - 4.4 * k - OL, 2.1 * k + OL * 2, 4.4 * k + OL * 2);
      ctx.fillRect(x + 0.5 * k - stride * 0.4 - OL, y - 4.4 * k - OL, 2.1 * k + OL * 2, 4.4 * k + OL * 2);
      ctx.fillRect(x - 5.0 * k - OL, y - 10.6 * k + swing * 0.3 - OL, 1.7 * k + OL * 2, 5.4 * k + OL * 2);
      ctx.fillRect(x + 3.3 * k - OL, y - 10.6 * k - swing * 0.3 - OL, 1.7 * k + OL * 2, 5.4 * k + OL * 2);
      ctx.fillRect(x - 3.4 * k - OL, y - 11.6 * k - OL, 6.8 * k + OL * 2, 7.6 * k + OL * 2);
      ctx.fillRect(x - 3.0 * k - OL, y - 17.4 * k - OL, 6.0 * k + OL * 2, 9.0 * k + OL * 2);

      // 腿
      ctx.fillStyle = "#20303a";
      ctx.fillRect(x - 2.6 * k + stride * 0.4, y - 4.4 * k, 2.1 * k, 4.4 * k);
      ctx.fillRect(x + 0.5 * k - stride * 0.4, y - 4.4 * k, 2.1 * k, 4.4 * k);

      // 袄身
      ctx.fillStyle = p.coat;
      ctx.fillRect(x - 3.4 * k, y - 11.6 * k, 6.8 * k, 7.6 * k);
      // 衣缘
      ctx.fillStyle = p.trim;
      ctx.fillRect(x - 3.4 * k, y - 11.6 * k, 6.8 * k, 1.5 * k);
      // 臂
      ctx.fillStyle = p.coat;
      ctx.fillRect(x - 5.0 * k, y - 10.6 * k + swing * 0.3, 1.7 * k, 5.4 * k);
      ctx.fillRect(x + 3.3 * k, y - 10.6 * k - swing * 0.3, 1.7 * k, 5.4 * k);

      // 头
      ctx.fillStyle = p.skin;
      ctx.fillRect(x - 2.4 * k, y - 16.2 * k, 4.8 * k, 4.8 * k);
      // 巾帽
      ctx.fillStyle = p.hat ? "#22323d" : p.trim;
      ctx.fillRect(x - 3.0 * k, y - 17.4 * k, 6.0 * k, 2.0 * k);
      if (p.hat) ctx.fillRect(x - 1.4 * k, y - 19.0 * k, 2.8 * k, 1.7 * k);

      // 携带物
      if (p.carry) {
        ctx.fillStyle = CARRY_COLOR[p.carry] || "#c9a464";
        ctx.fillRect(x + p.facing * 4.6 * k - 1.6 * k, y - 9.6 * k, 3.4 * k, 3.4 * k);
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.fillRect(x + p.facing * 4.6 * k - 1.6 * k, y - 9.6 * k, 3.4 * k, 1 * k);
      }

      // 暖光轮廓（靠近火炉）
      if (warm > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(0.5, warm * 0.62);
        ctx.fillStyle = "#ff9f45";
        ctx.fillRect(x - 3.6 * k, y - 16.4 * k, 1.5 * k, 12.2 * k);
        ctx.fillRect(x - 2.6 * k, y - 17.6 * k, 5.4 * k, 1.2 * k);
        ctx.restore();
      }
    }
  }

  return {
    setNodes,
    setCount,
    update,
    draw,
    drawPuffs,
    get size() { return people.length; },
    get roster() { return people.map((p) => ({ gx: p.gx, gy: p.gy, state: p.state })); },
  };
}
