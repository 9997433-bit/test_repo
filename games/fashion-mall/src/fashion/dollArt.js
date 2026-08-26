/**
 * 纸娃娃分层美术：全部用内联 SVG 绘制，不依赖任何外部图片。
 * 每个部件函数接收唯一前缀 p，用于隔离渐变 id（缩略图与主体同时存在时不会串色）。
 *
 * 画布 200x320，关键骨架：肩 y=112、腰 y=168、胯 y=198、膝 y=244、踝 y=288。
 */

const SKIN = "#f8d3ba";
const SKIN_D = "#e6b193";
const INK = "#3a2433";
const LIP = "#e0567f";

const HAIR = {
  bob: { c: "#432c3c", d: "#2b1a26", l: "#8a6076" },
  long: { c: "#7d4830", d: "#5b3120", l: "#c08a5c" },
  high: { c: "#241f36", d: "#141223", l: "#6b62a0" },
};

const TOP = {
  tee: { c: "#ffe1ec", d: "#f3bcd2", l: "#fff8fb" },
  blazer: { c: "#c73b6f", d: "#9d2b55", l: "#ef7ba5" },
  gown: { c: "#e8c37a", d: "#c39a48", l: "#fdf0d2" },
};

const BOTTOM = {
  skirt: { c: "#ffd6e5", d: "#f2abc8", l: "#fff2f7" },
  slacks: { c: "#d9c4b0", d: "#b99e85", l: "#f3e7da" },
  silk: { c: "#c9b6ff", d: "#9b85e0", l: "#ece5ff" },
};

const SHOES = {
  sneaker: { c: "#ffffff", d: "#dcdce8", a: "#ff9fc0" },
  heel: { c: "#3a2433", d: "#24151f", a: "#e8c37a" },
  boot: { c: "#7d5768", d: "#573a48", a: "#e8c37a" },
};

/** 四角星，用于点缀闪光。 */
function star(cx, cy, r, fill, opacity = 1) {
  const k = r * 0.24;
  return `<path d="M${cx},${cy - r} Q${cx + k},${cy - k} ${cx + r},${cy} Q${cx + k},${cy + k} ${cx},${cy + r} Q${cx - k},${cy + k} ${cx - r},${cy} Q${cx - k},${cy - k} ${cx},${cy - r} Z" fill="${fill}" opacity="${opacity}"/>`;
}

const TORSO = "M74,112 C70,134 80,152 84,168 L116,168 C120,152 130,134 126,112 C119,104 110,100 100,100 C90,100 81,104 74,112 Z";
const ARM_L = "M78,114 C70,134 66,158 66,178";
const ARM_R = "M122,114 C130,134 134,158 134,178";

export function bodyArt() {
  return `
  <g class="fm-figure">
    <path d="M80,196 C78,222 81,252 84,288 L96,288 C96,252 97,222 97,196 Z" fill="${SKIN}"/>
    <path d="M120,196 C122,222 119,252 116,288 L104,288 C104,252 103,222 103,196 Z" fill="${SKIN}"/>
    <path d="M84,286 L96,286 L96,293 C96,296 92,297.5 87,297.5 L79,297.5 C76,297.5 75,294.5 77,292.5 Z" fill="${SKIN}"/>
    <path d="M116,286 L104,286 L104,293 C104,296 108,297.5 113,297.5 L121,297.5 C124,297.5 125,294.5 123,292.5 Z" fill="${SKIN}"/>
    <path d="M84,160 C77,170 72,186 74,198 C82,205 118,205 126,198 C128,186 123,170 116,160 Z" fill="${SKIN}"/>
    <path d="${TORSO}" fill="${SKIN}"/>
    <path d="M88,124 C92,140 108,140 112,124" stroke="${SKIN_D}" stroke-width="1.6" fill="none" opacity=".35"/>
    <path d="${ARM_L}" stroke="${SKIN}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <path d="${ARM_R}" stroke="${SKIN}" stroke-width="10" stroke-linecap="round" fill="none"/>
    <circle cx="66" cy="182" r="5.6" fill="${SKIN}"/>
    <circle cx="134" cy="182" r="5.6" fill="${SKIN}"/>
    <path d="M93,72 L107,72 C107,86 108,96 111,103 L89,103 C92,96 93,86 93,72 Z" fill="${SKIN}"/>
    <ellipse cx="100" cy="82" rx="8.5" ry="5" fill="${SKIN_D}" opacity=".32"/>
    <ellipse cx="73" cy="62" rx="5" ry="7.5" fill="${SKIN}"/>
    <ellipse cx="127" cy="62" rx="5" ry="7.5" fill="${SKIN}"/>
    <ellipse cx="100" cy="58" rx="27" ry="31" fill="${SKIN}"/>
    <path d="M81,45 Q88,41 95,44" stroke="#a5705a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M105,44 Q112,41 119,45" stroke="#a5705a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M82,53 Q88,49 94,53" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M106,53 Q112,49 118,53" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="88" cy="60" rx="5.2" ry="6.8" fill="${INK}"/>
    <ellipse cx="112" cy="60" rx="5.2" ry="6.8" fill="${INK}"/>
    <circle cx="89.8" cy="57.4" r="1.9" fill="#fff" opacity=".92"/>
    <circle cx="113.8" cy="57.4" r="1.9" fill="#fff" opacity=".92"/>
    <ellipse cx="79" cy="70" rx="7.5" ry="4.4" fill="#f27ba6" opacity=".32"/>
    <ellipse cx="121" cy="70" rx="7.5" ry="4.4" fill="#f27ba6" opacity=".32"/>
    <path d="M100,64 q3,4 -1.6,4.6" stroke="${SKIN_D}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M93.5,75.4 Q100,72.4 106.5,75.4 Q100,82 93.5,75.4 Z" fill="${LIP}"/>
    <path d="M96,75.6 Q100,74.4 104,75.6" stroke="#fff" stroke-width="1" opacity=".5" fill="none"/>
  </g>`;
}

