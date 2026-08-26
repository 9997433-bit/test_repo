// 裂岛。
//
// 台面直接由 sim 的 tiles 数组长出来：一块 tile 一个实例，位置就是 tile.x / tile.z，
// 尺寸就是 arena.tileSize。渲染层不再自己造一套「永远不会破的板块布局」——
// 数组里没有的格子天生就是洞，数组里 alive=false 的格子会塌下去变成洞，
// 于是画面上的边线和 sim 的 hasFloorUnder 永远是同一条线。
//
// 岩体部分保持视觉手册底座 B 的做法：
//  1. 崖体用带层理台阶的 Lathe 剖面，再用噪声把回转对称打破 —— 侧面有沉积层与外凸的岩檐
//  2. 顶点色写入重力信息：越往下越冷越脏，凹陷处积垢，崩口露出更亮的新鲜断面
//  3. 台面板块之间是真实的缝，暖黄的光是从缝底下的深井透上来的，不是贴在表面的发光线
//     （emissive 只出现在缝里与井底，符合手册 §2-14）
//  4. 边缘石桩有断有歪，回答「这地方被用过」

import {
  BufferAttribute,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';
import { PALETTE } from './config.js';
import { fbm, makeValueNoise2D, mulberry32, smoothstep } from './noise.js';

const BLOOM_LAYER = 1;

/** 台面厚度。塌掉一块之后，邻块的断面要有厚度才读得出「这是个洞」。 */
const DECK_DEPTH = 0.92;
/** 板缝宽度（米）。缝里透上来的暖光是全场少数几个 emissive 之一。 */
const SEAM_GAP = 0.13;
/** 中缝（sim 的 tile.seam）再多让出一点，中轴线上因此有一条明显的裂口。 */
const SEAM_EXTRA = 0.16;

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// 顶点色在这里是「调制」而不是「固有色」：固有色由程序化 albedo 贴图给，
// 顶点色只负责乘上去的明暗与冷暖偏移，均值保持在 1.0 附近。
const TINT_COOL = new Color(0.84, 0.93, 1.14);
const TINT_WARM = new Color(1.14, 1.0, 0.84);

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
    vec3 col = mix(uDeep, uCore, clamp(fall * (0.35 + heat * 0.8), 0.0, 1.0));
    gl_FragColor = vec4(col * fall * pulse * 1.5, 1.0);
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

  /**
   * 岛口的共用半径调制。
   *
   * 崖体顶圈、深井井口、石唇与石桩共用同一条角向曲线，剪影才不是一个车床车出来的盘子，
   * 而且这几样东西永远互相对齐、不会错出缝来。台面的外沿由 tile 网格自己决定
   * （方格切圆，本来就带崩口），所以岩体只需要稳稳托在它下面。
   */
  function rimLobe(angle) {
    const big = fbm(noise, Math.cos(angle) * 1.15 + 41, Math.sin(angle) * 1.15 + 41, 3) - 0.5;
    const chip = fbm(noise, Math.cos(angle) * 6.5 + 13, Math.sin(angle) * 6.5 + 13, 3) - 0.5;
    return 1 + big * 0.17 + chip * 0.035;
  }
  /** 岩体顶圈用的收敛版：起伏保留一半，保证它不会在某个方位缩到台面里面去。 */
  function rockLobe(angle) {
    return 1 + (rimLobe(angle) - 1) * 0.5;
  }

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
      normalScale: new Vector2(0.7, 0.7),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      // 崖面整天背着落日，只能靠天空反射把暗部撑起来。给太低就是一片死黑的蓝糊，
      // 给太高又会让粗糙岩面泛出塑料光，0.34 是能读出岩层又不反光的位置。
      envMapIntensity: 0.34,
      fog: true,
      side: DoubleSide, // 从破洞往下看时，崖体内壁也要有面
    })
  );

  const crustMat = track(
    new MeshStandardMaterial({
      // 平铺周期从 ~7 米放大到 ~13 米。周期太小的话，岩壳的纹理在对战距离上
      // 每个特征都不到一个像素，滤波之后就抹成一片均匀的土色。
      map: cloneTex(textures.crust.albedo, 0.075, 0.075),
      normalMap: cloneTex(textures.crust.normal, 0.075, 0.075),
      roughnessMap: cloneTex(textures.crust.rough, 0.075, 0.075),
      normalScale: new Vector2(1.05, 1.05),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      envMapIntensity: 0.5,
    })
  );

  // 按世界 XZ 采样的宏观磨损，叠在平铺的岩壳贴图上。
  // 它同时干掉三个问题：贴图的重复感、顶点色被粗三角化摊平、以及
  // 「两百块同样的方板」——磨损是按世界坐标连续的，所以看不出格子的接缝在哪。
  crustMat.onBeforeCompile = (shader) => {
    shader.uniforms.uMacro = { value: textures.arenaMacro };
    shader.uniforms.uMacroScale = { value: 1 / (R * 2.15) };
    // 采样步长必须跟着贴图分辨率走：写死成 512 的话，低画质那张 128 的图
    // 取样点会落在同一个纹素里，梯度恒为零，大尺度起伏在低配上就整个消失了。
    shader.uniforms.uMacroTexel = {
      value: 2 / (textures.arenaMacro?.image?.width ?? 512),
    };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n varying vec3 vMacroPos;')
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vec4 macroLocal = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           macroLocal = instanceMatrix * macroLocal;
         #endif
         vMacroPos = (modelMatrix * macroLocal).xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\n uniform sampler2D uMacro;\n uniform float uMacroScale;\n uniform float uMacroTexel;\n varying vec3 vMacroPos;'
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
         vec2 macroUv = vMacroPos.xz * uMacroScale + 0.5;
         float macro = texture2D(uMacro, macroUv).r;
         diffuseColor.rgb *= 0.72 + macro * 0.78;`
      )
      // 台面在几何上是一块块平板，平铺的法线贴图又细到亚像素，两者相加就是「一张砂纸」。
      // 用宏观图自身的梯度推一个大尺度的法线扰动出来：起伏有好几米宽，跨得过好几块 tile，
      // 在游戏距离上真的能被主光扫出明暗。
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
         {
           float e = uMacroTexel;
           float hL = texture2D(uMacro, macroUv - vec2(e, 0.0)).r;
           float hR = texture2D(uMacro, macroUv + vec2(e, 0.0)).r;
           float hD = texture2D(uMacro, macroUv - vec2(0.0, e)).r;
           float hU = texture2D(uMacro, macroUv + vec2(0.0, e)).r;
           vec3 swell = normalize(vec3((hL - hR) * 1.6, 1.0, (hD - hU) * 1.6));
           normal = normalize(normal + vec3(swell.x, 0.0, swell.z) * 0.45);
         }`
      );
  };
  crustMat.customProgramCacheKey = () => 'crust-macro';

  const tileSideMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.cliff.albedo, 0.6, 1.6),
      normalMap: cloneTex(textures.cliff.normal, 0.6, 1.6),
      roughnessMap: cloneTex(textures.cliff.rough, 0.6, 1.6),
      roughness: 1,
      metalness: 0,
      vertexColors: true,
      // 断面比风化面亮一档就够。太亮的话，低角度的落日会直接灌进板缝，
      // 把缝烧成一条奶黄色的光带。
      color: new Color(0x8d8577),
      envMapIntensity: 0.35,
    })
  );

  const railMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.crust.albedo, 1.4, 1.4),
      roughnessMap: cloneTex(textures.crust.rough, 1.4, 1.4),
      normalMap: cloneTex(textures.crust.normal, 1.4, 1.4),
      roughness: 1,
      metalness: 0,
      // 石桩不该比台面还白：亮过头就变成插在边上的一圈纸板牌
      color: new Color(0x93897b),
      envMapIntensity: 0.45,
    })
  );

  // ---------- 崖体（层理剖面 + 噪声破对称） ----------
  // 剖面里刻意留了几处「先收进去再挑出来」的台阶：这才是沉积岩被风化出的岩檐，
  // 单调递减的剖面只会得到一个圆锥。
  // 台阶必须按「世界尺度」而不是「比例」来读：R=20 时 0.06 的收放只有 1.2 米，
  // 在整岛剪影里等于没有。所以每一级岩檐都做到 2~3 米的进退，远看才有层。
  const profile = [
    [1.0, -0.62],
    [1.045, -1.9],
    [0.845, -3.1],
    [0.93, -4.6],
    [0.7, -6.5],
    [0.795, -7.9],
    [0.545, -10.2],
    [0.635, -11.6],
    [0.375, -14.1],
    [0.44, -15.4],
    [0.215, -17.4],
    [0.095, -19.1],
    [0.012, -20.0],
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

  // 崖体的环向分段刻意比台面低一半：段数太多，噪声起伏就摊成一层油光；
  // 段数适中反而能读出一块块的岩面。
  const bedrockSegments = Math.max(18, Math.round(quality.islandRadialSegments * 0.5));
  const bedrockGeo = track(new LatheGeometry(profilePts, bedrockSegments, 0, Math.PI * 2));
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
      const lobe = (fbm(noise, Math.cos(ang) * 1.6 + 5, Math.sin(ang) * 1.6 + 5, 3) - 0.5) * 0.44;
      const detail =
        (fbm(noise, Math.cos(ang) * 5 + 1, Math.sin(ang) * 5 - y * 0.3, 3) - 0.5) * 0.11;
      // 顶圈跟着石唇一起崩，往下才逐渐换成自己的岩块起伏，
      // 于是剪影从「机加工的圆盘」变成「崩过的岩体」，而两者之间不会错开。
      const blend = smoothstep(0.0, 0.22, depth);
      const scale =
        (1 - blend) * rockLobe(ang) + blend * (1 + lobe * (0.5 + depth * 1.6)) + detail;
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
        .lerp(TINT_COOL, smoothstep(0.1, 0.9, depth) * 0.5)
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
      m.userData.bob = {
        base: y,
        amp: 0.06 + rand() * 0.14,
        phase: rand() * 6.28,
        spin: (rand() - 0.5) * 0.05,
      };
      group.add(m);
      chunks.push(m);
    }
  }

  // ---------- 缝底下的暖光井 ----------
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
  // 台面底下是一口深井，不是一块贴在台面下的灯板。
  //
  // 这里是整个场景最容易翻车的地方：如果在台面下面铺一张大发光盘，塌一块 tile 就会露出
  // 一整片橙色 —— 那正是手册 §10 的「平涂加色光球」。所以改成一口向下强烈收口的井：
  // 破洞里先吃到十几米的暗岩壁，光点小、在很深的地方，亮度靠距离衰减自然压住。
  // 井口收到跟崖体顶圈同一条曲线上，任何一块 tile 塌掉，露出的都是这口井而不是天空。
  const shaftGeo = track(new CylinderGeometry(R * 0.995, R * 0.16, 16.4, 44, 6, true));
  {
    const pos = shaftGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const a = Math.atan2(z, x);
      const rough =
        1 + (fbm(noise, Math.cos(a) * 3.2 + 11, Math.sin(a) * 3.2 - y * 0.22, 3) - 0.5) * 0.22;
      // 只有靠近井口的几圈需要跟着岩体顶圈收，深处不受影响
      const nearMouth = smoothstep(-2.5, 5.6, y);
      const tuck = 1 - nearMouth * (1 - Math.min(1, rockLobe(a)));
      pos.setXYZ(i, x * rough * tuck, y, z * rough * tuck);
    }
    shaftGeo.computeVertexNormals();
  }
  const shaftMat = track(
    new MeshStandardMaterial({
      map: cloneTex(textures.cliff.albedo, 4, 1.2),
      roughnessMap: cloneTex(textures.cliff.rough, 4, 1.2),
      normalMap: quality.normalMaps ? cloneTex(textures.cliff.normal, 4, 1.2) : null,
      // 井壁本身很暗，被底下的暖光「烤」出来的那点亮度交给 crackLight 点光源，
      // 这样光衰减是真的，越往上越暗，而不是刷一层橙色上去
      color: new Color(0x2b2521),
      roughness: 1,
      metalness: 0,
      side: DoubleSide,
      envMapIntensity: 0.04,
    })
  );
  const shaft = new Mesh(shaftGeo, shaftMat);
  // 井口刚好埋在台面底下：正上方看不见井沿，从破洞看下去却是一路到底
  shaft.position.y = -DECK_DEPTH - 8.0;
  shaft.name = 'crack-shaft';
  group.add(shaft);

  // 光核缩到井底的一小口，从台面看下去只是深处的一点暖光
  const coreGeo = track(new CircleGeometry(R * 0.22, 32));
  const core = new Mesh(coreGeo, coreMat);
  core.rotation.x = -Math.PI / 2;
  core.position.y = -16.1;
  core.name = 'crack-core';
  core.layers.enable(BLOOM_LAYER);
  core.userData.bloomSelf = true;
  group.add(core);

  // ---------- 台面：一块 tile 一个实例 ----------
  //
  // 两百来块 tile 如果各做一个 Mesh 就是两百个 drawcall，所以合成 InstancedMesh：
  // 形状共用（缺角方板），差异全部走实例矩阵与实例色 —— 每块的朝向、高低、
  // 明暗都不一样，读起来是「被切开的岩壳」而不是棋盘格。
  const dummy = new Object3D();
  const tmpColor = new Color();

  let deck = null;
  let deckGeo = null;
  let deckCapacity = 0;
  let deckTileSize = 0;

  function buildTileGeometry(size) {
    const half = Math.max(0.2, size / 2 - SEAM_GAP * 0.5);
    // 缺角：四个角各切掉一小块。相邻四块的缺角凑出一个小菱形空洞，
    // 井里的暖光正是从那些空洞与板缝里漏上来的。
    const chip = half * 0.22;
    const shape = new Shape();
    shape.moveTo(-half + chip, -half);
    shape.lineTo(half - chip, -half);
    shape.lineTo(half, -half + chip);
    shape.lineTo(half, half - chip);
    shape.lineTo(half - chip, half);
    shape.lineTo(-half + chip, half);
    shape.lineTo(-half, half - chip);
    shape.lineTo(-half, -half + chip);
    shape.closePath();

    const geo = new ExtrudeGeometry(shape, {
      depth: DECK_DEPTH,
      curveSegments: 1,
      bevelEnabled: quality.plateBevel,
      bevelThickness: 0.07,
      bevelSize: 0.09,
      bevelOffset: 0,
      bevelSegments: quality.name === 'high' ? 2 : 1,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    // 台面顶面对齐 y=0：sim 的 floorY 就是 0，角色贴地阴影也在这一层
    geo.translate(0, -geo.boundingBox.max.y, 0);

    // 顶点色：朝上的面亮、侧壁与底面暗，缝边再压一档做接触阴影。
    // 每块 tile 的整体明暗差异走实例色，这里只负责一块板自己的上下关系。
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const edge = Math.max(Math.abs(x), Math.abs(z)) / half;
      let m = y > -0.02 ? 1 : 0.52;
      m *= 1 - smoothstep(0.72, 1.0, edge) * (y > -0.02 ? 0.18 : 0.0);
      c.setRGB(1, 1, 1)
        .lerp(TINT_COOL, y > -0.02 ? 0.06 : 0.34)
        .multiplyScalar(m);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3));
    return geo;
  }

  function ensureDeck(tileSize, needed) {
    const capacity = Math.max(64, Math.ceil(needed * 1.15));
    if (deck && tileSize === deckTileSize && capacity <= deckCapacity) return false;

    if (deck) {
      group.remove(deck);
      deck.dispose();
      deckGeo.dispose();
    }
    deckTileSize = tileSize;
    deckCapacity = capacity;
    deckGeo = buildTileGeometry(tileSize);
    deck = new InstancedMesh(deckGeo, [crustMat, tileSideMat], capacity);
    deck.name = 'deck';
    deck.instanceMatrix.setUsage(DynamicDrawUsage);
    deck.castShadow = quality.shadows;
    deck.receiveShadow = quality.shadows;
    // 台面本来就把镜头包在中间，逐实例剔除只会白花 CPU
    deck.frustumCulled = false;
    deck.count = 0;
    group.add(deck);
    return true;
  }

  /** key -> record。record.slot 是它在 InstancedMesh 里的位置。 */
  const tiles = new Map();
  const byIndex = new Map();
  const byCell = new Map();
  /** 被移除的 tile 让出的实例位，优先复用，避免 slot 撞车。 */
  const freeSlots = [];
  let nextSlot = 0;
  /** 这一帧还需要写矩阵的块（塌落中、沉降中）。 */
  const animating = new Set();
  let matrixDirty = false;
  let arenaInfo = { origin: -R, tileSize: 2.5, cols: Math.ceil((R * 2) / 2.5) };

  function cellKey(x, z) {
    const ix = Math.floor((x - arenaInfo.origin) / arenaInfo.tileSize);
    const iz = Math.floor((z - arenaInfo.origin) / arenaInfo.tileSize);
    return `${ix},${iz}`;
  }

  function writeInstance(rec) {
    if (!deck) return;
    const f = rec.fall;
    if (f >= 1) {
      // 塌完了：实例缩到 0，画面上留下的就是一个洞
      dummy.position.set(rec.x, -60, rec.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0);
    } else {
      const damage = rec.displayCrack;
      // 受伤的块微微下沉倾斜，边线在打斗中真的会变
      const sink = damage * 0.14 + (rec.seam ? 0.05 : 0);
      dummy.position.set(rec.x, rec.baseY - sink - f * f * 30, rec.z);
      dummy.rotation.set(
        rec.tiltX * (damage * 0.05 + f * 1.5),
        rec.yaw,
        rec.tiltZ * (damage * 0.05 + f * 1.35)
      );
      const shrink = rec.seam ? 1 - SEAM_EXTRA / Math.max(deckTileSize, 0.01) : 1;
      dummy.scale.set(shrink, 1, 1);
    }
    dummy.updateMatrix();
    deck.setMatrixAt(rec.slot, dummy.matrix);
    matrixDirty = true;
  }

  function writeColor(rec) {
    if (!deck) return;
    // 实例色：一层跟世界坐标挂钩的宏观明暗（打散「两百块一样的板」），
    // 再叠上破损带来的变暗与积灰
    const macro = fbm(noise, rec.x * 0.085 + 21, rec.z * 0.085 + 21, 3);
    const wear = 0.82 + macro * 0.36;
    const dark = 1 - rec.displayCrack * 0.3;
    tmpColor
      .setRGB(1, 1, 1)
      .lerp(TINT_WARM, clamp01(0.3 - rec.radial * 0.3) * 0.5)
      .lerp(TINT_COOL, rec.seam ? 0.22 : 0)
      .multiplyScalar(wear * dark);
    deck.setColorAt(rec.slot, tmpColor);
    if (deck.instanceColor) deck.instanceColor.needsUpdate = true;
  }

  // ---------- 损伤裂纹贴花 ----------
  // 只在 tile 真的挨过打之后才出现，越伤越明显；塌下去时跟着一起消失。
  const decalGeo = track(new PlaneGeometry(1, 1));
  let decalBudget = quality.decalBudget;
  const decalGroup = new Group();
  decalGroup.name = 'tile-damage';
  group.add(decalGroup);

  function addDamageDecal(rec) {
    if (decalBudget <= 0 || !textures.crack) return;
    if (rec.decals.length >= 2) return;
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
    const spread = deckTileSize * 0.3;
    mesh.position.set(
      rec.x + (rand() - 0.5) * spread,
      0.014 + rec.decals.length * 0.004,
      rec.z + (rand() - 0.5) * spread
    );
    const s = deckTileSize * (0.7 + rand() * 0.5);
    mesh.scale.set(s, s, s);
    mesh.renderOrder = 2;
    // 与 vfx 的冲击贴花同理：平铺的分叉纹路一旦吃辉光就会炸成四芒星
    decalGroup.add(mesh);
    rec.decals.push({ mesh, mat });
  }

  function dropDecals(rec) {
    for (const d of rec.decals) {
      decalGroup.remove(d.mesh);
      d.mat.dispose();
      decalBudget = Math.min(quality.decalBudget, decalBudget + 1);
    }
    rec.decals.length = 0;
  }

  // ---------- 边缘石桩 ----------
  // 台面外沿由 tile 网格切出，是一圈带崩口的方边；石桩踩在它外面的岩肩上，
  // 正好解释 sim 里那道「挡轻击不挡重击」的低护栏。
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
    const postDummy = new Object3D();
    alive.forEach((a, i) => {
      const rr = (R + 1.8) * rockLobe(a);
      postDummy.position.set(Math.cos(a) * rr, -0.7, Math.sin(a) * rr);
      // 每根桩都被打歪过一点，倾角不一致
      postDummy.rotation.set((rand() - 0.5) * 0.3, a + (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.34);
      const h = 0.9 + rand() * 0.7;
      postDummy.scale.set(0.86 + rand() * 0.34, h, 0.86 + rand() * 0.34);
      postDummy.updateMatrix();
      posts.setMatrixAt(i, postDummy.matrix);
    });
    posts.instanceMatrix.needsUpdate = true;
    posts.castShadow = quality.shadows;
    posts.receiveShadow = quality.shadows;
    railGroup.add(posts);
    disposables.push(posts);

    // 岩肩：托在台面外沿下方的一圈石唇，让方格切出的边不至于凭空悬着
    const lipPts = [
      new Vector2((R + 0.4), -DECK_DEPTH - 0.05),
      new Vector2((R + 1.5), -DECK_DEPTH - 0.35),
      new Vector2((R + 2.1), -DECK_DEPTH - 0.95),
      new Vector2((R + 1.6), -DECK_DEPTH - 1.9),
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
        const wob = rockLobe(a);
        pos.setX(i, x * wob);
        pos.setZ(i, z * wob);
        c.setRGB(1, 1, 1)
          .lerp(TINT_COOL, 0.42)
          .multiplyScalar((0.62 + chip * 0.4) * (y < -1.4 ? 0.72 : 1));
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      lipGeo.setAttribute('color', new BufferAttribute(colors, 3));
      lipGeo.computeVertexNormals();
    }
    const lip = new Mesh(lipGeo, railMat);
    lip.receiveShadow = quality.shadows;
    lip.castShadow = false;
    railGroup.add(lip);
  }

  // ---------- 台面上的碎石 ----------
  // 打了这么多场，台面上不可能一颗石渣都没有。碎石往外缘堆，
  // 顺便把「一整片干净台面」的读法打散。
  {
    const count = quality.name === 'low' ? 10 : quality.name === 'mid' ? 22 : 46;
    const rubbleGeo = track(new IcosahedronGeometry(0.13, 0));
    {
      const pos = rubbleGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const s = 0.7 + fbm(noise, pos.getX(i) * 9, pos.getZ(i) * 9, 2) * 0.8;
        pos.setXYZ(i, pos.getX(i) * s, pos.getY(i) * s * 0.7, pos.getZ(i) * s);
      }
      rubbleGeo.computeVertexNormals();
    }
    const rubbleMat = track(
      new MeshStandardMaterial({
        color: new Color(0x59524a),
        roughness: 0.98,
        metalness: 0,
        flatShading: true,
        envMapIntensity: 0.2,
      })
    );
    const rubble = new InstancedMesh(rubbleGeo, rubbleMat, count);
    const rubbleDummy = new Object3D();
    for (let i = 0; i < count; i++) {
      // 偏向外缘分布，不是均匀撒点
      const a = rand() * Math.PI * 2;
      const bias = rand() < 0.45 ? 0.86 : Math.sqrt(rand());
      const rr = R * 0.12 + R * 0.74 * bias;
      rubbleDummy.position.set(Math.cos(a) * rr, 0.03 + rand() * 0.04, Math.sin(a) * rr);
      rubbleDummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      rubbleDummy.scale.setScalar(0.35 + rand() * 0.9);
      rubbleDummy.updateMatrix();
      rubble.setMatrixAt(i, rubbleDummy.matrix);
    }
    rubble.instanceMatrix.needsUpdate = true;
    rubble.castShadow = quality.shadows;
    rubble.receiveShadow = quality.shadows;
    group.add(rubble);
    disposables.push(rubble);
  }

  function makeRecord(tile, slot) {
    const radial = Math.hypot(tile.x, tile.z) / Math.max(R, 1e-6);
    const jitter = fbm(noise, tile.x * 0.7 + 3, tile.z * 0.7 - 5, 2) - 0.5;
    return {
      key: tile.key,
      index: tile.index,
      slot,
      x: tile.x,
      z: tile.z,
      seam: tile.seam,
      radial,
      // 每块板自己歪一点、沉一点：网格是规整的，被踩了几百年的岩壳不是
      yaw: jitter * 0.09,
      baseY: jitter * 0.05,
      tiltX: fbm(noise, tile.x * 1.3 + 11, tile.z * 1.3, 2) - 0.5,
      tiltZ: fbm(noise, tile.x * 1.3, tile.z * 1.3 + 11, 2) - 0.5,
      crack: tile.crack,
      displayCrack: tile.crack,
      broken: false,
      fall: 0,
      decals: [],
    };
  }

  function removeRecord(rec) {
    dropDecals(rec);
    tiles.delete(rec.key);
    byIndex.delete(rec.index);
    byCell.delete(cellKey(rec.x, rec.z));
    animating.delete(rec);
    freeSlots.push(rec.slot);
    if (deck) {
      dummy.position.set(0, -60, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      deck.setMatrixAt(rec.slot, dummy.matrix);
      matrixDirty = true;
    }
  }

  function startFall(rec) {
    if (rec.broken) return false;
    rec.broken = true;
    rec.fall = 1e-4;
    animating.add(rec);
    dropDecals(rec);
    return true;
  }

  return {
    group,
    tiles,
    core,
    arenaRadius: R,
    /** 还立着的块数。塌掉的记录会留在表里等落完，但它们已经是洞了。 */
    get tileCount() {
      let n = 0;
      for (const rec of tiles.values()) if (!rec.broken) n++;
      return n;
    },

    /**
     * 用 view 的 tiles 重建 / 更新台面。
     * 布局完全跟着数组走：数组里没有的 key 会被移除，于是「sim 里没有的格子」
     * 在画面上就是洞。
     * @param {Array} list readTiles() 的输出
     * @param {{origin:number,tileSize:number,cols:number}} arena
     */
    syncTiles(list, arena) {
      if (!Array.isArray(list) || list.length === 0) return;
      if (arena) arenaInfo = arena;
      const rebuilt = ensureDeck(arena?.tileSize ?? list[0].size ?? 2.5, list.length);
      if (rebuilt) {
        // 换了新的 InstancedMesh，之前写进去的矩阵与实例色都没了
        for (const rec of tiles.values()) {
          deck.count = Math.max(deck.count, rec.slot + 1);
          writeColor(rec);
          writeInstance(rec);
        }
      }

      const seen = new Set();
      for (const tile of list) {
        seen.add(tile.key);
        let rec = tiles.get(tile.key);
        if (!rec) {
          const slot = freeSlots.length ? freeSlots.pop() : nextSlot++;
          if (slot >= deckCapacity) continue;
          rec = makeRecord(tile, slot);
          tiles.set(tile.key, rec);
          byIndex.set(tile.index, rec);
          byCell.set(cellKey(tile.x, tile.z), rec);
          deck.count = Math.max(deck.count, rec.slot + 1);
          writeColor(rec);
          writeInstance(rec);
        }

        if (tile.crack > rec.crack + 0.02 && !tile.broken) {
          // 掉了一截血：留一道裂纹，之后就一直在那儿
          if (tile.crack > 0.32) addDamageDecal(rec);
          animating.add(rec);
        }
        rec.crack = tile.crack;

        if (tile.broken) startFall(rec);
        else if (rec.broken) {
          // 新开一局：台面整块回来
          rec.broken = false;
          rec.fall = 0;
          rec.displayCrack = tile.crack;
          writeColor(rec);
          writeInstance(rec);
        }
      }

      if (seen.size !== tiles.size) {
        for (const rec of [...tiles.values()]) {
          if (!seen.has(rec.key)) removeRecord(rec);
        }
      }
    },

    /** 事件驱动的即时反馈：不等下一帧的 tiles 快照，命中当帧就开始塌。 */
    breakTile(hint) {
      const rec = this.findTile(hint);
      if (!rec) return null;
      startFall(rec);
      return rec;
    },

    crackTile(hint, crack = 0.5) {
      const rec = this.findTile(hint);
      if (!rec || rec.broken) return null;
      rec.crack = Math.max(rec.crack, crack);
      if (rec.crack > 0.32) addDamageDecal(rec);
      animating.add(rec);
      return rec;
    },

    /** 事件到 tile 的映射：优先 sim 的 tile 下标，其次 id，最后按世界坐标落格。 */
    findTile({ tileIndex = null, tileId = null, x = null, z = null } = {}) {
      if (tileIndex != null && byIndex.has(tileIndex)) return byIndex.get(tileIndex);
      if (tileId != null && tiles.has(String(tileId))) return tiles.get(String(tileId));
      if (Number.isFinite(x) && Number.isFinite(z)) return byCell.get(cellKey(x, z)) ?? null;
      return null;
    },

    /** 该点还有没有台面（塌完的块不算）。VFX 用它决定尘该落在哪。 */
    hasFloorAt(x, z) {
      const rec = byCell.get(cellKey(x, z));
      return !!rec && !rec.broken;
    },

    update(dt, time) {
      coreMat.uniforms.uTime.value = time;

      for (const chunk of chunks) {
        const b = chunk.userData.bob;
        chunk.position.y = b.base + Math.sin(time * 0.4 + b.phase) * b.amp;
        chunk.rotation.y += b.spin * dt;
      }

      for (const rec of animating) {
        let done = true;

        if (rec.broken && rec.fall < 1) {
          // 塌落：先松一下，再翻着掉进云海
          rec.fall = Math.min(1, rec.fall + dt * 0.8);
          done = false;
        }

        const target = rec.broken ? 1 : rec.crack;
        if (Math.abs(rec.displayCrack - target) > 0.002) {
          rec.displayCrack += (target - rec.displayCrack) * Math.min(1, dt * 5);
          writeColor(rec);
          done = false;
        } else if (rec.displayCrack !== target) {
          rec.displayCrack = target;
          writeColor(rec);
        }

        writeInstance(rec);
        if (done) animating.delete(rec);
      }

      if (matrixDirty && deck) {
        deck.instanceMatrix.needsUpdate = true;
        matrixDirty = false;
      }

      for (const rec of tiles.values()) {
        if (rec.decals.length === 0) continue;
        for (const d of rec.decals) {
          const want = rec.broken ? 0 : 0.2 + rec.displayCrack * 0.45;
          d.mat.opacity += (want - d.mat.opacity) * Math.min(1, dt * 3);
          d.mesh.visible = d.mat.opacity > 0.01;
        }
      }
    },

    /** 台面顶面高度。sim 的 floorY 恒为 0，这里跟着它。 */
    surfaceY() {
      return 0;
    },

    dispose() {
      scene.remove(group);
      group.traverse((o) => {
        if (o.isMesh || o.isInstancedMesh) o.geometry?.dispose?.();
      });
      deck?.dispose?.();
      for (const d of disposables) d.dispose?.();
      tiles.clear();
      byIndex.clear();
      byCell.clear();
      animating.clear();
      freeSlots.length = 0;
      nextSlot = 0;
    },
  };
}
