// 裂岛的绘制预算结构单测（L3-10）。
//
// three 的场景图在 node 里是纯 JS，不需要 GL 上下文，所以「有没有在画」这件事
// 可以不靠截图来验：可见性、实例条数、每块板多少个三角形，都是能读出来的硬事实。
// 程序化贴图要 canvas，这里给一份 map 全为 null 的贴图库，材质吃 null 照样能建。

import { describe, expect, it } from 'vitest';
import { Scene } from './gfx/index.js';
import { OCCLUDER_LAYER, QUALITY } from './config.js';
import { createIsland } from './island.js';

const pair = () => ({ rough: null, normal: null, albedo: null });
/**
 * 贴图库的键很多（cliff / rock / crust / …），一律给一份空的就够验结构。
 * crack 单独一说：裂纹贴花的生成看的是「这张图在不在」，要验贴花就得给个真值。
 */
const fakeTextures = (crack = null) =>
  new Proxy({}, { get: (_t, k) => (k === 'crack' ? crack : k === 'noise' ? null : pair()) });

const triangles = (geo) =>
  (geo.index ? geo.index.count : geo.attributes.position.count) / 3;

/** 一块 tile 的最小形状。key 是 syncTiles 认板子的凭据，缺了十二块会挤成一块。 */
const makeTile = (i, broken = false, crack = 0) => ({
  key: `t${i}`,
  index: i,
  x: (i % 4) * 2.5 - 5,
  z: Math.floor(i / 4) * 2.5 - 5,
  alive: !broken,
  broken,
  crack,
});

const ARENA = { radius: 20, tileSize: 2.5, origin: -20, cols: 16 };

function mount(tier = 'mid', crack = null) {
  const scene = new Scene();
  const island = createIsland({
    scene,
    quality: QUALITY[tier],
    textures: fakeTextures(crack),
    arenaRadius: 20,
    seed: 7,
  });
  island.syncTiles(
    Array.from({ length: 12 }, (_, i) => makeTile(i)),
    ARENA
  );
  island.update(1 / 60, 0);
  return { scene, island };
}

describe('裂岛：安全区里不付绘制调用', () => {
  it('phase === hub 时整棵子树关掉（台面那块 InstancedMesh 不吃视锥剔除）', () => {
    const { scene, island } = mount();
    const root = scene.getObjectByName('island');
    expect(island.active).toBe(true);
    expect(root.visible).toBe(true);
    // 台面是 frustumCulled = false 的：不显式关掉，人在走道上时它照画一整座岛
    expect(scene.getObjectByName('deck').frustumCulled).toBe(false);

    island.setActive(false);
    expect(island.active).toBe(false);
    expect(root.visible).toBe(false);

    island.setActive(true);
    expect(root.visible).toBe(true);
    island.dispose();
  });

  it('岛底碎岩是一块实例网格，不是一块一个 Mesh', () => {
    const { scene, island } = mount();
    const chunks = scene.getObjectByName('rock-chunks');
    expect(chunks.isInstancedMesh).toBe(true);
    expect(chunks.count).toBe(QUALITY.mid.rockChunks);
    island.dispose();
  });
});

describe('裂岛：辉光通道的低面替身', () => {
  it('挡光替身贴着顶面，一块板 6 个三角形，平时不画', () => {
    const { scene, island } = mount();
    const deck = scene.getObjectByName('deck');
    const shade = scene.getObjectByName('deck-occluder');

    // 挡光归替身，本尊不再兼职 —— 否则辉光通道要把整座台面连倒角带侧壁再走一遍
    expect(deck.layers.isEnabled(OCCLUDER_LAYER)).toBe(false);
    expect(shade.layers.isEnabled(OCCLUDER_LAYER)).toBe(true);
    expect(shade.visible).toBe(false);
    expect(shade.userData.emissiveOnly).toBe(true);

    // 缺角照旧（八边形 = 6 个三角形），但省掉了倒角 / 侧壁 / 底面
    expect(triangles(shade.geometry)).toBe(6);
    expect(triangles(deck.geometry)).toBeGreaterThan(triangles(shade.geometry) * 5);

    // 两者共用同一份实例矩阵，条数每帧对齐，不会画到空位上
    expect(shade.instanceMatrix).toBe(deck.instanceMatrix);
    expect(shade.count).toBe(deck.count);
    island.dispose();
  });
});

describe('裂岛：裂纹贴花池化', () => {
  it('一整场的裂纹是一块实例网格，淡入淡出走每实例的 aFade', () => {
    const { scene, island } = mount('mid', { isTexture: true });
    const decals = scene.getObjectByName('tile-damage');
    expect(decals.isInstancedMesh).toBe(true);
    // 池子一次开满预算：打到最后十二片裂纹也只有一个 drawcall
    expect(decals.count).toBe(QUALITY.mid.decalBudget);
    // 一片都没有时整块不画
    expect(decals.visible).toBe(false);

    const fade = decals.geometry.attributes.aFade;
    expect(fade.isInstancedBufferAttribute).toBe(true);
    expect(fade.count).toBe(QUALITY.mid.decalBudget);

    // 打裂两块板：各占一个槽位，透明度从 0 涨上来之后才真的露面
    island.crackTile({ tileIndex: 1 }, 0.6);
    island.crackTile({ tileIndex: 2 }, 0.6);
    for (let i = 0; i < 60; i++) island.update(1 / 60, i / 60);
    expect(decals.visible).toBe(true);
    expect(fade.array[0]).toBeGreaterThan(0.1);
    expect(fade.array[1]).toBeGreaterThan(0.1);
    // 没用到的槽位是干净的 0，不会在台面上糊出一片
    expect(fade.array[QUALITY.mid.decalBudget - 1]).toBe(0);

    // 板塌下去，裂纹跟着收回池子，槽位可以再用
    island.syncTiles(
      Array.from({ length: 12 }, (_, i) => makeTile(i, i === 1 || i === 2, i === 1 || i === 2 ? 1 : 0)),
      ARENA
    );
    island.update(1 / 60, 2);
    expect(fade.array[0]).toBe(0);
    expect(fade.array[1]).toBe(0);
    expect(decals.visible).toBe(false);
    island.dispose();
  });
});
