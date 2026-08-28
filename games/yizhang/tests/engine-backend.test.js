// 迁移守门：可玩路径的 GPU 后端必须是 Babylon.js 8，且不得偷偷回退到旧 3D 引擎。
//
// 这几条断言是「换引擎」这件事本身的回归网。结构上的东西（sim 不认识 Babylon、
// 发布面没有 three）光靠人眼 review 很容易漏掉，尤其是后面有人补一行 import 的时候。
// 真正跑一帧用的是 Babylon 自带的 NullEngine：不需要 GL 上下文，但走的是真后端。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  DirectionalLight,
  Scene,
  WebGLRenderer,
} from '../src/render/gfx/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/** 递归收集 .js 源文件，跳过依赖和产物。 */
function collectSources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) collectSources(full, out);
    else if (name.endsWith('.js') || name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

// 这份守门文件自己会把要禁的模块名写成字面量，扫描时排掉它自己。
const SELF = fileURLToPath(import.meta.url);
const SOURCES = collectSources(join(ROOT, 'src'))
  .concat(collectSources(join(ROOT, 'tests')))
  .concat(collectSources(join(ROOT, 'scripts')))
  .filter((f) => f !== SELF);

/** 裸包名与子路径都算，import 和 re-export 都算。 */
const THREE_IMPORT = /\bfrom\s*['"]three(?:\/[^'"]*)?['"]/;
const BABYLON_IMPORT = /\bfrom\s*['"]@babylonjs\/[^'"]*['"]/;

describe('GPU 后端就是 Babylon.js 8', () => {
  it('package.json 只声明 @babylonjs/core 8.x，且 three 已经不在依赖里', () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps.three).toBeUndefined();

    const babylon = pkg.dependencies?.['@babylonjs/core'];
    expect(babylon, '@babylonjs/core 必须是运行时依赖').toBeTypeOf('string');
    // 对准 8，不接受 7/6
    expect(babylon).toMatch(/^\^?8\./);
  });

  it('装出来的 @babylonjs/core 真是 8.x', () => {
    const installed = JSON.parse(
      readFileSync(join(ROOT, 'node_modules/@babylonjs/core/package.json'), 'utf8')
    );
    expect(installed.version.split('.')[0]).toBe('8');
  });

  it('src / tests / scripts 里没有任何一处还 import three', () => {
    const offenders = SOURCES.filter((f) => THREE_IMPORT.test(readFileSync(f, 'utf8'))).map((f) =>
      relative(ROOT, f)
    );
    expect(offenders).toEqual([]);
  });

  it('sim / combat / core / data 不 import Babylon 具体类型（渲染适配是薄的）', () => {
    const gameplay = SOURCES.filter((f) => {
      const rel = relative(ROOT, f);
      return (
        rel.startsWith('src/sim/') ||
        rel.startsWith('src/combat/') ||
        rel.startsWith('src/core/') ||
        rel.startsWith('src/data/')
      );
    });
    // 目录本身别被挪走了，否则这条断言会空转成永真
    expect(gameplay.length).toBeGreaterThan(10);

    const offenders = gameplay
      .filter((f) => BABYLON_IMPORT.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it('Babylon 只在 src/render/gfx/backend 下露面', () => {
    const offenders = SOURCES.filter((f) => BABYLON_IMPORT.test(readFileSync(f, 'utf8')))
      .map((f) => relative(ROOT, f))
      .filter((rel) => !rel.startsWith('src/render/gfx/backend/'));
    expect(offenders).toEqual([]);
  });
});

describe('gfx 适配层跑得通真 Babylon 后端', () => {
  it('无画布时用 NullEngine 起后端，并能把一帧推完', () => {
    const renderer = new WebGLRenderer();
    // 走的是 Babylon 的引擎对象，不是自写的桩
    expect(renderer.engine.constructor.name).toBe('NullEngine');

    const scene = new Scene();
    const camera = new PerspectiveCamera(60, 16 / 9, 0.1, 100);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);

    const mesh = new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 0x8899aa }));
    scene.add(mesh);
    scene.add(new DirectionalLight(0xffffff, 1));

    expect(() => renderer.render(scene, camera)).not.toThrow();
    // 场景图确实被搬进了 Babylon 侧，而不是空转
    expect(renderer.bscene.meshes.length).toBeGreaterThan(0);

    renderer.dispose();
  });

  it('yaw=0 → -Z 的右手系没有为了迁就 Babylon 默认 +Z 而翻面', () => {
    const renderer = new WebGLRenderer();
    expect(renderer.bscene.useRightHandedSystem).toBe(true);
    renderer.dispose();
  });
});
