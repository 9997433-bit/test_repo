// 安全区（Hub）：走道 + 两排石台座 + 传送门。
//
// sim 把安全区整体挪到 z ≈ -120，与裂岛在水平面上错开（见 src/sim/hub.js）。这里照着
// `view.hub` 的布局把它长出来，`phase === 'arena'` 时整棵子树 visible = false ——
// 走道不会跑进格斗岛，裂岛那一套也一行没动。
//
// 视觉沿用底座 B（docs/VISUAL_HANDBOOK.md）：
//   1. 走道是**铺出来的**：一块块石板，各自有磨损、错高与冷暖差，不是一张长方形地板贴图
//   2. 台座有三段（脚 / 柱 / 帽），顶上一圈识别色漆环 —— 漆是刷的，会脏，不会自发光
//   3. 展示掌手指朝上（见 ./hub-palm.js），每掌一种 idle 特效（见 ./hub-vfx.js）
//   4. 中轴一条暖色石嵌线通向门；选完主掌，嵌线与门楣的凿刻一起亮起来 ——
//      「门开了」是靠材质与灯，不是靠把辉光调大糊一屏
//
// 绘制调用预算：走道 3 + 台座 2（8 座合批）+ 每掌 3 + 选中标记 ≤2 + 门 4 + 特效 ≈ 40，
// 比裂岛那 165~500 便宜一个量级。

import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  NormalBlending,
  Object3D,
  PlaneGeometry,
  PointLight,
  ShaderMaterial,
  TorusGeometry,
  Vector2,
} from 'three';
import { PALETTE } from './config.js';
import { bakeByMaterial, createPalmFactory } from './hub-palm.js';
import { createHubVfx } from './hub-vfx.js';
import { mulberry32 } from './noise.js';

const BLOOM_LAYER = 1;

/** 掌浮在台帽上方多少米。低于这个高度会挡住漆环，高了就不像「摆在座上」。 */
const PALM_HOVER = 0.62;

