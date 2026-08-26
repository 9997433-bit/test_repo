let ctx: AudioContext | null = null;
let muted = false;

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

function ac(): AudioContext | null {
  if (muted) return null;
  ctx ??= new AudioContext();
  return ctx;
}

export function chime(kind: "ok" | "warn" | "rare" | "water" = "ok"): void {
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.connect(g);
  g.connect(c.destination);
  const now = c.currentTime;
  const map = { ok: 523, warn: 196, rare: 784, water: 392 };
  o.frequency.value = map[kind];
  o.type = kind === "water" ? "sine" : "triangle";
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  o.start(now);
  o.stop(now + 0.3);
}

export function resumeAudio(): void {
  void ctx?.resume();
}