/* ---------------------------------------------------------------- 发型 */

function hairBack(id) {
  const h = HAIR[id] || HAIR.bob;
  if (id === "long") {
    return `
      <path d="M100,16 C64,16 54,44 56,80 C58,106 52,140 48,170 C57,179 68,177 72,166 C75,181 85,187 100,187 C115,187 125,181 128,166 C132,177 143,179 152,170 C148,140 142,106 144,80 C146,44 136,16 100,16 Z" fill="${h.c}"/>
      <path d="M64,100 C67,124 63,150 58,166 C63,167 68,163 70,155 C74,134 74,116 70,98 Z" fill="${h.d}" opacity=".4"/>
      <path d="M136,100 C133,124 137,150 142,166 C137,167 132,163 130,155 C126,134 126,116 130,98 Z" fill="${h.d}" opacity=".4"/>
      <circle cx="60" cy="150" r="9" fill="${h.c}"/>
      <circle cx="140" cy="150" r="9" fill="${h.c}"/>
      <circle cx="82" cy="176" r="11" fill="${h.c}"/>
      <circle cx="118" cy="176" r="11" fill="${h.c}"/>`;
  }
  if (id === "high") {
    return `
      <path d="M100,18 C76,18 68,38 70,62 L130,62 C132,38 124,18 100,18 Z" fill="${h.c}"/>
      <path d="M116,28 C148,20 168,44 161,80 C156,108 147,132 134,150 C132,135 130,122 126,112 C122,127 116,137 107,144 C118,121 122,92 117,58 Z" fill="${h.c}"/>
      <path d="M128,46 C146,50 151,70 147,92 C144,110 139,124 133,136 C137,114 138,88 130,64 Z" fill="${h.l}" opacity=".28"/>
      <ellipse cx="124" cy="40" rx="9" ry="6" fill="${h.d}"/>
      ${star(124, 40, 5.5, "#ffe9a8")}`;
  }
  return `
    <path d="M100,20 C74,20 63,42 64,70 C65,86 70,98 77,103 C88,106 112,106 123,103 C130,98 135,86 136,70 C137,42 126,20 100,20 Z" fill="${h.c}"/>
    <path d="M100,20 C88,20 78,26 72,38 C80,30 90,26 100,26 Z" fill="${h.l}" opacity=".25"/>`;
}

