// 程序化贴图工厂。仓库不允许下载版权素材，所以所有材质细节（层理、毛孔、织纹、
// 重力方向的水渍）都在启动时用 Canvas2D + 值噪声画出来，再转成 three 贴图。
//
// 对应手册条目：
//  §2-1  每种材质给不同的粗糙度贴图，杜绝「一个反光度打天下」
//  §2-2  albedo 上加色相微偏移与噪点，杜绝纯色平面
//  §2-8  低面数也要有法线细节
//  §2-9  贴图重复靠贴花 / 污渍层 / 顶点色宏变化打散
//  §4-11 灰尘只落在朝上的面，锈渍沿重力向下流

import {
  CanvasTexture,
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three';
import { contrast, fbm, makeValueNoise2D, mulberry32, ridged, smoothstep } from './noise.js';

function makeCanvas(size) {
  if (typeof OffscreenCanvas !== 'undefined') {
    try {
      return new OffscreenCanvas(size, size);
    } catch {
      /* 某些内核禁用 OffscreenCanvas，退回 DOM canvas */
    }
  }
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function imageDataTexture(size, write, { srgb = false, wrap = RepeatWrapping } = {}) {
  const canvas = makeCanvas(size);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  const img = ctx.createImageData(size, size);
  write(img.data, size);
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = wrap;
  tex.wrapT = wrap;
  tex.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** 高度场转法线贴图。风格化资产也要有法线细节（手册 §2-8）。 */
function normalFromHeight(height, size, strength) {
  const data = new Uint8Array(size * size * 4);
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      data[i] = Math.round((nx * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = true;
  tex.colorSpace = NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function mixHex(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return [ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t];
}

/**
 * 崖壁：横向沉积层理 + 顺重力的水渍条痕 + 凹处积垢。
 * UV 约定跟 LatheGeometry 一致：u 绕圈，v 自上而下。
 */
function buildCliff(size, seed, wantNormal) {
  const n = makeValueNoise2D(seed);
  const n2 = makeValueNoise2D(seed + 977);
  const height = new Float32Array(size * size);
  const albedo = imageDataTexture(
    size,
    (data, s) => {
      for (let y = 0; y < s; y++) {
        const v = y / s;
        for (let x = 0; x < s; x++) {
          const u = x / s;
          // 层理：横向条带，被低频噪声推得不平行，避免像百叶窗。
          // 频率必须压住：贴图在崖面上是缩小采样的，条带一密就成摩尔纹。
          const warp = fbm(n, u * 6, v * 3, 3) * 0.12;
          const strata = ridged(n2, u * 3, (v + warp) * 7, 3);
          const grain = fbm(n, u * 18, v * 18, 4, 0.55);
          // 顺重力的水渍：只在竖直方向拉长，越往下越浓
          const dripSeed = fbm(n2, u * 22, v * 1.2, 3);
          const drip = smoothstep(0.52, 0.86, dripSeed) * smoothstep(0.05, 0.7, v);
          // 凹槽积垢
          const crevice = smoothstep(0.62, 0.16, strata);

          height[y * s + x] = strata * 0.72 + grain * 0.11 + drip * 0.17;

          const cool = 0.35 + 0.5 * (1 - v); // 越往下越冷
          let [r, g, b] = mixHex(0x3a3d46, 0x6d6558, cool * (0.45 + strata * 0.55));
          const fresh = smoothstep(0.78, 0.98, strata) * 0.5;
          const [fr, fg, fb] = mixHex(0, 0x8b8378, 1);
          r += fr * fresh * 0.35;
          g += fg * fresh * 0.35;
          b += fb * fresh * 0.35;
          const dirt = crevice * 0.55 + drip * 0.6;
          r *= 1 - dirt * 0.55;
          g *= 1 - dirt * 0.5;
          b *= 1 - dirt * 0.42;
          // 色相微偏移，杜绝纯色平面
          const tint = (grain - 0.5) * 14;
          const i = (y * s + x) * 4;
          data[i] = Math.max(0, Math.min(255, r + tint));
          data[i + 1] = Math.max(0, Math.min(255, g + tint * 0.7));
          data[i + 2] = Math.max(0, Math.min(255, b + tint * 0.4));
          data[i + 3] = 255;
        }
      }
    },
    { srgb: true }
  );

  const rough = imageDataTexture(size, (data, s) => {
    for (let y = 0; y < s; y++) {
      const v = y / s;
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const grain = fbm(n, u * 18, v * 18, 4, 0.55);
        const dripSeed = fbm(n2, u * 22, v * 1.2, 3);
        const drip = smoothstep(0.52, 0.86, dripSeed) * smoothstep(0.05, 0.7, v);
        // 干燥风化面更粗糙，水渍处颜色变深、反射变锐（手册 §4.9）
        const r = 0.94 - drip * 0.34 + (grain - 0.5) * 0.16;
        const i = (y * s + x) * 4;
        const c = Math.max(0, Math.min(255, r * 255));
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = 255;
      }
    }
  });

  return {
    albedo,
    rough,
    normal: wantNormal ? normalFromHeight(height, size, size * 0.13) : null,
  };
}

/** 台面：花岗质斑点 + 朝上面的浮灰 + 走动磨光的划痕。 */
function buildCrust(size, seed, wantNormal) {
  const n = makeValueNoise2D(seed + 31);
  const n2 = makeValueNoise2D(seed + 1301);
  const height = new Float32Array(size * size);
  const albedo = imageDataTexture(
    size,
    (data, s) => {
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const u = x / s;
          const v = y / s;
          // 花岗质斑点压得很轻：高频噪点一强，石台就从「石」变成「沙」或「迷彩」
          const speck = fbm(n, u * 17, v * 17, 3, 0.55);
          const macro = fbm(n2, u * 2.2, v * 2.2, 4);
          const dust = contrast(fbm(n2, u * 5 + 11, v * 5, 3), 1.4);
          const scratch = smoothstep(0.84, 0.98, ridged(n, u * 22 + v * 5, v * 1.6, 2));

          // 法线只吃低频起伏，高频只留一点点，否则掠射光下满地是麻点
          height[y * s + x] = macro * 0.8 + speck * 0.08 + scratch * 0.12;

          let [r, g, b] = mixHex(0x4c4a4c, 0x655f54, 0.25 + macro * 0.75);
          const spot = (speck - 0.5) * 8;
          r += spot;
          g += spot * 0.9;
          b += spot * 0.75;
          // 浮灰把台面提亮并降饱和
          r = r * (1 - dust * 0.16) + 124 * dust * 0.16;
          g = g * (1 - dust * 0.16) + 118 * dust * 0.16;
          b = b * (1 - dust * 0.16) + 109 * dust * 0.16;
          // 磨光划痕露出更亮的新鲜石面
          r += scratch * 15;
          g += scratch * 14;
          b += scratch * 12;
          const i = (y * s + x) * 4;
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
          data[i + 3] = 255;
        }
      }
    },
    { srgb: true }
  );

  const rough = imageDataTexture(size, (data, s) => {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const dust = contrast(fbm(n2, u * 5 + 11, v * 5, 3), 1.4);
        const scratch = smoothstep(0.84, 0.98, ridged(n, u * 22 + v * 5, v * 1.6, 2));
        // 积灰的地方最哑，被踩磨光的地方略亮
        const r = 0.74 + dust * 0.2 - scratch * 0.26;
        const c = Math.max(0, Math.min(255, r * 255));
        const i = (y * s + x) * 4;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = 255;
      }
    }
  });

  return {
    albedo,
    rough,
    normal: wantNormal ? normalFromHeight(height, size, size * 0.16) : null,
  };
}

/** 皮革：毛孔 + 折痕 + 缝线牵拉出的浅褶。 */
function buildLeather(size, seed, wantNormal) {
  const n = makeValueNoise2D(seed + 77);
  const height = new Float32Array(size * size);
  const rough = imageDataTexture(size, (data, s) => {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const pore = fbm(n, u * 64, v * 64, 3, 0.62);
        const crease = ridged(n, u * 7, v * 7, 3);
        const wear = smoothstep(0.55, 0.95, crease);
        height[y * s + x] = pore * 0.35 + crease * 0.65;
        // 哑光底，折痕脊线上有一点包浆的微亮
        const r = 0.86 - wear * 0.34 + (pore - 0.5) * 0.1;
        const c = Math.max(0, Math.min(255, r * 255));
        const i = (y * s + x) * 4;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = 255;
      }
    }
  });
  return { rough, normal: wantNormal ? normalFromHeight(height, size, size * 0.5) : null };
}

