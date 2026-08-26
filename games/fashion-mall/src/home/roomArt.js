/**
 * 豪宅房间与家具美术：纯内联 SVG，房间使用 320x190 的正立面视角。
 * 地平线在 y=126，家具以「底边中点」为原点摆放，便于统一投影与落地动画。
 */

export const FLOOR_Y = 126;

export const ROOMS = [
  {
    id: "living",
    name: "会客厅",
    tagline: "落日拱窗 + 人字木地板，专治谈判前的紧张",
    accent: "#f0a97f",
  },
  {
    id: "studio",
    name: "造型间",
    tagline: "灯泡镜墙与成衣挂架，试装到凌晨也不累",
    accent: "#c9a4f5",
  },
  {
    id: "spa",
    name: "空中SPA",
    tagline: "整面云端玻璃，泡进去就听不见城市噪音",
    accent: "#6fc9c0",
  },
];

/** 家具在房间中的落位、尺寸（本地单位）与缩放。 */
export const PLACEMENT = {
  sofa: { room: "living", x: 122, y: 170, scale: 1, w: 130, h: 62 },
  lamp: { room: "living", x: 258, y: 162, scale: 0.92, w: 46, h: 116 },
  vanity: { room: "studio", x: 72, y: 178, scale: 0.88, w: 88, h: 86 },
  piano: { room: "studio", x: 218, y: 180, scale: 0.86, w: 128, h: 74 },
  tub: { room: "spa", x: 104, y: 176, scale: 0.98, w: 104, h: 58 },
  garden: { room: "spa", x: 244, y: 170, scale: 0.9, w: 92, h: 96 },
};

function shadow(rx, ry = Math.max(5, rx * 0.14)) {
  return `<ellipse cx="0" cy="1" rx="${rx}" ry="${ry}" fill="#3a2433" opacity=".13"/>`;
}

/* ------------------------------------------------------------------ 家具 */