const MEMBRANE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// 门帘两态共用一套着色器，靠 uReady 在两组颜色/纹路之间过渡：
//   未启 —— 一层结着灰的封印石膜，横向的封印带几乎不动
//   已启 —— 纵向流动的光帘，缝里透暖色，门框内沿更亮
// 两态的 alpha 峰值刻意接近，所以开门不会突然把整块屏幕糊白。
const MEMBRANE_FRAG = /* glsl */ `
  uniform sampler2D uNoise;
  uniform vec3 uSealA;
  uniform vec3 uSealB;
  uniform vec3 uOpenA;
  uniform vec3 uOpenB;
  uniform float uReady;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - vec2(0.5, 0.44);
    // 门洞是个拱：下半直边，上半半圆
    float d = max(abs(p.x) * 2.02, length(vec2(p.x * 2.02, max(0.0, p.y * 1.7))));
    float mask = 1.0 - smoothstep(0.84, 1.0, d);
    if (mask <= 0.002) discard;

    float grain = texture2D(uNoise, vec2(vUv.x * 3.1 - uTime * 0.008, vUv.y * 2.3 - uTime * 0.02)).r;
    float flow = texture2D(uNoise, vec2(vUv.x * 1.25 + uTime * 0.02, vUv.y * 0.9 - uTime * 0.17)).r;

    float bands = 0.5 + 0.5 * sin(vUv.y * 24.0 + grain * 3.4);
    vec3 sealed = mix(uSealA, uSealB, bands * 0.55 + grain * 0.45);
    float sealedA = (0.5 + grain * 0.22) * mask;

    float veil = pow(flow, 1.35);
    float streak = smoothstep(0.3, 0.92, flow * 0.7 + grain * 0.45);
    float edge = smoothstep(0.5, 0.98, d);
    vec3 open = mix(uOpenA, uOpenB, streak);
    float openA = (0.2 + veil * 0.46 + edge * 0.32) * mask;

    vec3 col = mix(sealed, open, uReady);
    float a = mix(sealedA, openA, uReady);
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

const hsl = { h: 0, s: 0, l: 0 };

/**
 * 识别色漆的明暗档。
 *
 * 不能直接 `multiplyScalar(boost)`：木棉这类本来就亮的识别色乘完会削顶，
 * 三个通道一起顶到 1 就洗成白的，八座的色相全丢了。改成只抬 HSL 的亮度、
 * 保住色相，焦点态因此是「更亮的那个金」而不是「白」。
 * 压暗时同步褪色 —— 没点亮的座是块石头，不是暗着的彩漆。
 */
function identShade(out, base, boost) {
  base.getHSL(hsl);
  const l = boost >= 1 ? hsl.l + (0.95 - hsl.l) * (1 - 1 / boost) : hsl.l * boost;
  const s = hsl.s * Math.min(1, boost * 0.85 + 0.15);
  return out.setHSL(hsl.h, s, Math.min(0.9, Math.max(0.02, l)));
}

/** 走道尺寸变了才需要重铺；每帧比对这个签名就够。 */
function walkwaySignature(hub) {
  const w = hub.walkway;
  return `${hub.origin.x.toFixed(2)}|${hub.floorY.toFixed(2)}|${w.halfWidth.toFixed(2)}|${w.minZ.toFixed(2)}|${w.maxZ.toFixed(2)}`;
}

export function createHubScene({ scene, quality, textures, seed = 20240501 }) {
  const root = new Group();
  root.name = 'hub';
  root.visible = false;
  scene.add(root);

  const rand = mulberry32(seed + 8171);
  const disposables = [];
  const track = (x) => {
    disposables.push(x);
    return x;
  };

  const cloneTex = (tex, rx, ry) => {
    if (!tex) return null;
    const t = tex.clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    track(t);
    return t;
  };

  // ---------------------------------------------------------------- 材质
  const deckMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures?.crust?.albedo, 1, 1),
      normalMap: quality.normalMaps ? cloneTex(textures?.crust?.normal, 1, 1) : null,
      roughnessMap: cloneTex(textures?.crust?.rough, 1, 1),
      normalScale: new Vector2(0.85, 0.85),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.42,
    })
  );

  const rockMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures?.cliff?.albedo, 2, 1),
      normalMap: quality.normalMaps ? cloneTex(textures?.cliff?.normal, 2, 1) : null,
      roughnessMap: cloneTex(textures?.cliff?.rough, 2, 1),
      normalScale: new Vector2(0.7, 0.7),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.3,
    })
  );

  const plinthMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures?.cliff?.albedo, 1, 1),
      normalMap: quality.normalMaps ? cloneTex(textures?.cliff?.normal, 1, 1) : null,
      roughnessMap: cloneTex(textures?.cliff?.rough, 1, 1),
      normalScale: new Vector2(0.8, 0.8),
      roughness: 0.96,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.34,
    })
  );

  // 中轴嵌线与门楣凿刻：唯一允许 emissive 的两处，强度由「主掌选没选」驱动
  const inlayMat = track(
    new MeshStandardMaterial({
      color: new Color(PALETTE.rockDeep),
      roughness: 0.62,
      metalness: 0.15,
      emissive: new Color(PALETTE.crackCore),
      emissiveIntensity: 0.05,
      envMapIntensity: 0.5,
    })
  );
  const runeMat = track(
    new MeshStandardMaterial({
      color: new Color(0x1a1410),
      roughness: 0.5,
      metalness: 0.25,
      emissive: new Color(PALETTE.crackCore),
      emissiveIntensity: 0.06,
      envMapIntensity: 0.6,
    })
  );

  const ringMat = track(
    new MeshStandardMaterial({
      color: new Color(0xffffff),
      roughnessMap: textures?.cloth?.rough ?? null,
      roughness: 0.85,
      metalness: 0,
      envMapIntensity: 0.3,
    })
  );

  const membraneMat = track(
    new ShaderMaterial({
      vertexShader: MEMBRANE_VERT,
      fragmentShader: MEMBRANE_FRAG,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: NormalBlending,
      uniforms: {
        uNoise: { value: textures?.turbulence ?? null },
        uSealA: { value: new Color(PALETTE.rockDeep) },
        uSealB: { value: new Color(PALETTE.fog).lerp(new Color(PALETTE.rockBody), 0.4) },
        uOpenA: { value: new Color(PALETTE.crackDeep).lerp(new Color(PALETTE.fog), 0.45) },
        uOpenB: { value: new Color(PALETTE.crackCore) },
        uReady: { value: 0 },
        uTime: { value: 0 },
      },
    })
  );

  const palms = createPalmFactory({ quality, textures });
  const vfx = createHubVfx({ root, quality, textures, seed });

  // 门口的暖光。它是「门后透出来的光」的依据，放在场景根上而不是 hub 子树里：
  // 灯一旦随子树隐藏就要重编译全场材质，改成把强度收到 0，切阶段时画面不会卡一下。
  const portalLight = new PointLight(PALETTE.crackLight, 0, 17, 2);
  portalLight.name = 'hub-portal-light';
  scene.add(portalLight);

  // ---------------------------------------------------------------- 走道
  let walkway = null;
  let walkwaySig = '';

  function buildWalkway(hub) {
    const w = hub.walkway;
    const ox = hub.origin.x;
    const y = hub.floorY;
    const length = Math.max(6, w.maxZ - w.minZ);
    const width = w.halfWidth * 2;
    const scaffold = new Object3D();
    const put = (geo, matKey, tone, place) => {
      const m = new Mesh(geo, null);
      m.userData.matKey = matKey;
      m.userData.tone = tone;
      place(m);
      scaffold.add(m);
      return m;
    };

    // --- 铺石板：一块块摆，错高、错色、留缝 ---
    const cols = Math.max(4, Math.round(width / 2.7));
    const rows = Math.max(6, Math.round(length / 2.7));
    const cw = width / cols;
    const ch = length / rows;
    const slabGeo = new BoxGeometry(cw - 0.1, 0.36, ch - 0.1);
    const tone = new Color();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = ox - w.halfWidth + cw * (c + 0.5);
        const cz = w.minZ + ch * (r + 0.5);
        const n = rand();
        // 越靠边越脏越冷，中轴被踩得最亮：磨损是有方向的
        const edge = Math.min(1, Math.abs(cx - ox) / w.halfWidth);
        const lum = 1.14 - edge * 0.24 - n * 0.16;
        tone.setRGB(lum * 1.03, lum, lum * (0.94 + edge * 0.1));
        put(slabGeo, 'deck', tone.clone(), (m) => {
          m.position.set(cx, y - 0.18 + (n - 0.5) * 0.028, cz);
          m.rotation.y = (rand() - 0.5) * 0.02;
        });
      }
    }

    // --- 中轴嵌线：一直通到门口，是走道的方向指示 ---
    const inlayGeo = new BoxGeometry(0.26, 0.06, ch * 0.72);
    for (let r = 0; r < rows; r++) {
      put(inlayGeo, 'inlay', 1, (m) => {
        m.position.set(ox, y + 0.005, w.minZ + ch * (r + 0.5));
      });
    }

    // --- 两侧石唇：有高有低、偶尔缺一块，说明这地方被走过很多年 ---
    const kerbGeo = new BoxGeometry(0.52, 0.34, 1.4);
    for (let z = w.minZ + 0.8; z < w.maxZ; z += 1.55) {
      for (const side of [-1, 1]) {
        if (rand() < 0.11) continue;
        const h = 0.8 + rand() * 0.5;
        put(kerbGeo, 'rock', 0.82 + rand() * 0.2, (m) => {
          m.position.set(ox + side * (w.halfWidth + 0.16), y + 0.02 + h * 0.04, z);
          m.rotation.set((rand() - 0.5) * 0.06, (rand() - 0.5) * 0.09, side * (rand() - 0.4) * 0.05);
          m.scale.set(1, h, 1);
        });
      }
    }

    // --- 底板与底下挂着的碎岩：安全区同样是一块浮空的石头 ---
    put(new BoxGeometry(width + 0.9, 0.95, length), 'rock', 0.62, (m) => {
      m.position.set(ox, y - 0.82, (w.minZ + w.maxZ) / 2);
    });

    const chunkGeo = new IcosahedronGeometry(1, 0);
    const chunks = quality.name === 'low' ? 8 : 16;
    for (let i = 0; i < chunks; i++) {
      const s = 0.55 + rand() * 1.5;
      put(chunkGeo, 'rock', 0.44 + rand() * 0.18, (m) => {
        m.position.set(
          ox + (rand() - 0.5) * width * 0.9,
          y - 1.5 - rand() * 2.2,
          w.minZ + rand() * length
        );
        m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
        m.scale.set(s, s * (0.6 + rand() * 0.7), s);
      });
    }

    // --- 入口两根断柱：给出生点一个「门槛」，玩家一转身就知道背后是尽头 ---
    const pillarGeo = new CylinderGeometry(0.34, 0.46, 1, 7);
    for (const side of [-1, 1]) {
      const h = 1.6 + rand() * 1.4;
      put(pillarGeo, 'rock', 0.78 + rand() * 0.16, (m) => {
        m.position.set(ox + side * (w.halfWidth - 1.1), y + h * 0.5, w.maxZ - 1.1);
        m.scale.set(1, h, 1);
        m.rotation.y = rand() * 3;
        m.rotation.z = side * 0.03;
      });
    }

    const baked = bakeByMaterial(scaffold);
    // 脚手架用的那几份原始几何体已经烘进合并结果里了，这里就地释放
    slabGeo.dispose();
    inlayGeo.dispose();
    kerbGeo.dispose();
    chunkGeo.dispose();
    pillarGeo.dispose();

    const group = new Group();
    group.name = 'hub-walkway';
    const meshes = [];
    const matOf = { deck: deckMat, rock: rockMat, inlay: inlayMat };
    for (const [key, geo] of baked) {
      const mesh = new Mesh(geo, matOf[key] ?? rockMat);
      mesh.receiveShadow = quality.shadows;
      mesh.castShadow = key === 'rock' && quality.shadows;
      group.add(mesh);
      meshes.push(mesh);
    }
    root.add(group);

    return {
      group,
      dispose() {
        root.remove(group);
        for (const m of meshes) m.geometry.dispose();
      },
    };
  }

  // ---------------------------------------------------------------- 台座
  let plinthGeo = null;
  let markGeo = null;
  let plinthSig = '';

  function buildPedestalGeometry(radius, height) {
    const scaffold = new Object3D();
    const born = [];
    const put = (geo, tone, place) => {
      born.push(geo);
      const m = new Mesh(geo, null);
      m.userData.matKey = 'rock';
      m.userData.tone = tone;
      place(m);
      scaffold.add(m);
    };

    put(new CylinderGeometry(radius * 1.12, radius * 1.2, height * 0.14, 8), 0.78, (m) => {
      m.position.y = height * 0.07;
      m.rotation.y = Math.PI / 8;
    });
    put(new CylinderGeometry(radius * 0.84, radius * 1.02, height * 0.62, 8), 0.92, (m) => {
      m.position.y = height * 0.46;
    });
    put(new CylinderGeometry(radius * 0.95, radius * 0.86, height * 0.1, 8), 1.02, (m) => {
      m.position.y = height * 0.82;
    });
    // 台帽被摸得最亮：这是玩家真正会盯着看的那一圈
    put(new CylinderGeometry(radius * 1.08, radius * 1.0, height * 0.12, 8), 1.16, (m) => {
      m.position.y = height * 0.93;
      m.rotation.y = Math.PI / 8;
    });
    // 缺角：石头会崩
    put(new IcosahedronGeometry(radius * 0.3, 0), 0.86, (m) => {
      m.position.set(radius * 0.9, height * 0.2, radius * 0.5);
      m.rotation.set(0.6, 0.9, 0.2);
      m.scale.set(1, 0.7, 1);
    });

    const baked = bakeByMaterial(scaffold);
    for (const g of born) g.dispose();
    return baked.get('rock');
  }

  /** 主掌 / 副掌的标记环。主掌一整圈 + 两根立柱，副掌只有朝走道那半圈 + 一根。 */
  function buildMarkGeometries(radius, height) {
    const make = (full) => {
      const scaffold = new Object3D();
      const born = [];
      const put = (geo, place) => {
        born.push(geo);
        const m = new Mesh(geo, null);
        m.userData.matKey = 'paint';
        m.userData.tone = 1;
        place(m);
        scaffold.add(m);
      };
      put(
        new TorusGeometry(radius * 1.2, full ? 0.038 : 0.03, 5, 22, full ? Math.PI * 2 : Math.PI),
        (m) => {
          m.rotation.x = -Math.PI / 2;
          m.position.y = height * 1.02;
        }
      );
      const pins = full ? [-1, 1] : [0];
      for (const side of pins) {
        put(new BoxGeometry(0.075, 0.26, 0.075), (m) => {
          m.position.set(side * radius * 0.86, height * 1.14, full ? 0 : -radius * 0.86);
        });
      }
      const baked = bakeByMaterial(scaffold);
      for (const g of born) g.dispose();
      return baked.get('paint');
    };
    return { main: make(true), off: make(false) };
  }

  /** 台帽上的识别色漆：一圈漆环 + 朝走道那一面的漆牌。8 座合批成一个实例网格。 */
  function buildRingGeometry(radius, height) {
    const scaffold = new Object3D();
    const born = [];
    const put = (geo, place) => {
      born.push(geo);
      const m = new Mesh(geo, null);
      m.userData.matKey = 'paint';
      m.userData.tone = 1;
      place(m);
      scaffold.add(m);
    };
    put(new TorusGeometry(radius * 1.02, 0.03, 4, 20), (m) => {
      m.rotation.x = -Math.PI / 2;
      m.position.y = height * 0.86;
    });
    put(new BoxGeometry(radius * 1.0, 0.16, 0.05), (m) => {
      m.position.set(0, height * 0.56, -radius * 0.98);
    });
    const baked = bakeByMaterial(scaffold);
    for (const g of born) g.dispose();
    return baked.get('paint');
  }

  let ringGeo = null;
  let plinthMesh = null;
  let ringMesh = null;
  const pedestals = new Map();
  const dummy = new Object3D();
  const tmpColor = new Color();

  function ensurePedestalGeometry(hub) {
    const sig = `${hub.pedestalRadius.toFixed(3)}|${hub.pedestalHeight.toFixed(3)}`;
    if (sig === plinthSig && plinthGeo) return false;
    plinthSig = sig;
    plinthGeo?.dispose();
    ringGeo?.dispose();
    markGeo?.main?.dispose();
    markGeo?.off?.dispose();
    plinthGeo = buildPedestalGeometry(hub.pedestalRadius, hub.pedestalHeight);
    ringGeo = buildRingGeometry(hub.pedestalRadius, hub.pedestalHeight);
    markGeo = buildMarkGeometries(hub.pedestalRadius, hub.pedestalHeight);
    return true;
  }

  function ensureInstanced(count) {
    if (plinthMesh && plinthMesh.instanceMatrix.count >= count) return;
    if (plinthMesh) {
      root.remove(plinthMesh);
      plinthMesh.dispose();
      root.remove(ringMesh);
      ringMesh.dispose();
    }
    const cap = Math.max(8, count);
    plinthMesh = new InstancedMesh(plinthGeo, plinthMat, cap);
    plinthMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    plinthMesh.castShadow = quality.shadows;
    plinthMesh.receiveShadow = quality.shadows;
    plinthMesh.frustumCulled = false;
    plinthMesh.count = 0;
    root.add(plinthMesh);

    ringMesh = new InstancedMesh(ringGeo, ringMat, cap);
    ringMesh.instanceMatrix.setUsage(DynamicDrawUsage);
    ringMesh.frustumCulled = false;
    ringMesh.count = 0;
    root.add(ringMesh);
  }

  function makePedestal(ped, hub) {
    const group = new Group();
    group.name = `pedestal:${ped.gloveId}`;
    root.add(group);

    const hand = ped.row === 'left' ? -1 : 1;
    const ident = new Color(ped.tint);
    const palm = palms.build({ gloveId: ped.gloveId, hand, ident, unlocked: ped.unlocked });
    palm.group.position.y = hub.pedestalHeight + PALM_HOVER;
    group.add(palm.group);

    const mainMark = new Mesh(markGeo.main, palm.paint);
    mainMark.visible = false;
    mainMark.castShadow = quality.shadows;
    group.add(mainMark);

    const offMark = new Mesh(markGeo.off, palm.paint);
    offMark.visible = false;
    offMark.castShadow = quality.shadows;
    group.add(offMark);

    const effect = vfx.attach({
      gloveId: ped.gloveId,
      host: group,
      tint: ident,
      handGeometry: palm.group.userData.handGeometry,
    });

    return {
      gloveId: ped.gloveId,
      group,
      palm,
      mainMark,
      offMark,
      effect,
      ident,
      identBase: ident.clone(),
      lift: 0,
      bobPhase: rand() * Math.PI * 2,
      locked: !ped.unlocked,
      ringKey: '',
      view: ped,
    };
  }

  function disposePedestal(rec) {
    rec.effect.dispose();
    rec.group.remove(rec.palm.group);
    rec.palm.dispose();
    root.remove(rec.group);
  }

  function reconcile(hub) {
    const seen = new Set();
    for (const ped of hub.pedestals) {
      seen.add(ped.gloveId);
      let rec = pedestals.get(ped.gloveId);
      if (!rec) {
        rec = makePedestal(ped, hub);
        pedestals.set(ped.gloveId, rec);
      }
      rec.view = ped;
      if (rec.locked !== !ped.unlocked) {
        rec.locked = !ped.unlocked;
        rec.palm.setLocked(rec.locked);
      }
    }
    for (const [id, rec] of pedestals) {
      if (seen.has(id)) continue;
      disposePedestal(rec);
      pedestals.delete(id);
    }
  }

  // ---------------------------------------------------------------- 传送门
  let portal = null;
  let portalSig = '';
  let portalReady = 0;

  function buildPortal(radius) {
    const scaffold = new Object3D();
    const born = [];
    const put = (geo, matKey, tone, place) => {
      born.push(geo);
      const m = new Mesh(geo, null);
      m.userData.matKey = matKey;
      m.userData.tone = tone;
      place(m);
      scaffold.add(m);
    };

    const half = radius + 0.62;
    const height = radius * 2.25;

    for (const side of [-1, 1]) {
      put(new CylinderGeometry(0.42, 0.62, height, 7), 'rock', 0.9, (m) => {
        m.position.set(side * half, height * 0.5, 0);
        m.rotation.y = side * 0.3;
      });
      put(new BoxGeometry(1.5, 0.42, 1.5), 'rock', 0.74, (m) => {
        m.position.set(side * half, 0.2, 0);
        m.rotation.y = side * 0.12;
      });
      // 门柱上的凿刻：三道，开门时从下往上依次更亮（uniform 由 update 统一给）
      for (let i = 0; i < 3; i++) {
        put(new BoxGeometry(0.1, 0.5, 0.14), 'rune', 1, (m) => {
          m.position.set(side * (half - 0.34), height * (0.32 + i * 0.2), 0.02);
        });
      }
    }

    put(new BoxGeometry(half * 2 + 1.5, 0.72, 1.15), 'rock', 0.96, (m) => {
      m.position.set(0, height + 0.3, 0);
    });
    put(new BoxGeometry(half * 1.2, 0.4, 0.95), 'rock', 0.86, (m) => {
      m.position.set(0, height + 0.78, 0.02);
    });
    put(new IcosahedronGeometry(0.55, 0), 'rock', 1.04, (m) => {
      m.position.set(0, height + 1.02, 0);
      m.rotation.set(0.4, 0.7, 0.2);
      m.scale.set(1.2, 0.8, 0.9);
    });
    // 门楣正中的凿刻纹
    put(new BoxGeometry(radius * 1.1, 0.16, 0.14), 'rune', 1, (m) => {
      m.position.set(0, height + 0.32, 0.6);
    });
    // 地面门槛：一条横过走道的暖色石嵌，人站上去就知道自己在门口
    put(new BoxGeometry(half * 2, 0.07, 0.3), 'rune', 1, (m) => {
      m.position.set(0, 0.03, 0.85);
    });

    const baked = bakeByMaterial(scaffold);
    for (const g of born) g.dispose();

    const group = new Group();
    group.name = 'hub-portal';
    const meshes = [];
    for (const [key, geo] of baked) {
      const mesh = new Mesh(geo, key === 'rune' ? runeMat : rockMat);
      mesh.castShadow = quality.shadows;
      mesh.receiveShadow = quality.shadows;
      if (key === 'rune' && quality.bloom) {
        mesh.layers.enable(BLOOM_LAYER);
        mesh.userData.bloomSelf = true;
      }
      group.add(mesh);
      meshes.push(mesh);
    }

    const membraneGeo = new PlaneGeometry(radius * 2.1, height * 1.02);
    const membrane = new Mesh(membraneGeo, membraneMat);
    membrane.position.set(0, height * 0.5, 0);
    membrane.renderOrder = 2;
    group.add(membrane);

    root.add(group);
    return {
      group,
      membrane,
      membraneGeo,
      meshes,
      height,
      dispose() {
        root.remove(group);
        for (const m of meshes) m.geometry.dispose();
        membraneGeo.dispose();
      },
    };
  }

  function ensurePortal(hub) {
    const sig = hub.portal.radius.toFixed(3);
    if (sig === portalSig && portal) return;
    portalSig = sig;
    portal?.dispose();
    portal = buildPortal(hub.portal.radius);
  }

  // ---------------------------------------------------------------- 每帧
  let visible = false;
  let motesAcc = 0;

  function hide() {
    if (!visible) return;
    visible = false;
    root.visible = false;
    portalLight.intensity = 0;
  }

  function updatePedestals(hub, dt, time) {
    let i = 0;
    for (const ped of hub.pedestals) {
      const rec = pedestals.get(ped.gloveId);
      if (!rec) continue;

      rec.group.position.set(ped.x, ped.y, ped.z);
      rec.group.rotation.y = ped.yaw;

      dummy.position.set(ped.x, ped.y, ped.z);
      dummy.rotation.set(0, ped.yaw + (rec.bobPhase % 1) * 0.12, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      plinthMesh.setMatrixAt(i, dummy.matrix);
      ringMesh.setMatrixAt(i, dummy.matrix);

      const focused = ped.focused && ped.unlocked;
      // 漆的亮度：焦点最亮，选中次之，未解锁压成石色 —— 全靠反射率，不靠自发光
      const boost = !ped.unlocked ? 0.3 : focused ? 1.7 : ped.slot ? 1.25 : 0.82;
      const key = `${boost.toFixed(2)}`;
      if (rec.ringKey !== key) {
        rec.ringKey = key;
        identShade(tmpColor, rec.identBase, boost);
        ringMesh.setColorAt(i, tmpColor);
        if (ringMesh.instanceColor) ringMesh.instanceColor.needsUpdate = true;
        rec.palm.paint.color.copy(tmpColor);
      }

      // 焦点座轻轻抬起来一截；主掌比副掌再高一点点，剪影上就分得出主副
      const liftTarget =
        (focused ? 0.11 : 0) + (ped.slot === 'main' ? 0.06 : ped.slot === 'off' ? 0.03 : 0);
      rec.lift = damp(rec.lift, liftTarget, 7, dt);

      const intensity = !ped.unlocked ? 0.16 : focused ? 1.35 : ped.slot ? 1.12 : 0.85;
      const bob = Math.sin(time * 0.9 + rec.bobPhase) * (0.018 + (focused ? 0.014 : 0));
      const palmY = hub.pedestalHeight + PALM_HOVER + rec.lift + bob + (rec.effect.palmOffset ?? 0);
      rec.palm.group.position.y = palmY;
      rec.palm.group.rotation.y = Math.sin(time * 0.32 + rec.bobPhase) * 0.09 + (focused ? 0.12 : 0);

      rec.mainMark.visible = ped.slot === 'main';
      rec.offMark.visible = ped.slot === 'off';

      rec.effect.update({
        dt,
        time,
        intensity,
        focused,
        selected: ped.slot,
        localPalmY: palmY,
        pedestalTopY: hub.pedestalHeight,
        anchor: { x: ped.x, y: ped.y + palmY, z: ped.z },
      });
      i++;
    }
    plinthMesh.count = i;
    ringMesh.count = i;
    plinthMesh.instanceMatrix.needsUpdate = true;
    ringMesh.instanceMatrix.needsUpdate = true;
  }

  function updatePortal(hub, dt, time) {
    const p = hub.portal;
    portal.group.position.set(p.x, hub.floorY, p.z);
    portalReady = damp(portalReady, p.ready ? 1 : 0, 2.4, dt);

    membraneMat.uniforms.uReady.value = portalReady;
    membraneMat.uniforms.uTime.value = time;
    // 凿刻与中轴嵌线一起亮：门通了这件事在走道另一头也看得见
    const flicker = 0.9 + Math.sin(time * 1.9) * 0.06 + Math.sin(time * 4.7 + 1.3) * 0.04;
    runeMat.emissiveIntensity = (0.05 + portalReady * 1.35 * flicker) * (p.near ? 1.15 : 1);
    inlayMat.emissiveIntensity = 0.04 + portalReady * 0.42 * flicker;
    portalLight.position.set(p.x, hub.floorY + p.radius * 0.9, p.z + 0.4);
    portalLight.intensity = portalReady * 13 * flicker;

    if (portalReady > 0.35) {
      // 门里往上冒的尘：门开了不是「贴了一张亮图」，是真的有东西在动
      motesAcc += dt * portalReady;
      while (motesAcc > 0.12) {
        motesAcc -= 0.12;
        const x = p.x + (rand() - 0.5) * p.radius * 1.6;
        const z = p.z + (rand() - 0.5) * 0.5;
        vfx.emitSoft(x, hub.floorY + rand() * 0.6, z, {
          vx: (rand() - 0.5) * 0.1,
          vy: 0.5 + rand() * 0.7,
          vz: (rand() - 0.5) * 0.1,
          life: 2 + rand() * 1.6,
          spin: (rand() - 0.5) * 0.8,
          grow: 0.5,
          drag: 0.45,
          size: 0.14 + rand() * 0.22,
          alpha: 0.16 + rand() * 0.12,
          gravity: 0.12,
          sway: 0.18,
          swayFreq: 0.9,
          color: new Color(PALETTE.crackCore).lerp(new Color(PALETTE.fog), 0.45),
        });
      }
    }
  }

  return {
    root,
    portalLight,
    pedestals,

    get visible() {
      return visible;
    },

    /**
     * 一帧。`hub` 是 ./view.js 的 readHub 结果。
     * `hub.active === false`（也就是 phase === 'arena'）时整棵子树关掉，一个 drawcall 都不出。
     */
    sync(hub, dt = 1 / 60, time = 0) {
      if (!hub || !hub.active || hub.pedestals.length === 0) {
        hide();
        return false;
      }

      const sig = walkwaySignature(hub);
      if (sig !== walkwaySig) {
        walkwaySig = sig;
        walkway?.dispose();
        walkway = buildWalkway(hub);
      }
      if (ensurePedestalGeometry(hub)) {
        // 台座尺寸变了：几何体换了一批，实例网格与已有台座都得重建
        for (const [, rec] of pedestals) disposePedestal(rec);
        pedestals.clear();
        if (plinthMesh) {
          root.remove(plinthMesh);
          plinthMesh.dispose();
          plinthMesh = null;
          root.remove(ringMesh);
          ringMesh.dispose();
          ringMesh = null;
        }
      }
      ensureInstanced(hub.pedestals.length);
      ensurePortal(hub);
      reconcile(hub);

      visible = true;
      root.visible = true;

      updatePedestals(hub, dt, time);
      updatePortal(hub, dt, time);
      vfx.update(dt, time);
      return true;
    },

    setPixelScale(v) {
      vfx.setPixelScale(v);
    },

    getStats() {
      return {
        visible,
        pedestals: pedestals.size,
        portalReady: portalReady,
      };
    },

    dispose() {
      for (const [, rec] of pedestals) disposePedestal(rec);
      pedestals.clear();
      walkway?.dispose();
      portal?.dispose();
      if (plinthMesh) {
        root.remove(plinthMesh);
        plinthMesh.dispose();
      }
      if (ringMesh) {
        root.remove(ringMesh);
        ringMesh.dispose();
      }
      plinthGeo?.dispose();
      ringGeo?.dispose();
      markGeo?.main?.dispose();
      markGeo?.off?.dispose();
      vfx.dispose();
      palms.dispose();
      scene.remove(portalLight);
      portalLight.dispose?.();
      for (const d of disposables) d.dispose?.();
      scene.remove(root);
    },
  };
}