function hairFront(id) {
  const h = HAIR[id] || HAIR.bob;
  if (id === "long") {
    return `
      <path d="M67,66 C63,34 82,18 100,18 C120,18 138,34 133,66 C127,44 116,35 102,41 C89,47 75,53 67,66 Z" fill="${h.c}"/>
      <path d="M65,60 C57,98 57,134 63,158 L78,153 C71,126 71,92 78,62 Z" fill="${h.c}"/>
      <path d="M135,60 C143,98 143,134 137,158 L122,153 C129,126 129,92 122,62 Z" fill="${h.c}"/>
      <circle cx="70" cy="156" r="8.5" fill="${h.c}"/>
      <circle cx="130" cy="156" r="8.5" fill="${h.c}"/>
      <path d="M80,33 C89,26 106,25 116,31" stroke="${h.l}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".42"/>`;
  }
  if (id === "high") {
    return `
      <path d="M68,58 C65,32 82,18 100,18 C118,18 135,32 132,58 C124,39 114,32 100,32 C86,32 76,39 68,58 Z" fill="${h.c}"/>
      <path d="M77,45 C84,35 95,31 105,33" stroke="${h.l}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".32"/>
      ${star(86, 27, 4.5, "#ffe9a8")}
      ${star(110, 24, 3.4, "#fff4d0")}`;
  }
  return `
    <path d="M68,66 C65,38 82,22 100,22 C118,22 135,38 132,66 C126,49 116,42 100,46 C86,50 76,54 68,66 Z" fill="${h.c}"/>
    <path d="M66,62 C63,78 65,94 71,104 L79,100 C74,89 72,76 74,62 Z" fill="${h.c}"/>
    <path d="M134,62 C137,78 135,94 129,104 L121,100 C126,89 128,76 126,62 Z" fill="${h.c}"/>
    <path d="M82,36 C90,29 110,28 118,35" stroke="${h.l}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".38"/>`;
}

/* ---------------------------------------------------------------- 上装 */