const FURNITURE_ART = {
  sofa: () => `
    ${shadow(64)}
    <path d="M-56,-6 L-56,-44 a11,11 0 0 1 11,-11 L45,-55 a11,11 0 0 1 11,11 L56,-6 Z" fill="#b7325f"/>
    <rect x="-42" y="-48" width="36" height="26" rx="9" fill="#ea7ba4"/>
    <rect x="6" y="-48" width="36" height="26" rx="9" fill="#ea7ba4"/>
    <rect x="-58" y="-26" width="116" height="22" rx="10" fill="#d94a80"/>
    <rect x="-60" y="-44" width="16" height="40" rx="8" fill="#c73b6f"/>
    <rect x="44" y="-44" width="16" height="40" rx="8" fill="#c73b6f"/>
    <path d="M-56,-32 C-22,-40 22,-40 56,-32" stroke="#ff9fc0" stroke-width="2" fill="none" opacity=".55"/>
    <path d="M-24,-46 v22 M0,-48 v24 M24,-46 v22" stroke="#c73b6f" stroke-width="1.4" opacity=".4"/>
    <path d="M-46,-4 l-4,8 M46,-4 l4,8" stroke="#8a5a3c" stroke-width="4.5" stroke-linecap="round"/>
    <rect x="-38" y="-30" width="22" height="10" rx="5" fill="#ffd0e0" opacity=".8"/>`,

  lamp: () => `
    ${shadow(18, 5)}
    <circle cx="0" cy="-96" r="30" fill="#ffdf9f" opacity=".3"/>
    <circle cx="0" cy="-96" r="18" fill="#ffe9bd" opacity=".45"/>
    <ellipse cx="0" cy="-2" rx="16" ry="5.5" fill="#c9a24a"/>
    <rect x="-2.4" y="-88" width="4.8" height="88" rx="2.4" fill="#d8b465"/>
    <path d="M-21,-84 L-14,-110 L14,-110 L21,-84 Z" fill="#f7d99f"/>
    <path d="M-21,-84 L21,-84" stroke="#e8c37a" stroke-width="3.4"/>
    <path d="M-13,-107 L-7,-86" stroke="#fff8e6" stroke-width="1.6" opacity=".7"/>
    <path d="M4,-108 L10,-86" stroke="#fff8e6" stroke-width="1.2" opacity=".45"/>`,

  vanity: () => `
    ${shadow(42)}
    <path d="M0,-80 C-27,-80 -35,-58 -30,-42 L30,-42 C35,-58 27,-80 0,-80 Z" fill="#fff0f6" stroke="#e8c37a" stroke-width="2.6"/>
    <path d="M0,-44 L0,-77 M0,-44 L-15,-73 M0,-44 L15,-73 M0,-44 L-25,-63 M0,-44 L25,-63" stroke="#f4cade" stroke-width="1.6"/>
    <rect x="-39" y="-44" width="78" height="12" rx="5" fill="#fffafc"/>
    <rect x="-35" y="-32" width="70" height="24" rx="5" fill="#f6dbe6"/>
    <rect x="-30" y="-27" width="26" height="12" rx="3" fill="#fff" opacity=".75"/>
    <rect x="4" y="-27" width="26" height="12" rx="3" fill="#fff" opacity=".75"/>
    <circle cx="-17" cy="-21" r="1.8" fill="#c9a24a"/>
    <circle cx="17" cy="-21" r="1.8" fill="#c9a24a"/>
    <path d="M-32,-8 v8 M32,-8 v8" stroke="#e8c37a" stroke-width="4.2" stroke-linecap="round"/>
    <rect x="-26" y="-53" width="8" height="10" rx="2.5" fill="#f9a8c8"/>
    <rect x="-25.5" y="-56" width="3" height="4" fill="#e8c37a"/>
    <rect x="14" y="-55" width="7" height="12" rx="2.5" fill="#c9b6ff"/>
    <ellipse cx="0" cy="-14" rx="12" ry="4" fill="#f2c4d6" opacity=".5"/>`,

  piano: () => `
    ${shadow(56)}
    <rect x="-66" y="-19" width="26" height="7" rx="3.5" fill="#f0d5c0"/>
    <path d="M-62,-12 v12 M-44,-12 v12" stroke="#dcbfa8" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M-40,-38 L-24,-64 L52,-52 L46,-38 Z" fill="#fff2e2" stroke="#e0c6ae" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M-30,-44 L-18,-60 L42,-51" stroke="#f7e5d4" stroke-width="1.6" fill="none"/>
    <path d="M40,-40 L46,-54" stroke="#dcbfa8" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M-46,-38 L30,-38 C48,-38 58,-32 58,-26 C58,-20 48,-14 30,-14 L-46,-14 Z" fill="#fffaf3" stroke="#e0c6ae" stroke-width="1.6"/>
    <path d="M-46,-22 L36,-22 C48,-22 54,-24 57,-28" stroke="#f0dccb" stroke-width="1.6" fill="none"/>
    <rect x="-52" y="-30" width="40" height="9" rx="1.5" fill="#ffffff" stroke="#e6d0bd" stroke-width="1"/>
    <path d="M-48,-30 v6 M-42,-30 v6 M-36,-30 v6 M-30,-30 v6 M-24,-30 v6 M-18,-30 v6" stroke="#3a2433" stroke-width="2.2"/>
    <path d="M-42,-14 v14 M18,-14 v14 M50,-16 v16" stroke="#e0c6ae" stroke-width="5" stroke-linecap="round"/>
    <circle cx="24" cy="-52" r="2.6" fill="#c9a24a"/>
    <path d="M26.4,-52 v-9 q4.5,1 4.5,4.5" stroke="#c9a24a" stroke-width="1.6" fill="none"/>`,

  tub: () => `
    ${shadow(48)}
    <path d="M-43,-40 C-44,-56 -40,-62 -30,-62 C-33,-56 -34,-50 -34,-44" stroke="#e8c37a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="-43" cy="-40" r="3.4" fill="#c9a24a"/>
    <path d="M-45,-42 C-47,-16 -35,-6 0,-6 C35,-6 47,-16 45,-42 Z" fill="#eaa98d"/>
    <path d="M-38,-40 C-40,-18 -30,-10 0,-10" stroke="#f7cbb6" stroke-width="3" fill="none" opacity=".8"/>
    <ellipse cx="0" cy="-42" rx="45" ry="9.5" fill="#f7cbb6"/>
    <ellipse cx="0" cy="-42" rx="38" ry="6.6" fill="#c8ecf5"/>
    <circle cx="-16" cy="-44" r="4.6" fill="#fff" opacity=".85"/>
    <circle cx="-6" cy="-41" r="3" fill="#fff" opacity=".7"/>
    <circle cx="9" cy="-44.5" r="5.2" fill="#fff" opacity=".8"/>
    <circle cx="21" cy="-41.5" r="3.4" fill="#fff" opacity=".65"/>
    <path d="M-34,-8 l-5,8 M34,-8 l5,8" stroke="#d0876a" stroke-width="5" stroke-linecap="round"/>`,

  garden: () => `
    ${shadow(44)}
    <path d="M-38,-4 V-54 L0,-88 L38,-54 V-4 Z" fill="#eafbf6" opacity=".9" stroke="#8fd4c2" stroke-width="2.6"/>
    <path d="M0,-88 V-4 M-38,-54 H38 M-19,-71 V-4 M19,-71 V-4" stroke="#8fd4c2" stroke-width="1.5" opacity=".75"/>
    <ellipse cx="-19" cy="-16" rx="12" ry="16" fill="#7fd6c2"/>
    <ellipse cx="15" cy="-20" rx="10" ry="19" fill="#5cbfa8"/>
    <ellipse cx="-2" cy="-13" rx="8" ry="11" fill="#9ce2ce"/>
    <circle cx="-22" cy="-27" r="3.6" fill="#ff9fc0"/>
    <circle cx="-13" cy="-19" r="3" fill="#ffd0e0"/>
    <circle cx="17" cy="-31" r="3.4" fill="#ffb8d2"/>
    <rect x="-38" y="-9" width="76" height="9" rx="3.5" fill="#cdeee4"/>
    <path d="M-30,-60 L0,-84 L30,-60" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
};

export function furnitureArt(id) {
  return FURNITURE_ART[id] ? FURNITURE_ART[id]() : "";
}

/* ------------------------------------------------------------------ 房间 */

function herringbone() {
  let out = "";
  for (let r = 0; r < 5; r += 1) {
    const y = 128 + r * 13;
    for (let c = 0; c < 15; c += 1) {
      const x = -12 + c * 24;
      out += `<path d="M${x},${y + 11} L${x + 12},${y} L${x + 24},${y + 11}" stroke="#b07c4d" stroke-width="1.3" fill="none" opacity=".45"/>`;
    }
  }
  return out;
}

/** 菱形拼花地砖，交错排列出透视感。 */
function harlequinFloor() {
  let out = "";
  for (let r = 0; r < 5; r += 1) {
    const cy = 133 + r * 14;
    const rx = 20 + r * 2.4;
    const ry = 8 + r * 0.9;
    for (let c = -1; c * (rx * 2) < 360; c += 1) {
      const cx = c * rx * 2 + (r % 2 ? rx : 0);
      out += `<path d="M${cx},${(cy - ry).toFixed(1)} L${(cx + rx).toFixed(1)},${cy} L${cx},${(cy + ry).toFixed(1)} L${(cx - rx).toFixed(1)},${cy} Z" fill="#ffc6e0" opacity=".5"/>`;
    }
  }
  return out;
}

function bulbs(p) {
  let out = "";
  const pts = [];
  for (let i = 0; i <= 9; i += 1) pts.push([20 + i * 8.9, 12]);
  for (let i = 1; i <= 9; i += 1) pts.push([20 + i * 8.9, 96]);
  for (let i = 1; i <= 8; i += 1) pts.push([15, 12 + i * 9.4]);
  for (let i = 1; i <= 8; i += 1) pts.push([105, 12 + i * 9.4]);
  pts.forEach(([x, y], i) => {
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="url(#${p}-bulb)" class="fm-bulb" style="--i:${i % 7}"/>`;
  });
  return out;
}

