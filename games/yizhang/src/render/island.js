// 裂岛。
//
// 它不能是一个「光滑灰圆柱」，所以做了四件事：
//  1. 崖体用带层理台阶的 Lathe 剖面，再用噪声把回转对称打破 —— 侧面有沉积层与外凸的岩檐
//  2. 顶点色写入重力信息：越往下越冷越脏，凹陷处积垢，崩口露出更亮的新鲜断面
//  3. 台面切成带倒角的可破坏扇形板，板与板之间是真实的缝 —— 暖黄的光是从缝底下透上来的，
//     不是贴在表面的发光线（emissive 只出现在缝里，符合手册 §2-14）
//  4. 边缘护栏是石桩 + 矮台阶，有断桩、有歪斜，回答「这地方被用过」

import {
  BufferAttribute,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Shape,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { PALETTE } from './config.js';
import { fbm, makeValueNoise2D, mulberry32, smoothstep } from './noise.js';

const BLOOM_LAYER = 1;

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// 顶点色在这里是「调制」而不是「固有色」：固有色由程序化 albedo 贴图给，
// 顶点色只负责乘上去的明暗与冷暖偏移，均值保持在 1.0 附近。
const TINT_COOL = new Color(0.84, 0.93, 1.14);
const TINT_WARM = new Color(1.14, 1.0, 0.84);

/** 把 sim 给的 tiles 归一成渲染需要的板块布局，字段缺失时退回默认四分扇区。 */
export function normalizeTiles(tiles, arenaRadius) {
  const list = Array.isArray(tiles) ? tiles : [];
  const usable = list.filter((t) => t && typeof t === 'object');
  if (usable.length === 0) {
    return Array.from({ length: 4 }, (_, i) => ({
      key: `sector-${i}`,
      kind: 'sector',
      index: i,
      count: 4,
      arenaRadius,
    }));
  }
  const hasXZ = usable.every(
    (t) => Number.isFinite(t.x) && (Number.isFinite(t.z) || Number.isFinite(t.y))
  );
  const hasSize = usable.some((t) =>
    Number.isFinite(t.r ?? t.radius ?? t.size ?? t.w ?? t.width)
  );
  if (hasXZ && hasSize) {
    return usable.map((t, i) => ({
      key: String(t.id ?? t.key ?? i),
      kind: 'slab',
      index: i,
      x: t.x,
      z: Number.isFinite(t.z) ? t.z : t.y,
      radius: t.r ?? t.radius ?? t.size ?? t.w ?? t.width ?? 4,
      arenaRadius,
    }));
  }
  return usable.map((t, i) => ({
    key: String(t.id ?? t.key ?? i),
    kind: 'sector',
    index: Number.isFinite(t.sector) ? t.sector : i,
    count: usable.length,
    arenaRadius,
  }));
}

/** hp 可能是 0..1 的比例，也可能是绝对值配 maxHp，还可能只有 alive/destroyed 布尔。 */
export function tileHealth(tile) {
  if (!tile || typeof tile !== 'object') return 1;
  if (tile.destroyed === true || tile.alive === false || tile.broken === true) return 0;
  const max = tile.maxHp ?? tile.hpMax ?? tile.maxHealth ?? null;
  const hp = tile.hp ?? tile.health ?? null;
  if (hp == null) return 1;
  if (max != null && max > 0) return clamp01(hp / max);
  if (hp <= 1) return clamp01(hp);
  return clamp01(hp / 100);
}

const CORE_FRAG = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uDeep;
  uniform float uTime;
  uniform sampler2D uNoise;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float turb = texture2D(uNoise, vUv * 1.6 + vec2(uTime * 0.01, uTime * -0.013)).r;
    float turb2 = texture2D(uNoise, vUv * 3.7 - vec2(uTime * 0.017, 0.0)).r;
    float heat = turb * 0.6 + turb2 * 0.4;
    // 中心最亮，往外冷成暗橙；再乘一层缓慢起伏，像底下真的在烧
    float fall = smoothstep(1.15, 0.05, r);
    float pulse = 0.82 + 0.18 * sin(uTime * 0.9 + heat * 6.0);
    vec3 col = mix(uDeep, uCore, clamp(fall * (0.45 + heat * 0.9), 0.0, 1.0));
    gl_FragColor = vec4(col * fall * pulse * 2.4, 1.0);
  }