/** 织物：可见经纬 + 缝合处聚集的褶皱。 */
function buildCloth(size, seed, wantNormal) {
  const n = makeValueNoise2D(seed + 401);
  const height = new Float32Array(size * size);
  const rough = imageDataTexture(size, (data, s) => {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const warp = Math.sin(u * Math.PI * 2 * (s / 4)) * 0.5 + 0.5;
        const weft = Math.sin(v * Math.PI * 2 * (s / 4)) * 0.5 + 0.5;
        const weave = (warp * 0.5 + weft * 0.5) * 0.4 + fbm(n, u * 12, v * 12, 3) * 0.6;
        height[y * s + x] = weave;
        const r = 0.93 + (weave - 0.5) * 0.1;
        const c = Math.max(0, Math.min(255, r * 255));
        const i = (y * s + x) * 4;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = 255;
      }
    }
  });
  return { rough, normal: wantNormal ? normalFromHeight(height, size, size * 0.35) : null };
}

/** 金属：拉丝各向异性痕 + 边角磨亮 + 缝隙氧化。 */
function buildMetal(size, seed, wantNormal) {
  const n = makeValueNoise2D(seed + 613);
  const height = new Float32Array(size * size);
  const rough = imageDataTexture(size, (data, s) => {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const u = x / s;
        const v = y / s;
        const brush = fbm(n, u * 90, v * 3, 3, 0.6); // 沿 u 方向拉丝
        const smudge = fbm(n, u * 5 + 3, v * 5, 3);
        const oxide = smoothstep(0.62, 0.9, smudge);
        height[y * s + x] = brush * 0.25 + smudge * 0.2;
        const r = 0.3 + brush * 0.2 + oxide * 0.45;
        const c = Math.max(0, Math.min(255, r * 255));
        const i = (y * s + x) * 4;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = 255;
      }
    }
  });
  return { rough, normal: wantNormal ? normalFromHeight(height, size, size * 0.25) : null };
}

