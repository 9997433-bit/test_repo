let ctx;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function beep(freq, dur, type = "sine", gain = 0.04) {
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur);
  } catch {
    /* audio optional */
  }
}

export const sfx = {
  unlock() {
    ac().resume?.();
  },
  recruit() {
    beep(420, 0.08, "triangle");
  },
  merge() {
    beep(620, 0.12, "square", 0.03);
  },
  awaken() {
    beep(880, 0.2, "sawtooth", 0.035);
  },
  leak() {
    beep(160, 0.25, "sine", 0.05);
  },
  skill() {
    beep(240, 0.18, "sawtooth", 0.03);
  },
  win() {
    beep(523, 0.15);
    setTimeout(() => beep(659, 0.2), 120);
  },
  lose() {
    beep(196, 0.35, "triangle", 0.05);
  },
};
