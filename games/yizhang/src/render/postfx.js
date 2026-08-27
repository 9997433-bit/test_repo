// 后期链：HDR 主渲染 → 只取自发光的辉光 → ACES 合成。
//
// 手册 §2-14：Bloom 只允许出现在真正的自发光体上。所以这里不做全屏亮度提取，
// 而是把整场重画一遍「自发光代理」—— 不发光的东西一律换成纯黑但仍然写深度，
// 于是角色能挡住裂缝的光，辉光也绝不会糊满屏幕。
//
// 低画质档 (quality.bloom === false) 把这条支链整个摘掉：不分配 render target、
// 不跑自发光通道与模糊、合成着色器里也不编译 bloom 采样，一帧只剩「主渲染 + 合成」。
// 色调映射链本身不受影响，低档与高档看到的是同一条 ACES 曲线。
//
// 中档留着辉光，但自发光通道只重画 OCCLUDER_LAYER（quality.bloomOccluders === 'tagged'）：
// 遮挡这件事只有大块实体说了算 —— 台面挡住井底的光核、门柱与人挡住门里的光。
// 一颗铆钉、一条束带对 1/4 分辨率再模糊两趟的遮罩没有可测量的贡献，却每样都要
// 在这条通道里占一个 drawcall。高档仍旧整场重画，两档的差别是写在档位表里的。
//
// 色调映射与 sRGB 编码都在合成着色器里手写完成：主场景渲进的是线性 HDR 贴图，
// three 对 render target 不做 tone mapping，这里统一处理，全流程只有一处曲线。

import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  HalfFloatType,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NoColorSpace,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three';
import { BLOOM_LAYER, OCCLUDER_LAYER } from './config.js';

const FS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BLUR_FRAG = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uDir;
  uniform float uThreshold;
  uniform float uSoftKnee;
  varying vec2 vUv;

  vec3 prefilter(vec3 c) {
    if (uThreshold < 0.0) return c;
    float br = max(c.r, max(c.g, c.b));
    float knee = uThreshold * uSoftKnee + 1e-5;
    float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee);
    float contrib = max(soft, br - uThreshold) / max(br, 1e-5);
    return c * contrib;
  }

  void main() {
    // 9 抽头高斯，权重按 sigma≈2 取
    float w[5];
    w[0] = 0.227027; w[1] = 0.194594; w[2] = 0.121621; w[3] = 0.054054; w[4] = 0.016216;
    vec3 sum = prefilter(texture2D(uTex, vUv).rgb) * w[0];
    for (int i = 1; i < 5; i++) {
      vec2 off = uDir * float(i);
      sum += prefilter(texture2D(uTex, vUv + off).rgb) * w[i];
      sum += prefilter(texture2D(uTex, vUv - off).rgb) * w[i];
    }
    gl_FragColor = vec4(sum, 1.0);
  }
`;

const COMPOSITE_FRAG = /* glsl */ `
  uniform sampler2D uScene;
  #ifdef USE_BLOOM
    uniform sampler2D uBloom;
    uniform float uBloomStrength;
  #endif
  uniform float uExposure;
  uniform float uVignette;
  varying vec2 vUv;

  // ACES 拟合（Stephen Hill）：高光缓慢滚降，不会死白
  const mat3 ACES_IN = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
  );
  const mat3 ACES_OUT = mat3(
     1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602
  );

  vec3 rrt(vec3 v) {
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return a / b;
  }

  vec3 acesFitted(vec3 c) {
    c = ACES_IN * c;
    c = rrt(c);
    c = ACES_OUT * c;
    return clamp(c, 0.0, 1.0);
  }

  vec3 linearToSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(0.41666)) - 0.055, step(0.0031308, c));
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    vec3 col = texture2D(uScene, vUv).rgb;
    #ifdef USE_BLOOM
      col += texture2D(uBloom, vUv).rgb * uBloomStrength;
    #endif

    // 极轻的暗角：把视线收回画面中央，不做成滤镜
    vec2 d = vUv - 0.5;
    float vig = 1.0 - dot(d, d) * uVignette;
    col *= vig;

    col = acesFitted(col * uExposure);
    col = linearToSrgb(col);
    // 抖动，消除暗部色带
    col += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function fullscreenTriangle() {
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return geo;
}

const BLACK = new Color(0, 0, 0);