/** 尘团精灵：不是圆形光斑，是有缺口、有絮状边缘的烟团。 */
function buildDustSprite(size, seed) {
  const n = makeValueNoise2D(seed + 907);
  return imageDataTexture(
    size,
    (data, s) => {
      const c = (s - 1) / 2;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const dx = (x - c) / c;
          const dy = (y - c) / c;
          const r = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          const lump = fbm(n, Math.cos(ang) * 3 + 4, Math.sin(ang) * 3 + 4, 4) * 0.42;
          const puff = fbm(n, x / s * 7, y / s * 7, 4);
          let a = smoothstep(1.0 + lump, 0.15, r) * (0.55 + puff * 0.75);
          a = Math.max(0, Math.min(1, a));
          const i = (y * s + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = a * 255;
        }
      }
    },
    { wrap: ClampToEdgeWrapping }
  );
}

/** 余烬精灵：极小的核心 + 快速衰减的晕，用于 additive 的少量火星。 */
function buildEmberSprite(size) {
  return imageDataTexture(
    size,
    (data, s) => {
      const c = (s - 1) / 2;
      for (let y = 0; y < s; y++) {
        for (let x = 0; x < s; x++) {
          const r = Math.hypot((x - c) / c, (y - c) / c);
          const core = smoothstep(0.22, 0.0, r);
          const halo = smoothstep(1.0, 0.1, r) * 0.35;
          const a = Math.max(0, Math.min(1, core + halo));
          const i = (y * s + x) * 4;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = a * 255;
        }
      }
    },
    { wrap: ClampToEdgeWrapping }
  );
}

