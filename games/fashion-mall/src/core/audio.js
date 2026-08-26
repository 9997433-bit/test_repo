let ctx;

function ac() {
  if (typeof window === "undefined") return null;
  ctx ||= new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function beep(freq = 520, dur = 0.09, type = "sine", gain = 0.04) {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + dur);
}

export const sfx = {
  coin: () => beep(740, 0.08, "triangle", 0.05),
  tap: () => beep(420, 0.05, "square", 0.03),
  win: () => {
    beep(523, 0.08);
    setTimeout(() => beep(659, 0.08), 70);
    setTimeout(() => beep(784, 0.12), 140);
  },
  rare: () => {
    beep(880, 0.16, "sawtooth", 0.03);
    setTimeout(() => beep(1174, 0.2, "triangle", 0.04), 120);
  },
};
