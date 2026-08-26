// 确定性噪声与随机源。渲染层所有程序化贴图 / 岩层起伏都从这里取值，
// 保证同一 seed 下每次启动的裂岛长得一样。

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * 2D 值噪声。返回 [0,1)。周期 256，方便做可平铺贴图。
 */
export function makeValueNoise2D(seed) {
  const rand = mulberry32(seed);
  const size = 256;
  const mask = size - 1;
  const table = new Float32Array(size * size);
  for (let i = 0; i < table.length; i++) table[i] = rand();

  return function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = fade(x - xi);
    const yf = fade(y - yi);
    const x0 = xi & mask;
    const x1 = (xi + 1) & mask;
    const y0 = (yi & mask) * size;
    const y1 = ((yi + 1) & mask) * size;
    const a = table[y0 + x0];
    const b = table[y0 + x1];
    const c = table[y1 + x0];
    const d = table[y1 + x1];
    return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
  };
}

/**
 * 分形叠加。lacunarity 固定 2，gain 可调（岩石 0.5，尘土 0.6 更绵）。
 */
export function fbm(noise, x, y, octaves = 4, gain = 0.5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += noise(fx, fy) * amp;
    norm += amp;
    amp *= gain;
    fx *= 2;
    fy *= 2;
  }
  return sum / norm;
}

/** 山脊噪声：给岩层的锐利层理用，比普通 fbm 更有「被劈开」的感觉。 */
export function ridged(noise, x, y, octaves = 4) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise(fx, fy) * 2 - 1);
    sum += n * n * amp;
    norm += amp;
    amp *= 0.45;
    fx *= 2.07;
    fy *= 2.03;
  }
  return sum / norm;
}

/** 把 [0,1] 的值往两端推，用来把污渍压成「有边界的斑块」而不是均匀灰雾。 */
export function contrast(v, k) {
  const c = Math.min(1, Math.max(0, v));
  return c < 0.5 ? 0.5 * Math.pow(c * 2, k) : 1 - 0.5 * Math.pow((1 - c) * 2, k);
}

export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
