let ctx;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function playStroke(type, mute) {
  if (mute) return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    const now = c.currentTime;
    const map = { line: 440, circle: 330, zigzag: 520, spiral: 380, cloud: 300, curve: 360, scribble: 220 };
    o.frequency.value = map[type] || 280;
    o.type = type === "circle" ? "sine" : "triangle";
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(now + 0.3);
  } catch {
    /* autoplay policies */
  }
}
