/** 顶栏 / 开屏用的「兵」字朱印，内联绘制，不依赖外部路径。 */

import { fromHTML } from '../dom.js';

export function brandSeal({ size = 28, className = 'brand__seal' } = {}) {
  return fromHTML(`
<svg class="${className}" viewBox="0 0 72 72" width="${size}" height="${size}" aria-hidden="true" focusable="false">
  <rect width="72" height="72" rx="12" fill="#0b0a09"/>
  <rect x="5" y="5" width="62" height="62" rx="10" fill="#9b1f16"/>
  <rect x="9.5" y="9.5" width="53" height="53" rx="8" fill="none" stroke="#e4b84a" stroke-width="2"/>
  <text x="36" y="48" text-anchor="middle" font-family="STSong, Songti SC, Noto Serif SC, serif" font-size="34" font-weight="700" fill="#f7ecd2">兵</text>
</svg>`);
}

/** 把相对仓库资源的路径钉到本模块，避免 Pages 子路径 / 缺斜杠把图解析到站点根。 */
export function assetUrl(relFromGameRoot) {
  return new URL(`../../../${relFromGameRoot.replace(/^\.\//, '')}`, import.meta.url).href;
}