/** 裂纹贴花：分叉的细缝，中心一线暖芯，其余是压暗的碎裂纹路。 */
function buildCrackDecal(size, seed) {
  const canvas = makeCanvas(size);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const rand = mulberry32(seed + 5);
  const cx = size / 2;
  const cy = size / 2;
  const branches = 7;

  const drawStroke = (color, widthScale, alpha) => {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    for (let b = 0; b < branches; b++) {
      const baseAng = (b / branches) * Math.PI * 2 + rand() * 0.6;
      let x = cx + Math.cos(baseAng) * size * 0.03;
      let y = cy + Math.sin(baseAng) * size * 0.03;
      let ang = baseAng;
      const segs = 6 + Math.floor(rand() * 4);
      let w = size * 0.03 * widthScale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < segs; i++) {
        ang += (rand() - 0.5) * 0.9;
        const len = (size * 0.42) / segs;
        x += Math.cos(ang) * len;
        y += Math.sin(ang) * len;
        ctx.lineWidth = Math.max(0.6, w);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        w *= 0.78;
        // 二级分叉：让裂纹像真的在传播，而不是米字星
        if (rand() < 0.4 && i < segs - 2) {
          const sa = ang + (rand() - 0.5) * 1.6;
          let sx = x;
          let sy = y;
          ctx.lineWidth = Math.max(0.5, w * 0.6);
          for (let j = 0; j < 3; j++) {
            sx += Math.cos(sa) * len * 0.7;
            sy += Math.sin(sa) * len * 0.7;
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // 先画崩碎的暗边，再在正中压一条更细的暖芯：读起来是「裂开的石头」而不是「画上去的黄线」
  drawStroke('#1a1512', 2.2, 0.62);
  drawStroke('#8a5a2c', 1.15, 0.7);
  drawStroke('#c98a45', 0.55, 0.85);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** 冲击波用的湍流噪声：让激波壳有絮状边缘而不是完美圆环。 */
function buildTurbulence(size, seed) {
  const n = makeValueNoise2D(seed + 1777);
  return imageDataTexture(size, (data, s) => {
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = fbm(n, (x / s) * 8, (y / s) * 8, 4, 0.55);
        const c = Math.max(0, Math.min(255, v * 255));
        const i = (y * s + x) * 4;
        data[i] = c;
        data[i + 1] = c;
        data[i + 2] = c;
        data[i + 3] = 255;
      }
    }
  });
}

export function createTextureLib(quality, seed = 20240501) {
  const rockSize = quality.texRock;
  const detail = quality.texDetail;
  const wantNormal = quality.normalMaps;

  const cliff = buildCliff(rockSize, seed, wantNormal);
  const crust = buildCrust(rockSize, seed, wantNormal);
  const leather = buildLeather(detail, seed, wantNormal);
  const cloth = buildCloth(detail, seed, wantNormal);
  const metal = buildMetal(detail, seed, wantNormal);

  const lib = {
    cliff,
    crust,
    leather,
    cloth,
    metal,
    dust: buildDustSprite(Math.max(64, detail), seed),
    ember: buildEmberSprite(64),
    crack: buildCrackDecal(Math.max(128, detail * 2), seed),
    turbulence: buildTurbulence(Math.max(64, detail), seed),
    dispose() {
      const seen = new Set();
      const kill = (t) => {
        if (t && !seen.has(t)) {
          seen.add(t);
          t.dispose();
        }
      };
      [cliff, crust, leather, cloth, metal].forEach((set) => {
        if (!set) return;
        kill(set.albedo);
        kill(set.rough);
        kill(set.normal);
      });
      kill(lib.dust);
      kill(lib.ember);
      kill(lib.crack);
      kill(lib.turbulence);
    },
  };
  return lib;
}