const BACKDROPS = {
  living: (p) => `
    <defs>
      <linearGradient id="${p}-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff6ee"/><stop offset="1" stop-color="#ffdfcc"/>
      </linearGradient>
      <linearGradient id="${p}-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#c9945f"/><stop offset="1" stop-color="#e3b183"/>
      </linearGradient>
      <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd9a8"/><stop offset=".55" stop-color="#ffb9c6"/><stop offset="1" stop-color="#f2a2b9"/>
      </linearGradient>
      <clipPath id="${p}-win"><path d="M198,106 V56 a34,34 0 0 1 68,0 V106 Z"/></clipPath>
    </defs>
    <rect width="320" height="126" fill="url(#${p}-wall)"/>
    <g stroke="#f2cfb8" stroke-width="1.6" fill="none" opacity=".95">
      <rect x="16" y="20" width="58" height="84" rx="8"/>
      <rect x="86" y="20" width="58" height="84" rx="8"/>
    </g>
    <g clip-path="url(#${p}-win)">
      <rect x="196" y="18" width="72" height="90" fill="url(#${p}-sky)"/>
      <circle cx="248" cy="54" r="10" fill="#fff4d6" opacity=".92"/>
      <path d="M196,106 V82 h9 v-15 h7 v15 h10 V74 h8 v32 Z" fill="#d9829f" opacity=".45"/>
      <path d="M236,106 V72 h11 v-11 h6 v11 h9 v34 Z" fill="#c9738f" opacity=".4"/>
    </g>
    <path d="M198,106 V56 a34,34 0 0 1 68,0 V106" fill="none" stroke="#fffaf5" stroke-width="5.5"/>
    <path d="M232,22 V106 M199,76 H265" stroke="#fffaf5" stroke-width="4"/>
    <path d="M188,12 C195,48 193,84 189,114 L203,114 C208,82 208,46 201,12 Z" fill="#f6b8c8"/>
    <path d="M276,12 C269,48 271,84 275,114 L261,114 C256,82 256,46 263,12 Z" fill="#f6b8c8"/>
    <rect x="186" y="8" width="92" height="7" rx="3.5" fill="#e8c37a"/>
    <g>
      <rect x="34" y="34" width="34" height="42" rx="4" fill="#fffaf5" stroke="#e8c37a" stroke-width="2"/>
      <path d="M38,70 L48,52 L56,64 L62,56 L64,70 Z" fill="#f4b8c8"/>
      <circle cx="58" cy="46" r="4" fill="#ffe0a8"/>
    </g>
    <rect y="118" width="320" height="9" fill="#f6d8c4"/>
    <rect y="126" width="320" height="64" fill="url(#${p}-floor)"/>
    ${herringbone()}
    <ellipse cx="150" cy="172" rx="120" ry="26" fill="#f9d0dd" opacity=".8"/>
    <ellipse cx="150" cy="172" rx="104" ry="20" fill="none" stroke="#f0aec4" stroke-width="2"/>`,

  studio: (p) => `
    <defs>
      <linearGradient id="${p}-wall" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#f5ecff"/><stop offset="1" stop-color="#ffe6f2"/>
      </linearGradient>
      <linearGradient id="${p}-mirror" x1="0" y1="0" x2="0.6" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#eef3ff"/><stop offset="1" stop-color="#ffe9f4"/>
      </linearGradient>
      <radialGradient id="${p}-bulb"><stop offset="0" stop-color="#fffdf2"/><stop offset="1" stop-color="#ffd98e"/></radialGradient>
    </defs>
    <rect width="320" height="126" fill="url(#${p}-wall)"/>
    <rect y="126" width="320" height="64" fill="#fff4fa"/>
    ${harlequinFloor()}
    <rect y="118" width="320" height="9" fill="#efdcf5"/>
    <g>
      <rect x="11" y="8" width="98" height="92" rx="13" fill="#f7e2ee" stroke="#e8c37a" stroke-width="2.4"/>
      <rect x="21" y="18" width="78" height="72" rx="9" fill="url(#${p}-mirror)"/>
      <path d="M30,90 L64,18 L78,18 L44,90 Z" fill="#fff" opacity=".55"/>
      <path d="M82,90 L96,58 L96,90 Z" fill="#fff" opacity=".35"/>
      ${bulbs(p)}
    </g>
    <g>
      <path d="M186,26 H302" stroke="#d9b8c8" stroke-width="4" stroke-linecap="round"/>
      <path d="M190,26 V112 M298,26 V112" stroke="#e2c8d4" stroke-width="3"/>
      <path d="M206,26 v8 M234,26 v8 M262,26 v8" stroke="#c9a24a" stroke-width="1.8"/>
      <path d="M198,34 L214,34 L221,86 C214,90 198,90 191,86 Z" fill="#ffc3d8"/>
      <path d="M226,34 L242,34 L249,92 C242,96 226,96 219,92 Z" fill="#c9b6ff"/>
      <path d="M254,34 L270,34 L277,82 C270,86 254,86 247,82 Z" fill="#ffe1a8"/>
      <path d="M204,40 v42 M232,40 v48 M260,40 v38" stroke="#fff" stroke-width="1.4" opacity=".5"/>
    </g>
    <g opacity=".95">
      <path d="M126,18 H176" stroke="#d9b8c8" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="128" y="20" width="20" height="24" rx="3" fill="#ffd0e0" stroke="#efb8cc" stroke-width="1.2"/>
      <rect x="152" y="20" width="20" height="30" rx="3" fill="#cfe6ff" stroke="#b3d3f0" stroke-width="1.2"/>
      <rect x="130" y="52" width="20" height="26" rx="3" fill="#ffe9b8" stroke="#e8cc8c" stroke-width="1.2"/>
      <rect x="154" y="58" width="20" height="22" rx="3" fill="#d9ccff" stroke="#bcaaf0" stroke-width="1.2"/>
      <circle cx="138" cy="20" r="2" fill="#c9a24a"/>
      <circle cx="162" cy="20" r="2" fill="#c9a24a"/>
      <circle cx="140" cy="52" r="2" fill="#c9a24a"/>
      <circle cx="164" cy="58" r="2" fill="#c9a24a"/>
    </g>`,

  spa: (p) => `
    <defs>
      <linearGradient id="${p}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a9dcf7"/><stop offset=".55" stop-color="#d6f1f5"/><stop offset="1" stop-color="#ebfbf5"/>
      </linearGradient>
      <linearGradient id="${p}-pool" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a9e2dd"/><stop offset="1" stop-color="#d9f4f0"/>
      </linearGradient>
    </defs>
    <rect width="320" height="126" fill="url(#${p}-sky)"/>
    <circle cx="262" cy="34" r="16" fill="#fff8dd" opacity=".9"/>
    <circle cx="262" cy="34" r="26" fill="#fff8dd" opacity=".3"/>
    <g fill="#ffffff" opacity=".85">
      <ellipse cx="70" cy="40" rx="26" ry="11"/><ellipse cx="90" cy="34" rx="18" ry="10"/>
      <ellipse cx="196" cy="66" rx="22" ry="9"/><ellipse cx="212" cy="61" rx="15" ry="8"/>
      <ellipse cx="30" cy="80" rx="18" ry="7"/>
    </g>
    <g fill="#8fc2d8" opacity=".38">
      <path d="M0,118 V96 h14 v-12 h9 v12 h13 V88 h11 v30 Z"/>
      <path d="M60,118 V90 h12 v-16 h8 v16 h14 v28 Z"/>
      <path d="M150,118 V100 h16 v-14 h9 v14 h12 v18 Z"/>
      <path d="M240,118 V94 h13 v-13 h8 v13 h15 v24 Z"/>
    </g>
    <g stroke="#ffffff" stroke-width="4" opacity=".85">
      <path d="M80,0 V122 M160,0 V122 M240,0 V122"/>
      <path d="M0,58 H320" stroke-width="3"/>
    </g>
    <rect y="118" width="320" height="9" fill="#dff2ef"/>
    <rect y="126" width="320" height="64" fill="#eef8f8"/>
    <g stroke="#d3e9e7" stroke-width="1.4">
      <path d="M0,140 H320 M0,158 H320 M0,178 H320"/>
      <path d="M40,126 V190 M110,126 V190 M180,126 V190 M250,126 V190"/>
    </g>
    <rect y="168" width="320" height="22" fill="url(#${p}-pool)" opacity=".4"/>
    <rect y="126" width="320" height="18" fill="#ffffff" opacity=".35"/>
    <g>
      <path d="M300,126 c-6,-18 2,-32 10,-38 c2,12 0,26 -4,38 Z" fill="#7fd6c2"/>
      <path d="M300,126 c-14,-12 -14,-28 -10,-36 c8,8 14,22 14,36 Z" fill="#5cbfa8"/>
      <rect x="292" y="122" width="22" height="10" rx="3" fill="#f3c9a8"/>
    </g>
    <g opacity=".55" fill="#ffffff">
      <ellipse cx="150" cy="104" rx="9" ry="5"/><ellipse cx="140" cy="96" rx="6" ry="4"/>
    </g>`,
};

export function roomBackdrop(id, p) {
  return (BACKDROPS[id] || BACKDROPS.living)(p);
}
