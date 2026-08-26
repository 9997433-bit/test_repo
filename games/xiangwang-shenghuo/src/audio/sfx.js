let ctx;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function setMuted(v) {
  muted = v;
}

export function chirp(kind = "harvest") {
  if (muted) return;
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  const map = { harvest: 520, plant: 340, cook: 260, wish: 620, ui: 400 };
  o.frequency.value = map[kind] || 400;
  o.type = kind === "cook" ? "triangle" : "sine";
  g.gain.value = 0.04;
  o.connect(g).connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
  o.stop(c.currentTime + 0.2);
}
