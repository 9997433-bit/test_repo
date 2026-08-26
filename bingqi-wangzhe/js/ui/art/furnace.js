/** 炉膛场景插画（内联 SVG，颜色跟随 --hearth / --hearth-lit）。 */

import { fromHTML } from '../dom.js';

export function furnaceArt() {
  return fromHTML(`
<svg class="hearth__art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="bqwzBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a4738"/>
      <stop offset=".42" stop-color="#302419"/>
      <stop offset="1" stop-color="#150f0c"/>
    </linearGradient>
    <linearGradient id="bqwzRim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8d6a22"/>
      <stop offset=".5" stop-color="#e4b84a"/>
      <stop offset="1" stop-color="#8d6a22"/>
    </linearGradient>
    <radialGradient id="bqwzCore" cx="50%" cy="55%" r="50%">
      <stop offset="0" stop-color="#fff8e2"/>
      <stop offset=".38" stop-color="var(--hearth-lit, #ff9a4d)"/>
      <stop offset="1" stop-color="var(--hearth, #b8452c)" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 炉座 -->
  <path d="M22 104h76l-5 9H27z" fill="#181310" stroke="#3a2c20" stroke-width="1"/>
  <path d="M34 92v12M60 94v10M86 92v12" stroke="#241a14" stroke-width="6" stroke-linecap="round"/>

  <!-- 炉腹 -->
  <path d="M28 46h64c2 0 3 1.4 2.6 3.4L86 96c-.4 2-2 3.4-4 3.4H38c-2 0-3.6-1.4-4-3.4L25.4 49.4C25 47.4 26 46 28 46Z"
        fill="url(#bqwzBody)" stroke="#4d3a2a" stroke-width="1.2"/>

  <!-- 炉口火 -->
  <ellipse cx="60" cy="74" rx="19" ry="17" fill="url(#bqwzCore)" class="hearth__core"/>
  <path d="M42 78c0-9 6-14 8-20 1 4 3 6 3 9 2-4 4-7 4-12 4 6 9 10 9 17 0 3-1 5-2 7"
        fill="none" stroke="var(--hearth-lit, #ff9a4d)" stroke-width="1.6"
        stroke-linecap="round" opacity=".85" class="hearth__core"/>

  <!-- 炉门 -->
  <path d="M43 62h34v30H43z" fill="none" stroke="#5b4530" stroke-width="1.4"/>
  <path d="M43 62 60 55l17 7" fill="none" stroke="#5b4530" stroke-width="1.4"/>

  <!-- 回纹带 -->
  <g stroke="#6b5230" stroke-width="1" fill="none" opacity=".8">
    <path d="M30 54h6v-4h4v8h-6v-4h-4zM50 54h6v-4h4v8h-6v-4h-4zM70 54h6v-4h4v8h-6v-4h-4z"/>
  </g>

  <!-- 炉沿 + 双耳 -->
  <ellipse cx="60" cy="45" rx="34" ry="7.5" fill="#1c1511" stroke="url(#bqwzRim)" stroke-width="2"/>
  <path d="M25 42c-6-1-9-5-8-10 4-1 8 1 10 5M95 42c6-1 9-5 8-10-4-1-8 1-10 5"
        fill="none" stroke="url(#bqwzRim)" stroke-width="2.2" stroke-linecap="round"/>

  <!-- 炉火升腾 -->
  <g class="hearth__core" opacity=".95">
    <path d="M60 42c-4-6-2-12 2-16-1 5 2 7 4 10 1-3 1-6 0-9 5 5 7 10 5 15"
          fill="var(--hearth-lit, #ff9a4d)" opacity=".55"/>
    <path d="M48 42c-3-5-1-9 2-12-1 4 1 5 2 7 1-2 1-4 0-6 4 4 5 8 4 11"
          fill="var(--hearth-lit, #ff9a4d)" opacity=".38"/>
    <path d="M72 42c-3-4-1-8 2-11-1 4 1 5 2 7 1-2 1-4 0-6 4 4 5 7 4 10"
          fill="var(--hearth-lit, #ff9a4d)" opacity=".38"/>
  </g>

  <!-- 铁砧 -->
  <path d="M14 84h22c2.6 4 6 6.4 9.8 6.8-3.4 3.8-7.6 5.6-12.4 5.6H20l1.8 4H10l1.8-4H10c-2.2 0-3.4-1.2-3.4-3z"
        fill="#241a14" stroke="#4d3a2a" stroke-width="1"/>
  <path d="M15 96.4 13 108h14l-2-11.6" fill="#1b1410" stroke="#4d3a2a" stroke-width="1"/>
</svg>`);
}

export function hammerArt() {
  return fromHTML(`
<svg class="hearth__hammer" viewBox="0 0 80 80" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="bqwzHead" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b9bec6"/>
      <stop offset=".5" stop-color="#6e737a"/>
      <stop offset="1" stop-color="#3a3d42"/>
    </linearGradient>
  </defs>
  <path d="M22 60 58 20" stroke="#7a5426" stroke-width="7" stroke-linecap="round"/>
  <path d="M22 60 58 20" stroke="#a97b3c" stroke-width="3.4" stroke-linecap="round"/>
  <rect x="4" y="6" width="34" height="20" rx="4" transform="rotate(45 21 16)"
        fill="url(#bqwzHead)" stroke="#2c2f34" stroke-width="1.4"/>
  <path d="M14 8.5 24 18.5" stroke="#d7dbe0" stroke-width="2" stroke-linecap="round" opacity=".65"/>
  <circle cx="21.5" cy="62" r="3.6" fill="#5c4020"/>
</svg>`);
}

export function ridgeArt() {
  return fromHTML(`
<svg class="hearth__ridge" viewBox="0 0 400 74" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 74V52l26-18 20 14 24-24 26 22 22-12 30 26 24-18 28 22 22-16 26 20 24-14 30 24 24-16 34 22v20z"
        fill="currentColor" opacity=".55"/>
  <path d="M0 74V62l34-14 26 16 30-20 28 20 26-12 32 20 30-16 28 18 30-14 36 20 30-12 30 16v10z"
        fill="currentColor" opacity=".8"/>
</svg>`);
}