function topArt(id, p) {
  const t = TOP[id] || TOP.tee;
  if (id === "blazer") {
    return `
      <path d="M89,98 L111,98 C113,128 115,152 115,170 L85,170 C85,152 87,128 89,98 Z" fill="#fff7fa"/>
      <path d="${ARM_L}" stroke="${t.c}" stroke-width="14" stroke-linecap="round" fill="none"/>
      <path d="${ARM_R}" stroke="${t.c}" stroke-width="14" stroke-linecap="round" fill="none"/>
      <circle cx="66.5" cy="171" r="7.6" fill="${t.d}"/>
      <circle cx="133.5" cy="171" r="7.6" fill="${t.d}"/>
      <path d="M74,112 C69,134 80,153 84,170 L100,170 L100,101 C90,100 80,105 74,112 Z" fill="${t.c}"/>
      <path d="M126,112 C131,134 120,153 116,170 L100,170 L100,101 C110,100 120,105 126,112 Z" fill="${t.d}"/>
      <path d="M100,102 L96,148 L82,114 Z" fill="${t.l}"/>
      <path d="M100,102 L104,148 L118,114 Z" fill="${t.l}"/>
      <path d="M90,99 Q100,110 110,99" fill="${SKIN}"/>
      <path d="M92,99 L100,105 L108,99" stroke="${t.l}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
      <circle cx="100" cy="147" r="2.9" fill="#e8c37a"/>
      <circle cx="100" cy="158" r="2.9" fill="#e8c37a"/>
      <path d="M79,126 C77,144 81,159 84,168" stroke="${t.l}" stroke-width="1.5" fill="none" opacity=".4"/>`;
  }
  if (id === "gown") {
    return `
      <defs>
        <linearGradient id="${p}-gown" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stop-color="${t.l}"/><stop offset=".45" stop-color="${t.c}"/><stop offset="1" stop-color="${t.d}"/>
        </linearGradient>
      </defs>
      <path d="M81,160 C64,190 51,226 49,258 C71,270 129,270 151,258 C149,226 136,190 119,160 Z" fill="url(#${p}-gown)"/>
      <path d="M95,170 C87,202 77,234 69,262" stroke="${t.l}" stroke-width="2.4" fill="none" opacity=".5"/>
      <path d="M105,170 C113,202 123,234 131,262" stroke="${t.l}" stroke-width="2.4" fill="none" opacity=".5"/>
      <path d="M100,172 V266" stroke="${t.d}" stroke-width="1.8" fill="none" opacity=".3"/>
      <path d="M80,108 C77,132 82,152 84,170 L116,170 C118,152 123,132 120,108 C112,116 104,118 100,118 C96,118 88,116 80,108 Z" fill="url(#${p}-gown)"/>
      <path d="M85,110 L93,100" stroke="${t.c}" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M115,110 L107,100" stroke="${t.c}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="81" y="158" width="38" height="10" rx="5" fill="${t.d}"/>
      <path d="M100,163 l-11,-6 v12 Z" fill="${t.l}"/>
      <path d="M100,163 l11,-6 v12 Z" fill="${t.l}"/>
      <circle cx="100" cy="163" r="3.4" fill="#fff6e2"/>
      ${star(74, 232, 4.5, "#fff6e2", 0.9)}
      ${star(126, 212, 3.6, "#fff6e2", 0.85)}
      ${star(108, 246, 3, "#fff6e2", 0.8)}
      ${star(90, 202, 2.6, "#fff6e2", 0.7)}`;
  }
  let ribs = "";
  for (let x = 88; x <= 112; x += 6) {
    ribs += `<path d="M${x},112 V160" stroke="${t.l}" stroke-width="1.8" opacity=".6"/>`;
  }
  return `
    <path d="M94,99 C74,104 64,126 61,146 L74,150 C76,134 80,118 92,107 Z" fill="${t.c}"/>
    <path d="M106,99 C126,104 136,126 139,146 L126,150 C124,134 120,118 108,107 Z" fill="${t.c}"/>
    <path d="${TORSO}" fill="${t.c}"/>
    ${ribs}
    <rect x="82" y="160" width="36" height="10" rx="5" fill="${t.d}"/>
    <path d="M89,99 Q100,112 111,99" fill="${SKIN}"/>
    <path d="M89,99 Q100,112 111,99" stroke="${t.d}" stroke-width="2.4" fill="none"/>
    <path d="M61,146 Q68,150 74,150" stroke="${t.d}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M139,146 Q132,150 126,150" stroke="${t.d}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
}

/* ---------------------------------------------------------------- 下装 */

function bottomArt(id, p) {
  const b = BOTTOM[id] || BOTTOM.skirt;
  if (id === "slacks") {
    return `
      <path d="M84,158 L116,158 C124,176 128,196 127,208 C126,230 124,246 123,262 L104,262 C103,240 102,222 101,208 L99,208 C98,222 97,240 96,262 L77,262 C76,246 74,230 73,208 C72,196 76,176 84,158 Z" fill="${b.c}"/>
      <path d="M88,176 C87,204 87,234 86,258" stroke="${b.l}" stroke-width="2" fill="none" opacity=".85"/>
      <path d="M112,176 C113,204 113,234 114,258" stroke="${b.l}" stroke-width="2" fill="none" opacity=".85"/>
      <path d="M100,168 V206" stroke="${b.d}" stroke-width="1.6" opacity=".4"/>
      <path d="M77,258 L96,258 M104,258 L123,258" stroke="${b.d}" stroke-width="3.4"/>
      <rect x="84" y="155" width="32" height="11" rx="5" fill="${b.d}"/>
      <circle cx="100" cy="160.5" r="2.6" fill="${b.l}"/>`;
  }
  if (id === "silk") {
    return `
      <defs>
        <linearGradient id="${p}-silk" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stop-color="${b.l}"/><stop offset=".4" stop-color="${b.c}"/><stop offset="1" stop-color="${b.d}"/>
        </linearGradient>
      </defs>
      <path d="M84,158 L116,158 C126,182 131,220 129,258 C116,266 84,266 71,258 C69,220 74,182 84,158 Z" fill="url(#${p}-silk)"/>
      <path d="M103,204 C102,228 103,244 105,262 L113,262 C109,242 108,222 110,204 Z" fill="${SKIN}"/>
      <path d="M103,204 C102,228 103,244 105,262" stroke="${b.d}" stroke-width="1.6" fill="none" opacity=".5"/>
      <path d="M88,168 C82,200 79,232 80,258" stroke="${b.l}" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/>
      <path d="M95,172 C91,200 89,230 90,258" stroke="${b.l}" stroke-width="2" fill="none" opacity=".35"/>
      <path d="M119,172 C125,202 128,232 127,256" stroke="${b.d}" stroke-width="2.4" fill="none" opacity=".45"/>
      <rect x="84" y="153" width="32" height="10" rx="5" fill="${b.d}"/>
      ${star(86, 212, 3.4, "#fff", 0.7)}
      ${star(118, 238, 2.8, "#fff", 0.6)}`;
  }
  let pleats = "";
  for (let i = -3; i <= 3; i++) {
    const x1 = 100 + i * 6.2;
    const x2 = 100 + i * 11.4;
    const y2 = 211 + 8 * (1 - ((x2 - 100) / 36) ** 2);
    pleats += `<path d="M${x1},176 L${x2},${y2.toFixed(1)}" stroke="${b.d}" stroke-width="1.7" opacity=".6"/>`;
  }
  return `
    <path d="M84,158 L116,158 C122,174 128,190 136,211 C119,222 81,222 64,211 C72,190 78,174 84,158 Z" fill="${b.c}"/>
    ${pleats}
    <path d="M64,211 C81,222 119,222 136,211" stroke="${b.d}" stroke-width="2.4" fill="none"/>
    <rect x="84" y="155" width="32" height="10" rx="5" fill="${b.d}"/>
    <circle cx="100" cy="160" r="2.6" fill="${b.l}"/>`;
}

/* ---------------------------------------------------------------- 鞋履 */

function shoeSide(id) {
  const s = SHOES[id] || SHOES.sneaker;
  if (id === "heel") {
    return `
      <path d="M91,285 L97,285 L96,300 L91,300 Z" fill="${s.d}"/>
      <path d="M84,274 L97,274 L97,284 C97,288 92,291 85,293 L66,297 C63,297.6 62,294 65,292.4 C76,289 82,283 84,274 Z" fill="${s.c}"/>
      <path d="M65,292.5 C76,289 82,284 85,278" stroke="${s.a}" stroke-width="1.8" fill="none"/>
      <path d="M84,277 L97,276" stroke="${s.a}" stroke-width="2.2" stroke-linecap="round"/>
      ${star(75, 289, 3.2, "#fff", 0.85)}`;
  }
  if (id === "boot") {
    return `
      <path d="M89,288 L98,288 L98,299 L89,299 Z" fill="${s.d}"/>
      <path d="M80,252 L98,252 L98,286 C98,290 94,292 88,292 L70,292 C66,292 65,289 67,287 C77,283 79,270 80,252 Z" fill="${s.c}"/>
      <path d="M67,289 L98,286 L98,293 L69,296 C66,296.4 65,291 67,289 Z" fill="${s.d}"/>
      <rect x="78" y="248" width="19" height="8" rx="4" fill="${s.d}"/>
      <path d="M79,266 L98,264" stroke="${s.a}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="86" cy="265" r="2.2" fill="${s.a}"/>
      <path d="M82,258 C82,272 76,281 70,285" stroke="${s.d}" stroke-width="1.5" fill="none" opacity=".55"/>`;
  }
  return `
    <path d="M84,271 L97,271 L97,287 C97,291 93,293 87,293 L69,293 C65,293 64,289 67,287 C78,284 83,279 84,271 Z" fill="${s.c}"/>
    <path d="M66,289 L97,286 L97,293 C97,295.5 95.5,297 93,297 L69,297 C66,297 64.6,292 66,289 Z" fill="${s.a}"/>
    <path d="M85,275 L96,274 M84,280 L96,279 M82,285 L96,284" stroke="${s.d}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M97,271 C99,278 99,283 97,288" stroke="${s.d}" stroke-width="1.4" fill="none"/>
    <path d="M67,287 C74,285 80,282 83,278" stroke="${s.d}" stroke-width="1.2" fill="none" opacity=".55"/>`;
}

function shoesArt(id) {
  const one = shoeSide(id);
  return `${one}<g transform="translate(200,0) scale(-1,1)">${one}</g>`;
}

/* ---------------------------------------------------------------- 饰品 */

function accArt(id, p) {
  if (id === "pearl") {
    let beads = "";
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      const x = 89 + 22 * t;
      const y = 99 + 24 * t * (1 - t);
      beads += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.1" fill="#fffaf4"/>`;
    }
    return `
      <path d="M89,99 Q100,111 111,99" stroke="#f0dcc8" stroke-width="1.4" fill="none"/>
      ${beads}
      <circle cx="100" cy="111" r="3.6" fill="#fffaf4"/>
      <circle cx="98.8" cy="109.8" r="1.2" fill="#fff"/>
      <circle cx="71" cy="72" r="4.2" fill="#fffaf4"/>
      <circle cx="129" cy="72" r="4.2" fill="#fffaf4"/>
      <circle cx="69.8" cy="70.8" r="1.4" fill="#fff"/>
      <circle cx="127.8" cy="70.8" r="1.4" fill="#fff"/>`;
  }
  if (id === "crown") {
    return `
      <defs>
        <linearGradient id="${p}-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe9b0"/><stop offset="1" stop-color="#c9a24a"/>
        </linearGradient>
      </defs>
      <path d="M76,37 L82,21 L90,32 L100,14 L110,32 L118,21 L124,37 C110,32 90,32 76,37 Z" fill="url(#${p}-crown)"/>
      <path d="M74,38 C88,32 112,32 126,38" stroke="url(#${p}-crown)" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="82" cy="23" r="2.3" fill="#ff9fc0"/>
      <circle cx="118" cy="23" r="2.3" fill="#ff9fc0"/>
      <circle cx="100" cy="17" r="3.2" fill="#ffd0e2"/>
      <path d="M70,73 l0,7" stroke="#c9a24a" stroke-width="1.6"/>
      <path d="M130,73 l0,7" stroke="#c9a24a" stroke-width="1.6"/>
      <circle cx="70" cy="82" r="3.2" fill="#ffe9b0"/>
      <circle cx="130" cy="82" r="3.2" fill="#ffe9b0"/>
      ${star(66, 30, 4.2, "#fff3cf")}
      ${star(136, 34, 3.4, "#fff3cf")}
      ${star(100, 8, 3, "#fff3cf")}`;
  }
  return "";
}