`;

const CORE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function createIsland({ scene, quality, textures, arenaRadius = 20, seed = 20240501 }) {
  const group = new Group();
  group.name = 'island';
  scene.add(group);

  const disposables = [];
  const track = (obj) => {
    disposables.push(obj);
    return obj;
  };

  const noise = makeValueNoise2D(seed + 17);
  const rand = mulberry32(seed + 99);
  const R = arenaRadius;

  const cloneTex = (tex, rx, ry) => {
    if (!tex) return null;
    const t = tex.clone();
    t.repeat.set(rx, ry);
    t.needsUpdate = true;
    track(t);
    return t;
  };

  // ---------- 材质 ----------
  const cliffMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.cliff.albedo, 4, 1.7),
      normalMap: cloneTex(textures.cliff.normal, 4, 1.7),
      roughnessMap: cloneTex(textures.cliff.rough, 4, 1.7),
      normalScale: new Vector2(0.55, 0.55),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.3,
      fog: true,
    })
  );

  const crustMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.crust.albedo, 0.14, 0.14),
      normalMap: cloneTex(textures.crust.normal, 0.14, 0.14),
      roughnessMap: cloneTex(textures.crust.rough, 0.14, 0.14),
      normalScale: new Vector2(0.7, 0.7),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.5,
    })
  );

  const plateSideMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.cliff.albedo, 0.4, 1.4),
      normalMap: cloneTex(textures.cliff.normal, 0.4, 1.4),
      roughnessMap: cloneTex(textures.cliff.rough, 0.4, 1.4),
      roughness: 1,
      metalness: 0,
      // 断面比风化面亮：崩口露出的是新鲜岩
      color: new Color(0xd8cec0),
      envMapIntensity: 0.6,
    })
  );

  const railMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.crust.albedo, 1.4, 1.4),
      roughnessMap: cloneTex(textures.crust.rough, 1.4, 1.4),
      normalMap: cloneTex(textures.crust.normal, 1.4, 1.4),
      roughness: 1,
      metalness: 0,
      color: new Color(0xbdb4a6),
      envMapIntensity: 0.6,
    })
  );

  // ---------- 崖体（层理剖面 + 噪声破对称） ----------
  const profile = [
    [1.0, -0.35],
    [1.035, -1.15],
    [0.955, -2.1],
    [0.985, -3.35],
    [0.86, -4.9],
    [0.895, -6.15],
    [0.72, -8.2],
    [0.69, -9.6],
    [0.5, -11.9],
    [0.42, -13.4],
    [0.24, -15.8],
    [0.1, -17.9],
    [0.012, -19.4],
  ];
  const profilePts = [];
  const steps = Math.max(2, Math.floor(quality.islandProfileSegments / profile.length) + 1);
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i + 1];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      profilePts.push(new Vector2(R * (r0 + (r1 - r0) * t), y0 + (y1 - y0) * t));
    }
  }
  profilePts.push(new Vector2(R * profile[profile.length - 1][0], profile[profile.length - 1][1]));

  const bedrockGeo = track(
    new LatheGeometry(profilePts, quality.islandRadialSegments, 0, Math.PI * 2)
  );
  {
    const pos = bedrockGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const rad = Math.hypot(x, z);
      const depth = clamp01(-y / 20);

      // 大尺度凸起：让剖面不再是回转体，侧面有真正的岩块凸出
      const lobe = (fbm(noise, Math.cos(ang) * 1.6 + 5, Math.sin(ang) * 1.6 + 5, 3) - 0.5) * 0.16;
      const detail =
        (fbm(noise, Math.cos(ang) * 6 + 1, Math.sin(ang) * 6 - y * 0.22, 4) - 0.5) * 0.075;
      const scale = 1 + lobe * (0.35 + depth) + detail;
      pos.setX(i, x * scale);
      pos.setZ(i, z * scale);
      if (rad > 0.001) pos.setY(i, y + detail * 2.4);

      // 顶点色：深处变冷变暗，凹处积垢，凸出的棱线露出更亮的新鲜岩面
      const crevice = clamp01(0.5 - detail * 7);
      const ridge = clamp01(detail * 9);
      const drip = smoothstep(0.55, 0.95, fbm(noise, ang * 5.5 + 20, y * 0.06, 3));
      let m = 1.18 - smoothstep(0.05, 0.9, depth) * 0.5;
      m *= 1 - crevice * 0.3;
      m *= 1 + ridge * 0.34;
      m *= 1 - drip * 0.28 * smoothstep(0.0, 0.45, depth);
      c.setRGB(1, 1, 1)
        .lerp(TINT_COOL, smoothstep(0.1, 0.9, depth) * 0.7)
        .lerp(TINT_WARM, ridge * 0.45)
        .multiplyScalar(m);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    bedrockGeo.setAttribute('color', new BufferAttribute(colors, 3));
    bedrockGeo.computeVertexNormals();
    pos.needsUpdate = true;
  }
  const bedrock = new Mesh(bedrockGeo, cliffMat);
  bedrock.name = 'bedrock';
  bedrock.receiveShadow = quality.shadows;
  bedrock.castShadow = false;
  group.add(bedrock);

  // 挂在岛底的碎岩：不对称，破掉「完美圆锥」的读法
  const chunks = [];
  if (quality.rockChunks > 0) {
    const chunkGeo = track(new IcosahedronGeometry(1, quality.name === 'low' ? 0 : 1));
    {
      const pos = chunkGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const s = 0.7 + fbm(noise, x * 1.7 + 3, z * 1.7 + y, 3) * 0.7;
        pos.setXYZ(i, x * s, y * s * 0.8, z * s);
      }
      chunkGeo.computeVertexNormals();
      const colors = new Float32Array(pos.count * 3);
      const c = new Color();
      for (let i = 0; i < pos.count; i++) {
        c.setRGB(1, 1, 1)
          .lerp(TINT_COOL, 0.5)
          .multiplyScalar(0.62 + clamp01(pos.getY(i) * 0.5 + 0.5) * 0.5);
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      chunkGeo.setAttribute('color', new BufferAttribute(colors, 3));
    }
    for (let i = 0; i < quality.rockChunks; i++) {
      const m = new Mesh(chunkGeo, cliffMat);
      const ang = rand() * Math.PI * 2;
      const rad = R * (0.35 + rand() * 0.7);
      const y = -3 - rand() * 13;
      m.position.set(Math.cos(ang) * rad, y, Math.sin(ang) * rad);
      const s = 0.7 + rand() * 2.4;
      m.scale.setScalar(s);
      m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      m.castShadow = false;
      m.receiveShadow = false;
      m.userData.bob = { base: y, amp: 0.06 + rand() * 0.14, phase: rand() * 6.28, spin: (rand() - 0.5) * 0.05 };
      group.add(m);
      chunks.push(m);
    }
  }

  // ---------- 裂缝底下的暖光核 ----------
  const coreMat = track(
    new ShaderMaterial({
      vertexShader: CORE_VERT,
      fragmentShader: CORE_FRAG,
      side: DoubleSide,
      fog: false,
      uniforms: {
        uCore: { value: new Color(PALETTE.crackCore) },
        uDeep: { value: new Color(PALETTE.crackDeep) },
        uNoise: { value: textures.turbulence },
        uTime: { value: 0 },
      },
    })
  );
  // 半径必须小于台面板块的外缘，否则从岛外能直接看见这圈发光盘
  const coreGeo = track(new CircleGeometry(R * 0.86, 48));
  const core = new Mesh(coreGeo, coreMat);
  core.rotation.x = -Math.PI / 2;
  core.position.y = -1.05;
  core.name = 'crack-core';
  core.layers.enable(BLOOM_LAYER);
  core.userData.bloomSelf = true;
  group.add(core);

  // ---------- 台面板块 ----------
  const plateDepth = 0.62;
  const seamGap = 0.34;

  function sectorShape(index, count) {
    const shape = new Shape();
    const a0 = (index / count) * Math.PI * 2;
    const a1 = ((index + 1) / count) * Math.PI * 2;
    const rOut = R * 0.9;
    const rIn = R * 0.055;
    const g = seamGap * 0.5;
    const dOut = Math.asin(Math.min(0.95, g / rOut));
    const dIn = Math.asin(Math.min(0.95, g / Math.max(rIn, g + 0.01)));
    const s0 = a0 + dOut;
    const s1 = a1 - dOut;
    const segs = Math.max(6, Math.round(((s1 - s0) / (Math.PI * 2)) * quality.islandRadialSegments));

    // 外弧（世界 z 取反：形状建在 XY，之后绕 X 转 -90°）
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const a = s0 + ((s1 - s0) * i) / segs;
      // 外缘不是完美圆：有小的崩口起伏
      const wob = 1 + (fbm(noise, Math.cos(a) * 4 + 9, Math.sin(a) * 4 + 9, 3) - 0.5) * 0.035;
      pts.push([Math.cos(a) * rOut * wob, -Math.sin(a) * rOut * wob]);
    }
    // 内端（靠近中缝）
    const i1 = a1 - dIn;
    const i0 = a0 + dIn;
    pts.push([Math.cos(i1) * rIn, -Math.sin(i1) * rIn]);
    pts.push([Math.cos(i0) * rIn, -Math.sin(i0) * rIn]);

    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
    shape.closePath();
    return shape;
  }

  function slabShape(x, z, radius) {
    const shape = new Shape();
    const segs = Math.max(6, quality.plateCurveSegments * 2);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const wob = 1 + (fbm(noise, Math.cos(a) * 3 + x, Math.sin(a) * 3 + z, 3) - 0.5) * 0.14;
      const px = x + Math.cos(a) * (radius - seamGap * 0.5) * wob;
      const py = -(z + Math.sin(a) * (radius - seamGap * 0.5) * wob);
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();
    return shape;
  }

  function buildPlateGeometry(info) {
    const shape = info.kind === 'slab'
      ? slabShape(info.x, info.z, info.radius)
      : sectorShape(info.index, info.count);
    const geo = new ExtrudeGeometry(shape, {
      depth: plateDepth,
      curveSegments: quality.plateCurveSegments,
      bevelEnabled: quality.plateBevel,
      bevelThickness: 0.085,
      bevelSize: 0.13,
      bevelOffset: 0,
      bevelSegments: quality.name === 'high' ? 2 : 1,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    geo.translate(0, -geo.boundingBox.max.y, 0);

    // 顶点色：中心被踩得更亮更干净，靠缝与靠边的位置积垢发暗
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const rad = Math.hypot(x, z);
      const macro = fbm(noise, x * 0.12 + 30, z * 0.12 + 30, 4);
      // 宏观明暗把贴图的重复感打散
      let m = 0.82 + macro * 0.4;
      // 中央走动区被磨亮，靠外缘风吹雨打发暗
      const polish = smoothstep(R * 0.55, R * 0.1, rad);
      m *= 1 + polish * 0.16;
      m *= 1 - smoothstep(R * 0.72, R * 0.92, rad) * 0.26;
      // 侧壁与底面：灰只落在朝上的面，缝里还有接触阴影
      m *= y < -0.06 ? 0.6 : 1;
      c.setRGB(1, 1, 1).lerp(TINT_WARM, polish * 0.35).multiplyScalar(m);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return geo;
  }

  const plates = new Map();
  let lastSignature = '';

  function ensurePlate(info) {
    let plate = plates.get(info.key);
    if (plate) return plate;
    const geo = buildPlateGeometry(info);
    const mesh = new Mesh(geo, [crustMat, plateSideMat]);
    mesh.name = `plate-${info.key}`;
    mesh.castShadow = quality.shadows;
    mesh.receiveShadow = quality.shadows;
    group.add(mesh);

    geo.computeBoundingBox();
    const center = new Vector3();
    geo.boundingBox.getCenter(center);

    plate = {
      key: info.key,
      info,
      mesh,
      geo,
      center,
      health: 1,
      displayHealth: 1,
      fall: 0,
      decals: [],
      restPos: mesh.position.clone(),
      tilt: new Vector3((rand() - 0.5) * 0.9, 0, (rand() - 0.5) * 0.9).normalize(),
    };
    plates.set(info.key, plate);
    disposables.push(geo);
    return plate;
  }

  // 损伤裂纹贴花：只在板块受伤后才出现，最多 3 片，越伤越亮
  const decalGeo = track(new PlaneGeometry(1, 1));
  let decalBudget = quality.decalBudget;

  function addDamageDecal(plate, strength) {
    if (decalBudget <= 0 || !textures.crack) return;
    if (plate.decals.length >= 3) return;
    decalBudget--;
    const mat = new MeshBasicMaterial({
      map: textures.crack,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      toneMapped: false,
    });
    disposables.push(mat);
    const mesh = new Mesh(decalGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = rand() * Math.PI * 2;
    const spread = plate.info.kind === 'slab' ? plate.info.radius * 0.5 : R * 0.28;
    mesh.position.set(
      plate.center.x + (rand() - 0.5) * spread,
      0.012 + plate.decals.length * 0.004,
      plate.center.z + (rand() - 0.5) * spread
    );
    const s = 3.2 + rand() * 3.4;
    mesh.scale.set(s, s, s);
    mesh.layers.enable(BLOOM_LAYER);
    mesh.userData.bloomSelf = true;
    mesh.renderOrder = 2;
    group.add(mesh);
    plate.decals.push({ mesh, mat, target: 0.55 + strength * 0.45, t: 0 });
  }

  // ---------- 边缘护栏：石桩 + 矮台阶 ----------
  const railGroup = new Group();
  group.add(railGroup);
  {
    const postCount = quality.name === 'low' ? 14 : 26;
    // 凿出来的石桩：上小下大、五棱、棱角被磕圆，不是一颗颗蛋
    const postGeo = track(new CylinderGeometry(0.17, 0.3, 1, 5, 2));
    {
      const pos = postGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const s = 0.88 + fbm(noise, x * 5 + 7, (y + z) * 5 + 7, 2) * 0.26;
        pos.setXYZ(i, x * s, y + (fbm(noise, x * 4, z * 4, 2) - 0.5) * 0.12, z * s);
      }
      postGeo.computeVertexNormals();
      postGeo.translate(0, 0.5, 0);
    }
    const alive = [];
    for (let i = 0; i < postCount; i++) {
      const a = (i / postCount) * Math.PI * 2 + 0.11;
      // 15% 的桩已经断了：这地方被打过很多次
      if (rand() < 0.16) continue;
      alive.push(a);
    }
    const posts = new InstancedMesh(postGeo, railMat, alive.length);
    posts.instanceMatrix.setUsage(DynamicDrawUsage);
    const dummy = new Object3D();
    alive.forEach((a, i) => {
      const rr = R * 0.945;
      dummy.position.set(Math.cos(a) * rr, -0.06, Math.sin(a) * rr);
      // 每根桩都被打歪过一点，倾角不一致
      dummy.rotation.set((rand() - 0.5) * 0.3, a + (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.34);
      const h = 0.68 + rand() * 0.55;
      dummy.scale.set(0.86 + rand() * 0.34, h, 0.86 + rand() * 0.34);
      dummy.updateMatrix();
      posts.setMatrixAt(i, dummy.matrix);
    });
    posts.instanceMatrix.needsUpdate = true;
    posts.castShadow = quality.shadows;
    posts.receiveShadow = quality.shadows;
    railGroup.add(posts);
    disposables.push(posts);

    // 矮护栏台阶：挡轻击不挡重击的那圈石唇
    const lipPts = [
      new Vector2(R * 0.905, -0.2),
      new Vector2(R * 0.9, 0.02),
      new Vector2(R * 0.97, 0.06),
      new Vector2(R * 0.995, -0.1),
      new Vector2(R * 1.0, -0.5),
    ];
    const lipGeo = track(new LatheGeometry(lipPts, quality.islandRadialSegments, 0, Math.PI * 2));
    {
      const pos = lipGeo.attributes.position;
      const colors = new Float32Array(pos.count * 3);
      const c = new Color();
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const a = Math.atan2(z, x);
        const chip = fbm(noise, Math.cos(a) * 7 + 2, Math.sin(a) * 7 + 2, 3);
        pos.setX(i, x * (1 + (chip - 0.5) * 0.02));
        pos.setZ(i, z * (1 + (chip - 0.5) * 0.02));
        c.setRGB(1, 1, 1)
          .lerp(TINT_COOL, y < -0.05 ? 0.5 : 0.1)
          .multiplyScalar((0.78 + chip * 0.45) * (y < -0.05 ? 0.66 : 1));
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      lipGeo.setAttribute('color', new BufferAttribute(colors, 3));
      lipGeo.computeVertexNormals();
    }
    const lip = new Mesh(lipGeo, railMat);
    lip.receiveShadow = quality.shadows;
    lip.castShadow = quality.shadows;
    railGroup.add(lip);
  }

  const tmpQuat = new Quaternion();

  return {
    group,
    plates,
    core,
    arenaRadius: R,

    /** 用 view.tiles 更新板块健康度；缺 tiles 时保持默认四块完好。 */
    syncTiles(tiles) {
      const infos = normalizeTiles(tiles, R);
      const signature = infos.map((i) => `${i.kind}:${i.key}`).join('|');
      if (signature !== lastSignature) {
        // 布局变了（比如从默认四分扇区换成 sim 真正的 tiles）：先清掉旧板块，避免重叠
        lastSignature = signature;
        const wanted = new Set(infos.map((i) => i.key));
        for (const [key, plate] of plates) {
          if (wanted.has(key)) continue;
          group.remove(plate.mesh);
          plate.geo.dispose();
          for (const d of plate.decals) {
            group.remove(d.mesh);
            d.mat.dispose();
          }
          plates.delete(key);
        }
      }
      const list = Array.isArray(tiles) ? tiles : [];
      infos.forEach((info, i) => {
        const plate = ensurePlate(info);
        const hp = tileHealth(list[i]);
        if (hp < plate.health - 0.03) {
          addDamageDecal(plate, 1 - hp);
        }
        plate.health = hp;
      });
    },

    update(dt, time) {
      coreMat.uniforms.uTime.value = time;

      for (const chunk of chunks) {
        const b = chunk.userData.bob;
        chunk.position.y = b.base + Math.sin(time * 0.4 + b.phase) * b.amp;
        chunk.rotation.y += b.spin * dt;
      }

      for (const plate of plates.values()) {
        const damage = 1 - plate.health;
        plate.displayHealth += (plate.health - plate.displayHealth) * Math.min(1, dt * 6);

        if (plate.health <= 0.001) {
          // 塌落：先塌一下，再翻着掉进云海
          plate.fall = Math.min(1, plate.fall + dt * 0.85);
          const f = plate.fall;
          plate.mesh.position.y = plate.restPos.y - f * f * 34;
          tmpQuat.setFromAxisAngle(plate.tilt, f * 1.25);
          plate.mesh.quaternion.copy(tmpQuat);
          plate.mesh.visible = f < 0.995;
        } else {
          if (plate.fall > 0) {
            plate.fall = Math.max(0, plate.fall - dt * 2);
            plate.mesh.quaternion.identity();
            plate.mesh.visible = true;
          }
          // 受伤的板块微微下沉与倾斜，边线因此在打斗中真的会变
          const sink = damage * 0.16;
          plate.mesh.position.y = plate.restPos.y - sink;
          plate.mesh.rotation.z = plate.tilt.x * damage * 0.012;
          plate.mesh.rotation.x = plate.tilt.z * damage * 0.012;
        }

        for (const d of plate.decals) {
          d.t = Math.min(1, d.t + dt * 2.4);
          const flick = 0.88 + 0.12 * Math.sin(time * 3.1 + d.mesh.position.x);
          d.mat.opacity = d.target * d.t * flick * (plate.mesh.visible ? 1 : 0);
        }
      }
    },

    /** 给 VFX / 相机用：某点在台面上的高度（板块塌了就没有台面）。 */
    surfaceY() {
      return 0;
    },

    dispose() {
      scene.remove(group);
      group.traverse((o) => {
        if (o.isMesh || o.isInstancedMesh) {
          o.geometry?.dispose?.();
        }
      });
      for (const d of disposables) d.dispose?.();
      plates.clear();
    },
  };
}
