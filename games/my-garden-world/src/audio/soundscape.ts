export type ChimeKind = "ok" | "warn" | "rare" | "water";
export type AudioStatus = "unavailable" | "muted" | "idle" | "ready";

interface Tone {
  freq: number;
  type: OscillatorType;
  peak: number;
  dur: number;
  detune?: number;
}

const TONES: Record<ChimeKind, Tone> = {
  ok: { freq: 523, type: "triangle", peak: 0.05, dur: 0.3 },
  warn: { freq: 196, type: "triangle", peak: 0.055, dur: 0.34 },
  rare: { freq: 784, type: "triangle", peak: 0.05, dur: 0.46, detune: 7 },
  water: { freq: 392, type: "sine", peak: 0.045, dur: 0.26 },
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let armed = false;
let unavailable = false;

function contextCtor(): typeof AudioContext | null {
  if (typeof globalThis === "undefined") return null;
  const g = globalThis as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  return g.AudioContext ?? g.webkitAudioContext ?? null;
}

/** Browsers keep a fresh context suspended until a gesture, and re-suspend it on tab hide. */
function arm(): void {
  if (armed || typeof document === "undefined") return;
  armed = true;
  const wake = () => resumeAudio();
  for (const type of ["pointerdown", "touchend", "keydown"] as const) {
    document.addEventListener(type, wake, { passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resumeAudio();
  });
}

function ensureContext(): AudioContext | null {
  if (unavailable) return null;
  if (ctx && ctx.state !== "closed") return ctx;
  const Ctor = contextCtor();
  if (!Ctor) {
    unavailable = true;
    return null;
  }
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
    unavailable = true;
    return null;
  }
  arm();
  return ctx;
}

function tryResume(c: AudioContext): void {
  if (c.state === "running" || c.state === "closed") return;
  try {
    void Promise.resolve(c.resume()).catch(() => undefined);
  } catch {
    /* a context that refuses to resume simply stays silent */
  }
}

/** Safe to call at any time — before the context exists, while muted, or from a gesture handler. */
export function resumeAudio(): void {
  arm();
  if (muted) return;
  const c = ensureContext();
  if (!c) return;
  if (master) master.gain.value = 0.9;
  tryResume(c);
}

export function toggleMute(): boolean {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.9;
  if (ctx && !muted) tryResume(ctx);
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

export function audioStatus(): AudioStatus {
  if (muted) return "muted";
  if (unavailable || (!ctx && !contextCtor())) return "unavailable";
  return ctx?.state === "running" ? "ready" : "idle";
}

export function audioStatusLabel(): string {
  return { unavailable: "无声", muted: "静音", idle: "待启", ready: "有声" }[audioStatus()];
}

export function chime(kind: ChimeKind = "ok"): void {
  if (muted) return;
  const c = ensureContext();
  const bus = master;
  if (!c || !bus) return;
  if (c.state !== "running") {
    // Queueing tones here would dump a burst the moment audio unlocks, so drop this one.
    tryResume(c);
    return;
  }
  const tone = TONES[kind] ?? TONES.ok;
  try {
    const now = c.currentTime;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.freq, now);
    if (tone.detune) osc.detune.setValueAtTime(tone.detune, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(tone.peak, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur);
    osc.connect(env);
    env.connect(bus);
    osc.onended = () => {
      try {
        osc.disconnect();
        env.disconnect();
      } catch {
        /* already torn down */
      }
    };
    osc.start(now);
    osc.stop(now + tone.dur + 0.02);
  } catch {
    /* never let a decorative sound break the game loop */
  }
}