/* ---------------------------------------------------------------- 导出 */

/** 每个槽位映射到 SVG 图层（发型跨越两层，实现前后发分离）。 */
export const SLOT_LAYERS = {
  hair: ["hairBack", "hairFront"],
  top: ["top"],
  bottom: ["bottom"],
  shoes: ["shoes"],
  acc: ["acc"],
};

/**
 * 图层自后向前的绘制顺序，body 由容器固定插入。
 * 鞋履压在下装之下，长裙/长裤的裙摆才能自然盖住靴筒。
 */
export const LAYER_ORDER = ["hairBack", "body", "shoes", "bottom", "top", "hairFront", "acc"];

export const SLOT_META = {
  hair: { label: "发型", icon: "💇", view: "54 6 92 110", dy: "-18px" },
  top: { label: "上装", icon: "🧥", view: "50 88 100 96", dy: "-12px" },
  bottom: { label: "下装", icon: "👖", view: "56 144 88 134", dy: "14px" },
  shoes: { label: "鞋履", icon: "👠", view: "58 244 84 60", dy: "18px" },
  acc: { label: "饰品", icon: "💎", view: "60 4 80 118", dy: "-16px" },
};

/** 返回某个槽位下某件单品在各图层上的 SVG 片段。 */
export function layerArt(slot, itemId, prefix) {
  const p = `${prefix}-${slot}-${itemId}`;
  if (slot === "hair") return { hairBack: hairBack(itemId), hairFront: hairFront(itemId) };
  if (slot === "top") return { top: topArt(itemId, p) };
  if (slot === "bottom") return { bottom: bottomArt(itemId, p) };
  if (slot === "shoes") return { shoes: shoesArt(itemId) };
  if (slot === "acc") return { acc: accArt(itemId, p) };
  return {};
}

