// 裂岛的绘制预算结构单测（L3-10）。
//
// three 的场景图在 node 里是纯 JS，不需要 GL 上下文，所以「有没有在画」这件事
// 可以不靠截图来验：可见性、实例条数、每块板多少个三角形，都是能读出来的硬事实。
// 程序化贴图要 canvas，这里给一份 map 全为 null 的贴图库，材质吃 null 照样能建。

import { describe, expect, it } from 'vitest';
import { Scene } from 'three';
import { OCCLUDER_LAYER, QUALITY } from './config.js';
import { createIsland } from './island.js';

const pair = () => ({ rough: null, normal: null, albedo: null });
/** 贴图库的键很多（cliff / rock / crust / …），一律给一份空的就够验结构。 */
const fakeTextures = () =>
  new Proxy({}, { get: (_t, k) => (k === 'crack' || k === 'noise' ? null : pair()) });

const triangles = (geo) =>
  (geo.index ? geo.index.count : geo.attributes.position.count) / 3;

function mount(tier = 'mid') {
  const scene = new Scene();
  const island = createIsland({
    scene,
    quality: QUALITY[tier],
    textures: fakeTextures(),
    arenaRadius: 20,
    seed: 7,
  });
  const arena = { radius: 20, tileSize: 2.5, origin: -20, cols: 16 };
  const tiles = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    x: (i % 4) * 2.5 - 5,
    z: Math.floor(i / 4) * 2.5 - 5,
    alive: true,
    crack: 0,
  }));
  island.syncTiles(tiles, arena);
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