export function createPost({ renderer, scene, quality }) {
  const size = new Vector2(1, 1);
  renderer.getDrawingBufferSize(size);

  const makeRT = (w, h, opts = {}) =>
    new WebGLRenderTarget(Math.max(1, Math.floor(w)), Math.max(1, Math.floor(h)), {
      type: HalfFloatType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      depthBuffer: opts.depth !== false,
      stencilBuffer: false,
      samples: opts.samples ?? 0,
      colorSpace: NoColorSpace,
      ...opts.extra,
    });

  // 低档整条辉光链不成立：不建 render target、不重画自发光通道、合成着色器里连采样都不编译。
  const bloomOn = quality.bloom !== false && quality.bloomIterations > 0 && quality.bloomStrength > 0;
  const occluders = quality.bloomOccluders === 'all' ? 'all' : 'tagged';

  let sceneRT = makeRT(size.x, size.y, { samples: quality.msaa });
  const bScale = quality.bloomScale;
  let emissiveRT = bloomOn ? makeRT(size.x * bScale, size.y * bScale, { depth: true }) : null;
  let blurA = bloomOn ? makeRT(size.x * bScale, size.y * bScale, { depth: false }) : null;
  let blurB = bloomOn ? makeRT(size.x * bScale, size.y * bScale, { depth: false }) : null;

  const quadGeo = fullscreenTriangle();
  const quadScene = new Scene();
  const quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const blurMat = bloomOn
    ? new ShaderMaterial({
        vertexShader: FS_VERT,
        fragmentShader: BLUR_FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTex: { value: null },
          uDir: { value: new Vector2() },
          uThreshold: { value: 0.85 },
          uSoftKnee: { value: 0.6 },
        },
      })
    : null;

  const compositeMat = new ShaderMaterial({
    vertexShader: FS_VERT,
    fragmentShader: COMPOSITE_FRAG,
    defines: bloomOn ? { USE_BLOOM: '' } : {},
    depthTest: false,
    depthWrite: false,
    uniforms: bloomOn
      ? {
          uScene: { value: sceneRT.texture },
          uBloom: { value: blurA.texture },
          uBloomStrength: { value: quality.bloomStrength },
          uExposure: { value: 1.25 },
          uVignette: { value: 0.42 },
        }
      : {
          uScene: { value: sceneRT.texture },
          uExposure: { value: 1.25 },
          uVignette: { value: 0.42 },
        },
  });

  const quad = new Mesh(quadGeo, compositeMat);
  quad.frustumCulled = false;
  quadScene.add(quad);

  // 自发光代理缓存：源材质 → 只输出 emissive 的纯色材质
  const proxyCache = new WeakMap();
  const blackCache = new WeakMap();
  const swapped = [];

  function blackFor(material) {
    let m = blackCache.get(material);
    if (!m) {
      m = new MeshBasicMaterial({
        color: BLACK,
        transparent: false,
        depthWrite: material.depthWrite !== false,
        depthTest: material.depthTest !== false,
        side: material.side,
      });
      blackCache.set(material, m);
    }
    return m;
  }

  function proxyFor(material, object) {
    if (!material) return null;
    // ShaderMaterial 自己就输出 HDR（裂缝光核、余烬），直接用
    if (material.isShaderMaterial || material.isRawShaderMaterial) return material;

    if (object.userData.bloomSelf && material.isMeshBasicMaterial) {
      let m = proxyCache.get(material);
      if (!m) {
        m = material.clone();
        m.toneMapped = false;
        proxyCache.set(material, m);
      }
      const boost = object.userData.bloomBoost ?? 2.4;
      m.color.copy(material.color).multiplyScalar(boost);
      m.opacity = material.opacity;
      m.map = material.map;
      return m;
    }

    if (material.emissive && (material.emissiveIntensity ?? 0) > 0.001) {
      let m = proxyCache.get(material);
      if (!m) {
        m = new MeshBasicMaterial({
          transparent: material.transparent,
          depthWrite: material.depthWrite !== false,
          side: material.side,
          toneMapped: false,
        });
        proxyCache.set(material, m);
      }
      m.color.copy(material.emissive).multiplyScalar(material.emissiveIntensity ?? 1);
      m.map = material.emissiveMap ?? null;
      m.opacity = material.opacity;
      return m;
    }

    return blackFor(material);
  }

  function pushSwap(object) {
    const original = object.material;
    let replacement;
    if (Array.isArray(original)) {
      replacement = original.map((m) => proxyFor(m, object));
    } else {
      replacement = proxyFor(original, object);
    }
    if (replacement === original) return;
    swapped.push({ object, original });
    object.material = replacement;
  }

  function renderEmissivePass(camera) {
    swapped.length = 0;
    const hidden = [];
    // 'tagged' 档只画自发光体与登记过的遮挡体：相机的 layer 掩码一收窄，
    // 剩下的东西连遍历带材质替换一起省掉，不是「画成黑的」而是根本不进这条通道。
    const mask = camera.layers.mask;
    if (occluders === 'tagged') {
      camera.layers.set(BLOOM_LAYER);
      camera.layers.enable(OCCLUDER_LAYER);
    }
    scene.traverse((o) => {
      if (!o.visible) return;
      if (o.isPoints) {
        // 尘埃不发光也不该在辉光通道里挡光，直接跳过
        if (!o.userData.bloomSelf) {
          hidden.push(o);
          o.visible = false;
        }
        return;
      }
      if (!o.isMesh && !o.isInstancedMesh && !o.isBatchedMesh) return;
      if (!camera.layers.test(o.layers)) return;
      pushSwap(o);
    });

    renderer.setRenderTarget(emissiveRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, true, false);
    renderer.render(scene, camera);

    camera.layers.mask = mask;
    for (const s of swapped) s.object.material = s.original;
    swapped.length = 0;
    for (const o of hidden) o.visible = true;
  }

  function blur(iterations) {
    quad.material = blurMat;
    let src = emissiveRT;
    for (let i = 0; i < iterations; i++) {
      // 横向。第一趟顺带做阈值提取：只有真的过曝的自发光体能进辉光
      blurMat.uniforms.uTex.value = src.texture;
      blurMat.uniforms.uThreshold.value = i === 0 ? 0.85 : -1;
      blurMat.uniforms.uDir.value.set((1.4 + i * 1.8) / blurA.width, 0);
      renderer.setRenderTarget(blurA);
      renderer.clear(true, false, false);
      renderer.render(quadScene, quadCam);

      // 纵向
      blurMat.uniforms.uTex.value = blurA.texture;
      blurMat.uniforms.uThreshold.value = -1;
      blurMat.uniforms.uDir.value.set(0, (1.4 + i * 1.8) / blurB.height);
      renderer.setRenderTarget(blurB);
      renderer.clear(true, false, false);
      renderer.render(quadScene, quadCam);

      src = blurB;
    }
    return src;
  }

  return {
    get sceneTarget() {
      return sceneRT;
    },

    get bloomEnabled() {
      return bloomOn;
    },

    /** 只读窥孔，给 postfx.test.js 核对档位是否真的裁掉了辉光支链。 */
    get debug() {
      return {
        composite: compositeMat,
        targets: 1 + (bloomOn ? 3 : 0),
        bloomSize: bloomOn ? [blurA.width, blurA.height] : null,
        occluders,
      };
    },

    render(camera) {
      renderer.setRenderTarget(sceneRT);
      renderer.setClearColor(0x000000, 1);
      renderer.clear(true, true, false);
      renderer.render(scene, camera);

      if (bloomOn) {
        renderEmissivePass(camera);
        const bloomTex = blur(quality.bloomIterations);
        compositeMat.uniforms.uBloom.value = bloomTex.texture;
      }

      compositeMat.uniforms.uScene.value = sceneRT.texture;
      quad.material = compositeMat;
      renderer.setRenderTarget(null);
      renderer.clear(true, true, false);
      renderer.render(quadScene, quadCam);
    },

    setSize(w, h) {
      const width = Math.max(1, Math.floor(w));
      const height = Math.max(1, Math.floor(h));
      sceneRT.setSize(width, height);
      if (!bloomOn) return;
      const bw = Math.max(1, Math.floor(width * bScale));
      const bh = Math.max(1, Math.floor(height * bScale));
      emissiveRT.setSize(bw, bh);
      blurA.setSize(bw, bh);
      blurB.setSize(bw, bh);
    },

    setBloomStrength(v) {
      if (!bloomOn) return;
      compositeMat.uniforms.uBloomStrength.value = v;
    },

    setExposure(v) {
      compositeMat.uniforms.uExposure.value = v;
    },

    dispose() {
      sceneRT.dispose();
      emissiveRT?.dispose();
      blurA?.dispose();
      blurB?.dispose();
      quadGeo.dispose();
      blurMat?.dispose();
      compositeMat.dispose();
      sceneRT = null;
      emissiveRT = null;
      blurA = null;
      blurB = null;
    },
  };
}