/** T 台底座、聚光与氛围粒子。 */
export function backdropArt(p) {
  let dust = "";
  const seeds = [
    [34, 96, 3.2],
    [166, 74, 2.6],
    [24, 188, 2.2],
    [178, 168, 3],
    [46, 46, 2],
    [156, 224, 2.4],
  ];
  seeds.forEach(([x, y, r], i) => {
    dust += `<g class="fm-dust" style="--i:${i}">${star(x, y, r, "#ffffff", 0.8)}</g>`;
  });
  return `
    <defs>
      <radialGradient id="${p}-glow" cx="0.5" cy="0.36" r="0.62">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
        <stop offset=".55" stop-color="#ffe3ef" stop-opacity=".65"/>
        <stop offset="1" stop-color="#ffe3ef" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${p}-spot" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0" stop-color="#fff6de" stop-opacity="0"/>
        <stop offset="1" stop-color="#fff0cf" stop-opacity=".55"/>
      </linearGradient>
      <linearGradient id="${p}-podium" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffd9e6"/><stop offset="1" stop-color="#f3aec8"/>
      </linearGradient>
    </defs>
    <ellipse cx="100" cy="132" rx="96" ry="120" fill="url(#${p}-glow)"/>
    <path d="M60,0 L140,0 L182,300 L18,300 Z" fill="url(#${p}-spot)"/>
    ${dust}
    <ellipse cx="100" cy="300" rx="74" ry="15" fill="url(#${p}-podium)"/>
    <ellipse cx="100" cy="297" rx="74" ry="15" fill="#fff2f7"/>
    <ellipse cx="100" cy="297" rx="58" ry="10" fill="none" stroke="#f6c9db" stroke-width="1.6"/>
    <ellipse cx="100" cy="296" rx="40" ry="7" fill="#000" opacity=".07"/>`;
}
