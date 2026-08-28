// 后端 · 着色器方言转写。
//
// 渲染层的自写着色器沿用一套「隐式内建」的写法：`position` / `normal` / `uv` 是属性，
// `modelMatrix` / `modelViewMatrix` / `projectionMatrix` / `viewMatrix` / `cameraPosition`
// 是自动绑上的 uniform。Babylon 不提供这些名字，但它会自动绑 `world` / `view` /
// `projection` / `viewProjection` / `cameraPosition`，所以只要补一段前言把名字接过去，
// 原始 GLSL 一个字都不用改。
//
// 实例化同理：Babylon 的瘦实例把每实例矩阵拆成 world0..world3 四个 vec4 属性，
// 按列拼回去就是原本那个 `instanceMatrix`（两边的矩阵在内存里本来就是同一串数）。
//
// 名字接的时候要绕一道存取函数，不能直接 `#define modelMatrix world`：引擎认死
// `world` 这个 uniform 名，而调用方的着色器里「world」是个很自然的局部变量名
// （`vec4 world = modelMatrix * vec4(position, 1.0);` 就是原样照抄 three 的写法）。
// 宏在函数体里展开就会撞上那个局部量，`mat3(modelMatrix)` 于是变成拿 vec4 造 mat3。
// 存取函数在全局作用域里读 uniform，谁在自己函数里遮蔽同名变量都影响不到它。

const BUILTIN_ATTRIBUTES = ['position', 'normal', 'uv'];

/** 顶点前言：把引擎的矩阵名接到调用方习惯的那套上。 */
const VERTEX_PREAMBLE = `precision highp float;
uniform mat4 world;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 cameraPosition;
mat4 gfxWorld() { return world; }
mat4 gfxView() { return view; }
mat4 gfxProjection() { return projection; }
#define modelMatrix gfxWorld()
#define viewMatrix gfxView()
#define projectionMatrix gfxProjection()
#define modelViewMatrix (gfxView()*gfxWorld())
#define normalMatrix mat3(gfxWorld())
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
`;

const VERTEX_INSTANCING = `attribute vec4 world0;
attribute vec4 world1;
attribute vec4 world2;
attribute vec4 world3;
mat4 gfxInstanceMatrix() { return mat4(world0,world1,world2,world3); }
#define instanceMatrix gfxInstanceMatrix()
`;

const FRAGMENT_PREAMBLE = `precision highp float;
uniform mat4 view;
uniform vec3 cameraPosition;
mat4 gfxView() { return view; }
#define viewMatrix gfxView()
`;

const DECL_RE = /^\s*(attribute|uniform)\s+((?:lowp|mediump|highp)\s+)?([A-Za-z_][\w]*)\s+([A-Za-z_][\w]*)\s*(\[[^\]]*\])?\s*;/;

/** 扫一遍源码，把作者自己声明的属性 / uniform 收集出来（Babylon 要显式登记）。 */
function collectDeclarations(source) {
  const attributes = [];
  const uniforms = [];
  const samplers = [];
  for (const line of String(source || '').split('\n')) {
    const m = DECL_RE.exec(line);
    if (!m) continue;
    const [, keyword, , type, name] = m;
    if (keyword === 'attribute') {
      attributes.push(name);
    } else if (type.startsWith('sampler')) {
      samplers.push(name);
    } else {
      uniforms.push(name);
    }
  }
  return { attributes, uniforms, samplers };
}

const uniq = (list) => [...new Set(list)];

/**
 * 把一份「三件套写法」的着色器翻成 Babylon 能直接编译的源码 + 登记表。
 *
 * @param {object}  o
 * @param {string}  o.vertexShader
 * @param {string}  o.fragmentShader
 * @param {object}  [o.defines]   宏开关（值为空串就只 `#define NAME`）
 * @param {object}  [o.uniforms]  three 风格的 uniform 表，用来补声明里漏掉的名字
 * @param {boolean} [o.instanced] 需要 world0..3 与 instanceMatrix
 */
export function translateShader({
  vertexShader,
  fragmentShader,
  defines = {},
  uniforms = {},
  instanced = false,
}) {
  const vDecl = collectDeclarations(vertexShader);
  const fDecl = collectDeclarations(fragmentShader);

  const defineBlock = Object.entries(defines)
    .map(([k, v]) => (v === '' || v === true ? `#define ${k}` : `#define ${k} ${v}`))
    .join('\n');
  const head = defineBlock ? `${defineBlock}\n` : '';

  const vertexSource =
    head + VERTEX_PREAMBLE + (instanced ? VERTEX_INSTANCING : '') + vertexShader;
  const fragmentSource = head + FRAGMENT_PREAMBLE + fragmentShader;

  const attributes = uniq([
    ...BUILTIN_ATTRIBUTES,
    ...vDecl.attributes,
    ...(instanced ? ['world0', 'world1', 'world2', 'world3'] : []),
  ]);

  const declaredUniforms = uniq([
    'world',
    'view',
    'projection',
    'cameraPosition',
    ...vDecl.uniforms,
    ...fDecl.uniforms,
  ]);
  const samplers = uniq([...vDecl.samplers, ...fDecl.samplers]);

  // three 的 uniform 表里可能有源码没显式声明的名字（宏关掉的分支），登记也无害
  for (const name of Object.keys(uniforms)) {
    if (samplers.includes(name) || declaredUniforms.includes(name)) continue;
    declaredUniforms.push(name);
  }

  return { vertexSource, fragmentSource, attributes, uniforms: declaredUniforms, samplers };
}

/** 源码里有没有真的用到逐实例矩阵 / 颜色。 */
export function usesInstanceMatrix(source) {
  return /\binstanceMatrix\b/.test(String(source || ''));
}
