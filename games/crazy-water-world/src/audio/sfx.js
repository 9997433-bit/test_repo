let ctx;
let muted = false;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function setMuted(v) {
  muted = v;
}

export function blip(kind = "pickup") {
  if (muted) return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = kind === "build" ? "triangle" : kind === "hit" ? "sawtooth" : "sine";
    o.frequency.value = kind === "build" ? 180 : kind === "hit" ? 120 : 520;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.18);
    o.stop(c.currentTime + 0.2);
  } catch {
    /* audio optional */
  }
}
